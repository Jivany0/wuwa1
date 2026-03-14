// ═══════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════
const EL_VAR={Spectro:'--Spectro',Havoc:'--Havoc',Aero:'--Aero',Glacio:'--Glacio',Electro:'--Electro',Fusion:'--Fusion',Physical:'--Physical'};
const RESISTANCE=0.9;

const ROLE_ST={
  dps:    {hp:[700, 720], atk:[70,80],  def:[30,35]},
  subdps: {hp:[800, 820], atk:[55,65],  def:[50,60]},
  support:{hp:[980, 1000], atk:[20,25],  def:[90,100]},
};

const WEAPON_IC={Sword:"🗡️",Broadblade:"🔱",Gauntlets:"👊",Pistol:"🔫",Rectifier:"📡"};

// ═══════════════════════════════════════════════════════════
// CARD POOL SYSTEM (4.0)
// Each resonator draws 3 cards from their combined pool:
//   ALL_ROLE + ROLE_POOL[role] + EL_ROLE_POOL[el+role]
// Variety card is always fixed in hand (slot 4)
// All cards cost 1 energy. Max 2 duplicates per hand.
// ═══════════════════════════════════════════════════════════

// ── ALL ROLE ────────────────────────────────────────────────
// Every resonator regardless of element or role can draw these
const ALL_ROLE_POOL = [
  {t:"buff", n:"War Cry",         ic:"📯", v:0,   shield:0,  c:0, skill:"Apply +10% ATK to the whole team for the next round."},
  {t:"attack", n:"Apex Focus",      ic:"🎯", v:10,  shield:10, c:0, skill:"Prioritize highest ATK enemy."},
  {t:"buff", n:"Echo Pulse",      ic:"⚡", v:10,  shield:0,  c:0, skill:"Gain 1 energy when hit by 2 cards this round."},
  {t:"defend", n:"Iron Taunt",      ic:"🛡️", v:0,   shield:20, c:0, skill:"Taunt all DPS attacks and reduce their damage by 15%."},
  {t:"defend", n:"Lone Taunt",      ic:"📣", v:0,   shield:60, c:0, skill:"Taunt enemy DPS attacks."},
  {t:"defend", n:"Cleanse",         ic:"✨", v:0,   shield:120,c:0, skill:"Remove all debuffs on this resonator."},
  {t:"defend", n:"Deflect",         ic:"🌀", v:40,  shield:30, c:0, skill:"Block one incoming attack next round."},
  {t:"defend", n:"Damage Veil",     ic:"🌫️", v:40,  shield:20, c:1, skill:"Reduce damage taken by 20% this round."},
  {t:"buff", n:"Momentum Charge", ic:"🔋", v:0,   shield:20, c:1, skill:"Gain 1 energy if this card is active and attacking per round (1 per round, only lasts one round)."},
  {t:"buff", n:"Affinity Charge", ic:"💫", v:20,  shield:20, c:0, skill:"Gain 1 energy when hit by 2 cards of the same attribute this round."},
  {t:"heal", n:"Team Pulse",      ic:"💚", v:0,   shield:20, c:0, skill:"Heal all allies by 30 HP."},
  {t:"heal", n:"Resonance Mend",  ic:"🌿", v:0,   shield:40, c:1, skill:"Heal this resonator by 90–120 HP."},
];

// ── ROLE POOLS ──────────────────────────────────────────────
const ROLE_POOL = {

  dps: [
    {t:"attack", n:"Last Stand",      ic:"💀", v:100, shield:25, c:1, skill:"Deal 150% damage if this resonator's HP is below 10%."},
    {t:"attack", n:"Death's Edge",    ic:"☠️", v:110, shield:30, c:1, skill:"Deal 200% more damage if HP is below 5%."},
    {t:"defend", n:"Void Strike",     ic:"🌑", v:110, shield:30, c:1, skill:"Apply lethal (true damage/ignore DEF) if this resonator's HP is below 30%."},
    {t:"attack", n:"Desperation",     ic:"🔥", v:110, shield:40, c:1, skill:"Deal 120% damage if this resonator's HP is below 50%."},
    {t:"attack", n:"First Blood",     ic:"⚔️", v:100, shield:45, c:1, skill:"Deal 120% damage if this resonator was attacked first in the round."},
    {t:"attack", n:"Combat Instinct", ic:"🗡️", v:110, shield:20, c:1, skill:"Guaranteed critical if this resonator attacked first."},
    {t:"attack", n:"Bloodhound Instinct",ic:"🐺",v:100,shield:20,c:1, skill:"Prioritize highest ATK enemy if this resonator's HP is below 50%."},
    {t:"attack", n:"Predator's Mark", ic:"🎯", v:100, shield:30, c:1, skill:"Targeting enemy with more than 80% HP increases this card's damage by 20%."},
    {t:"attack", n:"Triple Tempo",    ic:"⚡", v:35,  shield:30, c:1, skill:"Strike 3 times."},
    {t:"attack", n:"Grudge Memory",   ic:"💢", v:110, shield:20, c:1, skill:"Deal 200% more damage if hit by the same card from the last 3 rounds."},
    {t:"attack", n:"Echo Retaliation",ic:"🔄", v:90,  shield:40, c:1, skill:"Deal 130% damage if hit by the same card from the last round."},
    {t:"attack", n:"Resonant Fury",   ic:"💥", v:100, shield:40, c:1, skill:"Deal 200% damage when hit by the same card in the same round."},
    {t:"attack", n:"Sync Strike",     ic:"🌟", v:110, shield:30, c:1, skill:"Deal 120% damage if paired with a variety card this round."},
    {t:"attack", n:"Perfect Crit",    ic:"💎", v:100, shield:30, c:1, skill:"Guaranteed critical if executed with a variety card."},
    {t:"buff", n:"Affliction Fury", ic:"🩸", v:50,  shield:10, c:1, skill:"Attack twice if this resonator has a debuff."},
    {t:"attack", n:"Shared Ruin",     ic:"💔", v:60,  shield:40, c:1, skill:"50% more damage if all resonators have HP below 50%."},
    {t:"attack", n:"Underdog",        ic:"⬆️", v:90,  shield:30, c:1, skill:"Deal 120% damage if this resonator's HP% is lower than the target's HP%."},
    {t:"attack", n:"Upward Pressure", ic:"🔺", v:100, shield:30, c:1, skill:"Deal 120% damage if the target's ATK is higher than this resonator's ATK."},
    {t:"buff", n:"Buff Breaker",    ic:"🔨", v:90,  shield:40, c:1, skill:"Deal 130% damage if the target is buffed."},
    {t:"buff", n:"Curse Exploit",   ic:"🎃", v:90,  shield:40, c:1, skill:"Deal 130% damage if the target is debuffed."},
    {t:"defend", n:"Shield Shatter",  ic:"💥", v:100, shield:30, c:1, skill:"If this card breaks the target's shield, it deals 130% damage."},
    {t:"defend", n:"Sunder Guard",    ic:"🔱", v:110, shield:40, c:1, skill:"Deal 30% more damage to a shielded target."},
    {t:"attack", n:"Last Breath",     ic:"🌬️", v:100, shield:30, c:1, skill:"Deal 150% damage if this resonator attacks last in this round."},
    {t:"attack", n:"Delayed Verdict", ic:"⏳", v:90,  shield:30, c:1, skill:"Deal 140% damage of 1 card after 3 rounds."},
    {t:"heal", n:"Life Drain",      ic:"🩸", v:90,  shield:25, c:1, skill:"Heal this resonator by 90% of the damage inflicted by this card."},
    {t:"heal", n:"Lifesteal Strike",ic:"❤️", v:80,  shield:40, c:1, skill:"Heal this resonator by the damage inflicted by this card."},
    {t:"heal", n:"Vital Strike",    ic:"💗", v:70,  shield:60, c:1, skill:"Successful attacks heal this resonator's HP by 50."},
  ],

  subdps: [
    {t:"attack", n:"Disrupt",         ic:"✂️", v:65,  shield:20, c:1, skill:"Remove the first committed card the target has."},
    {t:"heal", n:"Wither",          ic:"🍂", v:100, shield:15, c:1, skill:"Target reduces incoming heal next round by 50%."},
    {t:"heal", n:"Anti-Mend",       ic:"🚫", v:30,  shield:40, c:1, skill:"Apply -40% heal debuff for this round and next round."},
    {t:"buff", n:"Resonance Crack", ic:"💢", v:0,   shield:20, c:0, skill:"Apply -20% damage debuff for this and next round."},
    {t:"attack", n:"Energy Sever",    ic:"⚡", v:85,  shield:35, c:1, skill:"Destroy 1 of your opponent's energy."},
    {t:"attack", n:"Energy Siphon",   ic:"🌀", v:90,  shield:20, c:1, skill:"Steal 1 energy from opponent's energy (if 0 energy, nothing will be stolen)."},
    {t:"attack", n:"Void Siphon",     ic:"🌑", v:50,  shield:20, c:1, skill:"Steal 1 energy from the enemy when paired with a variety card."},
    {t:"attack", n:"Jamming Field",   ic:"📡", v:90,  shield:40, c:1, skill:"Disable 1 card of the enemy this round."},
    {t:"heal", n:"Mend Block",      ic:"🔒", v:10,  shield:20, c:0, skill:"Disable enemy heal card this round."},
    {t:"attack", n:"Chaos Draw",      ic:"🎲", v:50,  shield:40, c:1, skill:"Randomly discard an enemy card when comboed by 2 cards this round."},
    {t:"buff", n:"Curse Transfer",  ic:"☠️", v:110, shield:30, c:1, skill:"Transfer all debuffs of this resonator to the target."},
    {t:"buff", n:"Status Nullify",  ic:"🚷", v:80,  shield:60, c:1, skill:"Disable the target's buff and debuff cards next round."},
    {t:"attack", n:"Counter Seal",    ic:"🔐", v:60,  shield:60, c:1, skill:"When attacked by the enemy, their card next round is disabled."},
    {t:"defend", n:"Armor Bypass",    ic:"💨", v:50,  shield:30, c:1, skill:"Skip the highest DEF stat target."},
    {t:"defend", n:"Wall Seeker",     ic:"🧱", v:120, shield:10, c:1, skill:"Target the highest DEF if this resonator's HP is below 50%."},
    {t:"defend", n:"Shield Predator", ic:"🎯", v:110, shield:20, c:1, skill:"Targets the lowest shield if attacked with 2 cards."},
    {t:"buff", n:"Grudge Bloom",    ic:"🌹", v:100, shield:40, c:1, skill:"Deal 120% damage if debuffed last round."},
    {t:"attack", n:"Resonant Chain",  ic:"🔗", v:90,  shield:35, c:1, skill:"When comboed by 2 cards, deals 120% damage next round."},
    {t:"attack", n:"Mirror Fury",     ic:"🪞", v:50,  shield:30, c:1, skill:"Attack twice when attacked by the same attribute."},
    {t:"buff", n:"Attunement Strike",ic:"🎵",v:110, shield:35, c:1, skill:"Draw a card when attacking a resonator of the same attribute."},
    {t:"attack", n:"Apex Hunt",       ic:"🏹", v:70,  shield:30, c:1, skill:"Target the highest HP%."},
    {t:"defend", n:"Taunt Breaker",   ic:"💪", v:100, shield:20, c:1, skill:"Deal 120% damage if this resonator is taunted."},
  ],

  support: [
    {t:"defend", n:"Iron Veil",       ic:"🛡️", v:0,   shield:120,c:1, skill:"This resonator can't take critical damage this round."},
    {t:"defend", n:"Fortify",         ic:"🏰", v:70,  shield:50, c:1, skill:"Make this resonator's DEF next round doubled, only lasts 1 round."},
    {t:"defend", n:"Barrier Surge",   ic:"🌊", v:70,  shield:30, c:1, skill:"Gain 30% more shield next round if hit by 2 cards this round while this card is active."},
    {t:"defend", n:"Barrier Hold",    ic:"🧲", v:40,  shield:50, c:1, skill:"Draw a card if this resonator's shield didn't break this round."},
    {t:"defend", n:"Shield Crash",    ic:"💥", v:80,  shield:50, c:1, skill:"Deal 30% of the shield gained this round as bonus damage."},
    {t:"defend", n:"Shatter Surge",   ic:"⚡", v:100, shield:20, c:1, skill:"Deal 130% damage if this resonator's shield broke this round."},
    {t:"attack", n:"Thorned Mirror",  ic:"🌹", v:20,  shield:70, c:1, skill:"Reflect 30% damage taken if this resonator's HP is below 30%."},
    {t:"defend", n:"Tactical Bond",   ic:"🤝", v:80,  shield:40, c:1, skill:"Add 15% of this card's shield depending on teammates' DEF/ATK."},
    {t:"defend", n:"Resonant Barrier",ic:"🌀", v:90,  shield:30, c:1, skill:"Double the shield gain next round if this resonator was attacked by the same attribute."},
    {t:"defend", n:"Guardian Taunt",  ic:"📣", v:30,  shield:60, c:1, skill:"Taunt the next round's attacks."},
    {t:"buff", n:"Role Resonance",  ic:"🔮", v:20,  shield:30, c:1, skill:"Gain 1 energy when attacked by the same role."},
    {t:"defend", n:"Shield Break Charge",ic:"🔋",v:80,shield:50, c:1, skill:"Gain 1 energy if this resonator's shield breaks."},
    {t:"buff", n:"Over Dive",       ic:"🌊", v:80,  shield:30, c:1, skill:"Gain 1 energy when attacked with 50% HP."},
    {t:"heal", n:"Mending Touch",   ic:"💚", v:0,   shield:40, c:1, skill:"Heal the lowest HP% teammate by 130."},
    {t:"heal", n:"Crisis Mend",     ic:"🚑", v:0,   shield:30, c:1, skill:"Heal lowest HP% ally by 150 if they're below 30% HP."},
    {t:"heal", n:"Barrier Mend",    ic:"💗", v:0,   shield:40, c:1, skill:"Heal this resonator by 50% of shield gained this round."},
    {t:"heal", n:"Mending Surge",   ic:"🌟", v:20,  shield:20, c:1, skill:"Heal 210% of this card's damage to the lowest HP% teammate."},
  ],
};

// ── ELEMENT + ROLE POOLS ────────────────────────────────────
// Bonus cards exclusive to each element + role combination
const EL_ROLE_POOL = {

  // ── HAVOC ──
  "Havoc-dps": [
    {t:"attack", n:"Void Fury",       ic:"🌑", v:100, shield:20, c:1, skill:"Deal 120% damage if this resonator's HP is below 50%. Prioritize highest ATK enemy."},
    {t:"buff", n:"Dark Affliction", ic:"💢", v:50,  shield:10, c:1, skill:"Attack twice if this resonator has a debuff. Havoc resonance."},
    {t:"buff", n:"Curse Exploit",   ic:"🎃", v:90,  shield:40, c:1, skill:"Deal 130% damage if the target is debuffed."},
  ],
  "Havoc-subdps": [
    {t:"buff", n:"Curse Transfer",  ic:"☠️", v:110, shield:30, c:1, skill:"Transfer all debuffs of this resonator to the target."},
    {t:"attack", n:"Void Siphon",     ic:"🌑", v:50,  shield:20, c:1, skill:"Steal 1 energy from the enemy when paired with a variety card."},
    {t:"attack", n:"Chaos Draw",      ic:"🎲", v:50,  shield:40, c:1, skill:"Randomly discard an enemy card when comboed by 2 cards this round."},
  ],
  "Havoc-support": [
    {t:"attack", n:"Thorned Mirror",  ic:"🌹", v:20,  shield:70, c:1, skill:"Reflect 30% damage taken if this resonator's HP is below 30%."},
    {t:"defend", n:"Shatter Surge",   ic:"⚡", v:100, shield:20, c:1, skill:"Deal 130% damage if this resonator's shield broke this round."},
    {t:"defend", n:"Guardian Taunt",  ic:"📣", v:30,  shield:60, c:1, skill:"Taunt the next round's attacks."},
  ],

  // ── ELECTRO ──
  "Electro-dps": [
    {t:"attack", n:"Triple Tempo",    ic:"⚡", v:35,  shield:30, c:1, skill:"Strike 3 times."},
    {t:"attack", n:"Combat Instinct", ic:"🗡️", v:110, shield:20, c:1, skill:"Guaranteed critical if this resonator attacked first."},
    {t:"attack", n:"Resonant Fury",   ic:"💥", v:100, shield:40, c:1, skill:"Deal 200% damage when hit by the same card in the same round."},
  ],
  "Electro-subdps": [
    {t:"attack", n:"Energy Sever",    ic:"⚡", v:85,  shield:35, c:1, skill:"Destroy 1 of your opponent's energy."},
    {t:"attack", n:"Energy Siphon",   ic:"🌀", v:90,  shield:20, c:1, skill:"Steal 1 energy from opponent's energy (if 0 energy, nothing will be stolen)."},
    {t:"attack", n:"Counter Seal",    ic:"🔐", v:60,  shield:60, c:1, skill:"When attacked by the enemy, their card next round is disabled."},
  ],
  "Electro-support": [
    {t:"buff", n:"Role Resonance",  ic:"🔮", v:20,  shield:30, c:1, skill:"Gain 1 energy when attacked by the same role."},
    {t:"defend", n:"Shield Break Charge",ic:"🔋",v:80,shield:50, c:1, skill:"Gain 1 energy if this resonator's shield breaks."},
    {t:"buff", n:"Affinity Charge", ic:"💫", v:20,  shield:20, c:0, skill:"Gain 1 energy when hit by 2 cards of the same attribute this round."},
  ],

  // ── GLACIO ──
  "Glacio-dps": [
    {t:"attack", n:"Last Stand",      ic:"💀", v:100, shield:25, c:1, skill:"Deal 150% damage if this resonator's HP is below 10%."},
    {t:"defend", n:"Void Strike",     ic:"🌑", v:110, shield:30, c:1, skill:"Apply lethal (true damage/ignore DEF) if this resonator's HP is below 30%."},
    {t:"defend", n:"Shield Shatter",  ic:"💥", v:100, shield:30, c:1, skill:"If this card breaks the target's shield, it deals 130% damage."},
  ],
  "Glacio-subdps": [
    {t:"attack", n:"Jamming Field",   ic:"📡", v:90,  shield:40, c:1, skill:"Disable 1 card of the enemy this round."},
    {t:"buff", n:"Status Nullify",  ic:"🚷", v:80,  shield:60, c:1, skill:"Disable the target's buff and debuff cards next round."},
    {t:"heal", n:"Mend Block",      ic:"🔒", v:10,  shield:20, c:0, skill:"Disable enemy heal card this round."},
  ],
  "Glacio-support": [
    {t:"defend", n:"Iron Veil",       ic:"🛡️", v:0,   shield:120,c:1, skill:"This resonator can't take critical damage this round."},
    {t:"defend", n:"Fortify",         ic:"🏰", v:70,  shield:50, c:1, skill:"Make this resonator's DEF next round doubled, only lasts 1 round."},
    {t:"defend", n:"Resonant Barrier",ic:"🌀", v:90,  shield:30, c:1, skill:"Double the shield gain next round if this resonator was attacked by the same attribute."},
  ],

  // ── FUSION ──
  "Fusion-dps": [
    {t:"buff", n:"Buff Breaker",    ic:"🔨", v:90,  shield:40, c:1, skill:"Deal 130% damage if the target is buffed."},
    {t:"attack", n:"Predator's Mark", ic:"🎯", v:100, shield:30, c:1, skill:"Targeting enemy with more than 80% HP increases this card's damage by 20%."},
    {t:"defend", n:"Sunder Guard",    ic:"🔱", v:110, shield:40, c:1, skill:"Deal 30% more damage to a shielded target."},
  ],
  "Fusion-subdps": [
    {t:"heal", n:"Anti-Mend",       ic:"🚫", v:30,  shield:40, c:1, skill:"Apply -40% heal debuff for this round and next round."},
    {t:"heal", n:"Wither",          ic:"🍂", v:100, shield:15, c:1, skill:"Target reduces incoming heal next round by 50%."},
    {t:"buff", n:"Resonance Crack", ic:"💢", v:0,   shield:20, c:0, skill:"Apply -20% damage debuff for this and next round."},
  ],
  "Fusion-support": [
    {t:"defend", n:"Tactical Bond",   ic:"🤝", v:80,  shield:40, c:1, skill:"Add 15% of this card's shield depending on teammates' DEF/ATK."},
    {t:"heal", n:"Barrier Mend",    ic:"💗", v:0,   shield:40, c:1, skill:"Heal this resonator by 50% of shield gained this round."},
    {t:"heal", n:"Mending Surge",   ic:"🌟", v:20,  shield:20, c:1, skill:"Heal 210% of this card's damage to the lowest HP% teammate."},
  ],

  // ── SPECTRO ──
  "Spectro-dps": [
    {t:"attack", n:"Sync Strike",     ic:"🌟", v:110, shield:30, c:1, skill:"Deal 120% damage if paired with a variety card this round."},
    {t:"attack", n:"Perfect Crit",    ic:"💎", v:100, shield:30, c:1, skill:"Guaranteed critical if executed with a variety card."},
    {t:"attack", n:"Delayed Verdict", ic:"⏳", v:90,  shield:30, c:1, skill:"Deal 140% damage of 1 card after 3 rounds."},
  ],
  "Spectro-subdps": [
    {t:"buff", n:"Attunement Strike",ic:"🎵",v:110, shield:35, c:1, skill:"Draw a card when attacking a resonator of the same attribute."},
    {t:"attack", n:"Mirror Fury",     ic:"🪞", v:50,  shield:30, c:1, skill:"Attack twice when attacked by the same attribute."},
    {t:"defend", n:"Taunt Breaker",   ic:"💪", v:100, shield:20, c:1, skill:"Deal 120% damage if this resonator is taunted."},
  ],
  "Spectro-support": [
    {t:"defend", n:"Barrier Hold",    ic:"🧲", v:40,  shield:50, c:1, skill:"Draw a card if this resonator's shield didn't break this round."},
    {t:"defend", n:"Barrier Surge",   ic:"🌊", v:70,  shield:30, c:1, skill:"Gain 30% more shield next round if hit by 2 cards this round while this card is active."},
    {t:"buff", n:"Over Dive",       ic:"🌊", v:80,  shield:30, c:1, skill:"Gain 1 energy when attacked with 50% HP."},
  ],

  // ── AERO ──
  "Aero-dps": [
    {t:"attack", n:"Last Breath",     ic:"🌬️", v:100, shield:30, c:1, skill:"Deal 150% damage if this resonator attacks last in this round."},
    {t:"attack", n:"Underdog",        ic:"⬆️", v:90,  shield:30, c:1, skill:"Deal 120% damage if this resonator's HP% is lower than the target's HP%."},
    {t:"buff", n:"Strike Advance",  ic:"💨", v:80,  shield:30, c:1, skill:"Draw a card if this resonator attacked first."},
  ],
  "Aero-subdps": [
    {t:"attack", n:"Disrupt",         ic:"✂️", v:65,  shield:20, c:1, skill:"Remove the first committed card the target has."},
    {t:"defend", n:"Armor Bypass",    ic:"💨", v:50,  shield:30, c:1, skill:"Skip the highest DEF stat target."},
    {t:"buff", n:"Grudge Bloom",    ic:"🌹", v:100, shield:40, c:1, skill:"Deal 120% damage if debuffed last round."},
  ],
  "Aero-support": [
    {t:"defend", n:"Damage Veil",     ic:"🌫️", v:40,  shield:20, c:1, skill:"Reduce damage taken by 20% this round."},
    {t:"heal", n:"Crisis Mend",     ic:"🚑", v:0,   shield:30, c:1, skill:"Heal lowest HP% ally by 150 if they're below 30% HP."},
    {t:"heal", n:"Mending Touch",   ic:"💚", v:0,   shield:40, c:1, skill:"Heal the lowest HP% teammate by 130."},
  ],
};

// ─────────────────────────────────────────────────────────────
// weightedPick(weightedPools, n)
// Picks n unique cards from weighted pools.
// weightedPools: [{cards:[], weight:0-100}, ...]  weights sum to 100.
// Each draw rolls a random number and selects a pool by weight,
// then picks a random card from that pool not already chosen.
// Falls back to any remaining card if the rolled pool is exhausted.
// ─────────────────────────────────────────────────────────────
function weightedPick(weightedPools, n) {
  const chosen = [];
  const usedNames = new Set();
  // Flatten all available cards with their pool weight for fallback
  const allCards = weightedPools.flatMap(wp => wp.cards);

  for (let i = 0; i < n; i++) {
    // Try weighted pick up to 10 times before falling back
    let picked = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const roll = Math.random() * 100;
      let cumulative = 0;
      let pool = null;
      for (const wp of weightedPools) {
        cumulative += wp.weight;
        if (roll < cumulative) { pool = wp.cards; break; }
      }
      if (!pool) pool = weightedPools[weightedPools.length - 1].cards;
      const available = pool.filter(c => !usedNames.has(c.n));
      if (available.length) {
        picked = available[Math.floor(Math.random() * available.length)];
        break;
      }
    }
    // Absolute fallback: any card not yet chosen
    if (!picked) {
      const remaining = allCards.filter(c => !usedNames.has(c.n));
      if (!remaining.length) break;
      picked = remaining[Math.floor(Math.random() * remaining.length)];
    }
    usedNames.add(picked.n);
    chosen.push({...picked});
  }
  return chosen;
}

// ─────────────────────────────────────────────────────────────
// pickLockedCards(resonator)
// Picks exactly 3 unique skill cards at battle start.
// Cards are locked for the entire match — never redrawn.
// Weights per role:
//   DPS:     55% own-role, 25% el+role, 15% subdps, 5% support
//   SubDPS:  55% own-role, 25% el+role, 15% dps,    5% support
//   Support: 65% own-role, 25% el+role, 8%  subdps, 2% dps
// ─────────────────────────────────────────────────────────────
function pickLockedCards(resonator) {
  const { el, role } = resonator;
  const elRoleKey = `${el}-${role}`;
  const ownRole   = ROLE_POOL[role] || [];
  const elRole    = EL_ROLE_POOL[elRoleKey] || [];

  let weightedPools;
  if (role === 'dps') {
    weightedPools = [
      { weight: 55, cards: ownRole },
      { weight: 20, cards: elRole },
      { weight: 10, cards: ALL_ROLE_POOL },
      { weight: 10, cards: ROLE_POOL.subdps },
      { weight:  5, cards: ROLE_POOL.support },
    ];
  } else if (role === 'subdps') {
    weightedPools = [
      { weight: 55, cards: ownRole },
      { weight: 20, cards: elRole },
      { weight: 10, cards: ALL_ROLE_POOL },
      { weight: 10, cards: ROLE_POOL.dps },
      { weight:  5, cards: ROLE_POOL.support },
    ];
  } else { // support
    weightedPools = [
      { weight: 65, cards: ownRole },
      { weight: 15, cards: elRole },
      { weight: 10, cards: ALL_ROLE_POOL },
      { weight:  8, cards: ROLE_POOL.subdps },
      { weight:  2, cards: ROLE_POOL.dps },
    ];
  }

  return weightedPick(weightedPools, 3);
}

// ─────────────────────────────────────────────────────────────
// buildTeamDeck(fighters)
// Each fighter's 3 locked cards go into the shared deck,
// tagged with ownerId/ownerName. Variety card added once each.
// Deck is shuffled before returning.
// ─────────────────────────────────────────────────────────────
function buildTeamDeck(fighters) {
  const deck = [];
  for (const f of fighters) {
    // f.lockedCards set during makeFighter; use them directly
    for (const card of (f.lockedCards || [])) {
      deck.push({ ...card, ownerId: f.id, ownerName: f.name,
        hid: 'h' + Math.random().toString(36).slice(2) });
    }
    const variety = CHAR_CARDS[f.name];
    if (variety) {
      deck.push({ ...variety, variety: true, ownerId: f.id, ownerName: f.name,
        hid: 'h' + Math.random().toString(36).slice(2) });
    }
  }
  return shuf(deck);
}

// ─────────────────────────────────────────────────────────────
// drawFromDeck(deck, hand, n)
// Moves up to n cards from deck → hand, capped so hand ≤ 9.
// ─────────────────────────────────────────────────────────────
function drawFromDeck(deck, hand, n) {
  const toDraw = Math.min(n, Math.max(0, 9 - hand.length), deck.length);
  for (let i = 0; i < toDraw; i++) {
    const card = deck.shift();
    card.hid = 'h' + Math.random().toString(36).slice(2);
    hand.push(card);
  }
}

// ═══════════════════════════════════════════════════════════
// RESONATOR ROSTER
// ═══════════════════════════════════════════════════════════
const RESONATORS=[
  {name:"Rover (Spectro)", el:"Spectro", role:"support", emoji:"🌟", weapon:"Sword"},
  {name:"Rover (Havoc)",   el:"Havoc",   role:"dps",     emoji:"💜", weapon:"Sword"},
  {name:"Jiyan",           el:"Aero",    role:"dps",     emoji:"🌪️", weapon:"Broadblade"},
  {name:"Calcharo",        el:"Electro", role:"dps",     emoji:"⚡", weapon:"Sword"},
  {name:"Encore",          el:"Fusion",  role:"dps",     emoji:"🔥", weapon:"Rectifier"},
  {name:"Jianxin",         el:"Aero",    role:"subdps",  emoji:"🌬️", weapon:"Gauntlets"},
  {name:"Lingyang",        el:"Glacio",  role:"dps",     emoji:"❄️", weapon:"Gauntlets"},
  {name:"Verina",          el:"Spectro", role:"support", emoji:"✨", weapon:"Rectifier"},
  {name:"Aalto",           el:"Aero",    role:"subdps",  emoji:"🍃", weapon:"Pistol"},
  {name:"Baizhi",          el:"Glacio",  role:"support", emoji:"🌿", weapon:"Rectifier"},
  {name:"Chixia",          el:"Fusion",  role:"dps",     emoji:"🔫", weapon:"Pistol"},
  {name:"Danjin",          el:"Havoc",   role:"subdps",  emoji:"🗡️", weapon:"Sword"},
  {name:"Mortefi",         el:"Fusion",  role:"subdps",  emoji:"🎯", weapon:"Pistol"},
  {name:"Sanhua",          el:"Glacio",  role:"subdps",  emoji:"🌨️", weapon:"Sword"},
  {name:"Taoqi",           el:"Havoc",   role:"support", emoji:"🛡️", weapon:"Broadblade"},
  {name:"Yangyang",        el:"Aero",    role:"subdps",  emoji:"🎐", weapon:"Sword"},
  {name:"Yuanwu",          el:"Electro", role:"support", emoji:"🥊", weapon:"Broadblade"},
  {name:"Jinhsi",          el:"Spectro", role:"dps",     emoji:"💫", weapon:"Broadblade"},
  {name:"Changli",         el:"Fusion",  role:"subdps",  emoji:"🌋", weapon:"Sword"},
  {name:"Xiangli Yao",     el:"Electro", role:"dps",     emoji:"⚖️", weapon:"Gauntlets"},
  {name:"Zhezhi",          el:"Glacio",  role:"subdps",  emoji:"🧊", weapon:"Rectifier"},
  {name:"Shorekeeper",     el:"Spectro", role:"support", emoji:"🌊", weapon:"Rectifier"},
  {name:"Youhu",           el:"Glacio",  role:"support", emoji:"🦊", weapon:"Sword"},
  {name:"Camellya",        el:"Havoc",   role:"dps",     emoji:"🌸", weapon:"Sword"},
  {name:"Lumi",            el:"Electro", role:"subdps",  emoji:"💡", weapon:"Rectifier"},
  {name:"Carlotta",        el:"Glacio",  role:"dps",     emoji:"🔮", weapon:"Pistol"},
  {name:"Roccia",          el:"Havoc",   role:"subdps",  emoji:"🪨", weapon:"Gauntlets"},
  {name:"Phoebe",          el:"Spectro", role:"subdps",  emoji:"🌙", weapon:"Rectifier"},
  {name:"Brant",           el:"Havoc",   role:"support", emoji:"💀", weapon:"Sword"},
  {name:"Cantarella",      el:"Havoc",   role:"support", emoji:"🎭", weapon:"Sword"},
  {name:"Rover (Aero)",    el:"Aero",    role:"support", emoji:"🌬️", weapon:"Sword"},
  {name:"Zani",            el:"Spectro", role:"dps",     emoji:"👊", weapon:"Gauntlets"},
  {name:"Ciaccona",        el:"Aero",    role:"subdps",  emoji:"🎵", weapon:"Rectifier"},
  {name:"Cartethyia",      el:"Aero",    role:"dps",     emoji:"🌺", weapon:"Broadblade"},
  {name:"Lupa",            el:"Fusion",  role:"dps",     emoji:"🐺", weapon:"Broadblade"},
  {name:"Phrolova",        el:"Havoc",   role:"dps",     emoji:"🦅", weapon:"Broadblade"},
  {name:"Augusta",         el:"Electro", role:"dps",     emoji:"👑", weapon:"Broadblade"},
  {name:"Iuno",            el:"Aero",    role:"subdps",  emoji:"🎪", weapon:"Pistol"},
  {name:"Galbrena",        el:"Fusion",  role:"dps",     emoji:"⚔️", weapon:"Broadblade"},
  {name:"Qiuyuan",         el:"Aero",    role:"subdps",  emoji:"🍂", weapon:"Sword"},
  {name:"Chisa",           el:"Havoc",   role:"support", emoji:"🌀", weapon:"Sword"},
  {name:"Buling",          el:"Electro", role:"support", emoji:"⚡", weapon:"Rectifier"},
  {name:"Lynae",           el:"Spectro", role:"subdps",  emoji:"🌿", weapon:"Sword"},
  {name:"Mornye",          el:"Fusion",  role:"support", emoji:"🌾", weapon:"Rectifier"},
  {name:"Aemeath",         el:"Fusion",  role:"dps",     emoji:"🔱", weapon:"Sword"},
  {name:"Luuk Herssen",    el:"Spectro", role:"dps",     emoji:"🗡️", weapon:"Broadblade"},
];

// ═══════════════════════════════════════════════════════════
// CHAR_CARDS — Variety cards only (one per resonator)
// These are fixed in hand slot 4 every round, never drawn
// ═══════════════════════════════════════════════════════════
const CHAR_CARDS={
  "Rover (Spectro)": {t:"buff", n:"Star Fragment",       ic:"🌠", v:0,  shield:0,  c:1, variety:true, vfx:"buff_allallies"},
  "Rover (Havoc)":   {t:"attack", n:"Void Devour",         ic:"🌑", v:72, shield:0,  c:1, variety:true, vfx:"consume_buff"},
  "Jiyan":           {t:"attack", n:"Dragon Spiral",        ic:"🐉", v:76, shield:0,  c:1, variety:true, vfx:"self_shield_40"},
  "Calcharo":        {t:"attack", n:"Death Sentence",       ic:"💀", v:80, shield:0,  c:1, variety:true, vfx:"execute_25"},
  "Encore":          {t:"attack", n:"Woolly Inferno",       ic:"🐑", v:75, shield:0,  c:1, variety:true, vfx:"burn_dot_20"},
  "Jianxin":         {t:"buff", n:"Qi Absorption",        ic:"🌬️", v:0,  shield:0,  c:1, variety:true, vfx:"heal_self_30"},
  "Lingyang":        {t:"attack", n:"Mythical Pounce",      ic:"🦁", v:58, shield:0,  c:1, variety:true, vfx:"none"},
  "Verina":          {t:"heal", n:"Verdant Overgrowth",   ic:"🌺", v:90, shield:0,  c:1, variety:true, vfx:"shield_all_40"},
  "Aalto":           {t:"defend", n:"Vanishing Act",        ic:"🌫️", v:0,  shield:0,  c:1, variety:true, vfx:"untargetable"},
  "Baizhi":          {t:"heal", n:"Glacial Blossom",      ic:"🌸", v:75, shield:0,  c:1, variety:true, vfx:"shield_lowest_50"},
  "Chixia":          {t:"attack", n:"Burst Fire",           ic:"🔫", v:60, shield:0,  c:1, variety:true, vfx:"double_hit_50"},
  "Danjin":          {t:"attack", n:"Life Drain",           ic:"🩸", v:62, shield:0,  c:1, variety:true, vfx:"lifesteal_40"},
  "Mortefi":         {t:"defend", n:"Detonation Mark",      ic:"💣", v:0,  shield:0,  c:1, variety:true, vfx:"delayed_debuff"},
  "Sanhua":          {t:"attack", n:"Zero Point",           ic:"🌡️", v:70, shield:0,  c:1, variety:true, vfx:"bonus_debuffed_30"},
  "Taoqi":           {t:"defend", n:"Iron Fortress",        ic:"🏯", v:0,  shield:0,  c:1, variety:true, vfx:"shield_all_split"},
  "Yangyang":        {t:"attack", n:"Gale Cry",             ic:"🪶", v:52, shield:0,  c:1, variety:true, vfx:"target_lowest_hp"},
  "Yuanwu":          {t:"defend", n:"Thunderclap Aura",     ic:"⚡", v:0,  shield:0,  c:1, variety:true, vfx:"shield_mini_all_25"},
  "Jinhsi":          {t:"attack", n:"Incandescent Mark",    ic:"☀️", v:78, shield:0,  c:1, variety:true, vfx:"mark_plus15_dmg"},
  "Changli":         {t:"attack", n:"Truthseeker Flame",    ic:"🔱", v:72, shield:0,  c:1, variety:true, vfx:"bonus_buffed_25pct"},
  "Xiangli Yao":     {t:"attack", n:"Final Verdict",        ic:"⚖️", v:85, shield:0,  c:1, variety:true, vfx:"bonus_shield_20pct"},
  "Zhezhi":          {t:"attack", n:"Living Canvas",        ic:"🖼️", v:70, shield:0,  c:1, variety:true, vfx:"copy_buff"},
  "Shorekeeper":     {t:"defend", n:"Tidal Embrace",        ic:"🌊", v:0,  shield:0,  c:1, variety:true, vfx:"full_team_shield_30"},
  "Youhu":           {t:"defend", n:"Lucky Draw",           ic:"🦊", v:0,  shield:0,  c:1, variety:true, vfx:"random_buff_team"},
  "Camellya":        {t:"attack", n:"Petal Storm",          ic:"🌸", v:68, shield:0,  c:1, variety:true, vfx:"burn_dot_30"},
  "Lumi":            {t:"attack", n:"Overload Burst",       ic:"💡", v:65, shield:0,  c:1, variety:true, vfx:"chain_electro_25"},
  "Carlotta":        {t:"attack", n:"Glass Coffin",         ic:"💎", v:82, shield:0,  c:1, variety:true, vfx:"refund_on_kill"},
  "Roccia":          {t:"defend", n:"Tectonic Shatter",     ic:"🪨", v:0,  shield:0,  c:1, variety:true, vfx:"shatter_highdef_15"},
  "Phoebe":          {t:"attack", n:"Crescent Omen",        ic:"🌙", v:70, shield:0,  c:1, variety:true, vfx:"target_highest_hp"},
  "Brant":           {t:"defend", n:"Death's Bargain",      ic:"💀", v:0,  shield:0,  c:1, variety:true, vfx:"buff_lowest_hp_ally"},
  "Cantarella":      {t:"defend", n:"Masquerade Poison",    ic:"🎭", v:0,  shield:0,  c:1, variety:true, vfx:"target_lowest_hppct"},
  "Rover (Aero)":    {t:"defend", n:"Tailwind Blessing",    ic:"🌬️", v:0,  shield:0,  c:1, variety:true, vfx:"buff_allallies"},
  "Zani":            {t:"defend", n:"Ghost Step",           ic:"👻", v:0,  shield:0,  c:1, variety:true, vfx:"ignore_shield"},
  "Ciaccona":        {t:"defend", n:"Resonant Frequency",   ic:"🎵", v:0,  shield:0,  c:1, variety:true, vfx:"remove_top_card"},
  "Cartethyia":      {t:"attack", n:"Petal Tempest",        ic:"🌺", v:72, shield:0,  c:1, variety:true, vfx:"splash_second_40pct"},
  "Lupa":            {t:"defend", n:"Pack Frenzy",          ic:"🐺", v:0,  shield:0,  c:1, variety:true, vfx:"buff_top2_atk"},
  "Phrolova":        {t:"attack", n:"Apex Predator",        ic:"🦅", v:80, shield:0,  c:1, variety:true, vfx:"target_highest_atk"},
  "Augusta":         {t:"defend", n:"Sovereign Decree",     ic:"👑", v:0,  shield:0,  c:1, variety:true, vfx:"debuff_all_enemies"},
  "Iuno":            {t:"attack", n:"Aerial Ambush",        ic:"🎪", v:66, shield:0,  c:1, variety:true, vfx:"target_lowest_def"},
  "Galbrena":        {t:"attack", n:"Battle Veteran",       ic:"⚔️", v:60, shield:0,  c:1, variety:true, vfx:"scale_hp_pct"},
  "Qiuyuan":         {t:"defend", n:"Autumn Reckoning",     ic:"🌾", v:0,  shield:0,  c:1, variety:true, vfx:"stacking_buff"},
  "Chisa":           {t:"defend", n:"Null Vortex",          ic:"🌀", v:0,  shield:0,  c:1, variety:true, vfx:"reduce_next_hit_20"},
  "Buling":          {t:"attack", n:"Overcharge Field",     ic:"⚡", v:68, shield:0,  c:1, variety:true, vfx:"restore_1_energy"},
  "Lynae":           {t:"attack", n:"Nature's Wrath",       ic:"🌿", v:68, shield:0,  c:1, variety:true, vfx:"bonus_def_scaling"},
  "Mornye":          {t:"attack", n:"Abundant Harvest",     ic:"🌾", v:65, shield:0,  c:1, variety:true, vfx:"heal_two_lowest"},
  "Aemeath":         {t:"attack", n:"Divine Immolation",    ic:"✝️", v:90, shield:0,  c:1, variety:true, vfx:"self_damage_20"},
  "Luuk Herssen":    {t:"attack", n:"Spectral Execution",   ic:"💀", v:85, shield:0,  c:1, variety:true, vfx:"execute_30"},
};
