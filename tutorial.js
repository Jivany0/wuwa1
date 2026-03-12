// ═══════════════════════════════════════════════════════
// IN-GAME TUTORIAL ENGINE
// ═══════════════════════════════════════════════════════
let TUT = {
  active: false,
  step: 0,
  waitingFor: null,   // what action we're waiting the player to do
  _orig: {},          // stash original functions we patch
};

// Each step: {id, title, body, target(fn→DOMel|null), waitFor, nextBtn, arrow}
// waitFor values: 'click_attack','click_debuff','click_buff','click_heal',
//                 'click_ult','click_variety','commit','newround'
const TUT_BATTLE_STEPS = [
  {
    id:'welcome',
    title:'🎓 Welcome to Tutorial Battle!',
    body:`This is a <b>real battle</b> — but I'll guide every step. Your team is on the <b class="grn">left</b>, enemies on the <b class="red">right</b>.<br><br>I've given you a <b>fixed hand</b> so we can learn together. Tap <b>Got it!</b> to begin.`,
    target:null, nextBtn:true, waitFor:null,
  },
  {
    id:'meet_energy',
    title:'⚡ Your Energy',
    body:`See the <b class="blu">⚡ number</b> top-left? That's your Energy. You get <b class="blu">3 Energy per round</b> — flat, no carry over. Every card costs <b>1 energy</b> to play. Spend wisely!`,
    target:()=>document.getElementById('enVal')?.closest('.en-block'),
    nextBtn:true, waitFor:null,
  },
  {
    id:'meet_hand',
    title:'🃏 Your Hand',
    body:`Three columns — one per fighter. Each fighter has <b>4 cards</b>: 3 skill cards drawn randomly + 1 fixed <b class="cyn">✦ Variety</b> card. Tap any card to commit it!`,
    target:()=>document.getElementById('handZone'),
    nextBtn:true, waitFor:null,
  },
  {
    id:'do_support',
    title:'Step 1 — Play a Support Skill',
    body:`Find <b class="grn">Team Pulse</b> or <b class="grn">Resonance Mend</b> in your <b>Support column</b> and <b>tap it</b>. Support skills heal or buff your whole team!`,
    target:()=>document.getElementById('handSuppCards'),
    nextBtn:false, waitFor:'click_support',
    arrow:true,
  },
  {
    id:'support_done',
    title:'✅ Support Skill Committed!',
    body:`Great! Your Support's skill is in their <b class="gld">committed fan</b>. Supports have the highest DEF so they act first — their heal/buff fires before damage lands. Next, let's disrupt the enemy!`,
    target:null, nextBtn:true, waitFor:null,
  },
  {
    id:'do_subdps',
    title:'Step 2 — Play a SubDPS Skill',
    body:`Find <b class="prp">Energy Siphon</b> or <b class="prp">Echo Pulse</b> in your <b>Sub-DPS column</b> and <b>tap it</b>. SubDPS skills steal energy, disable cards, or debuff enemies — triggering the <b class="red">🌀 Chain Combo!</b>`,
    target:()=>document.getElementById('handSubCards'),
    nextBtn:false, waitFor:'click_subdps',
    arrow:true,
  },
  {
    id:'subdps_done',
    title:'✅ SubDPS Skill Locked In!',
    body:`SubDPS disruptive skills trigger the <b class="red">Chain Combo +25%</b> when your DPS also attacks this round. Let's add the attack!`,
    target:null, nextBtn:true, waitFor:null,
  },
  {
    id:'do_attack',
    title:'Step 3 — Play a DPS Skill',
    body:`Tap any skill card in your <b class="red">DPS column</b> — like <b class="red">War Cry</b> or <b class="red">Apex Focus</b>. This triggers the <b class="red">Chain Combo</b> from your SubDPS skill!`,
    target:()=>document.getElementById('handDpsCards'),
    nextBtn:false, waitFor:'click_dps',
    arrow:true,
  },
  {
    id:'attack_done',
    title:'✅ Chain Combo Ready!',
    body:`You have <b>Support + SubDPS + DPS</b> committed — that's the core combo! Now hit <b>Commit</b> to resolve the round and watch the damage fly!`,
    target:()=>document.getElementById('commitBtn'),
    nextBtn:false, waitFor:'click_commit',
    arrow:true,
  },
  {
    id:'resolving',
    title:'⚔️ Resolving…',
    body:`Watch the action! Cards fire in <b>DEF order</b> — highest DEF fighter acts first. Support buffs/heals → SubDPS disrupts → DPS attacks. The enemy fights back too!`,
    target:()=>document.getElementById('playerCol'),
    nextBtn:true, waitFor:null,
  },
  {
    id:'new_round',
    title:'🔄 New Round!',
    body:`Each fighter draws a <b>fresh 4-card hand</b> — 3 random skills + their Variety card. Energy resets to <b>3</b>. No carry over! Now try playing a <b class="cyn">✦ Variety card</b> — look for the teal border!`,
    target:()=>document.getElementById('handZone'),
    nextBtn:true, waitFor:null,
  },
  {
    id:'do_variety',
    title:'Step 4 — Play a Variety Card',
    body:`Find the <b class="cyn">✦ Variety card</b> (teal border) in any column and <b>tap it</b>! Variety cards have unique effects and trigger <b>Elemental Reactions</b> when both sides play theirs in the same round!`,
    target:()=>document.getElementById('handDpsCards'),
    nextBtn:false, waitFor:'click_variety',
    arrow:true,
  },
  {
    id:'variety_done',
    title:'✅ Variety Card Committed!',
    body:`If the enemy also played their Variety card, an <b class="cyn">Elemental Reaction</b> fires automatically — 34 different reactions possible! Commit now to see what happens!`,
    target:()=>document.getElementById('commitBtn'),
    nextBtn:false, waitFor:'click_commit',
    arrow:true,
  },
  {
    id:'discard_tip',
    title:'🗑️ Discarding Cards',
    body:`See the <b class="red">✕ button</b> on skill cards? That's discard — it costs <b>1 energy</b> (same as playing). Use it to swap out a bad skill card. <b>Variety cards can't be discarded</b> — they're always yours!`,
    target:()=>document.getElementById('handZone'),
    nextBtn:true, waitFor:null,
  },
  {
    id:'shields_tip',
    title:'🛡️ Shields & Skills',
    body:`Cards with a <b class="blu">🛡️ value</b> give shields that absorb damage. Cards with a <b class="grn">💚</b> in their skill text heal allies. Read the skill text on each card — every skill has a condition or bonus effect!`,
    target:()=>document.getElementById('playerCol'),
    nextBtn:true, waitFor:null,
  },
  {
    id:'finish',
    title:'🏆 You\'re Ready!',
    body:`The loop: <b>Pick 3 skills → commit → watch reactions → repeat</b>. Mix roles for combos, save variety cards for reactions, and read skill conditions carefully. <b class="grn">Defeat all 3 enemies</b> to win!<br><br>Good luck, Rover! 🌟`,
    target:null, nextBtn:true, waitFor:null,
    last:true,
  },
];

function startTutorialBattle(){
  TUT.active = true;
  TUT.step = 0;
  TUT.waitingFor = null;

  document.getElementById('modeSelectOv').classList.remove('show');

  // Scripted fixed fighters
  const mkF = (name, role, el, emoji, weapon, hp, atk, def) => {
    const res = RESONATORS.find(r=>r.name===name)||{};
    return {
      name, role, el, emoji, weapon,
      maxHp:hp, hp, atk, def,
      shield:0, atkMult:1, buffRounds:0, debuffRounds:0, atkDebuffAmount:0,
      alive:true, overdrive:false, guard:false,
      id:'f'+Math.random().toString(36).slice(2),
      committed:[], hand:[]
    };
  };

  const camellya = mkF('Camellya','dps',    'Havoc',   '🌸','Sword',     310,75,32);
  const sanhua   = mkF('Sanhua',  'subdps', 'Glacio',  '🌨️','Sword',     410,60,55);
  const verina   = mkF('Verina',  'support','Spectro', '✨','Rectifier', 510,22,95);
  const calcharo = mkF('Calcharo','dps',    'Electro', '⚡','Sword',     305,74,31);
  const jianxin  = mkF('Jianxin', 'subdps', 'Aero',    '🌪️','Gauntlets', 405,58,52);
  const baizhi   = mkF('Baizhi',  'support','Glacio',  '🌿','Rectifier', 505,21,92);

  G = {
    player:[camellya, sanhua, verina],
    enemy: [calcharo, jianxin, baizhi],
    energy:3, botEnergy:3,
    round:1, phase:'commit', done:false, _passing:false, escalation:1,
    mode:'bot', pvpTurn:'p1'
  };

  // Scripted fixed hand — 4.0 skill cards on f.hand per fighter
  const hid = () => 'h'+Math.random().toString(36).slice(2);

  // Camellya (DPS) — damage + variety
  camellya.hand = [
    {n:'War Cry',    ic:'📣', v:75, shield:0, c:1, skill:'Deal 100% ATK damage. +20% if ally has a buff active.',          ownerId:camellya.id, ownerName:'Camellya', hid:hid()},
    {n:'Death\'s Edge',ic:'💀',v:90, shield:0, c:1, skill:'Deal 200% ATK damage if this resonator is below 5% HP.',        ownerId:camellya.id, ownerName:'Camellya', hid:hid()},
    {n:'Apex Focus', ic:'🎯', v:80, shield:0, c:1, skill:'Deal 120% ATK damage. Prioritize highest ATK enemy.',            ownerId:camellya.id, ownerName:'Camellya', hid:hid()},
    {...CHAR_CARDS['Camellya'], ownerId:camellya.id, ownerName:'Camellya', hid:hid()},
  ];

  // Sanhua (SubDPS) — disruptive skills + variety
  sanhua.hand = [
    {n:'Energy Siphon',ic:'⚡', v:0, shield:0, c:1, skill:'Steal 1 energy from your opponent.',                            ownerId:sanhua.id, ownerName:'Sanhua', hid:hid()},
    {n:'Echo Pulse',   ic:'🔊', v:60, shield:0, c:1, skill:'Deal 80% ATK damage. Disable 1 card of the enemy.',            ownerId:sanhua.id, ownerName:'Sanhua', hid:hid()},
    {n:'Iron Taunt',   ic:'🛡️', v:0, shield:120,c:1, skill:'Shield self (120). Taunts enemy DPS attacks this round.',      ownerId:sanhua.id, ownerName:'Sanhua', hid:hid()},
    {...CHAR_CARDS['Sanhua'], ownerId:sanhua.id, ownerName:'Sanhua', hid:hid()},
  ];

  // Verina (Support) — heals/shields + variety
  verina.hand = [
    {n:'Resonance Mend',ic:'💚', v:0, shield:0, c:1, skill:'Heal the lowest HP% teammate by 130 HP.',                     ownerId:verina.id, ownerName:'Verina', hid:hid()},
    {n:'Damage Veil',  ic:'🌫️', v:0, shield:100,c:1, skill:'Shield self (100). Reduce damage taken by 20% this round.',   ownerId:verina.id, ownerName:'Verina', hid:hid()},
    {n:'Team Pulse',   ic:'✨', v:0, shield:0, c:1, skill:'Apply +10% ATK to the whole team for 1 round.',                 ownerId:verina.id, ownerName:'Verina', hid:hid()},
    {...CHAR_CARDS['Verina'], ownerId:verina.id, ownerName:'Verina', hid:hid()},
  ];

  // Enemy hands — drawn normally
  [calcharo, jianxin, baizhi].forEach(f=>refreshHand(f));

  document.getElementById('titleScreen').classList.remove('active');
  document.getElementById('battleScreen').classList.add('active');
  document.getElementById('tutBanner').classList.add('show');
  document.getElementById('tutBannerTxt').textContent = '🎓 Tutorial Mode — follow the green prompts!';

  renderAll();
  setTimeout(()=>tutShowStep(0), 600);
}

function tutShowStep(idx){
  if(!TUT.active) return;
  TUT.step = idx;
  const s = TUT_BATTLE_STEPS[idx];
  if(!s) return;

  // Update banner progress
  document.getElementById('tutBannerProg').textContent = `${idx+1} / ${TUT_BATTLE_STEPS.length}`;

  // Populate tooltip
  document.getElementById('tutStepLbl').textContent = `Step ${idx+1} of ${TUT_BATTLE_STEPS.length}`;
  document.getElementById('tutTitle').textContent = s.title;
  document.getElementById('tutBody').innerHTML = s.body;
  document.getElementById('tutNextBtn').style.display = s.nextBtn ? 'block' : 'none';
  document.getElementById('tutNextBtn').textContent = s.last ? '🎉 Start Playing!' : 'Got it! →';

  // Position tooltip + ring
  const tooltip = document.getElementById('tutTooltip');
  const ring = document.getElementById('tutRing');
  const arrow = document.getElementById('tutArrow');
  tooltip.classList.add('show');

  if(s.target){
    const el = s.target();
    if(el){
      const r = el.getBoundingClientRect();
      // Show dim + ring
      document.getElementById('tutDim').style.display = 'block';
      ring.style.cssText = `display:block;left:${r.left-4}px;top:${r.top-4}px;width:${r.width+8}px;height:${r.height+8}px;`;

      // Position tooltip below or above target
      const tipW = 260, tipH = 180;
      let tx = Math.min(r.left, window.innerWidth - tipW - 8);
      let ty = r.bottom + 12;
      if(ty + tipH > window.innerHeight) ty = r.top - tipH - 12;
      tooltip.style.cssText = `display:block;left:${Math.max(8,tx)}px;top:${Math.max(8,ty)}px;`;

      // Arrow
      if(s.arrow){
        arrow.style.cssText = `display:block;left:${r.left + r.width/2 - 12}px;top:${r.top - 28}px;`;
        arrow.textContent = '👆';
      } else {
        arrow.style.display = 'none';
      }
    }
  } else {
    // Center tooltip
    document.getElementById('tutDim').style.display = 'none';
    ring.style.display = 'none';
    arrow.style.display = 'none';
    tooltip.style.cssText = `display:block;left:50%;top:50%;transform:translate(-50%,-50%);`;
  }

  // Progress dots
  const progEl = document.getElementById('tutBannerProg');
  const dots = TUT_BATTLE_STEPS.map((_,i)=>{
    const cls = i < idx ? 'tut-dot-done' : i === idx ? 'tut-dot-cur' : 'tut-dot-future';
    return `<span class="tut-dot ${cls}"></span>`;
  }).join('');
  progEl.innerHTML = dots;

  // Show waiting hint inside body when player must act
  if(s.waitFor){
    const wfLabels = {
      'click_support': '👆 Tap a <b>Support skill card</b> in the Support column',
      'click_subdps':  '👆 Tap a <b>SubDPS skill card</b> in the Sub-DPS column',
      'click_dps':     '👆 Tap a <b>DPS skill card</b> in the DPS column',
      'click_variety': '👆 Tap the <b>✦ Variety card</b> (teal border)',
      'click_commit':  '👆 Tap the <b>⚔️ Commit button</b> top-right',
    };
    const hint = wfLabels[s.waitFor];
    if(hint){
      document.getElementById('tutBody').innerHTML += `<div class="tut-waiting-hint">${hint}</div>`;
    }
  }

  // Set what we're waiting for
  TUT.waitingFor = s.waitFor;
}

// Aliases for any stray references
function gtNext(){ tutAdvance(); }
function gtSkip(){ exitTutorial(); }

function tutAdvance(){
  if(!TUT.active) return;
  const s = TUT_BATTLE_STEPS[TUT.step];
  if(s && s.last){ exitTutorial(); return; }
  const next = TUT.step + 1;
  if(next < TUT_BATTLE_STEPS.length) tutShowStep(next);
}

function tutHide(){
  document.getElementById('tutTooltip').classList.remove('show');
  document.getElementById('tutTooltip').style.display = 'none';
  document.getElementById('tutRing').style.display = 'none';
  document.getElementById('tutArrow').style.display = 'none';
  document.getElementById('tutDim').style.display = 'none';
}

function exitTutorial(){
  TUT.active = false;
  TUT.step = 0;
  TUT.waitingFor = null;
  tutHide();
  document.getElementById('tutBanner').classList.remove('show');
}

// ─── Hook into game actions to detect tutorial progress ───

// Patch addToFan to detect card type taps
const _origAddToFan = window.addToFan;
// We intercept at the card tap level — patch renderHandCard onclick
// Instead, we'll intercept by wrapping the click check in renderAll / hand rendering
// The cleanest approach: poll G state after each render

function tutCheckAction(mappedWaitFor){
  if(!TUT.active) return;
  const wf = TUT.waitingFor;
  if(!wf) return;
  if(wf === mappedWaitFor){
    TUT.waitingFor = null;
    tutHide();
    setTimeout(()=>tutAdvance(), 350);
  }
}

function tutCheckCommit(){
  if(!TUT.active) return;
  if(TUT.waitingFor === 'click_commit'){
    TUT.waitingFor = null;
    tutHide();
    setTimeout(()=>tutAdvance(), 300);
  }
}

function tutCheckNewRound(){
  if(!TUT.active) return;
  if(TUT.waitingFor === 'newround'){
    TUT.waitingFor = null;
    tutHide();
    setTimeout(()=>tutAdvance(), 800);
  }
}

// Patch commitRound to detect commit action
const _origCommitRound = commitRound;
window.commitRound = function(){
  tutCheckCommit();
  _origCommitRound();
};

// Patch newRound (called at end of resolve) to detect round transition
const _origNewRound = window.newRound || function(){};
// newRound is defined inline; we patch via a flag check at its call site instead
// We detect new round by watching G.round change after resolve

// Watch for new round via MutationObserver on roundNum
(function(){
  let lastRound = 1;
  const obs = new MutationObserver(()=>{
    const cur = parseInt(document.getElementById('roundNum')?.textContent||'1');
    if(cur !== lastRound){
      lastRound = cur;
      if(TUT.active){
        tutHide();
        // Find the 'new_round' step and jump to it
        const nrIdx = TUT_BATTLE_STEPS.findIndex(s=>s.id==='new_round');
        if(nrIdx > TUT.step) setTimeout(()=>tutShowStep(nrIdx), 600);
      }
    }
  });
  // Start observing once DOM is ready
  setTimeout(()=>{
    const rn = document.getElementById('roundNum');
    if(rn) obs.observe(rn, {childList:true, characterData:true, subtree:true});
  }, 1000);
})();

// Intercept card taps by patching the onclick that addToFan uses
// We do this by wrapping addToFan after it's defined
// Since addToFan is called from renderHandCard onclick, we patch at the function level
setTimeout(()=>{
  const _origHcTap = hcTap;
  window.hcTap = function(hid){
    if(TUT.active){
      // Search f.hand per fighter since 4.0 has no G.hand
      const team = G.player||[];
      let card = null;
      for(const f of team){ card = (f.hand||[]).find(c=>c.hid===hid); if(card) break; }
      if(card && G.phase==='commit'){
        const f = team.find(x=>x.name===card.ownerName);
        const role = f ? f.role : '';
        const mapped = card.variety ? 'click_variety' :
          role==='dps'    ? 'click_dps' :
          role==='subdps' ? 'click_subdps' :
          role==='support'? 'click_support' : null;
        if(mapped) tutCheckAction(mapped);
      }
    }
    return _origHcTap(hid);
  };
}, 200);