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

function buildLimitedHand(pool){
  const hand=[];let c2=0,c3=0;
  shuf([...pool]).forEach(c=>{
    if(c.c<=1)hand.push({...c});
    else if(c.c===2&&c2<4){hand.push({...c});c2++;}
    else if(c.c===3&&c3<2){hand.push({...c});c3++;}
  });
  return hand;
}

function makeFighter(c){
  const role=normRole(c.role||'dps');
  const rs=ROLE_ST[role];
  const maxHp=rnd(...rs.hp),atk=rnd(...rs.atk),def=rnd(...rs.def);
  return{...c,role,maxHp,hp:maxHp,atk,def,
    shield:0,atkMult:1,buffRounds:0,debuffRounds:0,atkDebuffAmount:0,alive:true,overdrive:false,guard:false,
    id:'f'+Math.random().toString(36).slice(2),
    cardPool:CHAR_CARDS[c.name]||CHAR_CARDS["Jiyan"],
    committed:[]};
}

function calcFirstTurn(){
  const pd=G.player.reduce((s,f)=>s+f.def,0);
  const ed=G.enemy.reduce((s,f)=>s+f.def,0);
  if(pd<=ed){
    G.energy=2; G.botEnergy=3;
    G.enemy.forEach(f=>f.guard=true);
  } else {
    G.energy=3;
    G.player.forEach(f=>f.guard=true);
    G.botEnergy=2;
  }
  G.startEnergy=G.energy;
  G.botStartEnergy=G.botEnergy;
  if(G.mode==='pvp'){G.p2energy=G.botEnergy;}
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
    energy:10,maxE:10,botEnergy:0,round:1,phase:'commit',hand:[],done:false,_passing:false,escalation:1,
    mode:mode||'bot', pvpTurn:'p1', p2hand:[]};
  calcFirstTurn();
  // Initial hand deal for player
  G.player.forEach(f=>buildLimitedHand(f.cardPool).slice(0,2).forEach(c=>{
    if(G.hand.length>=14)return;
    if(c.ult && G.hand.some(h=>h.ownerId===f.id&&h.ult)) return;
    if(c.variety && G.hand.some(h=>h.ownerId===f.id&&h.variety&&h.n===c.n)) return;
    G.hand.push({...c,ownerId:f.id,ownerName:f.name,hid:'h'+Math.random().toString(36).slice(2)});
  }));
  // PvP: also deal initial hand for P2 (enemy team)
  if(mode==='pvp'){
    G.enemy.forEach(f=>buildLimitedHand(f.cardPool).slice(0,2).forEach(c=>{
      if(G.p2hand.length>=14)return;
      if(c.ult && G.p2hand.some(h=>h.ownerId===f.id&&h.ult)) return;
      if(c.variety && G.p2hand.some(h=>h.ownerId===f.id&&h.variety&&h.n===c.n)) return;
      G.p2hand.push({...c,ownerId:f.id,ownerName:f.name,hid:'h'+Math.random().toString(36).slice(2)});
    }));
  }
  showScreen('battleScreen');
  renderAll();
  if(mode==='pvp'){
    // Show round 1 P1 start overlay
    showPvpP1StartOverlay();
  }
}

function drawForFighter(f,n=1,isP2=false){
  const hand=isP2?G.p2hand:G.hand;
  if(hand.length>=14)return;
  shuf(buildLimitedHand(f.cardPool)).slice(0,n).forEach(c=>{
    if(hand.length>=14)return;
    if(c.ult && hand.some(h=>h.ownerId===f.id&&h.ult)) return;
    if(c.variety && hand.some(h=>h.ownerId===f.id&&h.variety&&h.n===c.n)) return;
    hand.push({...c,ownerId:f.id,ownerName:f.name,hid:'h'+Math.random().toString(36).slice(2)});
  });
}

// ═══════════════════════════════════════════════════════════
// COMBO DETECTION
// Checks committed cards for synergy bonuses:
// Buff+Attack, Support+DPS, SubDPS debuff chain, Elemental
// ═══════════════════════════════════════════════════════════
function detectCombos(playerActs){
  const combos={};
  playerActs.forEach(act=>{
    const f=act.fighter,cards=f.committed;
    const hasAtk=cards.some(c=>c.t==='attack'||c.t==='debuff');
    const hasBuff=cards.some(c=>c.t==='buff');
    if(hasAtk&&hasBuff){combos[f.id]=(combos[f.id]||1)+0.20;showCombo('⚡ Combo! Buff+Attack +20%');}
  });
  const suppActs=playerActs.filter(a=>a.fighter.role==='support');
  const dpsActs=playerActs.filter(a=>a.fighter.role==='dps');
  if(suppActs.some(a=>a.fighter.committed.some(c=>c.t==='heal'))&&dpsActs.length){
    dpsActs.forEach(a=>{combos[a.fighter.id]=(combos[a.fighter.id]||1)+0.10;});
    showCombo('💚 Team Synergy! Support+DPS +10%');
  }
  const subDebuff=playerActs.filter(a=>a.fighter.role==='subdps'&&a.fighter.committed.some(c=>c.t==='debuff'));
  if(subDebuff.length&&dpsActs.length){
    dpsActs.forEach(a=>{combos[a.fighter.id]=(combos[a.fighter.id]||1)+0.25;});
    showCombo('🌀 Chain Combo! SubDPS→DPS +25%');
  }
  const elCounts={};
  playerActs.forEach(a=>{a.fighter.committed.forEach(()=>{elCounts[a.fighter.el]=(elCounts[a.fighter.el]||0)+1;});});
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
  const hand=isP2?G.p2hand:G.hand;
  team.forEach(f=>{
    f.committed.forEach(card=>{
      if(isP2) G.botEnergy+=card.c; else G.energy+=card.c;
      hand.push({...card,hid:'h'+Math.random().toString(36).slice(2)});
    });
    f.committed=[];
  });
  if(isP2){G.p2hand=[...hand]; /* already mutated */}
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
  const playerOD=G.startEnergy>=G.maxE;
  const botOD=G.botStartEnergy>=G.maxE;
  if(playerOD)G.player.filter(f=>f.alive).forEach(f=>{f.overdrive=true;floatDmg(f.id,'⚡ OD','overdrive');});
  if(botOD)   G.enemy.filter(f=>f.alive).forEach(f=>{f.overdrive=true;});
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
// Distributes bot energy per fighter by role priority:
// supports prefer heal/buff/defend; DPS prefer attack/debuff
// ═══════════════════════════════════════════════════════════
function buildBotActs(){
  const aliveEnemies=G.enemy.filter(f=>f.alive);
  let remainingEnergy=G.botEnergy;
  const perFighter=Math.floor(remainingEnergy/Math.max(1,aliveEnemies.length));
  const acts=[];
  for(const f of aliveEnemies){
    let budget=Math.min(perFighter,remainingEnergy);
    let cards=[];
    if(budget<=0){f.committed=[];acts.push({fighter:f,side:'enemy'});continue;}
    const botHand=shuf([...f.cardPool]);
    for(const c of botHand){
      if(budget<c.c)continue;
      if(f.role==='support'){
        if(f.hp<f.maxHp*0.5&&(c.t==='defend'||c.t==='heal')){cards.push(c);budget-=c.c;}
        else if(c.t==='buff'||c.t==='heal'||c.t==='defend'){cards.push(c);budget-=c.c;}
      } else {
        if(c.t==='attack'||c.t==='debuff'){cards.push(c);budget-=c.c;}
        else if(c.t==='buff'&&!cards.some(x=>x.t==='buff')){cards.push(c);budget-=c.c;}
      }
      if(budget<=0||cards.length>=3)break;
    }
    // fallback: pick cheapest affordable card if nothing was chosen
    if(!cards.length){
      const affordable=f.cardPool.filter(c=>c.c<=Math.min(perFighter,remainingEnergy));
      if(affordable.length)cards=[pick(affordable)];
    }
    // deduct actual cost of chosen cards from remaining pool
    const spent=cards.reduce((s,c)=>s+c.c,0);
    remainingEnergy-=spent;
    G.botEnergy-=spent;
    f.committed=cards;
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
