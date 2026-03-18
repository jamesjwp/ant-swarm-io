// BSS-style quests given by bear NPCs.
// Each quest has:
//   id, desc, icon, progress(gs), check(gs), reward: { tickets?, sprouts? }
export const BEAR_QUESTS = [
  {
    id: 'bear_honey_25',
    desc: 'Collect 25 honey',
    icon: '🍯',
    progress: gs => `${Math.min(gs.totalHoney, 25)}/25`,
    check:    gs => gs.totalHoney >= 25,
    reward:   { tickets: 3, sprouts: 1 },
  },
  {
    id: 'bear_cash_50',
    desc: 'Earn 50 cash',
    icon: '💰',
    progress: gs => `${Math.min(gs.totalCash, 50)}/50`,
    check:    gs => gs.totalCash >= 50,
    reward:   { tickets: 5 },
  },
  {
    id: 'bear_bees_3',
    desc: 'Own 3 bees',
    icon: '🐝',
    progress: gs => `${gs.ownedBees.length}/3`,
    check:    gs => gs.ownedBees.length >= 3,
    reward:   { tickets: 4 },
  },
  {
    id: 'bear_clover',
    desc: 'Visit the Clover Field',
    icon: '🍀',
    progress: gs => gs._namedZone?.name === 'Clover Field' || gs.totalHoney >= 80 ? '1/1' : '0/1',
    check:    gs => gs.totalHoney >= 80,
    reward:   { tickets: 8, sprouts: 2 },
  },
  {
    id: 'bear_level_3',
    desc: 'Reach level 3',
    icon: '⭐',
    progress: gs => `Lv. ${gs.level}/3`,
    check:    gs => gs.level >= 3,
    reward:   { tickets: 12 },
  },
  {
    id: 'bear_honey_500',
    desc: 'Collect 500 honey total',
    icon: '🍯',
    progress: gs => `${Math.min(gs.totalHoney, 500)}/500`,
    check:    gs => gs.totalHoney >= 500,
    reward:   { tickets: 30, sprouts: 3 },
  },
  {
    id: 'bear_golden_bee',
    desc: 'Hatch a Golden Bee',
    icon: '✨',
    progress: gs => gs.ownedBees.some(b => b.type.id === 'golden') ? '1/1' : '0/1',
    check:    gs => gs.ownedBees.some(b => b.type.id === 'golden'),
    reward:   { tickets: 50, sprouts: 5 },
  },
];

// Quests given by the Brown Bear NPC (mid-field, focuses on honey volume, streaks, and bees).
export const BROWN_BEAR_QUESTS = [
  {
    id: 'bb_honey_100',
    desc: 'Collect 100 honey total',
    icon: '🍯',
    progress: gs => `${Math.min(gs.totalHoney, 100)}/100`,
    check:    gs => gs.totalHoney >= 100,
    reward:   { tickets: 8, sprouts: 1 },
  },
  {
    id: 'bb_bees_8',
    desc: 'Own 8 bees',
    icon: '🐝',
    progress: gs => `${gs.ownedBees.length}/8`,
    check:    gs => gs.ownedBees.length >= 8,
    reward:   { tickets: 12 },
  },
  {
    id: 'bb_cash_300',
    desc: 'Earn 300 cash total',
    icon: '💰',
    progress: gs => `${Math.min(gs.totalCash, 300)}/300`,
    check:    gs => gs.totalCash >= 300,
    reward:   { tickets: 15 },
  },
  {
    id: 'bb_streak_20',
    desc: 'Reach a ×2.0 honey streak',
    icon: '🔥',
    progress: gs => `×${(gs.comboMult ?? 1).toFixed(1)}/×2.0`,
    check:    gs => (gs.comboMult ?? 1) >= 2.0,
    reward:   { tickets: 20, sprouts: 2 },
  },
  {
    id: 'bb_weather_5',
    desc: 'Survive 5 weather events',
    icon: '⛅',
    progress: gs => `${Math.min(gs._weatherCount ?? 0, 5)}/5`,
    check:    gs => (gs._weatherCount ?? 0) >= 5,
    reward:   { tickets: 25 },
  },
  {
    id: 'bb_honey_1500',
    desc: 'Collect 1,500 honey total',
    icon: '🏆',
    progress: gs => `${Math.min(gs.totalHoney, 1500)}/1500`,
    check:    gs => gs.totalHoney >= 1500,
    reward:   { tickets: 40, sprouts: 4 },
  },
];

// Quests given by the Spirit Bear NPC (deep north, late-game with big rewards including consumables).
export const SPIRIT_BEAR_QUESTS = [
  {
    id: 'sb_gifted_bee',
    desc: 'Hatch a Gifted bee',
    icon: '✨',
    progress: gs => gs.ownedBees.some(b => b.gifted) ? '1/1' : '0/1',
    check:    gs => gs.ownedBees.some(b => b.gifted),
    reward:   { tickets: 30, starTreats: 1 },
  },
  {
    id: 'sb_honey_5000',
    desc: 'Collect 5,000 honey total',
    icon: '🍯',
    progress: gs => `${Math.min(gs.totalHoney, 5000)}/5000`,
    check:    gs => gs.totalHoney >= 5000,
    reward:   { tickets: 60, royalJellies: 1 },
  },
  {
    id: 'sb_bond_max',
    desc: 'Max bond a bee to Lv. 5',
    icon: '🤝',
    progress: gs => gs.ownedBees.some(b => (b.bond ?? 0) >= 500) ? '1/1' : '0/1',
    check:    gs => gs.ownedBees.some(b => (b.bond ?? 0) >= 500),
    reward:   { tickets: 50, starTreats: 2 },
  },
  {
    id: 'sb_all_zones',
    desc: 'Explore all 6 field zones',
    icon: '🗺',
    progress: gs => `${gs._visitedZones?.size ?? 0}/6`,
    check:    gs => (gs._visitedZones?.size ?? 0) >= 6,
    reward:   { tickets: 40, royalJellies: 1 },
  },
  {
    id: 'sb_level_12',
    desc: 'Reach level 12',
    icon: '🌟',
    progress: gs => `Lv. ${gs.level}/12`,
    check:    gs => gs.level >= 12,
    reward:   { tickets: 80, starTreats: 3 },
  },
];

// Quests given by the Mother Bear NPC (mid-zone, slightly harder than Black Bear's intro quests).
export const MOTHER_BEAR_QUESTS = [
  {
    id: 'mb_honey_200',
    desc: 'Collect 200 honey total',
    icon: '🍯',
    progress: gs => `${Math.min(gs.totalHoney, 200)}/200`,
    check:    gs => gs.totalHoney >= 200,
    reward:   { tickets: 10, sprouts: 2 },
  },
  {
    id: 'mb_cash_150',
    desc: 'Earn 150 cash',
    icon: '💰',
    progress: gs => `${Math.min(gs.totalCash, 150)}/150`,
    check:    gs => gs.totalCash >= 150,
    reward:   { tickets: 8 },
  },
  {
    id: 'mb_bees_5',
    desc: 'Own 5 bees',
    icon: '🐝',
    progress: gs => `${gs.ownedBees.length}/5`,
    check:    gs => gs.ownedBees.length >= 5,
    reward:   { tickets: 10, sprouts: 1 },
  },
  {
    id: 'mb_level_5',
    desc: 'Reach level 5',
    icon: '⭐',
    progress: gs => `Lv. ${gs.level}/5`,
    check:    gs => gs.level >= 5,
    reward:   { tickets: 20 },
  },
  {
    id: 'mb_bond_bee',
    desc: 'Bond a bee to level 2',
    icon: '🤝',
    progress: gs => gs.ownedBees.some(b => (b.bond ?? 0) >= 200) ? '1/1' : '0/1',
    check:    gs => gs.ownedBees.some(b => (b.bond ?? 0) >= 200),
    reward:   { tickets: 15, sprouts: 2 },
  },
  {
    id: 'mb_honey_1000',
    desc: 'Collect 1000 honey total',
    icon: '🍯',
    progress: gs => `${Math.min(gs.totalHoney, 1000)}/1000`,
    check:    gs => gs.totalHoney >= 1000,
    reward:   { tickets: 40, sprouts: 4 },
  },
];
