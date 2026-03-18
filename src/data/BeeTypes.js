// Stat reference:
//   speed    — movement speed (px/s)
//   farmMs   — time to harvest a field (ms); lower = faster
//   honey    — honey deposited per trip
//   xpMult   — XP multiplier applied to honey earned
//   rarity   — weighted probability for random recruitment (higher = more common)
//   rarityLabel — display label shown on recruit

export const BEE_TYPES = {
  worker: {
    id: 'worker', name: 'Worker Bee', desc: 'Reliable all-rounder.',
    speed: 150, farmMs: 2000, honey: 1, xpMult: 1.0,
    textureKey: 'bee-worker', bodyColor: 0xf5c800, stripeColor: 0x1a0800, nameColor: '#ffdd44',
    rarity: 90, rarityLabel: 'Common',
    ability: 'tireless', abilityDesc: 'Tireless: no deposit delay',
  },
  scout: {
    id: 'scout', name: 'Scout Bee', desc: 'Very fast, same yield.',
    speed: 280, farmMs: 2000, honey: 1, xpMult: 1.0,
    textureKey: 'bee-scout', bodyColor: 0x55aaff, stripeColor: 0x002266, nameColor: '#88ddff',
    rarity: 5, rarityLabel: 'Uncommon',
    ability: 'marker', abilityDesc: 'Field Marker: +1 honey on marked fields',
  },
  harvester: {
    id: 'harvester', name: 'Harvester', desc: 'Slow but collects 2× honey.',
    speed: 90, farmMs: 1800, honey: 2, xpMult: 1.0,
    textureKey: 'bee-harvester', bodyColor: 0xff8800, stripeColor: 0x331100, nameColor: '#ffaa44',
    rarity: 3, rarityLabel: 'Uncommon',
    ability: 'gentle', abilityDesc: 'Gentle Harvest: 50% chance field preserved',
  },
  scholar: {
    id: 'scholar', name: 'Scholar Bee', desc: 'Earns 2× XP per trip.',
    speed: 140, farmMs: 2200, honey: 1, xpMult: 2.0,
    textureKey: 'bee-scholar', bodyColor: 0xaa55ff, stripeColor: 0x220044, nameColor: '#cc88ff',
    rarity: 1.5, rarityLabel: 'Rare',
    ability: 'scholar', abilityDesc: 'Knowledge Drop: +3 XP orb on deposit',
  },
  golden: {
    id: 'golden', name: 'Golden Bee', desc: 'Collects 3× honey, 1.5× XP.',
    speed: 120, farmMs: 2500, honey: 3, xpMult: 1.5,
    textureKey: 'bee-golden', bodyColor: 0xffd700, stripeColor: 0xff4400, nameColor: '#ffd700',
    rarity: 0.5, rarityLabel: 'Legendary',
    ability: 'fortune', abilityDesc: 'Fortune: 25% chance 2× honey',
  },
};

// Weighted random selection based on rarity values.
// To adjust probability, change the rarity field on each type.
export function getRandomBeeType() {
  const types = Object.values(BEE_TYPES);
  const total = types.reduce((sum, t) => sum + t.rarity, 0);
  let roll = Math.random() * total;
  for (const type of types) {
    roll -= type.rarity;
    if (roll <= 0) return type;
  }
  return types[0];
}

// Egg-tier weighted pools.
//   basic  — common/uncommon bees (cheap egg)
//   silver — uncommon/rare bees (mid egg)
//   gold   — rare/legendary bees (premium egg)
const EGG_POOLS = {
  basic:  [{ t: 'worker', w: 80 }, { t: 'scout', w: 15 }, { t: 'harvester', w: 5 }],
  silver: [{ t: 'scout', w: 30 }, { t: 'harvester', w: 40 }, { t: 'scholar', w: 25 }, { t: 'golden', w: 5 }],
  gold:   [{ t: 'harvester', w: 15 }, { t: 'scholar', w: 50 }, { t: 'golden', w: 35 }],
};

// Returns bond level 0–5 for a bee inventory entry.
// Each 100 bond XP = 1 level, capped at 5.
export function getBondLevel(entry) {
  return Math.min(5, Math.floor((entry?.bond ?? 0) / 100));
}

export function getEggBeeType(tier) {
  const pool  = EGG_POOLS[tier] ?? EGG_POOLS.basic;
  const total = pool.reduce((s, e) => s + e.w, 0);
  let roll    = Math.random() * total;
  for (const entry of pool) {
    roll -= entry.w;
    if (roll <= 0) return BEE_TYPES[entry.t];
  }
  return BEE_TYPES[pool[0].t];
}
