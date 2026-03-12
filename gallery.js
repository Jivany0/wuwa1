// ═══════════════════════════════════════════════════════════
// RESONATOR GALLERY
// Filterable grid of all characters with element/role filters
// and a detailed profile overlay showing each character's
// full card pool with stats
// ═══════════════════════════════════════════════════════════
// ── Gallery ──
let _galFilter='all';
function openGallery(){
  showScreen('galleryScreen');
  _galFilter='all';
  document.querySelectorAll('.gf-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector('.gf-btn').classList.add('active');
  renderGallery();
}
function filterGallery(filter,btn){
  _galFilter=filter;
  document.querySelectorAll('.gf-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderGallery();
}
function renderGallery(){
  const roles={dps:'dps',subdps:'subdps',support:'support'};
  const filtered=RESONATORS.filter(r=>{
    const role=normRole(r.role);
    if(_galFilter==='all') return true;
    if(roles[_galFilter]) return role===_galFilter;
    return r.el===_galFilter;
  });
  document.getElementById('galCount').textContent=`${filtered.length} resonators`;
  document.getElementById('galleryGrid').innerHTML=filtered.map(r=>{
    const role=normRole(r.role);
    const elColor=`var(--${r.el})`;
    return`<div class="gal-card" style="color:${elColor}" onclick="openCharProfile('${r.name.replace(/'/g,"\\'")}')">
      <div class="gal-emoji">${r.emoji}</div>
      <div class="gal-name">${r.name}</div>
      <div class="gal-el" style="color:${elColor}">${r.el}</div>
      <div class="gal-role ${role}">${role==='subdps'?'Sub-DPS':role==='support'?'Support':'DPS'}</div>
      <div style="font-size:.3rem;color:var(--dim2);margin-top:2px">${WEAPON_IC[r.weapon]||''} ${r.weapon||''}</div>
    </div>`;
  }).join('');
}
function openCharProfile(name){
  const r=RESONATORS.find(x=>x.name===name);if(!r)return;
  const role=normRole(r.role);
  const rs=ROLE_ST[role];
  const elColor=`var(--${r.el})`;
  const roleLabel=role==='subdps'?'Sub-DPS':role==='support'?'Support':'DPS';
  const roleBg=role==='dps'?'rgba(231,76,60,.2)':role==='subdps'?'rgba(212,168,67,.2)':'rgba(46,204,113,.2)';
  const roleClr=role==='dps'?'#e74c3c':role==='subdps'?'var(--gold)':'#2ecc71';

  document.getElementById('charProfileHeader').innerHTML=`
    <div class="char-profile-emoji">${r.emoji}</div>
    <div class="char-profile-info">
      <div class="char-profile-name" style="color:${elColor}">${r.name}</div>
      <div class="char-profile-meta">
        <span class="char-profile-el" style="color:${elColor}">${r.el}</span>
        <span class="char-profile-role-badge" style="background:${roleBg};color:${roleClr}">${roleLabel}</span>
        <span style="font-size:.55rem;color:var(--dim2)">${WEAPON_IC[r.weapon]||''} ${r.weapon||''}</span>
      </div>
    </div>`;

  document.getElementById('charProfileStats').innerHTML=`
    <div class="char-stat-block">
      <div class="char-stat-lbl">❤️ HP</div>
      <div class="char-stat-val">${rs.hp[0]}–${rs.hp[1]}</div>
    </div>
    <div class="char-stat-block">
      <div class="char-stat-lbl">⚔️ ATK</div>
      <div class="char-stat-val">${rs.atk[0]}–${rs.atk[1]}</div>
    </div>
    <div class="char-stat-block">
      <div class="char-stat-lbl">🛡️ DEF</div>
      <div class="char-stat-val">${rs.def[0]}–${rs.def[1]}</div>
    </div>
    <div class="char-stat-block">
      <div class="char-stat-lbl">🃏 Cards</div>
      <div class="char-stat-val">${(CHAR_CARDS[name]||[]).length}</div>
    </div>`;

  const cards=CHAR_CARDS[name]||[];
  document.getElementById('charProfileCards').innerHTML=cards.map(c=>{
    const tc=c.variety?'#64c8ff':typeCol(c.t);
    const val=c.t==='buff'?`+${Math.round((c.bv||0)*100)}% ATK`
      :c.t==='debuff'?`-${Math.round((c.dv||0.20)*100)}% ATK`
      :c.v?`${c.v} dmg`:'';
    const typeLabel=c.ult?'⭐ Ultimate':c.variety?`✦ ${c.t}`:c.t;
    const desc=cardDesc(c,role);
    const rowCls=c.ult?' ult-row':c.variety?' variety-row':'';
    return`<div class="char-card-row${rowCls}">
      <div class="char-card-ic">${c.ic}</div>
      <div class="char-card-body">
        <div class="char-card-name" style="${c.variety?'color:#64c8ff':''}">${c.n}</div>
        <div class="char-card-type" style="color:${tc}">${typeLabel.toUpperCase()}</div>
        <div class="char-card-desc">${desc}</div>
      </div>
      <div class="char-card-right">
        <div class="char-card-val" style="color:${tc}">${val}</div>
        <div class="char-card-cost${c.c===0?' free':''}">${c.c===0?'F':c.c}</div>
        ${c.ult?`<div class="char-card-ult-badge">ULT</div>`:''}
        ${c.variety?`<div class="char-card-variety-badge">VARIETY</div>`:''}
      </div>
    </div>`;
  }).join('');

  document.getElementById('charProfileOv').classList.add('show');
}
function closeCharProfile(){document.getElementById('charProfileOv').classList.remove('show');}
// Close profile on backdrop click
document.getElementById('charProfileOv')?.addEventListener('click',e=>{
  if(e.target===document.getElementById('charProfileOv'))closeCharProfile();
});
// activeHand and activeFighters are defined in render.js

function togglePauseMenu(){
  const ov=document.getElementById('pauseOv');
  ov.classList.toggle('show');
}
function resumeGame(){document.getElementById('pauseOv').classList.remove('show');}
function restartGame(){
  document.getElementById('pauseOv').classList.remove('show');
  document.getElementById('passOv').classList.remove('show');
  showScreen('titleScreen');
  document.getElementById('modeSelectOv').classList.add('show');
}
function exitToTitle(){
  document.getElementById('pauseOv').classList.remove('show');
  document.getElementById('passOv').classList.remove('show');
  document.getElementById('resultOv').classList.remove('show');
  showScreen('titleScreen');
}

// ═══════════════════════════════════════════════════════════
// HOW TO PLAY OVERLAY
// Tabbed guide with: Basics, Cards, Combos, Elements,
// Reactions, Variety tabs + embedded Tutorial launcher
// ═══════════════════════════════════════════════════════════
// ── How to Play ──
let _htpPage=0;
const HTP_TIPS=[
  'Tap a fighter portrait in battle to peek their full card pool!',
  'Cards carry over between rounds — unused cards stay in your hand!',
  'Sub-DPS debuffs boost DPS damage by +25% via Chain Combo!',
  'Same element attacks deal 10% less damage — elemental diversity matters!',
  'Variety cards (✦) trigger Elemental Reactions when two or more are used!',
  'Right-click (or long-press) a card to pin its detail popup!',
];
const HTP_PAGES=[
  // 0 — Basics
  `<div class="htp-section">
    <div class="htp-section-title">⚔️ The Battlefield</div>
    <div class="htp-para">WuWa Battle is a <b>3v3 simultaneous card combat</b> game. Each side fields one <b style="color:#e74c3c">DPS</b>, one <b style="color:var(--gold)">Sub-DPS</b>, and one <b style="color:#2ecc71">Support</b>.</div>
    <div class="htp-row"><div class="htp-row-ic">⚡</div><div class="htp-row-body"><div class="htp-row-title">Energy</div><div class="htp-row-desc">Each round you gain <b>+3 Energy</b>, stacking on top of whatever you didn't spend (capped at 10). <b>Tap a card</b> to commit it — it costs Energy equal to the number shown. <b>Unused Energy carries over</b>, so you can deliberately spend less to build toward <b>Overdrive</b>. Unplayed cards also stay in hand.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">🛡️</div><div class="htp-row-body"><div class="htp-row-title">Turn Order</div><div class="htp-row-desc">Both sides commit cards <b>simultaneously</b>, then they resolve. Fighters with <b>higher DEF act first</b>. Supports typically move before DPS.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">⚖️</div><div class="htp-row-body"><div class="htp-row-title">First Turn Balance</div><div class="htp-row-desc">The team with <b>lower total DEF</b> gets <b>+1 Energy</b> on round 1 to compensate for going second. The opposing team gets a temporary <b>Guard shield</b> instead.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">⚡</div><div class="htp-row-body"><div class="htp-row-title">Overdrive</div><div class="htp-row-desc">If you start a round with <b>maximum Energy (10)</b>, your whole team enters <b>Overdrive</b> — all cards deal <b>+10% bonus damage</b> that round.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">📈</div><div class="htp-row-body"><div class="htp-row-title">Escalation</div><div class="htp-row-desc">Every 10 rounds, a global <b>Damage Escalation</b> multiplier increases by ×0.1 — long battles get progressively more lethal.</div></div></div>
  </div>
  <div class="htp-section">
    <div class="htp-section-title">🎯 Winning</div>
    <div class="htp-para">Defeat all 3 enemy fighters. A fighter reduced to <b>0 HP is eliminated</b> and cannot act. Last team standing wins!</div>
    <div class="htp-tip-box"><p>💡 Passive shields are applied to each fighter whenever they commit cards — <b>lowest ATK fighters get the biggest shields</b> (supports are tankier than they look).</p></div>
  </div>`,

  // 1 — Cards
  `<div class="htp-section">
    <div class="htp-section-title">🃏 Card Types</div>
    <div class="htp-row"><div class="htp-row-ic">⚔️</div><div class="htp-row-body"><div class="htp-row-title" style="color:#ff6060">Attack</div><div class="htp-row-desc">Deals damage to an enemy. Target is chosen strategically — lowest HP, highest ATK, lowest DEF, or random. <b>ULT attacks</b> always target the lowest HP enemy.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">🛡️</div><div class="htp-row-body"><div class="htp-row-title" style="color:#60a0ff">Defend</div><div class="htp-row-desc">Grants a <b>shield</b> to the caster that absorbs incoming damage. Shield value scales with the card's listed value. Shields expire at round end.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">💚</div><div class="htp-row-body"><div class="htp-row-title" style="color:#2ecc71">Heal</div><div class="htp-row-desc">Heals the <b>lowest HP ally</b> for 70% of the card's value, and the caster for 30%. Heal amount scales up with the caster's DEF stat.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">⬆️</div><div class="htp-row-body"><div class="htp-row-title" style="color:var(--gold)">Buff</div><div class="htp-row-desc">Increases ATK multiplier for 1 round. <b>Support buffs</b> also share 70% of the buff value to the highest ATK DPS ally. Stacks multiplicatively up to ×2.5.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">⬇️</div><div class="htp-row-body"><div class="htp-row-title" style="color:#bb44ff">Debuff</div><div class="htp-row-desc">Reduces an enemy's ATK for 1 round. <b>Sub-DPS debuffs</b> target the highest ATK enemy. Stacks with other debuffs.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">⭐</div><div class="htp-row-body"><div class="htp-row-title" style="color:var(--gold2)">Ultimate (ULT)</div><div class="htp-row-desc">Each fighter has one powerful ULT card — usually cost 3 Energy. <b>Only one ULT per fighter can be in hand at a time.</b> They hit the lowest HP enemy and deal the highest raw damage.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">✦</div><div class="htp-row-body"><div class="htp-row-title" style="color:#64c8ff">Variety</div><div class="htp-row-desc">Unique special cards with <b>custom effects</b> beyond normal card types — lifesteal, splashes, execute thresholds, shields for allies, and more. Also <b>trigger Elemental Reactions</b> (see Reactions tab).</div></div></div>
  </div>
  <div class="htp-section">
    <div class="htp-section-title">🔢 Execution Order</div>
    <div class="htp-para">Cards in a fighter's fan are executed <b>last-committed first</b> (FILO order). Buff cards always fire before attack cards. You can <b>drag fan cards</b> to reorder them, or tap to remove.</div>
    <div class="htp-tip-box"><p>💡 Cards stay in hand between rounds if unused. Build up powerful combinations over multiple rounds!</p></div>
  </div>`,

  // 2 — Combos
  `<div class="htp-section">
    <div class="htp-section-title">💥 Combo Bonuses</div>
    <div class="htp-para">When certain card type combinations are committed by your team in the same round, <b>bonus damage multipliers</b> are applied automatically.</div>
    <div class="htp-row"><div class="htp-row-ic">⚡</div><div class="htp-row-body"><div class="htp-row-title">Buff + Attack Combo <span style="color:var(--gold)">+20% DMG</span></div><div class="htp-row-desc">If the <b>same fighter</b> commits both a Buff card and an Attack card in the same round, their attacks deal +20% bonus damage that round.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">💚</div><div class="htp-row-body"><div class="htp-row-title">Team Synergy <span style="color:var(--gold)">+10% DMG</span></div><div class="htp-row-desc">If your <b>Support</b> plays a Heal card and at least one <b>DPS</b> acts in the same round, all DPS fighters get +10% bonus damage.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">🌀</div><div class="htp-row-body"><div class="htp-row-title">Chain Combo <span style="color:var(--gold)">+25% DMG</span></div><div class="htp-row-desc">If your <b>Sub-DPS</b> commits a Debuff card AND your <b>DPS</b> acts in the same round, DPS fighters gain +25% bonus damage — the biggest single combo.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">🌟</div><div class="htp-row-body"><div class="htp-row-title">Elemental Resonance <span style="color:var(--gold)">+15% DMG</span></div><div class="htp-row-desc">If <b>2 or more committed cards share the same element</b> across your team in a round, everyone gets +15% bonus damage. Encourages mono-element team compositions.</div></div></div>
  </div>
  <div class="htp-section">
    <div class="htp-section-title">📊 Damage Formula</div>
    <div class="htp-para">Final Damage = <b>Card Value × ATK Mult × (ATK/70) × Combo Mult × Overdrive Mult × Escalation</b> — minus DEF reduction and shields. A <b>1.5% crit chance</b> exists for 1.3× damage.</div>
    <div class="htp-tip-box"><p>💡 Chain Combo + Buff+Attack + Team Synergy can stack together! A well-coordinated round can triple your damage output.</p><p>💡 Combos are detected per-team — your enemy can also trigger their own combo bonuses.</p></div>
  </div>`,

  // 3 — Elements
  `<div class="htp-section">
    <div class="htp-section-title">🌈 The 6 Elements</div>
    <div class="htp-para">Every Resonator has an element. Elemental matchups affect damage — and using Variety cards of different elements in the same round can trigger powerful <b>Elemental Reactions</b>.</div>
    <div class="htp-row"><div class="htp-row-ic">🌟</div><div class="htp-row-body"><div class="htp-row-title" style="color:var(--Spectro)">Spectro</div><div class="htp-row-desc">Weak vs <b style="color:var(--Havoc)">Havoc</b>. Resonators: Rover (Spectro), Jinhsi, Verina, Shorekeeper, Zani, Phoebe, Lynae, Luuk Herssen.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">💜</div><div class="htp-row-body"><div class="htp-row-title" style="color:var(--Havoc)">Havoc</div><div class="htp-row-desc">Weak vs <b style="color:var(--Aero)">Aero</b>. Resonators: Rover (Havoc), Danjin, Taoqi, Camellya, Roccia, Brant, Cantarella, Phrolova, Chisa.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">🌊</div><div class="htp-row-body"><div class="htp-row-title" style="color:var(--Aero)">Aero</div><div class="htp-row-desc">Weak vs <b style="color:var(--Electro)">Electro</b>. Resonators: Jiyan, Jianxin, Aalto, Yangyang, Rover (Aero), Ciaccona, Cartethyia, Iuno, Qiuyuan.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">❄️</div><div class="htp-row-body"><div class="htp-row-title" style="color:var(--Glacio)">Glacio</div><div class="htp-row-desc">Weak vs <b style="color:var(--Fusion)">Fusion</b>. Resonators: Lingyang, Baizhi, Sanhua, Zhezhi, Youhu, Carlotta.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">⚡</div><div class="htp-row-body"><div class="htp-row-title" style="color:var(--Electro)">Electro</div><div class="htp-row-desc">Weak vs <b style="color:var(--Glacio)">Glacio</b>. Resonators: Calcharo, Yuanwu, Xiangli Yao, Lumi, Augusta, Buling.</div></div></div>
    <div class="htp-row"><div class="htp-row-ic">🔥</div><div class="htp-row-body"><div class="htp-row-title" style="color:var(--Fusion)">Fusion</div><div class="htp-row-desc">Weak vs <b style="color:var(--Spectro)">Spectro</b>. Resonators: Encore, Chixia, Mortefi, Changli, Lupa, Galbrena, Mornye, Aemeath.</div></div></div>
  </div>
  <div class="htp-section">
    <div class="htp-section-title">🛡️ Resistance</div>
    <div class="htp-para">Attacking an enemy of the <b>same element</b> as your attack deals <b>10% less damage</b> (×0.9 multiplier). There is no bonus for hitting a "weak" element directly — weaknesses only matter for <b>Reactions</b>.</div>
    <div class="htp-tip-box"><p>💡 Build teams with diverse elements to avoid resistance penalties and unlock more Reaction combinations!</p></div>
  </div>`,

  // 4 — Reactions
  `<div class="htp-section">
    <div class="htp-section-title">⚗️ Elemental Reactions</div>
    <div class="htp-para">When <b>your fighters</b> use <b>Variety cards (✦)</b> of 2 or more different elements in the same round, an <b>Elemental Reaction</b> fires automatically after all actions resolve. <b>3-element reactions take priority</b> over 2-element ones. The <b>enemy can also trigger reactions</b> against your team if their fighters use 2+ different-element Variety cards in the same round — so watch out!</div>
    <div class="htp-tip-box" style="margin-top:8px">
      <p>💡 <b>Example — 2-Element:</b> Your <b style="color:var(--Havoc)">Camellya (Havoc)</b> plays Life Drain ✦ and your <b style="color:var(--Glacio)">Sanhua (Glacio)</b> plays a Variety card → <b style="color:#64c8ff">💜❄️ Frozen Abyss</b> fires! Knocks an enemy card AND marks them for +10% incoming damage.</p>
      <p style="margin-top:6px">💡 <b>Example — 3-Element:</b> Your <b style="color:var(--Havoc)">Camellya (Havoc)</b> + <b style="color:var(--Spectro)">Verina (Spectro)</b> + <b style="color:var(--Glacio)">Sanhua (Glacio)</b> all play Variety cards → <b style="color:#64c8ff">💜🌟❄️ Shattered Eclipse</b> fires! Launches 3 crystal shards dealing 40 damage each to random enemies over 3 rounds. More player elements = bigger reaction!</p>
    </div>
  </div>
  <div class="htp-section">
    <div class="htp-section-title">⚗️ 2-Element Reactions</div>
    <div class="htp-rx-grid">
      <div class="htp-rx-card"><div class="htp-rx-emoji">🔥💜</div><div class="htp-rx-name">Scorch Ruin</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion</div><div class="htp-rx-desc">Reduces target DEF by 10% and marks them for +15% incoming damage.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">🔥🌟</div><div class="htp-rx-name">Radiant Blaze</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion + <span style="color:var(--Spectro)">Spectro</span></div><div class="htp-rx-desc">Target takes +20% increased damage from all sources for the round.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">🔥🌊</div><div class="htp-rx-name">Blazing Gale</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion + <span style="color:var(--Aero)">Aero</span></div><div class="htp-rx-desc">Triggers a 40% splash hit to a second random enemy.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">🔥❄️</div><div class="htp-rx-name">Steam Surge</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion + <span style="color:var(--Glacio)">Glacio</span></div><div class="htp-rx-desc">Knocks out the enemy's top committed card — disrupts their plan!</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">🔥⚡</div><div class="htp-rx-name">Plasma Ignition</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion + <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Chain lightning — deals 50% ATK damage to a second enemy target.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">💜🌊</div><div class="htp-rx-name">Void Squall</div><div class="htp-rx-els" style="color:var(--Havoc)">Havoc + <span style="color:var(--Aero)">Aero</span></div><div class="htp-rx-desc">Shreds enemy armor — reduces DEF by 20% for 2 rounds.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">💜❄️</div><div class="htp-rx-name">Frozen Abyss</div><div class="htp-rx-els" style="color:var(--Havoc)">Havoc + <span style="color:var(--Glacio)">Glacio</span></div><div class="htp-rx-desc">Knocks an enemy card AND marks them for +10% incoming damage.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">💜⚡</div><div class="htp-rx-name">Dark Discharge</div><div class="htp-rx-els" style="color:var(--Havoc)">Havoc + <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Stuns target — they deal 50% less damage this round.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">💜🌟</div><div class="htp-rx-name">Eclipse Fracture</div><div class="htp-rx-els" style="color:var(--Havoc)">Havoc + <span style="color:var(--Spectro)">Spectro</span></div><div class="htp-rx-desc">Pulls an enemy — forces them to target a specific ally.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">🌟🌊</div><div class="htp-rx-name">Luminous Gust</div><div class="htp-rx-els" style="color:var(--Spectro)">Spectro + <span style="color:var(--Aero)">Aero</span></div><div class="htp-rx-desc">Marks target for ×3 multi-hit at 40% each — great with follow-up attacks.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">🌟❄️</div><div class="htp-rx-name">Crystal Prism</div><div class="htp-rx-els" style="color:var(--Spectro)">Spectro + <span style="color:var(--Glacio)">Glacio</span></div><div class="htp-rx-desc">Target reflects 20% of incoming damage back to attackers.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">🌟⚡</div><div class="htp-rx-name">Resonant Pulse</div><div class="htp-rx-els" style="color:var(--Spectro)">Spectro + <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Shockwave — deals 20% ATK damage to ALL enemies simultaneously.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">🌊❄️</div><div class="htp-rx-name">Frost Tempest</div><div class="htp-rx-els" style="color:var(--Aero)">Aero + <span style="color:var(--Glacio)">Glacio</span></div><div class="htp-rx-desc">Slows enemy draw — they draw 1 fewer card next round.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">🌊⚡</div><div class="htp-rx-name">Thunder Squall</div><div class="htp-rx-els" style="color:var(--Aero)">Aero + <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Thunder barrage — deals 40% ATK damage to ALL enemies.</div></div>
      <div class="htp-rx-card"><div class="htp-rx-emoji">❄️⚡</div><div class="htp-rx-name">Glacial Arc</div><div class="htp-rx-els" style="color:var(--Glacio)">Glacio + <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Freezes one enemy completely — they skip their next round of actions.</div></div>
    </div>
  </div>
  <div class="htp-section" style="margin-top:14px">
    <div class="htp-section-title">🌟 3-Element Reactions <span style="font-size:.52rem;color:var(--dim2);font-family:'Exo 2'">— All 20 · Rarer but devastating</span></div>
    <div class="htp-rx-grid">
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🔥💜🌟</div><div class="htp-rx-name">Ashen Revelation</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion · <span style="color:var(--Havoc)">Havoc</span> · <span style="color:var(--Spectro)">Spectro</span></div><div class="htp-rx-desc">Strips <b>ALL enemy ATK buffs</b> instantly. Each enemy also receives a burn dealing <b>10% of their Max HP</b> next round.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🔥💜🌊</div><div class="htp-rx-name">Infernal Vortex</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion · <span style="color:var(--Havoc)">Havoc</span> · <span style="color:var(--Aero)">Aero</span></div><div class="htp-rx-desc">A roaring vortex of fire — deals <b>60% of your highest ATK</b> to ALL enemies simultaneously.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🔥💜❄️</div><div class="htp-rx-name">Ruinous Blizzard</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion · <span style="color:var(--Havoc)">Havoc</span> · <span style="color:var(--Glacio)">Glacio</span></div><div class="htp-rx-desc">Curses ALL enemies with a frost plague — each takes <b>15% Max HP damage per round for 2 rounds</b>.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🔥💜⚡</div><div class="htp-rx-name">Cataclysm Surge</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion · <span style="color:var(--Havoc)">Havoc</span> · <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Electromagnetic chaos — <b>removes ALL attack-type cards</b> from every enemy's committed queue this round.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🔥🌟🌊</div><div class="htp-rx-name">Solar Gale</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion · <span style="color:var(--Spectro)">Spectro</span> · <span style="color:var(--Aero)">Aero</span></div><div class="htp-rx-desc">Blinds ALL enemies — each has a <b>40% miss chance</b> this round and suffers <b>-15% DEF</b>.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🔥🌟❄️</div><div class="htp-rx-name">Aurora Burst</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion · <span style="color:var(--Spectro)">Spectro</span> · <span style="color:var(--Glacio)">Glacio</span></div><div class="htp-rx-desc">Fills your team with radiant energy — grants <b>+50% team damage multiplier</b> for the entire round.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🔥🌟⚡</div><div class="htp-rx-name">Stellar Ignition</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion · <span style="color:var(--Spectro)">Spectro</span> · <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Shield-piercing radiance — deals <b>80% of highest ATK</b> to ALL enemies, <b>completely ignoring shields</b>.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🔥🌊❄️</div><div class="htp-rx-name">Hailfire Storm</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion · <span style="color:var(--Aero)">Aero</span> · <span style="color:var(--Glacio)">Glacio</span></div><div class="htp-rx-desc">Superheated hailstones — ALL enemies take <b>25 flat damage per round for 3 rounds</b>.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🔥🌊⚡</div><div class="htp-rx-name">Thunderblaze Cyclone</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion · <span style="color:var(--Aero)">Aero</span> · <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Electrified fire cyclone — ALL enemies take <b>30 flat damage per round for 2 rounds</b>.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🔥❄️⚡</div><div class="htp-rx-name">Voltaic Frost Burst</div><div class="htp-rx-els" style="color:var(--Fusion)">Fusion · <span style="color:var(--Glacio)">Glacio</span> · <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Freezes the <b>highest HP enemy</b> for a round, then detonates them — dealing <b>40% of their Max HP</b> to all other enemies.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">💜🌟🌊</div><div class="htp-rx-name">Phantom Rift</div><div class="htp-rx-els" style="color:var(--Havoc)">Havoc · <span style="color:var(--Spectro)">Spectro</span> · <span style="color:var(--Aero)">Aero</span></div><div class="htp-rx-desc">Tears reality — your team gains <b>+30% damage</b> and ignores <b>50% of enemy DEF</b> for the round.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">💜🌟❄️</div><div class="htp-rx-name">Shattered Eclipse</div><div class="htp-rx-els" style="color:var(--Havoc)">Havoc · <span style="color:var(--Spectro)">Spectro</span> · <span style="color:var(--Glacio)">Glacio</span></div><div class="htp-rx-desc">Launches <b>3 crystal shards</b> — each deals <b>40 damage</b> to a random enemy, arriving over the next 3 rounds.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">💜🌟⚡</div><div class="htp-rx-name">Void Resonance</div><div class="htp-rx-els" style="color:var(--Havoc)">Havoc · <span style="color:var(--Spectro)">Spectro</span> · <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Erodes enemy power — ALL enemies lose <b>8 ATK every round for 3 rounds</b> (24 total ATK loss each).</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">💜🌊❄️</div><div class="htp-rx-name">Cursed Tundra</div><div class="htp-rx-els" style="color:var(--Havoc)">Havoc · <span style="color:var(--Aero)">Aero</span> · <span style="color:var(--Glacio)">Glacio</span></div><div class="htp-rx-desc">Curses ALL enemies with <b>-25% DEF for 2 rounds</b>, and slows their draw — they draw <b>1 fewer card</b> next round.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">💜🌊⚡</div><div class="htp-rx-name">Abyssal Thunder</div><div class="htp-rx-els" style="color:var(--Havoc)">Havoc · <span style="color:var(--Aero)">Aero</span> · <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Sub-DPS powered lightning — deals <b>50% of your Sub-DPS's ATK</b> to ALL enemies simultaneously.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">💜❄️⚡</div><div class="htp-rx-name">Eternal Ruin</div><div class="htp-rx-els" style="color:var(--Havoc)">Havoc · <span style="color:var(--Glacio)">Glacio</span> · <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Freezes the <b>highest HP enemy</b> for a round and applies a <b>-20% ATK debuff for 2 rounds</b> to them.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🌟🌊❄️</div><div class="htp-rx-name">Boreal Radiance</div><div class="htp-rx-els" style="color:var(--Spectro)">Spectro · <span style="color:var(--Aero)">Aero</span> · <span style="color:var(--Glacio)">Glacio</span></div><div class="htp-rx-desc">Rapid spectral bombardment — fires <b>5 shards</b> at random enemies, each dealing <b>35 Spectro damage</b> in quick succession.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🌟🌊⚡</div><div class="htp-rx-name">Stormlight Pulse</div><div class="htp-rx-els" style="color:var(--Spectro)">Spectro · <span style="color:var(--Aero)">Aero</span> · <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">A penetrating shockwave — deals <b>50% of highest ATK</b> to ALL enemies, bypassing normal shield calculations.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🌟❄️⚡</div><div class="htp-rx-name">Prismatic Discharge</div><div class="htp-rx-els" style="color:var(--Spectro)">Spectro · <span style="color:var(--Glacio)">Glacio</span> · <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Prismatic lightning barrage — fires <b>6 bolts</b> at random enemies, each dealing <b>30 Electro damage</b>.</div></div>
      <div class="htp-rx-card three"><div class="htp-rx-emoji">🌊❄️⚡</div><div class="htp-rx-name">Polar Thunderstorm</div><div class="htp-rx-els" style="color:var(--Aero)">Aero · <span style="color:var(--Glacio)">Glacio</span> · <span style="color:var(--Electro)">Electro</span></div><div class="htp-rx-desc">Deals <b>70% average team ATK</b> to ALL enemies + grants your whole team a <b>DEF-scaled shield</b> simultaneously.</div></div>
    </div>
  </div>`,

  // 5 — Variety (existing, kept)
  `<div class="htp-section">
    <div class="htp-section-title">✦ Variety Card Effects</div>
    <div class="htp-para">Every Resonator has one <b style="color:#64c8ff">Variety card</b> — a unique skill with a special effect beyond normal card rules. They also trigger <b>Elemental Reactions</b> when multiple elements use Variety in the same round.</div>
    <div class="htp-var-grid">
      <div class="htp-var-row"><div class="htp-var-ic">🌠</div><div class="htp-var-body"><div class="htp-var-name">Buff All Allies</div><div class="htp-var-desc">Buffs ATK of <b>every alive ally</b> simultaneously — not just one fighter.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">🌑</div><div class="htp-var-body"><div class="htp-var-name">Consume Buff</div><div class="htp-var-desc">If the target has an ATK buff active, deals <b>+10% MaxHP bonus damage</b> and strips the buff.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">🩸</div><div class="htp-var-body"><div class="htp-var-name">Lifesteal</div><div class="htp-var-desc">Heals the caster for <b>40% of damage dealt</b>.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">💀</div><div class="htp-var-body"><div class="htp-var-name">Execute</div><div class="htp-var-desc">Deals <b>double damage</b> to enemies below 25% or 30% HP — great for finishing.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">🔫</div><div class="htp-var-body"><div class="htp-var-name">Double Hit</div><div class="htp-var-desc">Hits the same target <b>twice for 50% each</b> — triggers on-hit effects twice.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">🔥</div><div class="htp-var-body"><div class="htp-var-name">Burn DoT</div><div class="htp-var-desc">Leaves a <b>burn</b> on the target that deals 20 damage at the start of next round.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">🌺</div><div class="htp-var-body"><div class="htp-var-name">Splash Damage</div><div class="htp-var-desc">Hits the primary target and <b>splashes 40%</b> to a random second enemy.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">🎵</div><div class="htp-var-body"><div class="htp-var-name">Card Disruption</div><div class="htp-var-desc">Debuffs target AND <b>removes their highest-cost committed card</b> from the queue.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">💣</div><div class="htp-var-body"><div class="htp-var-name">Delayed Debuff</div><div class="htp-var-desc">Plants a detonation marker — the debuff triggers at the <b>start of the NEXT round</b>.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">👻</div><div class="htp-var-body"><div class="htp-var-name">Ignore Shield / Untargetable</div><div class="htp-var-desc">Phase through target shields completely, or make the caster untargetable for the round.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">🌾</div><div class="htp-var-body"><div class="htp-var-name">Heal Two Lowest</div><div class="htp-var-desc">Heals the <b>two lowest HP allies</b> splitting the heal evenly between them.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">💎</div><div class="htp-var-body"><div class="htp-var-name">Refund on Kill</div><div class="htp-var-desc">If the attack kills the target, the <b>Energy cost is fully refunded</b>.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">🔋</div><div class="htp-var-body"><div class="htp-var-name">Draw Extra Card</div><div class="htp-var-desc">Buffs ATK and draws <b>1 extra card</b> from this fighter's pool immediately.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">👑</div><div class="htp-var-body"><div class="htp-var-name">Debuff All Enemies</div><div class="htp-var-desc">Applies an ATK debuff to <b>every alive enemy</b> simultaneously.</div></div></div>
      <div class="htp-var-row"><div class="htp-var-ic">✝️</div><div class="htp-var-body"><div class="htp-var-name">Self Sacrifice</div><div class="htp-var-desc">Deals the highest non-ULT base damage — but <b>costs 20 HP</b> from the caster.</div></div></div>
    </div>
    <div class="htp-tip-box" style="margin-top:10px"><p>💡 Check the <b>Resonator Gallery</b> on the main menu to see every character's full card pool including their unique Variety card!</p></div>
  </div>`,

  // 6 — Tutorial (rendered dynamically by tutRender)
  `<div id="tutContainer"></div>`,
];

function openHowToPlay(){
  _htpPage=0;
  document.getElementById('htpOv').classList.add('show');
  renderHtpPage();
}
function closeHowToPlay(){
  document.getElementById('htpOv').classList.remove('show');
}
function htpTab(idx,btn){
  _htpPage=idx;
  document.querySelectorAll('.htp-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderHtpPage();
}
function htpNavStep(dir){
  _htpPage=Math.max(0,Math.min(HTP_PAGES.length-1,_htpPage+dir));
  document.querySelectorAll('.htp-tab').forEach((b,i)=>b.classList.toggle('active',i===_htpPage));
  renderHtpPage();
}
function renderHtpPage(){
  document.getElementById('htpBody').innerHTML=HTP_PAGES[_htpPage];
  document.getElementById('htpBody').scrollTop=0;
  document.getElementById('htpPageLbl').textContent=`${_htpPage+1} / ${HTP_PAGES.length}`;
  document.getElementById('htpPrev').style.opacity=_htpPage===0?'0.3':'1';
  document.getElementById('htpNext').style.opacity=_htpPage===HTP_PAGES.length-1?'0.3':'1';
  document.getElementById('htpFooterTip').textContent=HTP_TIPS[_htpPage]||HTP_TIPS[0];
  // If tutorial page, render it
  if(_htpPage===6){
    _tutStep=0;
    tutRender();
    // Replace footer nav Next with tutorial-aware next
    document.getElementById('htpNext').textContent='Next →';
    document.getElementById('htpNext').onclick=()=>tutNext();
    document.getElementById('htpPrev').onclick=()=>tutPrev();
  } else {
    document.getElementById('htpNext').textContent='Next →';
    document.getElementById('htpNext').onclick=()=>htpNavStep(1);
    document.getElementById('htpPrev').onclick=()=>htpNavStep(-1);
  }
}

// ── Tutorial Engine ──
let _tutStep=0;

// Tutorial state machine — each step describes what to show
// state: {players:[{emoji,name,role,el,hp,maxHp,shield,buff,debuff,highlight,dead}], enemies:[...],
//         energy, hand:[{ic,nm,tp,cost,highlight,committed,ult,variety}],
//         committed:[{owner,ic,nm,tp}],
//         speaker, text, highlight_section}
const TUT_STEPS=[
  // ─── INTRO ───
  {
    label:'intro',
    speaker:'🎓 Guide',
    text:`Welcome to <b>WuWa Battle</b>! This tutorial walks you through a full round of combat. Your team is on the <b class="grn">left</b>, enemies on the <b class="red">right</b>. Tap <b>Next</b> to continue.`,
    energy:7,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:305,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'🌸',nm:'Petal Storm',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true},
      {ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',cost:1,elColor:'var(--Glacio)'},
      {ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)'},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)'},
      {ic:'🌱',nm:'Nature Veil',tp:'BUFF',cost:1,elColor:'var(--Spectro)'},
    ],
    committed:[],
    highlight:null,
  },

  // ─── YOUR TEAM ───
  {
    label:'meet_team',
    speaker:'🎓 Guide',
    text:`Meet your team! Each role fills a different job:<br><b class="red">DPS Camellya</b> — deals the most damage.<br><b style="color:var(--Glacio)">Sub-DPS Sanhua</b> — debuffs and chips away.<br><b class="grn">Support Verina</b> — heals and buffs allies.`,
    energy:7,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)',highlight:true},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)',highlight:true},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)',highlight:true},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:305,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'🌸',nm:'Petal Storm',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true},
      {ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',cost:1,elColor:'var(--Glacio)'},
      {ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)'},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)'},
      {ic:'🌱',nm:'Nature Veil',tp:'BUFF',cost:1,elColor:'var(--Spectro)'},
    ],
    committed:[],
    highlight:null,
  },

  // ─── ENERGY ───
  {
    label:'energy',
    speaker:'🎓 Guide',
    text:`You have <b class="blu">7 ⚡ Energy</b> this round. Each card costs Energy to play — the number in the corner. You can commit multiple cards as long as you have enough Energy. <b>Unspent Energy resets</b> — use it wisely!`,
    energy:7,
    highlightEnergy:true,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:305,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'🌸',nm:'Petal Storm',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true},
      {ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',cost:1,elColor:'var(--Glacio)'},
      {ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)'},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)'},
      {ic:'🌱',nm:'Nature Veil',tp:'BUFF',cost:1,elColor:'var(--Spectro)'},
    ],
    committed:[],
    highlight:null,
  },

  // ─── YOUR HAND ───
  {
    label:'hand',
    speaker:'🎓 Guide',
    text:`This is your <b>hand</b> — cards are sorted by role column. Each card shows its <b>icon, name, type, and cost</b>. <b class="red">Attack</b> cards deal damage. <b class="grn">Heal</b> cards restore HP. <b style="color:var(--gold)">Buff</b> cards boost ATK. <b class="prp">Debuff</b> cards weaken enemies. <b class="cyn">✦ Variety</b> cards have unique special effects!`,
    energy:7,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:305,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'🌸',nm:'Petal Storm',tp:'ATTACK',cost:2,elColor:'var(--Havoc)',highlight:true},
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)',highlight:true},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)',highlight:true},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true,highlight:true},
      {ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',cost:1,elColor:'var(--Glacio)',highlight:true},
      {ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)',highlight:true},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)',highlight:true},
      {ic:'🌱',nm:'Nature Veil',tp:'BUFF',cost:1,elColor:'var(--Spectro)',highlight:true},
    ],
    committed:[],
    highlight:null,
  },

  // ─── STEP 1: COMMIT SUPPORT BUFF ───
  {
    label:'commit1',
    speaker:'🎓 Guide',
    text:`Let's plan our moves! First, commit <b class="grn">Verina's Nature Veil</b> (Buff, cost 1). A Support buff boosts <b>Verina's ATK and shares 70% of it to the top DPS</b>. Energy goes from 7 → 6.`,
    energy:6,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)',highlight:true},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:305,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'🌸',nm:'Petal Storm',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true},
      {ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',cost:1,elColor:'var(--Glacio)'},
      {ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)'},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)'},
      {ic:'🌱',nm:'Nature Veil',tp:'BUFF',cost:1,elColor:'var(--Spectro)',committed:true},
    ],
    committed:[{owner:'Verina',ic:'🌱',nm:'Nature Veil',tp:'BUFF',elColor:'var(--Spectro)'}],
  },

  // ─── STEP 2: COMMIT SUB DEBUFF ───
  {
    label:'commit2',
    speaker:'🎓 Guide',
    text:`Now commit <b style="color:var(--Glacio)">Sanhua's Cryo Lock</b> (Debuff, cost 2). Sub-DPS debuffs target the <b>highest ATK enemy</b>, reducing their damage. Energy: 6 → 4. This sets up the <b class="red">Chain Combo (+25% DPS damage)</b>!`,
    energy:4,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)',highlight:true},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:305,maxHp:310,elColor:'var(--Electro)',debuff:true},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'🌸',nm:'Petal Storm',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true},
      {ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',cost:1,elColor:'var(--Glacio)'},
      {ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)',committed:true},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)'},
      {ic:'🌱',nm:'Nature Veil',tp:'BUFF',cost:1,elColor:'var(--Spectro)',committed:true},
    ],
    committed:[
      {owner:'Verina',ic:'🌱',nm:'Nature Veil',tp:'BUFF',elColor:'var(--Spectro)'},
      {owner:'Sanhua',ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',elColor:'var(--Glacio)'},
    ],
  },

  // ─── STEP 3: COMMIT DPS ATTACK ───
  {
    label:'commit3',
    speaker:'🎓 Guide',
    text:`Now commit <b class="red">Camellya's Petal Storm</b> (Attack, cost 2). Energy: 4 → 2. Because Sanhua debuffed AND Camellya attacks in the same round — that triggers the <b class="red">🌀 Chain Combo! +25% bonus damage</b> on all DPS attacks.`,
    energy:2,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)',highlight:true},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:305,maxHp:310,elColor:'var(--Electro)',debuff:true},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'🌸',nm:'Petal Storm',tp:'ATTACK',cost:2,elColor:'var(--Havoc)',committed:true},
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true},
      {ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',cost:1,elColor:'var(--Glacio)'},
      {ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)',committed:true},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)'},
      {ic:'🌱',nm:'Nature Veil',tp:'BUFF',cost:1,elColor:'var(--Spectro)',committed:true},
    ],
    committed:[
      {owner:'Verina',ic:'🌱',nm:'Nature Veil',tp:'BUFF',elColor:'var(--Spectro)'},
      {owner:'Sanhua',ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',elColor:'var(--Glacio)'},
      {owner:'Camellya',ic:'🌸',nm:'Petal Storm',tp:'ATTACK',elColor:'var(--Havoc)'},
    ],
    comboFlash:'🌀 Chain Combo! +25% DPS Damage',
  },

  // ─── STEP 4: SPEND LAST ENERGY ───
  {
    label:'commit4',
    speaker:'🎓 Guide',
    text:`We have 2 Energy left — let's use it! Commit <b style="color:var(--Glacio)">Cold Snap</b> (Attack cost 1) from Sanhua. Energy 2 → 1. The remaining 1 energy is <b>wasted at round end</b>, so we could also play Elegy Thorns (cost 1) to use it all!`,
    energy:1,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)',highlight:true},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:305,maxHp:310,elColor:'var(--Electro)',debuff:true},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'🌸',nm:'Petal Storm',tp:'ATTACK',cost:2,elColor:'var(--Havoc)',committed:true},
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true,highlight:true},
      {ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',cost:1,elColor:'var(--Glacio)',committed:true},
      {ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)',committed:true},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)'},
      {ic:'🌱',nm:'Nature Veil',tp:'BUFF',cost:1,elColor:'var(--Spectro)',committed:true},
    ],
    committed:[
      {owner:'Verina',ic:'🌱',nm:'Nature Veil',tp:'BUFF',elColor:'var(--Spectro)'},
      {owner:'Sanhua',ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',elColor:'var(--Glacio)'},
      {owner:'Sanhua',ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',elColor:'var(--Glacio)'},
      {owner:'Camellya',ic:'🌸',nm:'Petal Storm',tp:'ATTACK',elColor:'var(--Havoc)'},
    ],
  },

  // ─── TURN ORDER EXPLAINED ───
  {
    label:'turnorder',
    speaker:'🎓 Guide',
    text:`You hit <b>Commit</b> and both sides resolve simultaneously. Fighters with <b>higher DEF act first</b>. <b class="grn">Verina (DEF 95)</b> goes first, then <b style="color:var(--Glacio)">Sanhua (DEF 55)</b>, then <b class="red">Camellya (DEF 33)</b>. Supports are tanky — they move first and buff before attacks land!`,
    energy:0,
    resolving:true,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)',highlight:true},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:305,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    committed:[
      {owner:'Verina',ic:'🌱',nm:'Nature Veil',tp:'BUFF',elColor:'var(--Spectro)'},
      {owner:'Sanhua',ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',elColor:'var(--Glacio)'},
      {owner:'Sanhua',ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',elColor:'var(--Glacio)'},
      {owner:'Camellya',ic:'🌸',nm:'Petal Storm',tp:'ATTACK',elColor:'var(--Havoc)'},
    ],
    hand:[],
  },

  // ─── RESOLVE: BUFF ───
  {
    label:'resolve_buff',
    speaker:'✨ Verina',
    text:`<b class="grn">Nature Veil activates!</b> I boost my own ATK by +8%. And since I'm a Support, I share <b>+5.6% ATK to Camellya</b> (70% of 8%). Now Camellya hits even harder this round!`,
    energy:0,
    resolving:true,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)',buff:true},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)',highlight:true,buff:true},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:305,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    committed:[
      {owner:'Sanhua',ic:'🔒',nm:'Cryo Lock',tp:'DEBUFF',elColor:'var(--Glacio)'},
      {owner:'Sanhua',ic:'🌨️',nm:'Cold Snap',tp:'ATTACK',elColor:'var(--Glacio)'},
      {owner:'Camellya',ic:'🌸',nm:'Petal Storm',tp:'ATTACK',elColor:'var(--Havoc)'},
    ],
    hand:[],
  },

  // ─── RESOLVE: DEBUFF ───
  {
    label:'resolve_debuff',
    speaker:'🌨️ Sanhua',
    text:`<b style="color:var(--Glacio)">Cryo Lock hits Calcharo!</b> As Sub-DPS I always target the <b>highest ATK enemy</b>. His ATK drops — he'll deal less damage this round. Then <b>Cold Snap</b> follows up for direct damage!`,
    energy:0,
    resolving:true,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)',buff:true},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)',highlight:true},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:255,maxHp:310,elColor:'var(--Electro)',debuff:true},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    committed:[
      {owner:'Camellya',ic:'🌸',nm:'Petal Storm',tp:'ATTACK',elColor:'var(--Havoc)'},
    ],
    hand:[],
  },

  // ─── RESOLVE: DPS ATTACK + COMBO ───
  {
    label:'resolve_attack',
    speaker:'🌸 Camellya',
    text:`<b class="red">Petal Storm!</b> Because Sanhua debuffed this round, the <b class="red">🌀 Chain Combo triggers — +25% bonus damage</b>. My attack is also boosted by Verina's Buff. Calcharo takes <b>massive damage</b> and is now at critical HP!`,
    energy:0,
    resolving:true,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:310,maxHp:310,elColor:'var(--Havoc)',highlight:true,buff:true},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:68,maxHp:310,elColor:'var(--Electro)',debuff:true},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    committed:[],
    hand:[],
    comboFlash:'🌸 Petal Storm! Chain Combo ×1.25!',
  },

  // ─── ENEMY ATTACKS BACK ───
  {
    label:'enemy_attacks',
    speaker:'⚡ Calcharo',
    text:`The enemy fights back! <b>Jianxin</b> shielded herself with <b class="blu">Barrier (80 DEF)</b> — shields absorb damage first. <b>Calcharo</b> attacks Camellya but his ATK was debuffed, so his hit is weakened. <b class="grn">Baizhi</b> heals Calcharo!`,
    energy:0,
    resolving:true,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:245,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:118,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)',shield:true},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    committed:[],
    hand:[],
  },

  // ─── SHIELDS EXPLAINED ───
  {
    label:'shields',
    speaker:'🎓 Guide',
    text:`Notice <b class="blu">Jianxin's shield</b>! When a Defend card is committed, the fighter gains a shield that <b>absorbs incoming damage first</b>. Shields are calculated from the card's base value and expire at round end. Plan around them!`,
    energy:0,
    resolving:true,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:245,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:118,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)',highlight:true,shield:true},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    committed:[],
    hand:[],
  },

  // ─── ROUND END / NEW ROUND ───
  {
    label:'newround',
    speaker:'🎓 Guide',
    text:`Round ends! Each side draws <b>+1 new card per fighter</b>. Your <b>unused cards from last round stay in hand</b> — Bloom Burst, Dark Bloom, and Elegy Thorns are still available. Energy resets to <b class="blu">7</b> again.`,
    energy:7,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:245,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:118,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true,highlight:true},
      {ic:'🌺',nm:'Elegy (New)',tp:'ATTACK',cost:3,elColor:'var(--Havoc)',ult:true},
      {ic:'🌨️',nm:'Ice Prison',tp:'ATTACK',cost:2,elColor:'var(--Glacio)'},
      {ic:'🧊',nm:'Cryo Canvas',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)'},
      {ic:'💚',nm:'Verdant Chain',tp:'HEAL',cost:3,elColor:'var(--Spectro)'},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)'},
    ],
    committed:[],
    newRoundBanner:true,
  },

  // ─── ULT EXPLAINED ───
  {
    label:'ult',
    speaker:'🎓 Guide',
    text:`Look — <b style="color:var(--gold2)">Elegy (Camellya's ULT)</b> is now in hand! ULT cards cost 3 Energy and deal the <b>highest damage of any card</b>. They always hit the <b>lowest HP enemy</b>. You can only hold <b>1 ULT per fighter</b> at a time. Calcharo is at low HP — perfect ULT target!`,
    energy:7,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:245,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:118,maxHp:310,elColor:'var(--Electro)',highlight:true},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true},
      {ic:'🌺',nm:'Elegy',tp:'⭐ULT',cost:3,elColor:'var(--Havoc)',ult:true,highlight:true},
      {ic:'🌨️',nm:'Ice Prison',tp:'ATTACK',cost:2,elColor:'var(--Glacio)'},
      {ic:'🧊',nm:'Cryo Canvas',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)'},
      {ic:'💚',nm:'Verdant Chain',tp:'HEAL',cost:3,elColor:'var(--Spectro)'},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)'},
    ],
    committed:[],
  },

  // ─── VARIETY EXPLAINED ───
  {
    label:'variety',
    speaker:'🎓 Guide',
    text:`See the <b class="cyn">✦ Elegy Thorns</b> (cost 1)? That's Camellya's <b>Variety card</b>! It's a cheap 1-cost attack with a unique effect. And crucially — if an enemy also plays their Variety card this round, <b>an Elemental Reaction fires!</b> Havoc + Glacio = <b>Frozen Abyss</b>!`,
    energy:7,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:245,maxHp:310,elColor:'var(--Havoc)',highlight:true},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:118,maxHp:310,elColor:'var(--Electro)'},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[
      {ic:'💐',nm:'Bloom Burst',tp:'ATTACK',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌑',nm:'Dark Bloom',tp:'DEBUFF',cost:2,elColor:'var(--Havoc)'},
      {ic:'🌺',nm:'Elegy Thorns',tp:'✦VAR',cost:1,elColor:'var(--Havoc)',variety:true,highlight:true},
      {ic:'🌺',nm:'Elegy',tp:'⭐ULT',cost:3,elColor:'var(--Havoc)',ult:true},
      {ic:'🌨️',nm:'Ice Prison',tp:'ATTACK',cost:2,elColor:'var(--Glacio)'},
      {ic:'🧊',nm:'Cryo Canvas',tp:'DEBUFF',cost:2,elColor:'var(--Glacio)'},
      {ic:'💚',nm:'Verdant Chain',tp:'HEAL',cost:3,elColor:'var(--Spectro)'},
      {ic:'🌿',nm:'Heal Bloom',tp:'HEAL',cost:2,elColor:'var(--Spectro)'},
    ],
    committed:[],
  },

  // ─── WINNING ───
  {
    label:'victory',
    speaker:'🎓 Guide',
    text:`Round 2 — we commit <b>Elegy (ULT)</b> to finish Calcharo. <b class="red">Calcharo is eliminated!</b> The enemy is now down to 2 fighters. Defeat all 3 enemy fighters to win. With one attacker gone, the enemy team is much weaker!`,
    energy:4,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:245,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:0,maxHp:310,elColor:'var(--Electro)',dead:true},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:415,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:505,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[],
    committed:[],
    ultFlash:true,
  },

  // ─── FINAL ───
  {
    label:'final',
    speaker:'🎓 Guide',
    text:`That's the full loop! <b>Commit cards → Resolve in DEF order → Draw new cards → Repeat.</b> The key to winning: <b class="red">Chain Combos</b> for burst, <b class="grn">heals & shields</b> for survival, <b class="cyn">Variety cards</b> for Reactions. Now go battle — <b style="color:var(--gold2)">good luck, Rover!</b> 🌟`,
    energy:7,
    players:[
      {emoji:'🌸',name:'Camellya',role:'DPS',el:'Havoc',hp:245,maxHp:310,elColor:'var(--Havoc)'},
      {emoji:'🌨️',name:'Sanhua',role:'Sub',el:'Glacio',hp:410,maxHp:410,elColor:'var(--Glacio)'},
      {emoji:'✨',name:'Verina',role:'Supp',el:'Spectro',hp:510,maxHp:510,elColor:'var(--Spectro)'},
    ],
    enemies:[
      {emoji:'⚡',name:'Calcharo',role:'DPS',el:'Electro',hp:0,maxHp:310,elColor:'var(--Electro)',dead:true},
      {emoji:'🌬️',name:'Jianxin',role:'Sub',el:'Aero',hp:365,maxHp:415,elColor:'var(--Aero)'},
      {emoji:'🌿',name:'Baizhi',role:'Supp',el:'Glacio',hp:450,maxHp:510,elColor:'var(--Glacio)'},
    ],
    hand:[],
    committed:[],
    showFinal:true,
  },
];

function tutNext(){
  if(_htpPage!==6)return;
  if(_tutStep<TUT_STEPS.length-1){_tutStep++;tutRender();}
  document.getElementById('htpBody').scrollTop=0;
}
function tutPrev(){
  if(_htpPage!==6)return;
  if(_tutStep>0){_tutStep--;tutRender();}
  else htpNavStep(-1);
  document.getElementById('htpBody').scrollTop=0;
}

function tutRender(){
  const s=TUT_STEPS[_tutStep];
  const total=TUT_STEPS.length;
  const isLast=_tutStep===total-1;
  const isFirst=_tutStep===0;

  // Dots
  const dots=Array.from({length:total},(_,i)=>{
    const cls=i<_tutStep?'done':i===_tutStep?'cur':'';
    return`<div class="tut-step-dot ${cls}"></div>`;
  }).join('');

  // Fighters
  function renderTutFighter(f,isEnemy){
    const pct=Math.max(0,f.hp/f.maxHp*100);
    const hpColor=pct>50?'var(--green)':pct>25?'var(--gold)':'var(--red)';
    let pip='';
    if(f.shield) pip+=`<div class="tut-f-pip tut-pip-shield">🛡️</div>`;
    if(f.buff)   pip+=`<div class="tut-f-pip tut-pip-buff">⬆️ATK</div>`;
    if(f.debuff) pip+=`<div class="tut-f-pip tut-pip-debuff">⬇️ATK</div>`;
    const hlCls=f.highlight?' tut-highlight':'';
    const deadCls=f.dead?' tut-dead':'';
    const buffCls=f.buff&&!f.highlight?' tut-buffed':'';
    const debuffCls=f.debuff&&!f.highlight?' tut-debuffed':'';
    const shieldCls=f.shield&&!f.highlight?' tut-shielded':'';
    return`<div class="tut-fighter${hlCls}${deadCls}${buffCls}${debuffCls}${shieldCls}" style="border-color:${f.highlight?'var(--gold)':f.elColor+'44'}">
      <div class="tut-f-emoji">${f.emoji}</div>
      <div class="tut-f-name" style="color:${f.elColor}">${f.name}</div>
      <div class="tut-f-role" style="color:${f.elColor}">${f.role}</div>
      <div class="tut-f-hp-bar"><div class="tut-f-hp-fill" style="width:${pct}%;background:${hpColor}"></div></div>
      <div class="tut-f-hp-lbl">${Math.max(0,f.hp)}/${f.maxHp}</div>
      ${pip}
    </div>`;
  }

  const playerHTML=s.players.map(f=>renderTutFighter(f,false)).join('');
  const enemyHTML=s.enemies.map(f=>renderTutFighter(f,true)).join('');

  // Energy dots
  const maxE=10;
  const curE=s.energy||0;
  const enDots=Array.from({length:maxE},(_,i)=>`<div class="tut-en-dot ${i<curE?'filled':''}"></div>`).join('');
  const enHighlight=s.highlightEnergy?'style="box-shadow:0 0 10px rgba(74,158,255,.4);border-color:rgba(74,158,255,.5)"':'';

  // Hand
  let handHTML='';
  if(s.hand&&s.hand.length){
    const typeColor=(tp)=>tp.includes('ATTACK')?'#ff6060':tp.includes('DEBUFF')?'#bb44ff':tp.includes('HEAL')?'#2ecc71':tp.includes('BUFF')?'var(--gold)':tp.includes('ULT')||tp.includes('⭐')?'var(--gold2)':'#64c8ff';
    handHTML=`<div style="margin-top:6px;">
      <div style="font-size:.36rem;color:var(--dim);letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px;">Your Hand</div>
      <div class="tut-hand">
        ${s.hand.map(c=>{
          const tc=typeColor(c.tp);
          const hCls=c.highlight?' tut-card-highlight':'';
          const comCls=c.committed?' tut-card-committed':'';
          const ultCls=c.ult?' tut-card-ult':'';
          const varCls=c.variety?' tut-card-variety':'';
          return`<div class="tut-card${hCls}${comCls}${ultCls}${varCls}">
            <div class="tut-card-cost">${c.cost}</div>
            <div class="tut-card-ic">${c.ic}</div>
            <div class="tut-card-nm">${c.nm}</div>
            <div class="tut-card-tp" style="color:${tc}">${c.tp}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // Committed fan
  let fanHTML='';
  if(s.committed&&s.committed.length){
    const typeColor=(tp)=>tp.includes('ATTACK')?'#ff6060':tp.includes('DEBUFF')?'#bb44ff':tp.includes('HEAL')?'#2ecc71':tp.includes('BUFF')?'var(--gold)':'#64c8ff';
    fanHTML=`<div style="margin-top:5px;">
      <div style="font-size:.34rem;color:var(--dim);letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px;">Committed Cards</div>
      <div class="tut-fan">
        ${s.committed.map(c=>`<div class="tut-fan-card" style="color:${typeColor(c.tp)}">${c.ic} ${c.nm} <span style="color:var(--dim2);font-size:.28rem">(${c.owner})</span></div>`).join('')}
      </div>
    </div>`;
  }

  // Special banners
  let bannerHTML='';
  if(s.comboFlash){
    bannerHTML=`<div style="text-align:center;padding:5px;background:rgba(212,168,67,.08);border:1px solid rgba(212,168,67,.3);border-radius:7px;font-size:.6rem;color:var(--gold2);font-weight:700;margin-top:6px;font-family:'Cinzel',serif">${s.comboFlash}</div>`;
  }
  if(s.newRoundBanner){
    bannerHTML=`<div style="text-align:center;padding:5px;background:rgba(46,204,113,.06);border:1px solid rgba(46,204,113,.2);border-radius:7px;font-size:.58rem;color:#2ecc71;font-weight:700;margin-top:6px">🔄 New Round! Cards drawn · Energy reset</div>`;
  }
  if(s.ultFlash){
    bannerHTML=`<div style="text-align:center;padding:5px;background:rgba(212,168,67,.1);border:1px solid rgba(212,168,67,.4);border-radius:7px;font-size:.6rem;color:var(--gold2);font-weight:700;margin-top:6px;font-family:'Cinzel',serif">⭐ ELEGY — ULT! Calcharo defeated!</div>`;
  }

  // Final result
  let finalHTML='';
  if(s.showFinal){
    finalHTML=`<div class="tut-result">
      <div class="tut-result-icon">🏆</div>
      <div class="tut-result-title">Tutorial Complete!</div>
      <div class="tut-result-sub">You know the basics — Commit, Resolve, Combo, Repeat.<br>Head to the <b>Resonator Gallery</b> to study character cards,<br>then start a real battle and put it all to use!</div>
    </div>`;
  }

  // Nav label
  const navLabel=isLast?'Done!':_tutStep===0?'Start →':'Next →';
  document.getElementById('htpNext').textContent=navLabel;
  document.getElementById('htpPrev').style.opacity=isFirst?'0.3':'1';
  document.getElementById('htpNext').style.opacity='1';
  document.getElementById('htpPageLbl').textContent=`Step ${_tutStep+1} / ${total}`;

  const container=document.getElementById('tutContainer');
  if(!container)return;
  container.innerHTML=`
    <div class="tut-step-bar">
      <span class="tut-step-lbl">Tutorial</span>
      <div class="tut-step-dots">${dots}</div>
    </div>
    <div class="tut-scene">
      <div class="tut-battlefield">
        <div class="tut-teams">
          <div class="tut-team">${playerHTML}</div>
          <div class="tut-divider-v"></div>
          <div class="tut-team enemy-team">${enemyHTML}</div>
        </div>
        <div class="tut-en-bar" ${enHighlight}>
          <div class="tut-en-lbl">⚡</div>
          <div class="tut-en-dots">${enDots}</div>
          <div class="tut-en-lbl">${curE} / ${maxE}</div>
        </div>
        ${handHTML}
        ${fanHTML}
        ${bannerHTML}
      </div>
      <div class="tut-bubble-wrap">
        <div class="tut-bubble">
          <div class="tut-bubble-speaker">${s.speaker}</div>
          <div class="tut-bubble-text">${s.text}</div>
        </div>
      </div>
      ${finalHTML}
    </div>`;
}
// Close HTP on backdrop click
document.getElementById('htpOv')?.addEventListener('click',e=>{
  if(e.target===document.getElementById('htpOv'))closeHowToPlay();
});

