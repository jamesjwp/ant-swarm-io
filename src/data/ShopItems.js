// Each item needs:
//   id        — unique string key (must match gs.upgrades key)
//   icon      — emoji shown in shop
//   name      — display name
//   desc      — fn(level) → short description shown per level
//   getCost   — fn(currentLevel) → cash cost for next purchase
//   onBuy     — fn(gs) → applies the upgrade effect to GameScene

export const SHOP_ITEMS = [
  {
    id:      'storage_bag',
    icon:    '🎒',
    name:    'Storage Bag',
    desc:    level => `+10 honey capacity  (now ${10 + level * 10})`,
    getCost: level => Math.ceil(30 * Math.pow(2, level)),
    onBuy:   gs    => { gs.storageMax += 10; },
  },
  {
    id:      'boots',
    icon:    '👟',
    name:    'Swift Boots',
    desc:    level => `+10% player speed  (level ${level + 1})`,
    getCost: level => Math.ceil(50 * Math.pow(2, level)),
    onBuy:   gs    => {
      const body = gs.player.sprite.body;
      body.setMaxVelocity(body.maxVelocity.x + 30, body.maxVelocity.y + 30);
    },
  },
  {
    id:      'bee_speed',
    icon:    '💨',
    name:    'Bee Speed Boost',
    desc:    level => `All bees +15% speed  (level ${level + 1})`,
    getCost: level => Math.ceil(40 * Math.pow(2, level)),
    onBuy:   gs    => {
      gs.beeSpeedMult *= 1.15;
      for (const ant of gs.ants) ant.speed = Math.round(ant.beeType.speed * gs.beeSpeedMult);
    },
  },
  {
    id:      'farm_time',
    icon:    '⚡',
    name:    'Harvest Accelerator',
    desc:    level => `All bees farm 10% faster  (level ${level + 1})`,
    getCost: level => Math.ceil(60 * Math.pow(2, level)),
    onBuy:   gs    => {
      gs.farmTimeMult *= 0.9;
      for (const ant of gs.ants) ant.farmMs = Math.round(ant.beeType.farmMs * gs.farmTimeMult);
    },
  },
  {
    id:      'regen_speed',
    icon:    '🌱',
    name:    'Field Fertilizer',
    desc:    level => `Fields regen 20% faster  (level ${level + 1})`,
    getCost: level => Math.ceil(80 * Math.pow(2, level)),
    onBuy:   gs    => { gs.fieldRegenMult = (gs.fieldRegenMult ?? 1) * 0.8; },
  },
  {
    id:      'honey_value',
    icon:    '💰',
    name:    'Honey Multiplier',
    desc:    level => `+25% cash per cash-out  (level ${level + 1})`,
    getCost: level => Math.ceil(100 * Math.pow(2, level)),
    onBuy:   gs    => { gs.cashOutMult = Math.round(((gs.cashOutMult ?? 1) + 0.25) * 100) / 100; },
  },
  {
    id:      'hive_cap',
    icon:    '🏠',
    name:    'Hive Expansion',
    desc:    level => `+5 bee slots  (now ${40 + level * 5})`,
    getCost: level => Math.ceil(120 * Math.pow(2, level)),
    onBuy:   gs    => { gs.maxHiveCells += 5; },
  },
  {
    id:      'sprout_pack',
    icon:    '🌱',
    name:    'Sprout Pack',
    desc:    _level => 'Adds 3 sprouts  ·  press F near a field to plant  ·  2× yield for 5 harvests',
    getCost: _level => 35,
    onBuy:   gs    => { gs.sprouts = (gs.sprouts ?? 0) + 3; },
  },
  {
    id:      'egg_basic',
    icon:    '🥚',
    name:    'Basic Egg',
    desc:    _level => 'Hatch a bee!  Worker 80%  Scout 15%  Harvester 5%',
    getCost: _level => 8,
    onBuy:   gs    => gs._hatchEgg('basic'),
  },
  {
    id:      'egg_silver',
    icon:    '🪺',
    name:    'Silver Egg',
    desc:    _level => 'Uncommon bees  Scout 30%  Harvester 40%  Scholar 25%  Golden 5%',
    getCost: _level => 45,
    onBuy:   gs    => gs._hatchEgg('silver'),
  },
  {
    id:      'egg_gold',
    icon:    '🎁',
    name:    'Gold Egg',
    desc:    _level => 'Rare bees  Harvester 15%  Scholar 50%  Golden 35%',
    getCost: _level => 220,
    onBuy:   gs    => gs._hatchEgg('gold'),
  },
  {
    id:      'star_treat',
    icon:    '⭐',
    name:    'Star Treat',
    desc:    _level => 'Adds 1 Star Treat  ·  use on a bee in Inventory to boost its Bond by +50 XP',
    getCost: _level => 60,
    onBuy:   gs    => { gs.starTreats = (gs.starTreats ?? 0) + 1; },
  },
  {
    id:      'royal_jelly',
    icon:    '👑',
    name:    'Royal Jelly',
    desc:    _level => 'Adds 1 Royal Jelly  ·  use on a bee in Inventory to re-roll its type',
    getCost: _level => 120,
    onBuy:   gs    => { gs.royalJellies = (gs.royalJellies ?? 0) + 1; },
  },
];
