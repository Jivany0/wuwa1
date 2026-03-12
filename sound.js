// ═══════════════════════════════════════════════════════════
// SOUND EFFECTS (Web Audio API)
// Procedurally generated tones for attack, heal, buff, etc.
// ═══════════════════════════════════════════════════════════
let _audioCtx=null;
function getAudio(){if(!_audioCtx)_audioCtx=new(window.AudioContext||window.webkitAudioContext)();return _audioCtx;}
function playSound(type){
  try{
    const ctx=getAudio();
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    const t=ctx.currentTime;
    switch(type){
      case 'attack': o.type='sawtooth';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(80,t+0.18);g.gain.setValueAtTime(0.18,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.2);break;
      case 'ult':    o.type='square';o.frequency.setValueAtTime(440,t);o.frequency.setValueAtTime(660,t+0.08);o.frequency.setValueAtTime(880,t+0.16);g.gain.setValueAtTime(0.22,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.45);break;
      case 'heal':   o.type='sine';o.frequency.setValueAtTime(523,t);o.frequency.exponentialRampToValueAtTime(783,t+0.22);g.gain.setValueAtTime(0.12,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);break;
      case 'buff':   o.type='triangle';o.frequency.setValueAtTime(392,t);o.frequency.exponentialRampToValueAtTime(523,t+0.18);g.gain.setValueAtTime(0.1,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.25);break;
      case 'defend': o.type='triangle';o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(180,t+0.2);g.gain.setValueAtTime(0.12,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.22);break;
      case 'debuff': o.type='sawtooth';o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(60,t+0.25);g.gain.setValueAtTime(0.14,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.28);break;
      case 'crit':   o.type='square';o.frequency.setValueAtTime(880,t);o.frequency.exponentialRampToValueAtTime(440,t+0.12);g.gain.setValueAtTime(0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.18);break;
    }
    o.start(t);o.stop(t+0.5);
  }catch(e){}
}

// ── Fan drag reorder ──
let _dragFid=null,_dragIdx=null;
function fanDragStart(e,fid,idx){
  _dragFid=fid;_dragIdx=idx;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed='move';
}
function fanDragOver(e){
  e.preventDefault();e.dataTransfer.dropEffect='move';
  e.currentTarget.classList.add('drag-over');
}
function fanDragLeave(e){e.currentTarget.classList.remove('drag-over');}
function fanDrop(e,fid,toIdx){
  e.preventDefault();e.currentTarget.classList.remove('drag-over');
  if(_dragFid!==fid||_dragIdx===null||_dragIdx===toIdx)return;
  const fighters=activeFighters();
  const f=fighters.find(x=>x.id===fid);if(!f)return;
  const cards=f.committed;
  const moved=cards.splice(_dragIdx,1)[0];
  cards.splice(toIdx,0,moved);
  _dragFid=null;_dragIdx=null;
  renderAll();
}
function fanDragEnd(e){
  e.target.classList.remove('dragging');
  document.querySelectorAll('.fan-card.drag-over').forEach(el=>el.classList.remove('drag-over'));
  _dragFid=null;_dragIdx=null;
}

// ── Flying card animation ──
function flyCard(card,fromId,toId,cb){
  const fe=document.getElementById('f-'+fromId);
  const te=document.getElementById('f-'+toId);
  if(!fe||!te){cb();return;}
  const fr=fe.getBoundingClientRect(),tr=te.getBoundingClientRect();
  const tc=typeCol(card.t);
  const fly=document.createElement('div');
  fly.className='card-fly';
  fly.innerHTML=`<div class="card-fly-ic">${card.ic}</div><div class="card-fly-nm">${card.n}</div><div class="card-fly-tp" style="color:${tc}">${card.ult?'ULT':card.t.slice(0,3).toUpperCase()}</div>`;
  fly.style.left=(fr.left+fr.width/2-20)+'px';
  fly.style.top=(fr.top+fr.height/2-28)+'px';
  fly.style.transform='scale(1.1) rotate(-6deg)';
  document.body.appendChild(fly);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    fly.style.left=(tr.left+tr.width/2-20)+'px';
    fly.style.top=(tr.top+tr.height/2-28)+'px';
    fly.style.transform='scale(0.7) rotate(6deg)';
  }));
  setTimeout(()=>{fly.style.opacity='0';setTimeout(()=>{fly.remove();cb();},160);},340);
}

function executeAct(act,combos={}){
  const{fighter:f,side}=act;
  const isPlayer=side==='player';
  const allies=isPlayer?G.player:G.enemy;
  const foes=isPlayer?G.enemy:G.player;
  const owner=allies.find(x=>x.id===f.id);
  if(!owner||!owner.alive)return;
  const comboMult=combos[owner.id]||1;

  // All committed cards execute in order
  owner.committed.forEach((card,ci)=>{
    setTimeout(()=>{
      if(!owner.alive)return;
      animF(owner.id,'attacking-anim');
      const aliveFoes=foes.filter(r=>r.alive);
      const aliveAllies=allies.filter(r=>r.alive);

      // ── Variety cards → delegate to applyVarietyVfx unchanged ──
      if(card.variety&&card.vfx&&card.vfx!=='none'){
        const raw=Math.round((card.v||0)*(owner.atkMult||1)*(owner.atk/70)*comboMult*(G._teamDmgMult||1)*(G._phantomRift?1.30:1.0));
        playSound('attack');
        flyCard(card,owner.id,owner.id,()=>{applyVarietyVfx(card,owner,allies,foes,raw);});
        return;
      }

      // ── Skill cards: compute base values ──
      const baseV = card.v || 0;
      const baseShield = card.shield || 0;

      // Apply skill condition modifiers
      const {dmgMult, skipDmg, extraShieldMult, healAmt, targetOverride, skipIfNoCondition} =
        applySkillCondition(card, owner, aliveFoes, aliveAllies);

      if(skipIfNoCondition) return; // condition not met, card does nothing

      // ── Damage portion ──
      if(baseV > 0 && !skipDmg && aliveFoes.length){
        const target = targetOverride || pickTarget(aliveFoes, owner.role, 'attack');
        const raw = Math.round(
          baseV * (owner.atkMult||1) * (owner.atk/70) * comboMult * dmgMult *
          (G._teamDmgMult||1) * (G._phantomRift?1.30:1.0)
        );
        const defIgnore = G._phantomRift ? 0.50 : 0;
        playSound('attack');
        flyCard(card,owner.id,target.id,()=>{
          const actualRaw = Math.round(raw*(target._reactionDmgMult||1));
          const res = dealDmgEx(target,actualRaw,owner.el,defIgnore);
          animF(target.id,'taking-hit');
          if(res.isCrit) playSound('crit');
          const cls = res.isCrit?'crit':res.resist?'resist':'dmg';
          floatDmg(target.id,`-${res.dmg}${res.isCrit?' CRIT!':''}`,cls);
          if(res.absorbed>0) floatDmg(target.id,`🛡️-${res.absorbed}`,'buff');
          // Lifesteal skill cards (Life Drain, Lifesteal Strike, Vital Strike)
          applyLifestealSkill(card,owner,res.dmg);
          updateFighterDOM(target);
          fireProj(owner.id,target.id,owner.el,()=>{});
          checkWin();
        });
      }

      // ── Shield portion ──
      if(baseShield > 0){
        const sh = Math.round(baseShield * (extraShieldMult||1));
        owner.shield = (owner.shield||0) + sh;
        playSound('defend');
        flyCard(card,owner.id,owner.id,()=>{
          animF(owner.id,'healing-anim');
          floatDmg(owner.id,`+${sh}🛡️`,'buff');
          updateFighterDOM(owner);
        });
      }

      // ── Heal portion (heal-only cards) ──
      if(healAmt > 0){
        const target = aliveAllies.filter(a=>a.id!==owner.id).sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0] || owner;
        target.hp = Math.min(target.maxHp, target.hp + healAmt);
        playSound('heal');
        flyCard(card,owner.id,target.id,()=>{
          animF(target.id,'healing-anim');
          floatDmg(target.id,`+${healAmt}💚`,'heal');
          updateFighterDOM(target);
        });
      }

      // ── Utility effects (energy steal/destroy, debuffs, disrupt, etc.) ──
      applyUtilitySkill(card, owner, aliveFoes, aliveAllies, isPlayer);

    },ci*520);
  });
}

// ─────────────────────────────────────────────────────────────
// applySkillCondition
// Reads card.skill text and applies conditional modifiers.
// Returns: dmgMult, skipDmg, extraShieldMult, healAmt,
//          targetOverride, skipIfNoCondition
// ─────────────────────────────────────────────────────────────
function applySkillCondition(card, owner, aliveFoes, aliveAllies){
  let dmgMult = 1;
  let skipDmg = false;
  let extraShieldMult = 1;
  let healAmt = 0;
  let targetOverride = null;
  let skipIfNoCondition = false;
  const sk = card.skill || '';
  const hpPct = owner.hp / owner.maxHp;

  // ── Damage multiplier conditions ──
  if(sk.includes('150% damage') && sk.includes('below 10%')){
    dmgMult = hpPct < 0.10 ? 1.50 : 1.0;
  }
  if(sk.includes('200%') && sk.includes('below 5%')){
    dmgMult = hpPct < 0.05 ? 2.0 : 1.0;
  }
  if(sk.includes('120% damage') && sk.includes('below 50%') && !sk.includes('paired')){
    dmgMult = hpPct < 0.50 ? 1.20 : 1.0;
  }
  if(sk.includes('lethal') && sk.includes('below 30%')){
    if(hpPct < 0.30){ dmgMult = 999; } // true dmg handled in dealDmgEx via defIgnore
  }
  if(sk.includes('120% damage') && sk.includes('attacked first')){
    dmgMult = owner._attackedFirst ? 1.20 : 1.0;
  }
  if(sk.includes('Guaranteed critical') && sk.includes('attacked first')){
    owner._forceCrit = owner._attackedFirst || false;
  }
  if(sk.includes('Guaranteed critical') && sk.includes('variety card')){
    const hasVariety = owner.committed.some(c=>c.variety);
    owner._forceCrit = hasVariety;
  }
  if(sk.includes('20%') && sk.includes('more than 80% HP')){
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'attack') : null;
    if(t && t.hp/t.maxHp > 0.80) dmgMult *= 1.20;
  }
  if(sk.includes('Strike 3 times')){
    dmgMult = 1/3; // dealt 3x in applyUtilitySkill triple tempo
    owner._tripleHit = true;
  }
  if(sk.includes('200% more damage') && sk.includes('last 3 rounds')){
    dmgMult = owner._sameCardStreak >= 3 ? 2.0 : 1.0;
  }
  if(sk.includes('130% damage') && sk.includes('last round')){
    dmgMult = owner._lastCardHit === card.n ? 1.30 : 1.0;
  }
  if(sk.includes('200% damage') && sk.includes('same round')){
    // Resonant Fury — checked in applyUtilitySkill
  }
  if(sk.includes('120% damage') && sk.includes('paired with a variety card')){
    const hasVariety = owner.committed.some(c=>c.variety);
    dmgMult = hasVariety ? 1.20 : 1.0;
  }
  if(sk.includes('Attack twice') && sk.includes('debuff')){
    owner._doubleHit = owner.debuffRounds > 0;
  }
  if(sk.includes('50% more damage') && sk.includes('all resonators')){
    const allLow = aliveAllies.every(a => a.hp/a.maxHp < 0.50);
    dmgMult = allLow ? 1.50 : 1.0;
  }
  if(sk.includes('120% damage') && sk.includes('HP% is lower than the target')){
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'attack') : null;
    if(t && (owner.hp/owner.maxHp) < (t.hp/t.maxHp)) dmgMult = 1.20;
  }
  if(sk.includes('120% damage') && sk.includes('target\'s ATK is higher')){
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'attack') : null;
    if(t && t.atk > owner.atk) dmgMult = 1.20;
  }
  if(sk.includes('130% damage') && sk.includes('target is buffed')){
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'attack') : null;
    if(t && t.atkMult > 1) dmgMult = 1.30;
  }
  if(sk.includes('130% damage') && sk.includes('target is debuffed')){
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'attack') : null;
    if(t && t.debuffRounds > 0) dmgMult = 1.30;
  }
  if(sk.includes('130% damage') && sk.includes('shield broke this round')){
    dmgMult = owner._shieldBrokeThisRound ? 1.30 : 1.0;
  }
  if(sk.includes('30% more damage') && sk.includes('shielded target')){
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'attack') : null;
    if(t && t.shield > 0) dmgMult = 1.30;
  }
  if(sk.includes('150% damage') && sk.includes('attacks last')){
    dmgMult = owner._attackedLast ? 1.50 : 1.0;
  }
  if(sk.includes('120% damage') && sk.includes('taunted')){
    dmgMult = owner._taunted ? 1.20 : 1.0;
  }
  if(sk.includes('130% damage') && sk.includes('shield broke this round')){
    dmgMult = owner._shieldBroke ? 1.30 : 1.0;
  }
  if(sk.includes('120% damage') && sk.includes('debuffed last round')){
    dmgMult = owner._wasDebuffedLastRound ? 1.20 : 1.0;
  }
  if(sk.includes('120% damage') && sk.includes('comboed by 2 cards') && sk.includes('next round')){
    // Resonant Chain — handled as a buff set in applyUtilitySkill
  }

  // ── Target override conditions ──
  if(sk.includes('Prioritize highest ATK enemy') && hpPct < 0.50 && aliveFoes.length){
    targetOverride = [...aliveFoes].sort((a,b)=>b.atk-a.atk)[0];
  }
  if(sk.includes('Prioritize highest ATK') && !sk.includes('below') && aliveFoes.length){
    targetOverride = [...aliveFoes].sort((a,b)=>b.atk-a.atk)[0];
  }
  if(sk.includes('Skip the highest DEF') && aliveFoes.length > 1){
    const sorted = [...aliveFoes].sort((a,b)=>b.def-a.def);
    targetOverride = sorted[1] || sorted[0];
  }
  if(sk.includes('Target the highest DEF') && hpPct < 0.50 && aliveFoes.length){
    targetOverride = [...aliveFoes].sort((a,b)=>b.def-a.def)[0];
  }
  if(sk.includes('Target the highest HP%') && aliveFoes.length){
    targetOverride = [...aliveFoes].sort((a,b)=>(b.hp/b.maxHp)-(a.hp/a.maxHp))[0];
  }
  if(sk.includes('Attack first') && hpPct < 0.50){
    owner._goFirst = true;
  }

  // ── Heal-only cards (no damage) ──
  if(sk.includes('Heal this resonator') && sk.includes('90–120 HP') && card.v === 0){
    healAmt = Math.round(90 + Math.random()*30);
    skipDmg = true;
  }
  if(sk.includes('Heal the lowest HP% teammate') && sk.includes('130')){
    const target = aliveAllies.filter(a=>a.id!==owner.id).sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
    if(target){ target.hp=Math.min(target.maxHp,target.hp+130); floatDmg(target.id,'+130💚','heal'); updateFighterDOM(target); }
    skipDmg = true;
  }
  if(sk.includes('Heal lowest HP% ally by 150') && sk.includes('below 30%')){
    const target = aliveAllies.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
    if(target && target.hp/target.maxHp < 0.30){ target.hp=Math.min(target.maxHp,target.hp+150); floatDmg(target.id,'+150💚🚑','heal'); updateFighterDOM(target); }
    skipDmg = true;
  }
  if(sk.includes('Heal this resonator by 50% of shield')){
    const sh = owner.shield || 0;
    const h = Math.round(sh * 0.50);
    owner.hp = Math.min(owner.maxHp, owner.hp + h);
    floatDmg(owner.id,`+${h}💗`,'heal');
    updateFighterDOM(owner);
    skipDmg = true;
  }
  if(sk.includes('210% of this card') && sk.includes('lowest HP%')){
    const target = aliveAllies.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
    const h = Math.round((card.v||20)*2.10);
    if(target){ target.hp=Math.min(target.maxHp,target.hp+h); floatDmg(target.id,`+${h}💚`,'heal'); updateFighterDOM(target); }
    skipDmg = true;
  }

  // ── Shield condition modifiers ──
  if(sk.includes('30% more shield') && sk.includes('hit by 2 cards')){
    extraShieldMult = owner._hitBy2ThisRound ? 1.30 : 1.0;
  }
  if(sk.includes('Double the shield') && sk.includes('same attribute')){
    extraShieldMult = owner._hitBySameEl ? 2.0 : 1.0;
  }

  // ── No-op cards (pure utility, handled in applyUtilitySkill) ──
  const pureUtility = [
    'can\'t take critical','Gain 1 energy','Steal 1 energy','Destroy 1','Disable 1 card',
    'Transfer all debuffs','Remove all debuffs','Apply +10% ATK','Block one incoming',
    'Reduce damage taken','Draw a card','Taunt','Target reduces incoming heal',
    'Apply -20% damage','Apply -40% heal','Attack twice','Remove the first committed'
  ];
  if(card.v === 0 && card.shield === 0 && pureUtility.some(p=>sk.includes(p))){
    skipDmg = true;
  }

  return{dmgMult, skipDmg, extraShieldMult, healAmt, targetOverride, skipIfNoCondition};
}

// ─────────────────────────────────────────────────────────────
// applyLifestealSkill — handles Life Drain, Lifesteal Strike, Vital Strike
// ─────────────────────────────────────────────────────────────
function applyLifestealSkill(card, owner, dmgDealt){
  const sk = card.skill || '';
  if(sk.includes('90% of the damage inflicted')){
    const h=Math.round(dmgDealt*0.90);
    owner.hp=Math.min(owner.maxHp,owner.hp+h);
    floatDmg(owner.id,`+${h}🩸`,'heal');updateFighterDOM(owner);
  } else if(sk.includes('by the damage inflicted')){
    owner.hp=Math.min(owner.maxHp,owner.hp+dmgDealt);
    floatDmg(owner.id,`+${dmgDealt}🩸`,'heal');updateFighterDOM(owner);
  } else if(sk.includes('heal this resonator') && sk.includes('50')){
    owner.hp=Math.min(owner.maxHp,owner.hp+50);
    floatDmg(owner.id,'+50💗','heal');updateFighterDOM(owner);
  }
}

// ─────────────────────────────────────────────────────────────
// applyUtilitySkill — handles all non-damage/shield effects:
// energy steal/destroy, debuffs, disruption, buffs, taunt, etc.
// ─────────────────────────────────────────────────────────────
function applyUtilitySkill(card, owner, aliveFoes, aliveAllies, isPlayer){
  const sk = card.skill || '';
  if(!sk) return;

  // Energy steal / destroy
  if(sk.includes('Steal 1 energy') && !sk.includes('variety card')){
    if(isPlayer && G.botEnergy > 0){ G.botEnergy--; floatDmg(owner.id,'⚡Steal 1 EN','buff'); }
    else if(!isPlayer && G.energy > 0){ G.energy--; floatDmg(owner.id,'⚡Steal 1 EN','buff'); }
  }
  if(sk.includes('Steal 1 energy') && sk.includes('variety card')){
    const hasVariety = owner.committed.some(c=>c.variety);
    if(hasVariety){
      if(isPlayer && G.botEnergy > 0){ G.botEnergy--; floatDmg(owner.id,'⚡Steal(VAR)','buff'); }
      else if(!isPlayer && G.energy > 0){ G.energy--; floatDmg(owner.id,'⚡Steal(VAR)','buff'); }
    }
  }
  if(sk.includes('Destroy 1 of your opponent\'s energy')){
    if(isPlayer && G.botEnergy > 0){ G.botEnergy--; floatDmg(owner.id,'💥-1 EN','buff'); }
    else if(!isPlayer && G.energy > 0){ G.energy--; floatDmg(owner.id,'💥-1 EN','buff'); }
  }

  // Debuffs
  if(sk.includes('Apply -20% damage debuff')){
    aliveFoes.forEach(t=>{ t._dmgReduced=(t._dmgReduced||0)+0.20; floatDmg(t.id,'⬇️-20%DMG','debuff'); updateFighterDOM(t); });
  }
  if(sk.includes('Apply -40% heal debuff')){
    aliveFoes.forEach(t=>{ t._healDebuff=(t._healDebuff||0)+0.40; t._healDebuffRounds=2; floatDmg(t.id,'⬇️-40%HEAL','debuff'); updateFighterDOM(t); });
  }
  if(sk.includes('Target reduces incoming heal')){
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'debuff') : null;
    if(t){ t._healDebuff=(t._healDebuff||0)+0.50; t._healDebuffRounds=2; floatDmg(t.id,'🚫-50%HEAL','debuff'); updateFighterDOM(t); }
  }
  if(sk.includes('Transfer all debuffs')){
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'attack') : null;
    if(t && owner.debuffRounds > 0){
      t.debuffRounds=(t.debuffRounds||0)+owner.debuffRounds;
      t.atkDebuffAmount=(t.atkDebuffAmount||0)+(owner.atkDebuffAmount||0);
      t.atk=Math.max(1,t.atk-(owner.atkDebuffAmount||0));
      owner.debuffRounds=0; owner.atkDebuffAmount=0;
      floatDmg(owner.id,'☠️Debuff Transferred!','buff'); floatDmg(t.id,'☠️Debuff Received!','debuff');
      updateFighterDOM(owner); updateFighterDOM(t);
    }
  }

  // Disruption
  if(sk.includes('Remove the first committed card')){
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'attack') : null;
    if(t && t.committed && t.committed.length){ t.committed.splice(0,1); floatDmg(t.id,'✂️Card Removed!','debuff'); updateFighterDOM(t); }
  }
  if(sk.includes('Disable 1 card of the enemy')){
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'attack') : null;
    if(t && t.committed && t.committed.length){
      const idx = Math.floor(Math.random()*t.committed.length);
      t.committed[idx]._disabled=true;
      floatDmg(t.id,'📡Card Jammed!','debuff'); updateFighterDOM(t);
    }
  }
  if(sk.includes('Disable enemy heal card')){
    aliveFoes.forEach(t=>{
      const healCard = t.committed.find(c=>c.skill&&(c.skill.includes('Heal')||c.skill.includes('heal')));
      if(healCard){ healCard._disabled=true; floatDmg(t.id,'🔒Heal Blocked!','debuff'); updateFighterDOM(t); }
    });
  }
  if(sk.includes('Randomly discard an enemy card') && sk.includes('comboed by 2')){
    if(owner.committed.length >= 2){
      const t = aliveFoes.length ? pick(aliveFoes) : null;
      if(t && t.committed && t.committed.length){
        const idx = Math.floor(Math.random()*t.committed.length);
        t.committed.splice(idx,1);
        floatDmg(t.id,'🎲Card Discarded!','debuff'); updateFighterDOM(t);
      }
    }
  }

  // Buffs / team effects
  if(sk.includes('+10% ATK to the whole team')){
    aliveAllies.forEach(a=>{ a.atkMult=Math.min(2.5,(a.atkMult||1)+0.10); a.buffRounds=1; floatDmg(a.id,'+10%ATK📯','buff'); updateFighterDOM(a); });
  }
  if(sk.includes('Remove all debuffs')){
    owner.debuffRounds=0; owner.atkDebuffAmount=0; owner.atk=owner.atk+(owner.atkDebuffAmount||0);
    floatDmg(owner.id,'✨Cleansed!','buff'); updateFighterDOM(owner);
  }

  // Taunt effects
  if(sk.includes('Taunt all DPS attacks') && sk.includes('15%')){
    owner._taunt='dps'; owner._tauntDmgReduce=0.15;
    floatDmg(owner.id,'🛡️TAUNT ALL DPS','buff'); updateFighterDOM(owner);
  }
  if(sk.includes('Taunts enemy DPS attacks') && !sk.includes('all')){
    owner._taunt='dps';
    floatDmg(owner.id,'📣TAUNT DPS','buff'); updateFighterDOM(owner);
  }
  if(sk.includes('Taunt the next round')){
    owner._tauntNextRound=true;
    floatDmg(owner.id,'📣TAUNT NXT RND','buff'); updateFighterDOM(owner);
  }

  // Defensive self effects
  if(sk.includes('can\'t take critical damage')){
    owner._noCrit=true;
    floatDmg(owner.id,'🛡️No Crit!','buff'); updateFighterDOM(owner);
  }
  if(sk.includes('DEF next round doubled')){
    owner._doubleDefNextRound=true;
    floatDmg(owner.id,'🏰DEF×2 NXT','buff'); updateFighterDOM(owner);
  }
  if(sk.includes('Reduce damage taken by 20%')){
    owner._dmgTakenReduce=(owner._dmgTakenReduce||0)+0.20;
    floatDmg(owner.id,'🌫️-20%DMG','buff'); updateFighterDOM(owner);
  }
  if(sk.includes('Block one incoming attack')){
    owner._blockNext=true;
    floatDmg(owner.id,'🌀BLOCK','buff'); updateFighterDOM(owner);
  }
  if(sk.includes('Reflect 30% damage') && sk.includes('below 30%')){
    if(owner.hp/owner.maxHp < 0.30){ owner._reflect=0.30; floatDmg(owner.id,'🌹THORNS 30%','buff'); updateFighterDOM(owner); }
  }

  // Draw effects
  if(sk.includes('Draw a card') && sk.includes('attacked first') && owner._attackedFirst){
    const extra = drawHand(owner).slice(0,1).map(c=>({...c,ownerId:owner.id,ownerName:owner.name,hid:'h'+Math.random().toString(36).slice(2)}));
    owner.hand.push(...extra);
    floatDmg(owner.id,'🃏+1 Card','buff');
  }
  if(sk.includes('Draw a card') && sk.includes('shield didn\'t break') && !owner._shieldBrokeThisRound && owner.shield > 0){
    const extra = drawHand(owner).slice(0,1).map(c=>({...c,ownerId:owner.id,ownerName:owner.name,hid:'h'+Math.random().toString(36).slice(2)}));
    owner.hand.push(...extra);
    floatDmg(owner.id,'🃏+1 Card','buff');
  }

  // Energy gain
  if(sk.includes('Gain 1 energy when hit by 2 cards')){
    owner._energyGainOnHit2=true; // checked in dealDmgEx equivalent
  }
  if(sk.includes('Gain 1 energy when attacked with 50% HP')){
    owner._energyGainAt50=true;
  }
  if(sk.includes('Gain 1 energy if this card is active and attacking')){
    if(isPlayer) G.energy=Math.min(3,G.energy+1);
    else G.botEnergy=Math.min(3,G.botEnergy+1);
    floatDmg(owner.id,'⚡+1 EN','buff');
  }
  if(sk.includes('Gain 1 energy if this resonator\'s shield breaks')){
    owner._energyOnShieldBreak=true;
  }

  // Triple hit (Triple Tempo)
  if(sk.includes('Strike 3 times') && owner._tripleHit){
    owner._tripleHit=false;
    const t = aliveFoes.length ? pickTarget(aliveFoes,owner.role,'attack') : null;
    if(t){
      const raw = Math.round((card.v||35)*(owner.atkMult||1)*(owner.atk/70)*(G._teamDmgMult||1));
      [0,1,2].forEach(i=>{
        const res=dealDmgEx(t,Math.round(raw/3),owner.el,0);
        if(t.alive) floatDmg(t.id,`-${res.dmg}⚡`,'dmg');
        updateFighterDOM(t);
      });
      checkWin();
    }
  }
}

function pickTarget(foes,role,cardType){
  if(foes.length===1)return foes[0];
  if(role==='subdps'&&cardType==='debuff')return foes.sort((a,b)=>b.atk-a.atk)[0];
  const strategies=['lowestHp','highestHp','lowestDef','highestAtk','random'];
  switch(pick(strategies)){
    case 'lowestHp':  return [...foes].sort((a,b)=>a.hp-b.hp)[0];
    case 'highestHp': return [...foes].sort((a,b)=>b.hp-a.hp)[0];
    case 'lowestDef': return [...foes].sort((a,b)=>a.def-b.def)[0];
    case 'highestAtk':return [...foes].sort((a,b)=>b.atk-a.atk)[0];
    default:          return pick(foes);
  }
}

function dealDmgEx(target,raw,atkEl,defIgnore=0){
  const resist=(atkEl===target.el);
  const resMult=resist?RESISTANCE:1.0;
  const isCrit=Math.random()<0.015;
  const critMult=isCrit?1.3:1.0;
  const defReduction=target.def*(0.3*(1-defIgnore));
  const guardBonus=target.guard?target.def*0.2:0;
  let dmg=Math.max(1,Math.round(raw*resMult*critMult*G.escalation-defReduction-guardBonus));
  let absorbed=0;
  if(target.shield>0){absorbed=Math.min(target.shield,dmg);target.shield-=absorbed;dmg-=absorbed;}
  target.hp=Math.max(0,target.hp-dmg);
  if(target.hp<=0)target.alive=false;
  return{dmg,isCrit,resist,absorbed};
}

function dealDmg(target,raw,atkEl){return dealDmgEx(target,raw,atkEl,0);}

function newRound(){
  if(G.done)return;
  [...G.player,...G.enemy].forEach(f=>{
    f.committed=[];f.overdrive=false;f.guard=false;
    f.shield=0;
    if(f.buffRounds>0){f.buffRounds--;if(f.buffRounds===0)f.atkMult=1;}
    if(f.debuffRounds>0){f.debuffRounds--;if(f.debuffRounds===0){f.atk+=f.atkDebuffAmount||0;f.atkDebuffAmount=0;}}
    // Burn DoT
    if(f._burnDot>0&&f.alive){
      const bd=f._burnDot;
      f.hp=Math.max(0,f.hp-bd);if(f.hp<=0)f.alive=false;
      floatDmg(f.id,`-${bd}🔥`,'debuff');
      f._burnDot=0;
      updateFighterDOM(f);
    }
    // HP% DoT
    if(f._hpDot>0&&f.alive){
      const hd=Math.round(f.maxHp*f._hpDot);
      f.hp=Math.max(0,f.hp-hd);if(f.hp<=0)f.alive=false;
      floatDmg(f.id,`-${hd}💀DOT`,'debuff');
      f._hpDot=Math.max(0,f._hpDot-0.15);
      updateFighterDOM(f);
    }
    // Flat DoT
    if(f._flatDot>0&&f.alive){
      f.hp=Math.max(0,f.hp-f._flatDot);if(f.hp<=0)f.alive=false;
      floatDmg(f.id,`-${f._flatDot}🌋`,'debuff');
      f._flatDotRounds=(f._flatDotRounds||1)-1;
      if(f._flatDotRounds<=0)f._flatDot=0;
      updateFighterDOM(f);
    }
    // ATK decay
    if(f._atkDecay>0&&f._atkDecayRounds>0&&f.alive){
      f.atk=Math.max(1,f.atk-f._atkDecay);
      floatDmg(f.id,`⬇️-${f._atkDecay}ATK`,'debuff');
      f._atkDecayRounds--;
      if(f._atkDecayRounds<=0){f._atkDecay=0;}
      updateFighterDOM(f);
    }
    // Frozen: skip committed (cleared at round start means they can't act next)
    if(f._frozen>0){f._frozen=0;}
    // Pending debuff (Mortefi delayed)
    if(f._pendingDebuff>0&&f.alive){
      const reduction=Math.round(f.atk*f._pendingDebuff);
      f.atk=Math.max(1,f.atk-reduction);
      f.debuffRounds=1;f.atkDebuffAmount=(f.atkDebuffAmount||0)+reduction;
      floatDmg(f.id,`💣DETONATE -${reduction}ATK`,'debuff');
      f._pendingDebuff=0;
      updateFighterDOM(f);
    }
    // Reaction DMG mult clears each round
    f._reactionDmgMult=1;
    f._dmgReduced=0;
    f._missChance=0;
    f._untargetable=false;
  });
  // Shard system (Shattered Eclipse)
  if(G._shards>0){
    const targets=[...G.enemy.filter(f=>f.alive),...G.player.filter(f=>f.alive)];
    if(targets.length){
      const t=pick(targets);
      rxDmg(t,40,'Havoc');
      floatDmg(t.id,'💜SHARD','ult');
    }
    G._shards--;
  }
  // Slow draw (legacy flag, kept for compatibility)
  G._slowDrawNext=0;
  G.round++;
  if(G.round>1&&G.round%10===1){
    G.escalation=+(G.escalation+0.10).toFixed(2);
    showCombo(`⚠️ Damage Escalation! ×${G.escalation.toFixed(1)}`);
  }
  // 4.0: flat 3 energy per round, no carry over
  G.energy=3;
  G.botEnergy=3;
  G.startEnergy=3;
  G.botStartEnergy=3;
  G.phase='commit';
  G.pvpTurn='p1';
  // Refresh hands for all alive fighters (fresh 4 cards each round)
  G.player.filter(f=>f.alive).forEach(f=>refreshHand(f));
  G.enemy.filter(f=>f.alive).forEach(f=>refreshHand(f));
  if(G.mode==='pvp'){
    // Show "pass to P1" overlay at start of new round
    setTimeout(()=>{
      const ov=document.getElementById('passOv');
      document.getElementById('passOvTitle').textContent='New Round — Pass to Player 1! 📱';
      document.getElementById('passOvMsg').innerHTML=`Round ${G.round} begins!<br>Hand the device to Player 1 to commit their cards.`;
      ov.classList.add('show');
    },400);
  }
  renderAll();
  checkWin();
}

function projHTML(el){
  const shapes={
    Spectro:`<svg width="26" height="26" viewBox="0 0 44 44"><polygon points="22,3 27,16 41,16 30,25 34,39 22,30 10,39 14,25 3,16 17,16" fill="var(--Spectro)"/></svg>`,
    Aero:`<svg width="32" height="22" viewBox="0 0 44 28"><polygon points="0,4 18,0 14,9" fill="var(--Aero)" opacity=".9"/><polygon points="5,12 23,8 19,17" fill="var(--Aero)" opacity=".7"/><polygon points="10,20 28,16 24,25" fill="var(--Aero)" opacity=".5"/></svg>`,
    Havoc:`<svg width="26" height="26" viewBox="0 0 44 44"><path d="M22 3 L39 22 L31 24 L37 41 L22 27 L7 41 L13 24 L5 22 Z" fill="var(--Havoc)"/></svg>`,
    Glacio:`<svg width="22" height="30" viewBox="0 0 22 30"><polygon points="11,0 22,8 18,22 11,30 4,22 0,8" fill="var(--Glacio)"/></svg>`,
    Electro:`<svg width="18" height="30" viewBox="0 0 44 44"><polygon points="28,2 15,22 22,22 13,42 31,20 24,20" fill="var(--Electro)"/></svg>`,
    Fusion:`<svg width="22" height="30" viewBox="0 0 44 44"><ellipse cx="22" cy="35" rx="15" ry="7" fill="var(--Fusion)" opacity=".9"/><ellipse cx="22" cy="20" rx="10" ry="14" fill="var(--Fusion)" opacity=".8"/><ellipse cx="22" cy="8" rx="5" ry="8" fill="#fff" opacity=".5"/></svg>`,
    Physical:`<div style="font-size:1.3rem">💥</div>`,
  };
  return shapes[el]||shapes.Physical;
}
function fireProj(fromId,toId,el,onHit){
  const fe=document.getElementById('f-'+fromId),te=document.getElementById('f-'+toId);
  if(!fe||!te){onHit();return;}
  const fr=fe.getBoundingClientRect(),tr=te.getBoundingClientRect();
  const proj=document.createElement('div');proj.className='proj';proj.innerHTML=projHTML(el);
  proj.style.cssText=`left:${fr.left+fr.width/2}px;top:${fr.top+fr.height/2}px;transform:translate(-50%,-50%)`;
  document.getElementById('projLayer').appendChild(proj);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    proj.style.left=(tr.left+tr.width/2)+'px';proj.style.top=(tr.top+tr.height/2)+'px';
    proj.style.transform='translate(-50%,-50%) scale(1.3)';
  }));
  setTimeout(()=>{proj.style.opacity='0';proj.style.transform='translate(-50%,-50%) scale(2)';setTimeout(()=>proj.remove(),180);onHit();},370);
}
function floatDmg(fid,val,cls){
  const el=document.getElementById('f-'+fid);if(!el)return;
  const d=document.createElement('div');d.className=`dmg-float ${cls}`;d.textContent=val;
  el.style.position='relative';el.appendChild(d);setTimeout(()=>d.remove(),860);
}
function animF(fid,cls){
  const el=document.getElementById('f-'+fid);if(!el)return;
  el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),500);
}

function showPeek(fid,e){
  if(e)e.stopPropagation();
  const f=G.player.find(x=>x.id===fid)||G.enemy.find(x=>x.id===fid);if(!f)return;
  const isPlayerFighter=G.player.some(x=>x.id===fid);
  const pvp=G.mode==='pvp';
  const isActivePlayer = !pvp
    || (G.pvpTurn==='p1' && isPlayerFighter)
    || (G.pvpTurn==='p2' && !isPlayerFighter)
    || G.phase==='resolve';
  document.getElementById('peekTitle').textContent=`${f.emoji} ${f.name} · ${isActivePlayer?'Your':'Enemy'} Cards`;
  const peekPool=[...buildCardPool(f),{...CHAR_CARDS[f.name],variety:true}];
  document.getElementById('peekCards').innerHTML=peekPool.map(c=>{
    const tc=typeCol(c.t);
    const val=c.t==='buff'?`+${Math.round((c.bv||0)*100)}%ATK`:c.t==='debuff'?`⬇️${Math.round((c.dv||0.20)*100)}%ATK`:c.v?`${c.t==='attack'?'⚔️':'💚'}${c.v}`:'';
    const desc=cardDesc(c,f.role);
    let badge='';
    if(isActivePlayer){
      const committed=f.committed.some(h=>h.n===c.n);
      const inHand=(f.hand||[]).some(h=>h.n===c.n);
      if(committed)badge=`<div style="font-size:.34rem;color:var(--gold);font-weight:700">✓ QUEUED</div>`;
      else if(inHand)badge=`<div style="font-size:.34rem;color:var(--green)">in hand</div>`;
    }
    return`<div class="hcard" style="cursor:default;pointer-events:none;height:100px${c.ult?';border-color:rgba(212,168,67,.5)':''}">
      <div class="hcard-cost${c.c===0?' free-cost':''}">${c.c===0?'F':c.c}</div>
      <div class="hcard-ic">${c.ic}</div>
      <div class="hcard-nm">${c.n}</div>
      <div class="hcard-tp" style="color:${tc}">${c.ult?'⭐ULT':c.t.toUpperCase()}</div>
      <div class="hcard-vl" style="color:${tc}">${val}</div>
      <div style="font-size:.34rem;color:var(--dim2);text-align:center;line-height:1.3;white-space:pre-line">${desc}</div>
      ${badge}
    </div>`;
  }).join('');
  const cx=e?(e.clientX||e.touches?.[0]?.clientX||100):100;
  const cy=e?(e.clientY||e.touches?.[0]?.clientY||100):100;
  const x=Math.min(cx+4,window.innerWidth-310);
  const y=Math.min(cy+4,window.innerHeight-300);
  const peek=document.getElementById('peekEl');
  peek.style.left=x+'px';peek.style.top=y+'px';peek.style.display='block';
}
document.addEventListener('click',e=>{
  if(!e.target.closest('#peekEl')&&!e.target.closest('.f-header')&&!e.target.closest('.enemy-fighter'))
    document.getElementById('peekEl').style.display='none';
});

function checkWin(){
  if(G.done)return;
  const pa=G.player.filter(f=>f.alive).length;
  const ea=G.enemy.filter(f=>f.alive).length;
  if(!ea){G.done=true;setTimeout(()=>showResult(true),600);}
  else if(!pa){G.done=true;setTimeout(()=>showResult(false),600);}
}
function showResult(won){
  const pvp=G.mode==='pvp';
  document.getElementById('resIcon').textContent=won?'🏆':'💀';
  document.getElementById('resTitle').textContent=pvp?(won?'Player 1 Wins! 🏆':'Player 2 Wins! 🏆'):(won?'Victory!':'Defeated...');
  document.getElementById('resTitle').className='res-title win';
  document.getElementById('resSub').textContent=pvp
    ?`Battle concluded on round ${G.round}!`
    :(won?`All enemies defeated in ${G.round} rounds!`:`Your team fell on round ${G.round}.`);
  document.getElementById('resultOv').classList.add('show');
}
function goTitle(){
  document.getElementById('resultOv').classList.remove('show');
  document.getElementById('peekEl').style.display='none';
  document.getElementById('passOv').classList.remove('show');
  showScreen('titleScreen');
}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');}
function showModeSelect(){document.getElementById('modeSelectOv').classList.add('show');}