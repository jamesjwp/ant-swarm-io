// Zones ordered from nearest hive (high y) to farthest (low y).
// honeyMult multiplies raw bee honey on harvest.
// tint is applied to the flower-field sprite for each field in the zone.
// bgTint is the faint background band color drawn behind the fields.
export const FIELD_ZONES = [
  { name: 'Sunflower Field', icon: '🌻', minY: 2300, maxY: Infinity, honeyMult: 1,   tint: 0xfff176, bgTint: 0xf9a825 },
  { name: 'Dandelion Field', icon: '🌼', minY: 1800, maxY: 2300,     honeyMult: 1.5, tint: 0xffe082, bgTint: 0xf57f17 },
  { name: 'Clover Field',    icon: '🍀', minY: 1300, maxY: 1800,     honeyMult: 2,   tint: 0xa5d6a7, bgTint: 0x2e7d32 },
  { name: 'Strawberry Field',icon: '🍓', minY: 800,  maxY: 1300,     honeyMult: 3,   tint: 0xef9a9a, bgTint: 0xb71c1c },
  { name: 'Blueberry Field', icon: '🫐', minY: 350,  maxY: 800,      honeyMult: 4,   tint: 0xce93d8, bgTint: 0x4a148c },
  { name: 'Bamboo Field',    icon: '🎋', minY: 0,    maxY: 350,      honeyMult: 5,   tint: 0x80cbc4, bgTint: 0x004d40 },
];

export function getZoneForY(y) {
  return FIELD_ZONES.find(z => y >= z.minY && y < z.maxY) ?? FIELD_ZONES[0];
}
