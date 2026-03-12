// ═══════════════════════════════════════════════════════════
// VARIETY CARD SPECIAL EFFECTS (applyVarietyVfx)
// Each unique variety card vfx key maps to special behavior:
// lifesteal, execute, double-hit, shields, DOTs, targeting…
// ═══════════════════════════════════════════════════════════
// ── Variety VFX special effects ──
function applyVarietyVfx(card,owner,allies,foes,raw){
  const vfx=card.vfx||'none';
  const aliveFoes=foes.filter(f=>f.alive);
  const aliveAllies=allies.filter(f=>f.alive);
  const odLabel=owner.overdrive?' ⚡OD':'';
  switch(vfx){
    case 'buff_allallies':
      aliveAllies.forEach(a=>{
        a.atkMult=Math.min(2.5,(a.atkMult||1)+(card.bv||.08));
        a.buffRounds=1;
        floatDmg(a.id,`✦+${Math.round((card.bv||.08)*100)}%ATK`,'buff');
        updateFighterDOM(a);
      });
      return true;
    case 'consume_buff':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const bonus=t.atkMult>1?Math.round(t.maxHp*.10):0;
        const res=dealDmg(t,raw+bonus,owner.el);
        floatDmg(t.id,`-${res.dmg}${bonus>0?' 🌑DEVOURED':''}${odLabel}`,res.isCrit?'crit':'dmg');
        if(bonus>0){t.atkMult=1;t.buffRounds=0;floatDmg(t.id,'Buff Consumed!','debuff');}
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'lifesteal_40':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const res=dealDmg(t,raw,owner.el);
        const steal=Math.round(res.dmg*.40);
        floatDmg(t.id,`-${res.dmg}${odLabel}`,'dmg');
        floatDmg(owner.id,`+${steal}🩸`,'heal');
        updateFighterDOM(t);updateFighterDOM(owner);checkWin();
      }
      return true;
    case 'execute_25':
    case 'execute_30':{
      const threshold=vfx==='execute_25'?.25:.30;
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const mult=(t.hp/t.maxHp<threshold)?2.0:1.0;
        const res=dealDmg(t,Math.round(raw*mult),owner.el);
        floatDmg(t.id,`-${res.dmg}${mult>1?' ⚡EXECUTE!':''}${odLabel}`,mult>1?'ult':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    }
    case 'double_hit_50':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        [0,1].forEach(i=>{
          const res=dealDmg(t,Math.round(raw*.5),owner.el);
          if(t.alive)floatDmg(t.id,`-${res.dmg}`,'dmg');
          updateFighterDOM(t);
        });
        checkWin();
      }
      return true;
    case 'burn_dot_20':
      if(aliveFoes.length){
        const t=pick(aliveFoes);
        const res=dealDmg(t,raw,owner.el);
        floatDmg(t.id,`-${res.dmg}🔥`,'dmg');
        t._burnDot=(t._burnDot||0)+20;
        floatDmg(t.id,'🔥 Burn!','debuff');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'self_shield_40':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const res=dealDmg(t,raw,owner.el);
        floatDmg(t.id,`-${res.dmg}`,'dmg');
        owner.shield+=40;
        floatDmg(owner.id,'+40🛡️🐉','buff');
        updateFighterDOM(t);updateFighterDOM(owner);checkWin();
      }
      return true;
    case 'heal_self_30':
      owner.atkMult=Math.min(2.5,(owner.atkMult||1)+(card.bv||.07));
      owner.buffRounds=1;
      owner.hp=Math.min(owner.maxHp,owner.hp+30);
      floatDmg(owner.id,`✦+${Math.round((card.bv||.07)*100)}%ATK +30💚`,'buff');
      updateFighterDOM(owner);
      return true;
    case 'shield_all_40':
      aliveAllies.forEach(a=>{
        a.shield+=40;
        floatDmg(a.id,'+40🛡️✦','buff');
        updateFighterDOM(a);
      });
      const lh=aliveAllies.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
      if(lh){lh.hp=Math.min(lh.maxHp,lh.hp+Math.round(card.v*.7));floatDmg(lh.id,`+${Math.round(card.v*.7)}💚`,'heal');updateFighterDOM(lh);}
      return true;
    case 'shield_lowest_50':{
      const lowest=aliveAllies.sort((a,b)=>a.hp-b.hp)[0];
      if(lowest){lowest.shield+=50;floatDmg(lowest.id,'+50🛡️✦','buff');updateFighterDOM(lowest);}
      return true;
    }
    case 'shield_all_split':
      aliveAllies.forEach(a=>{
        const sh=Math.round(120/aliveAllies.length);
        a.shield+=sh;floatDmg(a.id,`+${sh}🛡️✦`,'buff');updateFighterDOM(a);
      });
      return true;
    case 'shield_mini_all_25':
      owner.shield+=card.v;
      floatDmg(owner.id,`+${card.v}🛡️`,'buff');
      aliveAllies.filter(a=>a.id!==owner.id).forEach(a=>{
        a.shield+=25;floatDmg(a.id,'+25🛡️⚡','buff');updateFighterDOM(a);
      });
      updateFighterDOM(owner);
      return true;
    case 'shield_lowest_def':{
      const t=aliveAllies.sort((a,b)=>a.def-b.def)[0];
      if(t){t.shield+=card.v;floatDmg(t.id,`+${card.v}🛡️✦`,'buff');updateFighterDOM(t);}
      return true;
    }
    case 'reduce_next_hit_20':
      owner.shield+=card.v;
      owner._reduceNextHit=0.20;
      floatDmg(owner.id,`+${card.v}🛡️ ✦-20% next`,'buff');
      updateFighterDOM(owner);
      return true;
    case 'ignore_shield':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'debuff');
        const reduction=Math.round(t.atk*(card.dv||.20));
        t.atk=Math.max(1,t.atk-reduction);
        t.debuffRounds=(t.debuffRounds||0)+1;
        t.atkDebuffAmount=(t.atkDebuffAmount||0)+reduction;
        const savedShield=t.shield;t.shield=0;
        floatDmg(t.id,`⬇️ATK -${reduction} 👻PHASE`,'debuff');
        t.shield=savedShield;
        updateFighterDOM(t);
      }
      return true;
    case 'remove_top_card':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'debuff');
        const reduction=Math.round(t.atk*(card.dv||.18));
        t.atk=Math.max(1,t.atk-reduction);
        t.debuffRounds=(t.debuffRounds||0)+1;
        t.atkDebuffAmount=(t.atkDebuffAmount||0)+reduction;
        // Remove highest cost committed card
        if(t.committed&&t.committed.length){
          t.committed.sort((a,b)=>b.c-a.c);
          t.committed.splice(0,1);
          floatDmg(t.id,'🎵 Card Disrupted!','debuff');
        }
        floatDmg(t.id,`⬇️ATK -${reduction}`,'debuff');
        updateFighterDOM(t);
      }
      return true;
    case 'delayed_debuff':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'debuff');
        t._pendingDebuff=(t._pendingDebuff||0)+(card.dv||.18);
        floatDmg(t.id,'💣 Marked!','debuff');
        updateFighterDOM(t);
      }
      return true;
    case 'random_target_debuff10':
      if(aliveFoes.length){
        const t=pick(aliveFoes);
        const res=dealDmg(t,raw,owner.el);
        const reduction=Math.round(t.atk*.10);
        t.atk=Math.max(1,t.atk-reduction);
        t.debuffRounds=(t.debuffRounds||0)+1;
        t.atkDebuffAmount=(t.atkDebuffAmount||0)+reduction;
        floatDmg(t.id,`-${res.dmg} ⬇️-10%ATK`,'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'bonus_debuffed_30':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const bonus=t.debuffRounds>0?1.30:1.0;
        const res=dealDmg(t,Math.round(raw*bonus),owner.el);
        floatDmg(t.id,`-${res.dmg}${bonus>1?' ❄️ZERO POINT':''}`,res.isCrit?'crit':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'bonus_shield_20pct':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const bonus=Math.round((t.shield||0)*.20);
        const res=dealDmg(t,raw+bonus,owner.el);
        floatDmg(t.id,`-${res.dmg}${bonus>0?' ⚖️PUNISH':''}`,res.isCrit?'crit':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'bonus_buffed_25pct':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const bonus=t.atkMult>1?Math.round(raw*.25):0;
        const res=dealDmg(t,raw+bonus,owner.el);
        floatDmg(t.id,`-${res.dmg}${bonus>0?' 🔱REVEALED':''}`,res.isCrit?'crit':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'splash_second_40pct':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const res=dealDmg(t,raw,owner.el);
        floatDmg(t.id,`-${res.dmg}`,'dmg');
        const others=aliveFoes.filter(f=>f.id!==t.id);
        if(others.length){
          const t2=pick(others);
          const res2=dealDmg(t2,Math.round(raw*.40),owner.el);
          floatDmg(t2.id,`-${res2.dmg}🌺`,'dmg');
          updateFighterDOM(t2);
        }
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'target_highest_hp':
      if(aliveFoes.length){
        const t=[...aliveFoes].sort((a,b)=>b.hp-a.hp)[0];
        const res=dealDmg(t,raw,owner.el);
        floatDmg(t.id,`-${res.dmg}🌙`,res.isCrit?'crit':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'target_lowest_hp':
      if(aliveFoes.length){
        const t=[...aliveFoes].sort((a,b)=>a.hp-b.hp)[0];
        const res=dealDmg(t,raw,owner.el);
        floatDmg(t.id,`-${res.dmg}🪶`,res.isCrit?'crit':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'target_lowest_hppct':
      if(aliveFoes.length){
        const t=[...aliveFoes].sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
        const reduction=Math.round(t.atk*(card.dv||.18));
        t.atk=Math.max(1,t.atk-reduction);
        t.debuffRounds=(t.debuffRounds||0)+1;
        t.atkDebuffAmount=(t.atkDebuffAmount||0)+reduction;
        floatDmg(t.id,`⬇️ATK -${reduction} 🎭`,'debuff');
        updateFighterDOM(t);
      }
      return true;
    case 'target_highest_atk':
      if(aliveFoes.length){
        const t=[...aliveFoes].sort((a,b)=>b.atk-a.atk)[0];
        const res=dealDmg(t,raw,owner.el);
        floatDmg(t.id,`-${res.dmg}🦅`,res.isCrit?'crit':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'target_lowest_def':
      if(aliveFoes.length){
        const t=[...aliveFoes].sort((a,b)=>a.def-b.def)[0];
        const res=dealDmg(t,raw,owner.el);
        floatDmg(t.id,`-${res.dmg}🎪`,res.isCrit?'crit':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'debuff_all_enemies':
      aliveFoes.forEach(t=>{
        const reduction=Math.round(t.atk*(card.dv||.20));
        t.atk=Math.max(1,t.atk-reduction);
        t.debuffRounds=(t.debuffRounds||0)+1;
        t.atkDebuffAmount=(t.atkDebuffAmount||0)+reduction;
        floatDmg(t.id,`⬇️ATK -${reduction}👑`,'debuff');
        updateFighterDOM(t);
      });
      return true;
    case 'buff_lowest_hp_ally':{
      const t=[...aliveAllies].sort((a,b)=>a.hp-b.hp)[0];
      if(t){
        t.atkMult=Math.min(2.5,(t.atkMult||1)+(card.bv||.08));
        t.buffRounds=1;
        floatDmg(t.id,`✦+${Math.round((card.bv||.08)*100)}%ATK 💀`,'buff');
        updateFighterDOM(t);
      }
      return true;
    }
    case 'buff_top2_atk':{
      const sorted=[...aliveAllies].sort((a,b)=>b.atk-a.atk).slice(0,2);
      sorted.forEach(a=>{
        a.atkMult=Math.min(2.5,(a.atkMult||1)+(card.bv||.08));
        a.buffRounds=1;
        floatDmg(a.id,`✦+${Math.round((card.bv||.08)*100)}%ATK🐺`,'buff');
        updateFighterDOM(a);
      });
      return true;
    }
    case 'shatter_highdef_15':{
      const t=[...aliveFoes].sort((a,b)=>b.def-a.def)[0];
      if(t){
        const reduction=Math.round(t.atk*(card.dv||.20));
        t.atk=Math.max(1,t.atk-reduction);
        t.def=Math.max(1,Math.round(t.def*.85));
        t.debuffRounds=(t.debuffRounds||0)+1;
        t.atkDebuffAmount=(t.atkDebuffAmount||0)+reduction;
        floatDmg(t.id,'⬇️ATK+DEF-15% 🪨','debuff');
        updateFighterDOM(t);
      }
      return true;
    }
    case 'draw_extra_card':
      owner.atkMult=Math.min(2.5,(owner.atkMult||1)+(card.bv||.08));
      owner.buffRounds=1;
      floatDmg(owner.id,`✦+${Math.round((card.bv||.08)*100)}%ATK`,'buff');
      // Draw one extra card from owner's pool
      {const pool=buildCardPool(owner);const nc={...pick(pool),hid:'h'+Math.random().toString(36).slice(2),ownerName:owner.name,ownerId:owner.id};owner.hand.push(nc);}
      floatDmg(owner.id,'+1🃏','heal');
      updateFighterDOM(owner);
      return true;
    case 'refund_on_kill':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const res=dealDmg(t,raw,owner.el);
        floatDmg(t.id,`-${res.dmg}💎`,res.isCrit?'crit':'dmg');
        if(!t.alive){G.energy=Math.min(G.maxE,G.energy+card.c);floatDmg(owner.id,`+${card.c}⚡ REFUND`,'buff');}
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'scale_hp_pct':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const mult=owner.hp/owner.maxHp*1.5;
        const res=dealDmg(t,Math.round(raw*mult),owner.el);
        floatDmg(t.id,`-${res.dmg}⚔️`,res.isCrit?'crit':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'stacking_buff':
      owner._stackBuff=(owner._stackBuff||0)+1;
      const bvStack=+(((card.bv||.07)+owner._stackBuff*.01).toFixed(3));
      owner.atkMult=Math.min(2.5,(owner.atkMult||1)+bvStack);
      owner.buffRounds=1;
      floatDmg(owner.id,`✦+${Math.round(bvStack*100)}%ATK🍂${owner._stackBuff>1?` ×${owner._stackBuff}`:''}` ,'buff');
      updateFighterDOM(owner);
      return true;
    case 'restore_1_energy':{
      const healAmt=Math.round(card.v*(1+owner.def/100));
      const lh2=[...aliveAllies].sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
      if(lh2){lh2.hp=Math.min(lh2.maxHp,lh2.hp+Math.round(healAmt*.7));floatDmg(lh2.id,`+${Math.round(healAmt*.7)}💚`,'heal');updateFighterDOM(lh2);}
      G.energy=Math.min(G.maxE,G.energy+1);
      floatDmg(owner.id,'+1⚡✦','buff');
      updateFighterDOM(owner);
      return true;
    }
    case 'bonus_def_scaling':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const bonus=Math.round(owner.def*.5);
        const res=dealDmg(t,raw+bonus,owner.el);
        floatDmg(t.id,`-${res.dmg}🌿`,res.isCrit?'crit':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'mark_plus15_dmg':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const res=dealDmg(t,raw,owner.el);
        t._solarMark=1;
        floatDmg(t.id,`-${res.dmg}☀️ MARKED`,res.isCrit?'crit':'dmg');
        updateFighterDOM(t);checkWin();
      }
      return true;
    case 'heal_two_lowest':{
      const healAmt2=Math.round(card.v*(1+owner.def/100));
      const sorted2=[...aliveAllies].sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp)).slice(0,2);
      const each=Math.round(healAmt2/Math.max(sorted2.length,1));
      sorted2.forEach(a=>{a.hp=Math.min(a.maxHp,a.hp+each);floatDmg(a.id,`+${each}💚🌾`,'heal');updateFighterDOM(a);});
      return true;
    }
    case 'self_damage_20':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'attack');
        const res=dealDmg(t,raw,owner.el);
        floatDmg(t.id,`-${res.dmg}✝️`,res.isCrit?'crit':'ult');
        owner.hp=Math.max(1,owner.hp-20);
        floatDmg(owner.id,'-20 🔥COST','debuff');
        updateFighterDOM(t);updateFighterDOM(owner);checkWin();
      }
      return true;
    case 'untargetable':
      if(aliveFoes.length){
        const t=pickTarget(aliveFoes,owner.role,'debuff');
        const reduction=Math.round(t.atk*(card.dv||.20));
        t.atk=Math.max(1,t.atk-reduction);
        t.debuffRounds=(t.debuffRounds||0)+1;
        t.atkDebuffAmount=(t.atkDebuffAmount||0)+reduction;
        owner._untargetable=true;
        floatDmg(owner.id,'🌫️ INVISIBLE','buff');
        floatDmg(t.id,`⬇️ATK -${reduction}`,'debuff');
        updateFighterDOM(t);updateFighterDOM(owner);
      }
      return true;
    default:
      return false;
  }
}

// ── Reaction System ──
const REACTIONS={
  // 2-element
  'Fusion+Havoc':    {name:'Scorch Ruin',    emoji:'🔥💜',fn:(p,e)=>r2_scorchRuin(p,e)},
  'Fusion+Spectro':  {name:'Radiant Blaze',  emoji:'🔥🌟',fn:(p,e)=>r2_radiantBlaze(p,e)},
  'Fusion+Aero':     {name:'Blazing Gale',   emoji:'🔥🌊',fn:(p,e)=>r2_blazingGale(p,e)},
  'Fusion+Glacio':   {name:'Steam Surge',    emoji:'🔥❄️',fn:(p,e)=>r2_steamSurge(p,e)},
  'Fusion+Electro':  {name:'Plasma Ignition',emoji:'🔥⚡',fn:(p,e)=>r2_plasmaIgnition(p,e)},
  'Havoc+Spectro':   {name:'Eclipse Fracture',emoji:'💜🌟',fn:(p,e)=>r2_eclipseFracture(p,e)},
  'Havoc+Aero':      {name:'Void Squall',    emoji:'💜🌊',fn:(p,e)=>r2_voidSquall(p,e)},
  'Havoc+Glacio':    {name:'Frozen Abyss',   emoji:'💜❄️',fn:(p,e)=>r2_frozenAbyss(p,e)},
  'Havoc+Electro':   {name:'Dark Discharge', emoji:'💜⚡',fn:(p,e)=>r2_darkDischarge(p,e)},
  'Spectro+Aero':    {name:'Luminous Gust',  emoji:'🌟🌊',fn:(p,e)=>r2_luminousGust(p,e)},
  'Spectro+Glacio':  {name:'Crystal Prism',  emoji:'🌟❄️',fn:(p,e)=>r2_crystalPrism(p,e)},
  'Spectro+Electro': {name:'Resonant Pulse', emoji:'🌟⚡',fn:(p,e)=>r2_resonantPulse(p,e)},
  'Aero+Glacio':     {name:'Frost Tempest',  emoji:'🌊❄️',fn:(p,e)=>r2_frostTempest(p,e)},
  'Aero+Electro':    {name:'Thunder Squall', emoji:'🌊⚡',fn:(p,e)=>r2_thunderSquall(p,e)},
  'Glacio+Electro':  {name:'Glacial Arc',    emoji:'❄️⚡',fn:(p,e)=>r2_glacialArc(p,e)},
  // 3-element
  'Fusion+Havoc+Spectro': {name:'Ashen Revelation',   emoji:'🔥💜🌟',fn:(p,e)=>r3_ashenRevelation(p,e)},
  'Fusion+Havoc+Aero':    {name:'Infernal Vortex',     emoji:'🔥💜🌊',fn:(p,e)=>r3_infernalVortex(p,e)},
  'Fusion+Havoc+Glacio':  {name:'Ruinous Blizzard',    emoji:'🔥💜❄️',fn:(p,e)=>r3_ruinousBlizzard(p,e)},
  'Fusion+Havoc+Electro': {name:'Cataclysm Surge',     emoji:'🔥💜⚡',fn:(p,e)=>r3_cataclysmSurge(p,e)},
  'Fusion+Spectro+Aero':  {name:'Solar Gale',          emoji:'🔥🌟🌊',fn:(p,e)=>r3_solarGale(p,e)},
  'Fusion+Spectro+Glacio':{name:'Aurora Burst',        emoji:'🔥🌟❄️',fn:(p,e)=>r3_auroraBurst(p,e)},
  'Fusion+Spectro+Electro':{name:'Stellar Ignition',   emoji:'🔥🌟⚡',fn:(p,e)=>r3_stellarIgnition(p,e)},
  'Fusion+Aero+Glacio':   {name:'Hailfire Storm',      emoji:'🔥🌊❄️',fn:(p,e)=>r3_hailfireStorm(p,e)},
  'Fusion+Aero+Electro':  {name:'Thunderblaze Cyclone',emoji:'🔥🌊⚡',fn:(p,e)=>r3_thunderblazeCyclone(p,e)},
  'Fusion+Glacio+Electro':{name:'Voltaic Frost Burst', emoji:'🔥❄️⚡',fn:(p,e)=>r3_voltaicFrostBurst(p,e)},
  'Havoc+Spectro+Aero':   {name:'Phantom Rift',        emoji:'💜🌟🌊',fn:(p,e)=>r3_phantomRift(p,e)},
  'Havoc+Spectro+Glacio': {name:'Shattered Eclipse',   emoji:'💜🌟❄️',fn:(p,e)=>r3_shatteredEclipse(p,e)},
  'Havoc+Spectro+Electro':{name:'Void Resonance',      emoji:'💜🌟⚡',fn:(p,e)=>r3_voidResonance(p,e)},
  'Havoc+Aero+Glacio':    {name:'Cursed Tundra',       emoji:'💜🌊❄️',fn:(p,e)=>r3_cursedTundra(p,e)},
  'Havoc+Aero+Electro':   {name:'Abyssal Thunder',     emoji:'💜🌊⚡',fn:(p,e)=>r3_abyssalThunder(p,e)},
  'Havoc+Glacio+Electro': {name:'Eternal Ruin',        emoji:'💜❄️⚡',fn:(p,e)=>r3_eternalRuin(p,e)},
  'Spectro+Aero+Glacio':  {name:'Boreal Radiance',     emoji:'🌟🌊❄️',fn:(p,e)=>r3_borealRadiance(p,e)},
  'Spectro+Aero+Electro': {name:'Stormlight Pulse',    emoji:'🌟🌊⚡',fn:(p,e)=>r3_stormlightPulse(p,e)},
  'Spectro+Glacio+Electro':{name:'Prismatic Discharge',emoji:'🌟❄️⚡',fn:(p,e)=>r3_prismaticDischarge(p,e)},
  'Aero+Glacio+Electro':  {name:'Polar Thunderstorm',  emoji:'🌊❄️⚡',fn:(p,e)=>r3_polarThunderstorm(p,e)},
};

function reactionKey(els){
  const order=['Fusion','Havoc','Spectro','Aero','Glacio','Electro'];
  return [...els].sort((a,b)=>order.indexOf(a)-order.indexOf(b)).join('+');
}

function detectReactions(playerActs,botActs){
  const player=G.player.filter(f=>f.alive);
  const enemy=G.enemy.filter(f=>f.alive);

  // ── Player reactions: only YOUR variety cards → effects hit enemies ──
  const playerVarEls=[...new Set(
    playerActs.filter(a=>a.fighter.committed.some(c=>c.variety)).map(a=>a.fighter.el)
  )];
  let playerFired=false;
  if(playerVarEls.length>=2){
    if(playerVarEls.length>=3){
      outer3p:
      for(let i=0;i<playerVarEls.length-2;i++)
        for(let j=i+1;j<playerVarEls.length-1;j++)
          for(let k=j+1;k<playerVarEls.length;k++){
            const key=reactionKey([playerVarEls[i],playerVarEls[j],playerVarEls[k]]);
            if(REACTIONS[key]){
              setTimeout(()=>fireReaction(key,player,enemy),800);
              playerFired=true;
              break outer3p;
            }
          }
    }
    if(!playerFired){
      outer2p:
      for(let i=0;i<playerVarEls.length-1;i++)
        for(let j=i+1;j<playerVarEls.length;j++){
          const key=reactionKey([playerVarEls[i],playerVarEls[j]]);
          if(REACTIONS[key]){
            setTimeout(()=>fireReaction(key,player,enemy),800);
            playerFired=true;
            break outer2p;
          }
        }
    }
  }

  // ── Bot reactions: only ENEMY variety cards → effects hit your team ──
  const botVarEls=[...new Set(
    botActs.filter(a=>a.fighter.committed.some(c=>c.variety)).map(a=>a.fighter.el)
  )];
  if(botVarEls.length<2)return;
  const botDelay=playerFired?1600:800;
  let botFired=false;
  if(botVarEls.length>=3){
    outer3b:
    for(let i=0;i<botVarEls.length-2;i++)
      for(let j=i+1;j<botVarEls.length-1;j++)
        for(let k=j+1;k<botVarEls.length;k++){
          const key=reactionKey([botVarEls[i],botVarEls[j],botVarEls[k]]);
          if(REACTIONS[key]){
            setTimeout(()=>fireBotReaction(key,enemy,player),botDelay);
            botFired=true;
            break outer3b;
          }
        }
  }
  if(!botFired){
    for(let i=0;i<botVarEls.length-1;i++)
      for(let j=i+1;j<botVarEls.length;j++){
        const key=reactionKey([botVarEls[i],botVarEls[j]]);
        if(REACTIONS[key]){
          setTimeout(()=>fireBotReaction(key,enemy,player),botDelay);
          break;
        }
      }
  }
}

function fireReaction(key,player,enemy){
  const rx=REACTIONS[key];if(!rx)return;
  showCombo(`${rx.emoji} ${rx.name}!`);
  playSound('ult');
  rx.fn(player,enemy);
}

// Bot reaction: same table but attacker=bot(enemy), target=player team
// We swap the args so all reaction fns debuff/damage the player side
function fireBotReaction(key,botSide,playerSide){
  const rx=REACTIONS[key];if(!rx)return;
  showCombo(`⚠️ ENEMY ${rx.emoji} ${rx.name}!`);
  playSound('ult');
  // Pass swapped: "player" arg = bot fighters (their buffs), "enemy" arg = your fighters (take the debuffs)
  rx.fn(botSide,playerSide);
}

// Helper: pick reaction target based on stat criteria
function rxTarget(foes,by){
  if(!foes.length)return null;
  if(by==='lowestHp')  return [...foes].sort((a,b)=>a.hp-b.hp)[0];
  if(by==='highestHp') return [...foes].sort((a,b)=>b.hp-a.hp)[0];
  if(by==='lowestDef') return [...foes].sort((a,b)=>a.def-b.def)[0];
  if(by==='highestAtk')return [...foes].sort((a,b)=>b.atk-a.atk)[0];
  if(by==='highestDef')return [...foes].sort((a,b)=>b.def-a.def)[0];
  return pick(foes);
}
function rxDmg(t,dmg,src){
  const res=dealDmg(t,dmg,src||'Physical');
  floatDmg(t.id,`-${res.dmg}✦`,'ult');
  animF(t.id,'taking-hit');
  updateFighterDOM(t);
  checkWin();
}
function rxPickBy(){
  return pick(['lowestHp','highestHp','lowestDef','highestAtk','random']);
}

// ─── 2-Element Reactions ───
function r2_scorchRuin(player,enemy){
  const t=rxTarget(enemy,rxPickBy());if(!t)return;
  t._reactionDmgMult=(t._reactionDmgMult||1)+.15;
  t.def=Math.max(1,Math.round(t.def*.90));
  floatDmg(t.id,'🔥SCORCH -10%DEF','debuff');
  updateFighterDOM(t);
}
function r2_radiantBlaze(player,enemy){
  const t=[...enemy].sort((a,b)=>a.hp-b.hp)[0];if(!t)return;
  t._reactionDmgMult=(t._reactionDmgMult||1)+.20;
  floatDmg(t.id,'🌟REVEALED +20%DMG','debuff');
  updateFighterDOM(t);
}
function r2_blazingGale(player,enemy){
  if(!enemy.length)return;
  const main=rxTarget(enemy,rxPickBy());
  const others=enemy.filter(f=>f.id!==main.id&&f.alive);
  const splash=others.length?pick(others):null;
  if(splash){
    const baseDmg=Math.round(G.player.filter(f=>f.alive).reduce((s,f)=>s+f.atk,0)/G.player.filter(f=>f.alive).length*0.3);
    rxDmg(splash,baseDmg,'Fusion');
    floatDmg(splash.id,'🌪️SPLASH','debuff');
  }
}
function r2_steamSurge(player,enemy){
  const t=rxTarget(enemy,rxPickBy());if(!t)return;
  if(t.committed&&t.committed.length){t.committed.splice(0,1);floatDmg(t.id,'💨 Card Knocked!','debuff');}
}
function r2_plasmaIgnition(player,enemy){
  if(!enemy.length)return;
  const main=rxTarget(enemy,rxPickBy());
  const others=enemy.filter(f=>f.id!==main.id&&f.alive);
  if(others.length){
    const chain=pick(others);
    const baseDmg=Math.round(G.player.filter(f=>f.alive).reduce((s,f)=>s+f.atk,0)/G.player.filter(f=>f.alive).length*.50);
    rxDmg(chain,baseDmg,'Electro');
    floatDmg(chain.id,'⚡CHAIN','debuff');
  }
}
function r2_eclipseFracture(player,enemy){
  const t=rxTarget(enemy,rxPickBy());if(!t)return;
  t._forcedTarget=player.length?pick(player).id:null;
  floatDmg(t.id,'💜PULLED','debuff');
  updateFighterDOM(t);
}
function r2_voidSquall(player,enemy){
  const t=rxTarget(enemy,rxPickBy());if(!t)return;
  t.def=Math.max(1,Math.round(t.def*.80));
  t._defDebuffRounds=2;
  floatDmg(t.id,'💜ARMOR SHRED -20%DEF','debuff');
  updateFighterDOM(t);
}
function r2_frozenAbyss(player,enemy){
  const t=rxTarget(enemy,rxPickBy());if(!t)return;
  if(t.committed&&t.committed.length){t.committed.splice(0,1);}
  t._reactionDmgMult=(t._reactionDmgMult||1)+.10;
  floatDmg(t.id,'❄️💜FROZEN ABYSS','debuff');
  updateFighterDOM(t);
}
function r2_darkDischarge(player,enemy){
  const t=rxTarget(enemy,rxPickBy());if(!t)return;
  t._dmgReduced=0.50;
  floatDmg(t.id,'💜STUNNED -50%DMG','debuff');
  updateFighterDOM(t);
}
function r2_luminousGust(player,enemy){
  const t=rxTarget(enemy,rxPickBy());if(!t)return;
  t._reactionMultiHit=3;
  t._reactionMultiPct=0.40;
  floatDmg(t.id,'🌟MULTI-HIT ×3 40%','debuff');
  updateFighterDOM(t);
}
function r2_crystalPrism(player,enemy){
  const t=rxTarget(enemy,rxPickBy());if(!t)return;
  t._reflectPct=0.20;
  floatDmg(t.id,'🌟REFLECT 20%','debuff');
  updateFighterDOM(t);
}
function r2_resonantPulse(player,enemy){
  const playerDps=G.player.filter(f=>f.alive).sort((a,b)=>b.atk-a.atk)[0];
  const splashDmg=Math.round((playerDps?playerDps.atk:50)*.20);
  enemy.forEach(t=>{rxDmg(t,splashDmg,'Spectro');floatDmg(t.id,'🌟SHOCKWAVE','debuff');});
}
function r2_frostTempest(player,enemy){
  G._slowDrawNext=(G._slowDrawNext||0)+1;
  showCombo('❄️🌊 SLOW — Enemy draws 1 fewer next round!');
}
function r2_thunderSquall(player,enemy){
  const playerDps=G.player.filter(f=>f.alive).sort((a,b)=>b.atk-a.atk)[0];
  const dmg=Math.round((playerDps?playerDps.atk:50)*.40);
  enemy.forEach(t=>{rxDmg(t,dmg,'Electro');floatDmg(t.id,'⚡SQUALL','debuff');});
}
function r2_glacialArc(player,enemy){
  const t=rxTarget(enemy,rxPickBy());if(!t)return;
  t._frozen=1;
  floatDmg(t.id,'❄️⚡FROZEN — Skip next round','debuff');
  updateFighterDOM(t);
}

// ─── 3-Element Reactions ───
function r3_ashenRevelation(player,enemy){
  enemy.forEach(t=>{
    t.atkMult=1;t.buffRounds=0;
    t._burnDot=(t._burnDot||0)+Math.round(t.maxHp*.10);
    floatDmg(t.id,'🔥💜🌟 BUFF STRIPPED + BURN','ult');
    updateFighterDOM(t);
  });
}
function r3_infernalVortex(player,enemy){
  const dps=G.player.filter(f=>f.alive).sort((a,b)=>b.atk-a.atk)[0];
  const dmg=Math.round((dps?dps.atk:60)*.60);
  enemy.forEach(t=>{rxDmg(t,dmg,'Fusion');floatDmg(t.id,'🔥💜🌊 VORTEX','ult');});
}
function r3_ruinousBlizzard(player,enemy){
  enemy.forEach(t=>{
    t._hpDot=(t._hpDot||0)+0.15;
    floatDmg(t.id,'💀15%MaxHP/rnd×2','ult');
    updateFighterDOM(t);
  });
}
function r3_cataclysmSurge(player,enemy){
  enemy.forEach(t=>{
    t.committed=t.committed.filter(c=>c.t!=='attack');
    floatDmg(t.id,'🔥💜⚡ ATK NULLIFIED','ult');
    updateFighterDOM(t);
  });
}
function r3_solarGale(player,enemy){
  enemy.forEach(t=>{
    t._missChance=(t._missChance||0)+.40;
    t.def=Math.max(1,Math.round(t.def*.85));
    floatDmg(t.id,'☀️ BLINDED 40%miss','ult');
    updateFighterDOM(t);
  });
}
function r3_auroraBurst(player,enemy){
  G._teamDmgMult=(G._teamDmgMult||1)+.50;
  showCombo('🔥🌟❄️ AURORA BURST! +50% Team DMG this round!');
}
function r3_stellarIgnition(player,enemy){
  const highest=G.player.filter(f=>f.alive).sort((a,b)=>b.atk-a.atk)[0];
  const dmg=Math.round((highest?highest.atk:60)*.80);
  enemy.forEach(t=>{
    const raw=dmg;
    const absorbed=Math.min(t.shield,raw);t.shield-=absorbed;
    const actual=raw-absorbed;
    t.hp=Math.max(0,t.hp-actual);
    if(t.hp<=0)t.alive=false;
    floatDmg(t.id,`-${actual}🌟⚡STELLAR`,'ult');
    updateFighterDOM(t);checkWin();
  });
}
function r3_hailfireStorm(player,enemy){
  enemy.forEach(t=>{t._flatDot=(t._flatDot||0)+25;t._flatDotRounds=3;floatDmg(t.id,'🔥❄️ 25 DMG/rnd×3','ult');updateFighterDOM(t);});
}
function r3_thunderblazeCyclone(player,enemy){
  enemy.forEach(t=>{t._flatDot=(t._flatDot||0)+30;t._flatDotRounds=2;floatDmg(t.id,'🔥⚡ 30 DMG/rnd×2','ult');updateFighterDOM(t);});
}
function r3_voltaicFrostBurst(player,enemy){
  if(!enemy.length)return;
  const frozen=[...enemy].sort((a,b)=>b.hp-a.hp)[0];
  frozen._frozen=1;
  floatDmg(frozen.id,'❄️⚡ FULL FREEZE','ult');
  const others=enemy.filter(f=>f.id!==frozen.id&&f.alive);
  const dmg=Math.round(frozen.maxHp*.40);
  others.forEach(t=>{rxDmg(t,dmg,'Electro');floatDmg(t.id,'💥FROST BURST','ult');});
  updateFighterDOM(frozen);
}
function r3_phantomRift(player,enemy){
  G._phantomRift=true;
  showCombo('💜🌟🌊 PHANTOM RIFT! +30%DMG & 50% DEF ignore!');
}
function r3_shatteredEclipse(player,enemy){
  G._shards=(G._shards||0)+3;
  showCombo('💜🌟❄️ 3 SHARDS launched! 40 DMG each over 3 rounds');
}
function r3_voidResonance(player,enemy){
  enemy.forEach(t=>{t._atkDecay=(t._atkDecay||0)+8;t._atkDecayRounds=3;floatDmg(t.id,'-8ATK/rnd×3💜','debuff');updateFighterDOM(t);});
}
function r3_cursedTundra(player,enemy){
  enemy.forEach(t=>{
    t.def=Math.max(1,Math.round(t.def*.75));
    t._defDebuffRounds=2;
    floatDmg(t.id,'❄️-25%DEF+Card Slow','debuff');
    updateFighterDOM(t);
  });
  G._slowDrawNext=(G._slowDrawNext||0)+1;
}
function r3_abyssalThunder(player,enemy){
  const sub=G.player.filter(f=>f.alive&&f.role==='subdps').sort((a,b)=>b.atk-a.atk)[0]||G.player.filter(f=>f.alive)[0];
  const dmg=Math.round((sub?sub.atk:50)*.50);
  enemy.forEach(t=>{rxDmg(t,dmg,'Electro');floatDmg(t.id,'💜⚡ABYSSAL','ult');});
}
function r3_eternalRuin(player,enemy){
  if(!enemy.length)return;
  const t=[...enemy].sort((a,b)=>b.hp-a.hp)[0];
  t._frozen=1;
  const reduction=Math.round(t.atk*.20);
  t.atk=Math.max(1,t.atk-reduction);
  t.debuffRounds=(t.debuffRounds||0)+2;
  t.atkDebuffAmount=(t.atkDebuffAmount||0)+reduction;
  floatDmg(t.id,'💜❄️⚡ ETERNAL RUIN FREEZE','ult');
  updateFighterDOM(t);
}
function r3_borealRadiance(player,enemy){
  for(let i=0;i<5;i++){
    const t=pick(enemy.filter(f=>f.alive));
    if(t){setTimeout(()=>{rxDmg(t,35,'Spectro');floatDmg(t.id,'❄️SHARD','ult');},i*180);}
  }
}
function r3_stormlightPulse(player,enemy){
  const highest=G.player.filter(f=>f.alive).sort((a,b)=>b.atk-a.atk)[0];
  const dmg=Math.round((highest?highest.atk:60)*.50);
  enemy.forEach(t=>{
    const actual=dmg;
    t.hp=Math.max(0,t.hp-actual);
    if(t.hp<=0)t.alive=false;
    floatDmg(t.id,`-${actual}🌟⚡PULSE`,'ult');
    updateFighterDOM(t);checkWin();
  });
}
function r3_prismaticDischarge(player,enemy){
  for(let i=0;i<6;i++){
    const t=pick(enemy.filter(f=>f.alive));
    if(t){setTimeout(()=>{rxDmg(t,30,'Electro');floatDmg(t.id,'⚡BOLT','ult');},i*120);}
  }
}
function r3_polarThunderstorm(player,enemy){
  const alive=G.player.filter(f=>f.alive);
  const avgAtk=alive.reduce((s,f)=>s+f.atk,0)/Math.max(alive.length,1);
  const dmg=Math.round(avgAtk*.70);
  enemy.forEach(t=>{rxDmg(t,dmg,'Electro');floatDmg(t.id,'🌊❄️⚡POLAR','ult');});
  G.player.filter(f=>f.alive).forEach(f=>{f.shield+=Math.round(f.def*.20);floatDmg(f.id,'+DEF🌊','buff');updateFighterDOM(f);});
}

let comboTimeout=null;
function showCombo(text){
  if(comboTimeout)clearTimeout(comboTimeout);
  const old=document.querySelector('.combo-flash');if(old)old.remove();
  const d=document.createElement('div');d.className='combo-flash';d.textContent=text;
  document.body.appendChild(d);
  comboTimeout=setTimeout(()=>d.remove(),900);
}