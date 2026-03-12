// ═══════════════════════════════════════════════════════════
// GAME STATE (G)
// The single source of truth for the entire match — teams,
// hands, energy, round, phase, mode, and all round flags
// ═══════════════════════════════════════════════════════════
let G={};

// ── Utility helpers ──
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function shuf(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

// ── Team building helpers ──
function pickBalancedTeam(pool){
  const by={dps:[],subdps:[],support:[]};
  pool.forEach(r=>{const role=normRole(r.role);if(by[role])by[role].push(r);});
  return[pick(shuf(by.dps)),pick(shuf(by.subdps)),pick(shuf(by.support))];
}
function normRole(r){
  const s=(r||'').toLowerCase().trim();
  if(s==='sub'||s==='subdps'||s==='sub-dps') return 'subdps';
  if(s.startsWith('sup')||s==='supp') return 'support';
  return 'dps';
}

function makeFighter(c){
  const role=normRole(c.role||'dps');
  const rs=ROLE_ST[role];
  const maxHp=rnd(...rs.hp),atk=rnd(...rs.atk),def=rnd(...rs.def);
  return{...c,role,maxHp,hp:maxHp,atk,def,
    shield:0,atkMult:1,buffRounds:0,debuffRounds:0,atkDebuffAmount:0,alive:true,overdrive:false,guard:false,
    id:'f'+Math.random().toString(36).slice(2),
    hand:[],   // 4 cards: 3 basics + variety (drawn fresh each round)
    committed:[]};
}

// Draw a fresh 4-card hand for a fighter (3 basics + variety fixed in slot 4)
// Max 2 duplicates. Called at battle start and at each newRound.
function refreshHand(f){
  f.hand = drawHand(f).map(c=>({
    ...c,
    ownerId:f.id,
    ownerName:f.name,
    hid:'h'+Math.random().toString(36).slice(2)
  }));
}

function calcFirstTurn(){
  // First turn balance: lower DEF team gets Guard (shield bonus), both start with 3 energy
  const pd=G.player.reduce((s,f)=>s+f.def,0);
  const ed=G.enemy.reduce((s,f)=>s+f.def,0);
  if(pd<=ed){
    G.enemy.forEach(f=>f.guard=true);
  } else {
    G.player.forEach(f=>f.guard=true);
  }
  G.energy=3; G.botEnergy=3;
  G.startEnergy=G.energy;
  G.botStartEnergy=G.botEnergy;
  if(G.mode==='pvp'){G.p2energy=3;}
}

// ═══════════════════════════════════════════════════════════
// BATTLE INITIALIZATION
// Picks random balanced teams, builds initial hands,
// and sets up the G state for bot, pvp, or tutorial mode
// ═══════════════════════════════════════════════════════════
function startBattle(mode){
  document.getElementById('modeSelectOv').classList.remove('show');
  // Tutorial mode — delegate to tutorial starter
  if(mode==='tutorial'){ startTutorialBattle(); return; }
  const all=shuf([...RESONATORS]);
  const pt=pickBalancedTeam(all);
  const used=new Set(pt.map(r=>r.name));
  const et=pickBalancedTeam(all.filter(r=>!used.has(r.name)));
  G={player:pt.map(makeFighter),enemy:et.map(makeFighter),
    energy:3,maxE:3,botEnergy:3,round:1,phase:'commit',done:false,_passing:false,escalation:1,
    mode:mode||'bot', pvpTurn:'p1'};
  calcFirstTurn();
  // Draw fresh hand for every fighter
  G.player.forEach(f=>refreshHand(f));
  G.enemy.forEach(f=>refreshHand(f));
  showScreen('battleScreen');
  renderAll();
  if(mode==='pvp'){
    showPvpP1StartOverlay();
  }
}

// Discard a card from hand — costs 1 energy (same as playing)
function discardCard(fid, hid){
  if(G.phase!=='commit'||G.done) return;
  if(G.energy<=0) return;
  const f = G.player.find(x=>x.id===fid);
  if(!f||!f.alive) return;
  const idx = f.hand.findIndex(c=>c.hid===hid);
  if(idx===-1) return;
  f.hand.splice(idx,1);
  G.energy--;
  renderAll();
}

// ═══════════════════════════════════════════════════════════
// COMBO DETECTION
// Checks committed cards for synergy bonuses:
// Buff+Attack, Support+DPS, SubDPS debuff chain, Elemental
// ═══════════════════════════════════════════════════════════
function detectCombos(playerActs){
  const combos={};
  // Buff+Attack combo: fighter has both a shield card AND a damage card
  playerActs.forEach(act=>{
    const f=act.fighter,cards=f.committed;
    const hasDmg   = cards.some(c=>c.v>0&&!c.variety);
    const hasShield = cards.some(c=>c.shield>0);
    if(hasDmg&&hasShield){combos[f.id]=(combos[f.id]||1)+0.20;showCombo('⚡ Combo! Shield+Attack +20%');}
  });
  // Support+DPS synergy: support committed anything + DPS is alive with cards
  const suppActs=playerActs.filter(a=>a.fighter.role==='support'&&a.fighter.committed.length>0);
  const dpsActs =playerActs.filter(a=>a.fighter.role==='dps');
  if(suppActs.length&&dpsActs.length){
    dpsActs.forEach(a=>{combos[a.fighter.id]=(combos[a.fighter.id]||1)+0.10;});
    showCombo('💚 Team Synergy! Support+DPS +10%');
  }
  // SubDPS chain: subdps has a disruptive/utility skill + dps is attacking
  const subDisrupt=playerActs.filter(a=>a.fighter.role==='subdps'&&a.fighter.committed.some(c=>
    c.skill&&(c.skill.includes('Steal')||c.skill.includes('Disable')||
              c.skill.includes('Remove')||c.skill.includes('Destroy')||
              c.skill.includes('debuff')||c.skill.includes('Taunt'))
  ));
  if(subDisrupt.length&&dpsActs.length){
    dpsActs.forEach(a=>{combos[a.fighter.id]=(combos[a.fighter.id]||1)+0.25;});
    showCombo('🌀 Chain Combo! SubDPS→DPS +25%');
  }
  // Elemental resonance: 2+ fighters of same element committed cards
  const elCounts={};
  playerActs.forEach(a=>{if(a.fighter.committed.length)elCounts[a.fighter.el]=(elCounts[a.fighter.el]||0)+1;});
  if(Object.values(elCounts).some(v=>v>=2)){
    playerActs.forEach(a=>{combos[a.fighter.id]=(combos[a.fighter.id]||1)+0.15;});
    showCombo('🌟 Elemental Resonance! +15% Team DMG');
  }
  return combos;
}

// ═══════════════════════════════════════════════════════════
// ROUND COMMIT & RESOLUTION
// passRound: returns all committed cards to hand
// commitRound: validates committed cards then triggers resolve
// ═══════════════════════════════════════════════════════════
function passRound(){
  if(G.phase!=='commit'||G.done) return;
  const isP2=G.mode==='pvp'&&G.pvpTurn==='p2';
  const team=isP2?G.enemy:G.player;
  team.forEach(f=>{
    f.committed.forEach(card=>{
      // Restore energy for uncommitted cards
      if(isP2) G.botEnergy=Math.min(3,G.botEnergy+1);
      else G.energy=Math.min(3,G.energy+1);
      // Return card to hand
      f.hand.push({...card,hid:'h'+Math.random().toString(36).slice(2)});
    });
    f.committed=[];
  });
  G._passing=true;
  commitRound();
}

function commitRound(){
  if(G.phase!=='commit'||G.done)return;

  // PvP: after P1 commits, show pass overlay for P2
  if(G.mode==='pvp'&&G.pvpTurn==='p1'){
    if(!G.player.some(f=>f.alive&&f.committed.length>0)){
      if(!G._passing){
        const lbl=document.getElementById('phaseLbl');
        lbl.style.color='var(--red)';setTimeout(()=>lbl.style.color='',800);
        return;
      }
    }
    G._passing=false;
    G.pvpTurn='p2';
    // Show pass overlay
    const ov=document.getElementById('passOv');
    document.getElementById('passOvTitle').textContent='Pass to Player 2! 📱';
    document.getElementById('passOvMsg').innerHTML=`Player 1 has locked in their moves.<br>Don't show Player 2 the screen — pass the device!`;
    ov.classList.add('show');
    return;
  }

  // PvP P2 commit → now resolve; or bot mode → resolve directly
  const isP2=G.mode==='pvp'&&G.pvpTurn==='p2';
  if(!G.player.some(f=>f.alive&&f.committed.length>0)&&
     !G.enemy.some(f=>f.alive&&f.committed.length>0)){
    if(!G._passing){
      const lbl=document.getElementById('phaseLbl');
      lbl.style.color='var(--red)';setTimeout(()=>lbl.style.color='',800);
      return;
    }
  }
  G._passing=false;
  G.phase='resolve';
  applyPassiveShields(G.player.filter(f=>f.alive&&f.committed.length>0));
  applyPassiveShields(G.enemy.filter(f=>f.alive&&f.committed.length>0));
  renderAll();
  const playerActs=G.player.filter(f=>f.alive&&f.committed.length>0).map(f=>({fighter:f,side:'player'}));
  const botActs=G.mode==='pvp'
    ? G.enemy.filter(f=>f.alive&&f.committed.length>0).map(f=>({fighter:f,side:'enemy'}))
    : buildBotActs();
  const combos=detectCombos(playerActs);
  detectReactions(playerActs,botActs);
  G._teamDmgMult=1; G._phantomRift=false;
  const allActs=[...playerActs,...botActs].sort((a,b)=>{
    const da=a.fighter.guard?Math.max(a.fighter.def,a.fighter.atk,a.fighter.hp/10):a.fighter.def;
    const db=b.fighter.guard?Math.max(b.fighter.def,b.fighter.atk,b.fighter.hp/10):b.fighter.def;
    return db-da;
  });
  let delay=300;
  allActs.forEach(act=>{
    setTimeout(()=>{if(!G.done)executeAct(act,combos);},delay);
    delay+=act.fighter.committed.length*520+500;
  });
  setTimeout(()=>{if(!G.done)newRound();},delay+400);
}

// Called when P2 taps "Ready" after receiving the device
function pvpContinue(){
  document.getElementById('passOv').classList.remove('show');
  renderAll();
}

// ═══════════════════════════════════════════════════════════
// BOT AI (buildBotActs)
// Bot draws same hand as player (4 cards: 3 basics + variety)
// Follows same rules: 3 energy max, all cards cost 1
// Role-aware: support heals/shields, dps/subdps attack/disrupt
// ═══════════════════════════════════════════════════════════
function buildBotActs(){
  const aliveEnemies=G.enemy.filter(f=>f.alive);
  let remainingEnergy=G.botEnergy;
  const acts=[];
  // Distribute energy evenly across alive fighters
  const perFighter=Math.floor(remainingEnergy/Math.max(1,aliveEnemies.length));

  for(const f of aliveEnemies){
    let budget=Math.min(perFighter,remainingEnergy);
    if(budget<=0){f.committed=[];acts.push({fighter:f,side:'enemy'});continue;}

    // Bot picks from its own drawn hand (same 4 cards as player would have)
    const available=shuf([...f.hand]);
    const chosen=[];

    for(const card of available){
      if(budget<=0||chosen.length>=3) break;
      if(card.c>budget) continue; // can't afford (all cost 1 so this is rarely an issue)

      // Role-aware selection
      if(f.role==='support'){
        // Support: prefer heal/shield skills, pick anything if nothing better
        const isDefensive = card.skill && (
          card.skill.includes('Heal') || card.skill.includes('heal') ||
          card.skill.includes('shield') || card.skill.includes('Shield') ||
          card.skill.includes('DEF') || card.skill.includes('def')
        );
        if(isDefensive || f.hp < f.maxHp*0.5 || chosen.length===0){
          chosen.push(card); budget--;
        }
      } else if(f.role==='subdps'){
        // SubDPS: prefer disrupt/debuff/energy drain cards, then anything
        const isDisruptive = card.skill && (
          card.skill.includes('Disable') || card.skill.includes('Steal') ||
          card.skill.includes('Remove') || card.skill.includes('debuff') ||
          card.skill.includes('Destroy')
        );
        if(isDisruptive || chosen.length===0 || card.variety){
          chosen.push(card); budget--;
        }
      } else {
        // DPS: prefer high-v damage cards, always pick something
        chosen.push(card); budget--;
      }
    }

    // Fallback: if nothing chosen, just pick up to budget cards randomly
    if(!chosen.length){
      available.slice(0,budget).forEach(c=>{chosen.push(c);});
    }

    remainingEnergy -= chosen.length;
    G.botEnergy -= chosen.length;
    f.committed = chosen;
    acts.push({fighter:f,side:'enemy'});
  }
  return acts;
}

// Passive shield on cast — distributed by ATK rank (lowest ATK gets most shield)
function applyPassiveShields(allies){
  const alive=allies.filter(a=>a.alive).sort((a,b)=>a.atk-b.atk);
  const shieldAmts=[80,70,60,40,20,10];
  alive.forEach((f,i)=>{
    const sh=shieldAmts[i]||30;
    f.shield=(f.shield||0)+sh;
    floatDmg(f.id,`+${sh}🛡️`,'buff');
    updateFighterDOM(f);
  });
}
// ── Web Audio sounds ──
