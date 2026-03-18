export const BEE_TYPES = {
  worker:    { id:'worker',    name:'Worker Bee', desc:'Reliable all-rounder.',  speed:150, farmMs:2000, honey:1, textureKey:'bee-worker',    bodyColor:0xf5c800, stripeColor:0x1a0800, nameColor:'#ffdd44' },
  scout:     { id:'scout',     name:'Scout Bee',  desc:'Fast, same yield.',      speed:260, farmMs:2000, honey:1, textureKey:'bee-scout',     bodyColor:0x55aaff, stripeColor:0x002266, nameColor:'#88ddff' },
  harvester: { id:'harvester', name:'Harvester',  desc:'Slow, +2 honey/trip.',   speed:90,  farmMs:1800, honey:2, textureKey:'bee-harvester', bodyColor:0xff8800, stripeColor:0x331100, nameColor:'#ffaa44' },
};
