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
];
