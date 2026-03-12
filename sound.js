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
  const odMult=owner.overdrive?1.1:1.0;

  // FILO — reverse the committed order for execution
  const buffCards=owner.committed.filter(c=>c.t==='buff');
  const restCards=owner.committed.filter(c=>c.t!=='buff');
  const execOrder=[...buffCards,...restCards].reverse();

  execOrder.forEach((card,ci)=>{
    setTimeout(()=>{
      if(!owner.alive)return;
      animF(owner.id,'attacking-anim');
      const aliveFoes=foes.filter(r=>r.alive);
      const aliveAllies=allies.filter(r=>r.alive);

      if(card.t==='attack'){
        if(!aliveFoes.length)return;
        if(card.variety&&card.vfx&&card.vfx!=='none'){
          playSound(card.ult?'ult':'attack');
          const raw2=Math.round(card.v*(owner.atkMult||1)*(owner.atk/70)*comboMult*odMult);
          flyCard(card,owner.id,owner.id,()=>{applyVarietyVfx(card,owner,allies,foes,raw2);});
          return;
        }
        const target=pickTarget(aliveFoes,owner.role,card.t);
        const raw=Math.round(card.v*owner.atkMult*(owner.atk/70)*comboMult*odMult*(G._teamDmgMult||1)*(G._phantomRift?1.30:1.0));
        playSound(card.ult?'ult':'attack');
        flyCard(card,owner.id,target.id,()=>{
          // Solar mark bonus
          if(target._solarMark){raw2_marked=Math.round(raw*1.15);target._solarMark=0;}
          const finalRaw=target._solarMark===undefined?raw:Math.round(raw*(target._reactionDmgMult||1));
          const actualRaw=Math.round(raw*(target._reactionDmgMult||1));
          // Phantom rift: ignore 50% DEF
          const defIgnore=G._phantomRift?0.50:0;
          const res=dealDmgEx(target,actualRaw,owner.el,defIgnore);
          animF(target.id,'taking-hit');
          if(res.isCrit)playSound('crit');
          const cls=card.ult?'ult':res.isCrit?'crit':res.resist?'resist':'dmg';
          floatDmg(target.id,`-${res.dmg}${res.isCrit?' CRIT!':''}`,cls);
          if(res.absorbed>0)floatDmg(target.id,`🛡️-${res.absorbed}`,'buff');
          updateFighterDOM(target);
          fireProj(owner.id,target.id,owner.el,()=>{});
          checkWin();
        });
      } else if(card.t==='debuff'){
        if(!aliveFoes.length)return;
        if(card.variety&&card.vfx&&card.vfx!=='none'){
          playSound('debuff');
          const raw3=0;
          flyCard(card,owner.id,owner.id,()=>{applyVarietyVfx(card,owner,allies,foes,raw3);});
          return;
        }
        const target=pickTarget(aliveFoes,owner.role,card.t);
        const reduction=Math.round(target.atk*(card.dv||0.20));
        target.atk=Math.max(1,target.atk-reduction);
        target.debuffRounds=(target.debuffRounds||0)+1;
        target.atkDebuffAmount=(target.atkDebuffAmount||0)+reduction;
        playSound('debuff');
        flyCard(card,owner.id,target.id,()=>{
          animF(target.id,'taking-hit');
          floatDmg(target.id,`⬇️ATK -${reduction}`,'debuff');
          updateFighterDOM(target);
        });
      } else if(card.t==='defend'){
        if(card.variety&&card.vfx&&card.vfx!=='none'){
          playSound('defend');
          flyCard(card,owner.id,owner.id,()=>{applyVarietyVfx(card,owner,allies,foes,0);});
          return;
        }
        const sh=card.v;
        owner.shield+=sh;
        playSound('defend');
        flyCard(card,owner.id,owner.id,()=>{
          animF(owner.id,'healing-anim');
          floatDmg(owner.id,`+${sh}🛡️`,'buff');
          updateFighterDOM(owner);
        });
      } else if(card.t==='heal'){
        if(card.variety&&card.vfx&&card.vfx!=='none'){
          playSound('heal');
          flyCard(card,owner.id,owner.id,()=>{applyVarietyVfx(card,owner,allies,foes,0);});
          return;
        }
        const healAmt=Math.round(card.v*(1+owner.def/100));
        const lowestAlly=aliveAllies.filter(a=>a.id!==owner.id).sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
        const mainHeal=Math.round(healAmt*0.7),selfHeal=Math.round(healAmt*0.3);
        playSound('heal');
        if(lowestAlly){
          flyCard(card,owner.id,lowestAlly.id,()=>{
            lowestAlly.hp=Math.min(lowestAlly.maxHp,lowestAlly.hp+mainHeal);
            animF(lowestAlly.id,'healing-anim');
            floatDmg(lowestAlly.id,`+${mainHeal}💚`,'heal');
            updateFighterDOM(lowestAlly);
          });
        }
        owner.hp=Math.min(owner.maxHp,owner.hp+selfHeal);
        animF(owner.id,'healing-anim');
        floatDmg(owner.id,`+${selfHeal}💚`,'heal');
        updateFighterDOM(owner);
      } else if(card.t==='buff'){
        if(card.variety&&card.vfx&&card.vfx!=='none'){
          playSound('buff');
          flyCard(card,owner.id,owner.id,()=>{applyVarietyVfx(card,owner,allies,foes,0);});
          return;
        }
        owner.atkMult=Math.min(2.5,(owner.atkMult||1)+(card.bv||.08));
        owner.buffRounds=1;
        playSound('buff');
        if(owner.role==='support'){
          const topDPS=aliveAllies.filter(a=>a.id!==owner.id&&a.role==='dps').sort((a,b)=>b.atk-a.atk)[0];
          if(topDPS){
            flyCard(card,owner.id,topDPS.id,()=>{
              topDPS.atkMult=Math.min(2.5,(topDPS.atkMult||1)+(card.bv||.08)*0.7);
              topDPS.buffRounds=1;
              animF(topDPS.id,'healing-anim');
              floatDmg(topDPS.id,`+${Math.round((card.bv||.08)*70)}%ATK`,'buff');
              updateFighterDOM(topDPS);
            });
          }
          floatDmg(owner.id,`+${Math.round((card.bv||.08)*30)}%ATK`,'buff');
        } else {
          flyCard(card,owner.id,owner.id,()=>{
            floatDmg(owner.id,`+${Math.round((card.bv||.08)*100)}%ATK`,'buff');
          });
        }
        animF(owner.id,'healing-anim');
        updateFighterDOM(owner);
      }
    },ci*520);
  });
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
  document.getElementById('peekCards').innerHTML=f.cardPool.map(c=>{
    const tc=typeCol(c.t);
    const val=c.t==='buff'?`+${Math.round((c.bv||0)*100)}%ATK`:c.t==='debuff'?`⬇️${Math.round((c.dv||0.20)*100)}%ATK`:c.v?`${c.t==='attack'?'⚔️':'💚'}${c.v}`:'';
    const desc=cardDesc(c,f.role);
    let badge='';
    if(isActivePlayer){
      const committed=f.committed.some(h=>h.n===c.n);
      const hand=isPlayerFighter?G.hand:G.p2hand;
      const inHand=(hand||[]).some(h=>h.ownerName===f.name&&h.n===c.n);
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
