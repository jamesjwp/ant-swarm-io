export const BADGES = [
  {
    id: 'first_honey', name: 'First Drops', desc: 'Collect your first honey',
    icon: '🍯', check: gs => gs.totalHoney >= 1,
    reward: { tickets: 1 },
  },
  {
    id: 'honey_100', name: 'Sweet Taster', desc: '100 honey collected',
    icon: '🍯', check: gs => gs.totalHoney >= 100,
    reward: { tickets: 3 },
  },
  {
    id: 'honey_500', name: 'Honey Lover', desc: '500 honey collected',
    icon: '🍯', check: gs => gs.totalHoney >= 500,
    reward: { tickets: 8 },
  },
  {
    id: 'honey_2500', name: 'Honey Baron', desc: '2,500 honey collected',
    icon: '🏆', check: gs => gs.totalHoney >= 2500,
    reward: { tickets: 20, storage: 20 },
  },
  {
    id: 'level_3', name: 'Apprentice', desc: 'Reach level 3',
    icon: '⭐', check: gs => gs.level >= 3,
    reward: { tickets: 4 },
  },
  {
    id: 'level_8', name: 'Journeyman', desc: 'Reach level 8',
    icon: '🌟', check: gs => gs.level >= 8,
    reward: { tickets: 12 },
  },
  {
    id: 'bees_8', name: 'Buzzing Hive', desc: 'Own 8 bees',
    icon: '🐝', check: gs => gs.ownedBees.length >= 8,
    reward: { tickets: 6 },
  },
  {
    id: 'streak_x15', name: 'On a Roll', desc: '×1.5 honey streak',
    icon: '🔥', check: gs => gs.comboMult >= 1.5,
    reward: { tickets: 5 },
  },
  {
    id: 'streak_x30', name: 'Blazing!', desc: '×3.0 honey streak',
    icon: '🌋', check: gs => gs.comboMult >= 2.9,
    reward: { tickets: 15, storage: 10 },
  },
  {
    id: 'golden_bee', name: 'Golden Touch', desc: 'Own a Golden bee',
    icon: '✨', check: gs => gs.ownedBees.some(b => b.type?.id === 'golden'),
    reward: { tickets: 10 },
  },
  {
    id: 'all_zones', name: 'World Traveler', desc: 'Explore all 6 field zones',
    icon: '🗺', check: gs => (gs._visitedZones?.size ?? 0) >= 6,
    reward: { tickets: 15, storage: 15 },
  },
  {
    id: 'storm_chaser', name: 'Storm Chaser', desc: 'Survive 3 weather events',
    icon: '⛈', check: gs => (gs._weatherCount ?? 0) >= 3,
    reward: { tickets: 8 },
  },
];
