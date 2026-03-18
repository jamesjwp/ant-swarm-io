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
