// ═══════════════════════════════════════════════════════════
// RENDERING HELPERS & DOM BUILDERS
// Converts game state into HTML — fighter cards, hand cards,
// card detail tooltips, and the full renderAll() refresh
// ═══════════════════════════════════════════════════════════
function elC(el){return `var(${EL_VAR[el]||'--Physical'})`;}
function hpColor(pct){return pct>50?'var(--green)':pct>25?'var(--gold)':'var(--red)';}
function typeCol(t){return t==='attack'?'#ff6060':t==='heal'?'#2ecc71':t==='defend'?'#60a0ff':t==='buff'?'var(--gold)':t==='debuff'?'#bb44ff':'var(--dim2)';}
function cardDesc(c,role){
  // Variety cards get their own unique descriptions
  if(c.variety&&c.vfx){
    const vfxDescs={
      'buff_allallies':   'Buffs ALL alive allies ATK simultaneously',
      'consume_buff':     'If target has ATK buff, deals +10% Max HP bonus damage & strips it',
      'lifesteal_40':     'Heals self for 40% of damage dealt',
      'execute_25':       'Deals DOUBLE damage to enemies below 25% HP',
      'execute_30':       'Deals DOUBLE damage to enemies below 30% HP',
      'double_hit_50':    'Hits the same target TWICE for 50% each (100% total)',
      'burn_dot_20':      'Hits random enemy + leaves burn: 20 damage next round',
      'burn_dot_30':      'Hits random enemy + leaves burn: 30 damage next round',
      'self_shield_40':   'Attacks enemy + grants self a 40-point bonus shield',
      'heal_self_30':     'Buffs own ATK and heals self for 30 HP simultaneously',
      'shield_all_40':    'Heals lowest HP ally + grants 40-point shield to ALL allies',
      'shield_lowest_50': 'Grants 50-point shield to the lowest HP ally',
      'shield_all_split': 'Grants shield split evenly across ALL alive allies',
      'shield_mini_all_25':'Full shield to self + 25-point mini-shield to every ally',
      'shield_lowest_def':'Grants shield to the lowest DEF ally instead of self',
      'reduce_next_hit_20':'Shields self + reduces the next hit any ally takes by 20%',
      'ignore_shield':    'Bypasses target\'s active shield entirely',
      'remove_top_card':  'Debuffs target AND removes their highest-cost committed card',
      'delayed_debuff':   'Plants a detonation — debuff triggers at START of NEXT round',
      'random_target_debuff10': 'Hits random enemy + applies an extra -10% ATK debuff',
      'bonus_debuffed_30':'Deals +30% bonus damage if target already has a debuff',
      'bonus_shield_20pct':'Deals +20% of target\'s current shield as bonus damage',
      'bonus_buffed_25pct':'Deals +25% bonus damage if target has an active ATK buff',
      'splash_second_40pct':'Hits primary target + 40% splash to a random 2nd enemy',
      'target_highest_hp':'Always targets the highest HP enemy specifically',
      'target_lowest_hp': 'Always targets the lowest HP enemy (perfect finisher)',
      'target_lowest_hppct':'Targets the most damaged enemy (lowest HP ratio)',
      'target_highest_atk':'Always targets the highest ATK enemy',
      'target_lowest_def':'Always targets the lowest DEF enemy',
      'debuff_all_enemies':'Debuffs ALL alive enemies ATK simultaneously',
      'buff_lowest_hp_ally':'Buffs the lowest HP ally\'s ATK (not just DPS)',
      'buff_top2_atk':    'Buffs self AND the ally with 2nd-highest ATK together',
      'shatter_highdef_15':'Targets highest DEF enemy, reduces their DEF by 15% too',
      'draw_extra_card':  'Buffs ATK + draws 1 extra card from this fighter\'s pool',
      'refund_on_kill':   'If this kills the target, energy cost is fully refunded',
      'scale_hp_pct':     'Damage multiplied by owner\'s remaining HP% × 1.5',
      'stacking_buff':    'Each consecutive use this battle gains +1% extra buff value',
      'restore_1_energy': 'Heals lowest HP ally + restores 1 energy to the player',
      'bonus_def_scaling':'Adds owner\'s DEF × 0.5 as bonus damage on top of ATK',
      'mark_plus15_dmg':  'Marks target — they take +15% more from ALL sources this round',
      'heal_two_lowest':  'Heals the TWO lowest HP allies (split evenly)',
      'self_damage_20':   'Highest base damage; costs 20 HP self-damage',
      'untargetable':     'Makes owner untargetable by enemies this round',
      'chain_electro_25': 'Hits primary target + 25% chain to a random 2nd enemy',
      'copy_buff':        'Copies the highest ATK buff from an ally to self',
      'full_team_shield_30':'Grants 30-point shield to every alive ally',
      'random_buff_team': 'Randomly buffs ATK of all alive allies',
      'none':             'Unique variety skill — special effect on use',
    };
    return `✦ ${vfxDescs[c.vfx]||'Unique variety effect'}`;
  }
  // 4.0 skill cards — show the skill text directly
  if(c.skill) return `→ ${c.skill}`;
  return '';
}

function renderFighter(f,isPlayer,hideCommitted=false){
  const pct=Math.max(0,f.hp/f.maxHp*100);
  const boxCol=elC(f.el);
  const hpBarColor=pct>50?'var(--green)':pct>25?'var(--gold)':'var(--red)';
  let pips='';
  if(f.buffRounds>0)pips+=`<span class="buff-pip">⬆️×${f.atkMult.toFixed(1)}(${f.buffRounds}r)</span>`;
  if(f.debuffRounds>0)pips+=`<span class="guard-pip" style="background:rgba(187,68,255,.15);color:#bb44ff;border-color:rgba(187,68,255,.3)">⬇️ATK(${f.debuffRounds}r)</span>`;
  if(f.guard)pips+=`<span class="guard-pip">🛡️Grd</span>`;
  if(f.overdrive)pips+=`<span class="overdrive-pip">⚡OD</span>`;
  if(f.shield>0)pips+=`<span class="guard-pip">🛡️${f.shield}</span>`;
  const header=`<div class="f-header" onclick="showPeek('${f.id}',event)">
    <div class="f-avatar" style="background:${boxCol}20;border:2px solid ${boxCol}55">${f.emoji}</div>
    <div class="f-body">
      <div class="f-top">
        <span class="f-name" style="color:${boxCol}">${f.name}</span>
        <span class="role-badge role-${f.role}">${f.role==='subdps'?'Sub':f.role==='support'?'Supp':f.role.toUpperCase()}</span>
      </div>
      <div class="f-stats-row"><span>ATK <b>${f.atk}</b></span><span>DEF <b>${f.def}</b></span><span style="color:var(--dim2);font-size:.55rem">${WEAPON_IC[f.weapon]||''} ${f.weapon||''}</span></div>
      <div class="hp-bar-wrap">
        <div class="hp-bar-track"><div class="hp-bar-fill" style="width:${pct}%;background:${hpBarColor}"></div></div>
        <div class="hp-lbl" style="color:${hpBarColor}">${Math.max(0,f.hp)}/${f.maxHp}</div>
      </div>
      ${pips?`<div class="buff-row">${pips}</div>`:''}
      <div class="peek-hint">👁 tap to peek</div>
    </div>
  </div>`;
  if(!isPlayer){
    // During resolve, show enemy committed cards (read-only fan)
    const showEnemyFan = G.phase==='resolve' && f.committed.length>0;
    const enemyFan = showEnemyFan ? `<div class="committed-fan enemy-fan" id="fan-${f.id}">${buildEnemyFan(f)}</div>` : '';
    return`<div class="fighter enemy-fighter${f.alive?'':' dead'}${f.overdrive?' overdrive':''}" id="f-${f.id}">${header}${enemyFan}</div>`;
  }
  return`<div class="fighter${f.alive?'':' dead'}${f.overdrive?' overdrive':''}" id="f-${f.id}">
    ${header}
    <div class="committed-fan" id="fan-${f.id}">${buildFan(f,hideCommitted)}</div>
  </div>`;
}

function buildFan(f,hideCommitted=false){
  if(!f.committed.length)return'';
  const total=f.committed.length;
  return f.committed.map((c,i)=>{
    const offset=i*14,rot=(i-(total-1)/2)*4,zIdx=i+1,execOrder=total-i;
    const lbl=c.variety?'VAR':'SKL';
    const col=c.variety?'var(--gold)':'var(--dim2)';
    if(hideCommitted){
      return`<div class="fan-card fan-hidden"
        style="left:${6+offset}px;z-index:${zIdx};transform:rotate(${rot}deg);"
        title="Hidden">
        <div class="fan-order">${execOrder}</div>
        <div class="fan-ic">${c.ic}</div>
        <div class="fan-tp" style="color:${col}">${lbl}</div>
      </div>`;
    }
    return`<div class="fan-card${c.variety?' variety-fan':''}"
      style="left:${6+offset}px;z-index:${zIdx};transform:rotate(${rot}deg);"
      draggable="true"
      ondragstart="fanDragStart(event,'${f.id}',${i})"
      ondragover="fanDragOver(event)"
      ondragleave="fanDragLeave(event)"
      ondrop="fanDrop(event,'${f.id}',${i})"
      ondragend="fanDragEnd(event)"
      onclick="unplace('${f.id}',${i})" title="Drag to reorder · Tap to remove · ${c.n}">
      <div class="fan-order">${execOrder}</div>
      <div class="fan-ic">${c.ic}</div>
      <div class="fan-tp" style="color:${col}">${lbl}</div>
    </div>`;
  }).join('');
}

function buildEnemyFan(f){
  if(!f.committed.length)return'';
  const total=f.committed.length;
  return f.committed.map((c,i)=>{
    const offset=i*14, rot=(i-(total-1)/2)*4, zIdx=i+1;
    const execOrder=total-i;
    const lbl=c.variety?'VAR':'SKL';
    const col=c.variety?'var(--gold)':'var(--dim2)';
    return`<div class="fan-card enemy-fan-card${c.variety?' variety-fan':''}"
      style="left:${6+offset}px;z-index:${zIdx};transform:rotate(${rot}deg);"
      title="${c.n}">
      <div class="fan-order">${execOrder}</div>
      <div class="fan-ic">${c.ic}</div>
      <div class="fan-tp" style="color:${col}">${lbl}</div>
      <div class="fan-nm">${c.n}</div>
    </div>`;
  }).join('');
}

function renderHandCard(hc){
  const canUse=activeEnergy()>=1&&G.phase==='commit'&&!G.done;
  const isVariety=hc.variety;
  const val=hc.v?`⚔️${hc.v}`:(hc.shield?`🛡️${hc.shield}`:'');
  const typeLabel = isVariety ? '✦VAR' : 'SKILL';
  const borderStyle = isVariety ? 'variety-card' : '';
  return`<div class="hcard${canUse?'':' hcdis'}${isVariety?' variety-card':''}" id="hc-${hc.hid}"
    ontouchstart="hcTouchStart(event,'${hc.hid}')"
    ontouchend="hcTouchEnd(event,'${hc.hid}')"
    ontouchcancel="hcTouchCancel('${hc.hid}')"
    onclick="hcTap('${hc.hid}')">
    <div class="hcard-cost${hc.c===0?' free-cost':''}">${hc.c===0?'F':hc.c}</div>
    <div class="hcard-ic">${hc.ic}</div>
    <div class="hcard-nm">${hc.n}</div>
    <div class="hcard-tp" style="color:${isVariety?'var(--gold)':'var(--dim2)'}">${typeLabel}</div>
    <div class="hcard-vl">${val}</div>
    <div class="hcard-ow">${hc.ownerName.split(' ')[0]}</div>
    ${G.phase==='commit'&&!G.done&&!isVariety?`<div class="discard-btn" onclick="event.stopPropagation();discardCard('${hc.ownerId}','${hc.hid}')" title="Discard (costs 1 energy)">✕</div>`:''}
  </div>`;
}

// discardCard is defined in battle.js — signature: discardCard(fid, hid)
// Variety cards cannot be discarded (no discard button rendered for them)

// ── Active hand / fighter helpers for PvP turn awareness ──
function activeEnergy(){return(G.mode==='pvp'&&G.pvpTurn==='p2')?G.botEnergy:G.energy;}
function activeHand(){
  const isP2=G.mode==='pvp'&&G.pvpTurn==='p2';
  const team=isP2?G.enemy:G.player;
  return team.filter(f=>f.alive).flatMap(f=>f.hand||[]);
}
function activeFighters(){
  const isP2=G.mode==='pvp'&&G.pvpTurn==='p2';
  return isP2?G.enemy:G.player;
}

function renderAll(){
  const isPvP=G.mode==='pvp';
  const isP2Turn=isPvP&&G.pvpTurn==='p2';

  // Team labels
  if(isPvP){
    document.getElementById('playerTeamLbl').textContent='P1';
    document.getElementById('enemyTeamLbl').textContent='P2';
  } else {
    document.getElementById('playerTeamLbl').textContent='YOU';
    document.getElementById('enemyTeamLbl').textContent='FOE';
  }

  // Fighters — during P2 turn, hide P1's committed fan (blind)
  document.getElementById('playerCol').innerHTML=G.player.map(f=>renderFighter(f,true,isP2Turn&&G.pvpTurn==='p2')).join('');
  document.getElementById('enemyCol').innerHTML=G.enemy.map(f=>renderFighter(f,isPvP&&isP2Turn,false)).join('');

  // Hand display — 4.0: cards live on f.hand per fighter
  const displayTeam=isP2Turn?G.enemy:G.player;

  // Flatten all hands from the display team into one list
  const displayHand=displayTeam.filter(f=>f.alive).flatMap(f=>f.hand||[]);

  const dpsCards=displayHand.filter(hc=>{const f=displayTeam.find(x=>x.name===hc.ownerName);return f&&f.role==='dps';});
  const subCards=displayHand.filter(hc=>{const f=displayTeam.find(x=>x.name===hc.ownerName);return f&&f.role==='subdps';});
  const suppCards=displayHand.filter(hc=>{const f=displayTeam.find(x=>x.name===hc.ownerName);return f&&f.role==='support';});

  document.getElementById('handDpsCards').innerHTML=dpsCards.map(renderHandCard).join('');
  document.getElementById('handSubCards').innerHTML=subCards.map(renderHandCard).join('');
  document.getElementById('handSuppCards').innerHTML=suppCards.map(renderHandCard).join('');

  // Column label color for P2
  const hz=document.getElementById('handZone');
  if(isP2Turn) hz.classList.add('p2-active'); else hz.classList.remove('p2-active');

  document.getElementById('roundNum').textContent=G.round;
  document.getElementById('enVal').textContent=activeEnergy();
  // Bot energy — show in bot mode only
  const botEnBlock=document.getElementById('botEnBlock');
  if(G.mode==='bot'){
    botEnBlock.style.display='flex';
    document.getElementById('botEnVal').textContent=G.botEnergy;
    botEnBlock.style.opacity=G.botEnergy>=3?'1':'.55';
  } else {
    botEnBlock.style.display='none';
  }
  document.getElementById('overdriveBar').style.display='none'; // overdrive removed in 4.0
  document.getElementById('guardBar').style.display=
    ((isP2Turn?G.enemy:G.player).some(f=>f.guard)&&G.round===1)?'flex':'none';

  const c=G.phase==='commit';
  document.getElementById('commitBtn').disabled=!c||G.done;
  document.getElementById('passBtn').disabled=!c||G.done;

  // Phase label + PvP badge
  const badge=document.getElementById('pvpTurnBadge');
  if(isPvP&&c){
    const who=isP2Turn?'P2':'P1';
    document.getElementById('phaseLbl').textContent=`${who}: Commit cards`;
    badge.textContent=isP2Turn?'⚔️ Player 2':'⚔️ Player 1';
    badge.className='pvp-turn-badge show '+(isP2Turn?'p2':'p1');
  } else {
    document.getElementById('phaseLbl').textContent=c?'Tap cards to commit':'Resolving...';
    badge.className='pvp-turn-badge';
  }
}

function updateFighterDOM(f){
  const el=document.getElementById('f-'+f.id);if(!el)return;
  const isPlayer=G.player.some(x=>x.id===f.id);
  const tmp=document.createElement('div');
  tmp.innerHTML=renderFighter(f,isPlayer);
  el.replaceWith(tmp.firstElementChild);
}

let lpTimer=null,lpActive=false;
function hcTouchStart(e,hid){
  lpActive=false;
  lpTimer=setTimeout(()=>{lpActive=true;showCardDetail(hid,e.touches[0]);},450);
}
function hcTouchEnd(e,hid){
  clearTimeout(lpTimer);
  if(lpActive){
    hideCardDetail();
    lpActive=false;
  } else {
    hcTap(hid);
  }
}
function hcTouchCancel(hid){clearTimeout(lpTimer);hideCardDetail();lpActive=false;}

function hcTap(hid){
  if(G.phase!=='commit'||G.done)return;
  const isP2=G.mode==='pvp'&&G.pvpTurn==='p2';
  const team=isP2?G.enemy:G.player;
  // Find which fighter owns this card
  let f=null, hc=null;
  for(const fighter of team){
    const found=fighter.hand&&fighter.hand.find(c=>c.hid===hid);
    if(found){f=fighter;hc=found;break;}
  }
  if(!f||!hc||!f.alive)return;
  const energy=activeEnergy();
  if(energy<1)return;
  if(isP2) G.botEnergy--; else G.energy--;
  f.committed.push({...hc});
  f.hand=f.hand.filter(c=>c.hid!==hid);
  renderAll();
}

let _cardDetailPinned=false;

function showCardDetail(hid,touch,pinned=false){
  const hc=activeHand().find(c=>c.hid===hid);if(!hc)return;
  const fighters=activeFighters();
  const f=fighters.find(x=>x.name===hc.ownerName);
  const isVariety=hc.variety;
  const val=hc.v?`⚔️ ${hc.v}`:(hc.shield?`🛡️ ${hc.shield}`:'');
  const desc=cardDesc(hc,f?f.role:'dps');
  let d=document.getElementById('cardDetailEl');
  if(!d){d=document.createElement('div');d.id='cardDetailEl';d.className='card-detail';document.body.appendChild(d);}
  _cardDetailPinned=pinned;
  d.className='card-detail'+(pinned?' pinned':'');
  d.innerHTML=`<div class="cd-close" onclick="hideCardDetail()">✕</div>
    <span class="cd-ic">${hc.ic}</span>
    <div class="cd-nm">${hc.n}</div>
    <div class="cd-type" style="color:${isVariety?'var(--gold)':'var(--dim2)'}">${isVariety?'✦ VARIETY':'SKILL'}</div>
    <span class="cd-vl">${val}</span>
    <div class="cd-desc">${desc}</div>
    <div class="cd-cost">Cost: ${hc.c===0?'FREE':'1 energy'} · ${hc.ownerName}</div>
    ${pinned?`<div class="cd-hint-pin">📌 pinned · click outside to close</div>`:`<div class="cd-hint">release to dismiss</div>`}`;
  const x=Math.min((touch.clientX||100)-85,window.innerWidth-180);
  const y=Math.max((touch.clientY||100)-220,8);
  d.style.left=x+'px';d.style.top=y+'px';d.style.display='block';
  const el=document.getElementById('hc-'+hid);if(el)el.classList.add('pressing');
}
function hideCardDetail(){
  _cardDetailPinned=false;
  const d=document.getElementById('cardDetailEl');if(d)d.style.display='none';
  document.querySelectorAll('.hcard.pressing').forEach(el=>el.classList.remove('pressing'));
}

document.addEventListener('mousedown',e=>{
  // Close pinned popup if clicking outside it
  if(_cardDetailPinned){
    const d=document.getElementById('cardDetailEl');
    if(d&&!d.contains(e.target)){hideCardDetail();return;}
  }
  if(e.button!==0)return; // only left button for hold
  const card=e.target.closest('.hcard');
  if(!card||card.classList.contains('hcdis'))return;
  const hid=card.id.replace('hc-','');
  lpActive=false;
  lpTimer=setTimeout(()=>{lpActive=true;showCardDetail(hid,e);},450);
});
document.addEventListener('mouseup',e=>{
  clearTimeout(lpTimer);
  if(lpActive&&!_cardDetailPinned){hideCardDetail();lpActive=false;}
});

// Right-click to pin card detail
document.addEventListener('contextmenu',e=>{
  const card=e.target.closest('.hcard');
  if(!card||card.classList.contains('hcdis'))return;
  e.preventDefault();
  const hid=card.id.replace('hc-','');
  clearTimeout(lpTimer);lpActive=false;
  showCardDetail(hid,e,true);
});

function unplace(fid,idx){
  if(G.phase!=='commit'||G.done)return;
  const isP2=G.mode==='pvp'&&G.pvpTurn==='p2';
  const team=isP2?G.enemy:G.player;
  const f=team.find(x=>x.id===fid);if(!f)return;
  const card=f.committed[idx];if(!card)return;
  // Restore 1 energy
  if(isP2) G.botEnergy=Math.min(3,G.botEnergy+1);
  else G.energy=Math.min(3,G.energy+1);
  // Return to f.hand
  f.hand.push({...card,hid:'h'+Math.random().toString(36).slice(2)});
  f.committed.splice(idx,1);
  renderAll();
}
