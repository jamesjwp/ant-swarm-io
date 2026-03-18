import Phaser    from 'phaser';
import Player    from '../entities/Player';
import Ant       from '../entities/Ant';
import FoodField from '../entities/FoodField';
import HomeTile  from '../entities/HomeTile';
import Shop       from '../entities/Shop';
import Bear      from '../entities/Bear';
import Ladybug   from '../entities/Ladybug';
import { BEE_TYPES, getRandomBeeType, getEggBeeType, getBondLevel } from '../data/BeeTypes.js';
import { SHOP_ITEMS } from '../data/ShopItems.js';
import { FIELD_ZONES, getZoneForY } from '../data/FieldZones.js';
import { BEAR_QUESTS, MOTHER_BEAR_QUESTS } from '../data/BearQuests.js';

const WORLD_W   = 3200;
const WORLD_H   = 3200;
const VILLAGE_H = 400;
const PATH_W    = 120;

const BONUS_INTERVAL_MS = 45_000;
const BONUS_DURATION_MS = 60_000;
const BONUS_MULT        = 3;

const QUESTS = [
  { id: 'honey_50',   desc: 'Collect 50 honey',   icon: '🍯', check: gs => gs.totalHoney >= 50,        reward: 5  },
  { id: 'honey_200',  desc: 'Collect 200 honey',  icon: '🍯', check: gs => gs.totalHoney >= 200,       reward: 15 },
  { id: 'honey_500',  desc: 'Collect 500 honey',  icon: '🍯', check: gs => gs.totalHoney >= 500,       reward: 40 },
  { id: 'level_3',    desc: 'Reach level 3',       icon: '⭐', check: gs => gs.level >= 3,              reward: 10 },
  { id: 'level_5',    desc: 'Reach level 5',       icon: '⭐', check: gs => gs.level >= 5,              reward: 25 },
  { id: 'level_10',   desc: 'Reach level 10',      icon: '⭐', check: gs => gs.level >= 10,             reward: 60 },
  { id: 'bees_5',     desc: 'Own 5 bees',          icon: '🐝', check: gs => gs.ownedBees.length >= 5,  reward: 10 },
  { id: 'bees_10',    desc: 'Own 10 bees',         icon: '🐝', check: gs => gs.ownedBees.length >= 10, reward: 25 },
  { id: 'cash_100',   desc: 'Earn 100 cash',       icon: '💰', check: gs => gs.totalCash >= 100,       reward: 8  },
  { id: 'cash_500',   desc: 'Earn 500 cash',       icon: '💰', check: gs => gs.totalCash >= 500,       reward: 20 },
];

function spawnFloatText(scene, worldX, worldY, text, color = '#ffffff') {
  const t = scene.add.text(worldX, worldY, text, {
    fontSize: '13px', color, stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
  }).setOrigin(0.5, 1).setDepth(9999);
  scene.tweens.add({ targets: t, y: worldY - 44, alpha: 0, duration: 1100, ease: 'Quad.Out', onComplete: () => t.destroy() });
}

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  preload() {
    this.load.image('bee-south', 'assets/bee/rotations/south.png');
    for (const dir of ['north', 'south', 'east', 'west', 'north-east', 'south-east', 'south-west', 'north-west'])
      for (let i = 0; i < 6; i++)
        this.load.image(`player-walk-${dir}-${i}`, `assets/player/animations/walk/${dir}/frame_00${i}.png`);
    for (let i = 0; i < 4; i++)
      this.load.image(`player-idle-${i}`, `assets/player/animations/breathing-idle/south/frame_00${i}.png`);
    this.load.image('bear-npc-south',        'assets/npc/bear/south.png');
    this.load.image('mother-bear-npc-south', 'assets/npc/mother-bear/south.png');
    this.load.image('grass-bg',       'assets/tiles/grass-bg.png');
    this.load.image('flower-tiles',   'assets/tiles/flower-field.png');
    this.load.image('depleted-tiles', 'assets/tiles/depleted-field.png');
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this._generateTextures();
    this._createAnims();
    this._createGround();

    this.storage         = 0;
    this.storageMax      = 10;
    this.cash            = 0;
    this.tickets         = 0;
    this.totalHoney      = 0;
    this.totalCash       = 0;
    this._storageFullTimer = 0;
    this.upgrades        = Object.fromEntries(SHOP_ITEMS.map(i => [i.id, 0]));
    this.nextAntCost     = 5;
    this.maxHiveCells    = 40;
    this.currentZone     = null;
    this._namedZone      = null;   // current named field zone player is in
    this.sprouts         = 0;      // player's sprout inventory
    this.xp              = 0;
    this.xpMax           = 10;
    this.level           = 1;
    this.statPoints      = 0;
    this.ownedBees       = [];
    this.ants            = [];

    // Upgrade multipliers (applied to new bees and on purchase)
    this.beeSpeedMult   = 1.0;
    this.farmTimeMult   = 1.0;
    this.fieldRegenMult = 1.0;
    this.cashOutMult    = 1.0;

    // Quests
    this.quests = QUESTS.map(q => ({ ...q, done: false }));

    this.ladybugs         = [];
    this.bearQuests       = BEAR_QUESTS.map(q => ({ ...q, claimed: false }));
    this.motherBearQuests = MOTHER_BEAR_QUESTS.map(q => ({ ...q, claimed: false }));
    this._activeBear      = 'black';
    this.starTreats       = 0;
    this.royalJellies     = 0;

    this.player   = new Player(this, WORLD_W / 2, WORLD_H - VILLAGE_H / 2);
    this.homeTile = new HomeTile(this, WORLD_W / 2 - 160, WORLD_H - VILLAGE_H + 100);
    this.shop     = new Shop(this,    WORLD_W / 2 + 160,  WORLD_H - VILLAGE_H + 100);
    this.bear        = new Bear(this, WORLD_W / 2 + 480,  WORLD_H - VILLAGE_H + 110);
    this.motherBear  = new Bear(this, WORLD_W / 4,        WORLD_H - VILLAGE_H - 600, {
      label:      'Mother Bear',
      textureKey: 'mother-bear-npc-south',
      questsKey:  'motherBearQuests',
      bearId:     'mother',
    });
    this._createZone();

    this.eKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.fKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    const workerEntry = this._addToInventory(BEE_TYPES.worker);
    this._addToInventory(BEE_TYPES.scout);
    this._addToInventory(BEE_TYPES.harvester);
    this.equipBee(workerEntry);

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player.sprite, true, 1, 1);
    this.scene.launch('UIScene');

    this._startBonusSpawner();
    this._startLadybugSpawner();
  }

  update(_time, delta) {
    this.player.update();
    this._updateZone();
    for (const ant of this.ants) ant.update(delta);

    const nearHome        = this.homeTile.update(this.player.x, this.player.y);
    const nearShop        = this.shop.update(this.player.x, this.player.y);
    const nearBear        = this.bear.update(this.player.x, this.player.y);
    const nearMotherBear  = this.motherBear.update(this.player.x, this.player.y);
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (nearShop)            this._toggleShop();
      else if (nearBear)       { this._activeBear = 'black';  this._toggleBear(); }
      else if (nearMotherBear) { this._activeBear = 'mother'; this._toggleBear(); }
      else if (nearHome)       this._cashOut();
    }
    if (Phaser.Input.Keyboard.JustDown(this.fKey)) this._plantSprout();

    // Update ladybugs, remove destroyed ones
    this.ladybugs = this.ladybugs.filter(b => !b.destroyed);
    for (const bug of this.ladybugs) bug.update(this.player.x, this.player.y, delta);
    if (this._storageFullTimer > 0) this._storageFullTimer -= delta;

    this._checkQuests();
    this.scene.get('UIScene')?.refresh(this);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  addHoney(amount, xpMult = 1.0, worldX, worldY) {
    const added = Math.min(amount, this.storageMax - this.storage);
    if (added <= 0) {
      if (this._storageFullTimer <= 0) {
        spawnFloatText(this, this.player.x, this.player.y - 20, 'Honey storage is full!', '#ff4444');
        this._storageFullTimer = 5000;
      }
      return;
    }
    this.storage    += added;
    this.totalHoney += added;
    spawnFloatText(this, worldX, worldY, `+${added} 🍯`, '#ffdd44');
    this._addXp(Math.round(added * xpMult), worldX, worldY - 18);
  }

  tryBuyAnt() {
    if (this.cash < this.nextAntCost) return false;
    this.cash -= this.nextAntCost;
    this.nextAntCost = Math.ceil((this.nextAntCost + 5) * 1.4);
    const type  = getRandomBeeType();
    const entry = this._addToInventory(type);
    if (this.ownedBees.filter(b => b.ant).length < this.maxHiveCells) this.equipBee(entry);
    spawnFloatText(this, this.player.x, this.player.y - 40, `${type.name}!`, type.nameColor);
    return true;
  }

  equipBee(entry) {
    if (entry.ant) return;
    const ant = new Ant(
      this,
      this.player.x + Phaser.Math.Between(-40, 40),
      this.player.y + Phaser.Math.Between(-40, 40),
      entry.type,
    );
    this._applyBondStats(entry, ant);
    entry.ant  = ant;
    ant.entry  = entry;
    this.ants.push(ant);
  }

  unequipBee(entry) {
    if (!entry.ant) return;
    const idx = this.ants.indexOf(entry.ant);
    if (idx !== -1) this.ants.splice(idx, 1);
    entry.ant.destroy();
    entry.ant = null;
  }

  get antCount()      { return this.ants.length; }
  get isStorageFull() { return this.storage >= this.storageMax; }
  xpForNextLevel()    { return this.xpMax; }

  spawnXpOrb(fromX, fromY) {
    const orb = this.add.circle(fromX, fromY - 20, 5, 0x88ffdd, 1).setDepth(9999);
    this.tweens.add({
      targets: orb, x: this.player.x, y: this.player.y - 10,
      scale: 0, duration: 700, ease: 'Quad.In',
      onComplete: () => { orb.destroy(); this._addXp(3, this.player.x, this.player.y - 20); },
    });
  }

  getAvailableField() {
    if (!this.currentZone) return null;
    if (this.isStorageFull) return null;
    const avail = this.zone.fields.filter(f => f.isAvailable);
    if (!avail.length) return null;
    const { x: px, y: py } = this.player;
    return avail.sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[0];
  }

  // ── Private ───────────────────────────────────────────────────────────────

  buyUpgrade(id) {
    const item  = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return false;
    const level = this.upgrades[id] ?? 0;
    const cost  = item.getCost(level);
    if (this.cash < cost) return false;
    this.cash -= cost;
    this.upgrades[id]++;
    item.onBuy(this);
    spawnFloatText(this, this.player.x, this.player.y - 40, `${item.icon} ${item.name}!`, '#ffdd44');
    return true;
  }

  _toggleShop() {
    if (this.scene.isSleeping('ShopScene')) {
      this.scene.wake('ShopScene');
    } else if (!this.scene.isActive('ShopScene')) {
      this.scene.launch('ShopScene');
    } else {
      this._closeShop();
    }
  }

  _closeShop() {
    if (this.scene.isActive('ShopScene') && !this.scene.isSleeping('ShopScene')) {
      this.scene.sleep('ShopScene');
    }
  }

  _cashOut() {
    if (this.storage <= 0) return;
    const amount = Math.floor(this.storage * this.cashOutMult);
    this.cash      += amount;
    this.totalCash += amount;
    this.storage    = 0;
    spawnFloatText(this, this.homeTile.x, this.homeTile.y - 20, `+${amount} 💰`, '#ffff44');
  }

  addBond(ant, amount = 1) {
    const entry = ant.entry;
    if (!entry) return;
    const prev = getBondLevel(entry);
    entry.bond = (entry.bond ?? 0) + amount;
    const next = getBondLevel(entry);
    if (next > prev) {
      const statPct = Math.round((entry.gifted ? 1.2 : 1.0) * (1 + next * 0.05) * 100 - 100);
      spawnFloatText(this, ant.x, ant.y - 20, `🤝 Bond Lv.${next}! (+${statPct}% stats)`, '#ff88ff');
      this._applyBondStats(entry);
    }
  }

  applyStarTreat(entry) {
    if ((this.starTreats ?? 0) <= 0) return false;
    this.starTreats--;
    entry.bond = Math.min((entry.bond ?? 0) + 50, 500);
    this._applyBondStats(entry);
    spawnFloatText(this, this.player.x, this.player.y - 30, '⭐ Star Treat! +50 Bond XP', '#ffff44');
    return true;
  }

  applyRoyalJelly(entry) {
    if ((this.royalJellies ?? 0) <= 0) return false;
    this.royalJellies--;
    const newType = getRandomBeeType();
    const wasEquipped = !!entry.ant;
    if (wasEquipped) this.unequipBee(entry);
    entry.type = newType;
    if (wasEquipped) this.equipBee(entry);
    spawnFloatText(this, this.player.x, this.player.y - 40, `👑 Rerolled: ${newType.name}!`, newType.nameColor);
    return true;
  }

  _applyBondStats(entry, ant) {
    const a = ant ?? entry.ant;
    if (!a) return;
    const bondLevel = getBondLevel(entry);
    const statMult  = (entry.gifted ? 1.2 : 1.0) * (1 + bondLevel * 0.05);
    a.statMult = statMult;
    a.speed    = Math.round(a.beeType.speed  * this.beeSpeedMult * statMult);
    a.farmMs   = Math.round(a.beeType.farmMs * this.farmTimeMult / statMult);
  }

  _addToInventory(type) {
    const entry = { type, ant: null, bond: 0, gifted: false };
    this.ownedBees.push(entry);
    return entry;
  }

  _addXp(amount, worldX, worldY) {
    this.xp += amount;
    spawnFloatText(this, worldX, worldY, `+${amount} xp`, '#88ddff');
    if (this.xp >= this.xpMax) {
      this.xp -= this.xpMax;
      this.xpMax = Math.ceil((this.xpMax + 100) * 1.1);
      this.level++;
      this.statPoints++;
      this._onLevelUp();
    }
  }

  _onLevelUp() {
    const py = this.player.y - 50;
    const t  = this.add.text(this.player.x, py, `Level Up!  Lv ${this.level}`, {
      fontSize: '22px', color: '#ffff00', stroke: '#000000', strokeThickness: 5, fontStyle: 'bold',
    }).setOrigin(0.5, 1).setDepth(9999);
    this.tweens.add({ targets: t, y: py - 70, alpha: 0, duration: 2200, ease: 'Quad.Out', onComplete: () => t.destroy() });
  }

  _updateZone() {
    this.currentZone = this.zone.bounds.contains(this.player.x, this.player.y) ? this.zone : null;
    const nz = this.currentZone ? getZoneForY(this.player.y) : null;
    if (nz !== this._namedZone) {
      this._namedZone = nz;
      if (nz) this._showZoneBanner(nz);
    }
  }

  _showZoneBanner(zone) {
    const py = this.player.y - 70;
    const t  = this.add.text(this.player.x, py, `${zone.icon}  ${zone.name}  ×${zone.honeyMult} honey`, {
      fontSize: '18px', color: '#ffffff', stroke: '#000000', strokeThickness: 5, fontStyle: 'bold',
    }).setOrigin(0.5, 1).setDepth(9999).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 400, ease: 'Quad.Out',
      onComplete: () => this.tweens.add({ targets: t, alpha: 0, duration: 800, delay: 2000, ease: 'Quad.In', onComplete: () => t.destroy() }),
    });
  }

  _plantSprout() {
    if (this.sprouts <= 0) {
      spawnFloatText(this, this.player.x, this.player.y - 30, 'No sprouts!', '#ff8888');
      return;
    }
    const RANGE = 80;
    const { x: px, y: py } = this.player;
    const candidates = this.zone.fields.filter(f =>
      !f.isDepleted && f.sproutCount === 0 && Math.hypot(f.x - px, f.y - py) < RANGE,
    );
    if (!candidates.length) {
      spawnFloatText(this, px, py - 30, 'No field nearby!', '#ff8888');
      return;
    }
    const field = candidates.sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[0];
    field.plantSprout();
    this.sprouts--;
    spawnFloatText(this, field.x, field.y - 20, '🌱 Sprout planted!', '#66ff88');
  }

  claimBearQuest(id, bearType = 'black') {
    const pool = bearType === 'mother' ? this.motherBearQuests : this.bearQuests;
    const q    = pool.find(q => q.id === id);
    if (!q || q.claimed || !q.check(this)) return;
    q.claimed = true;
    const parts = [];
    if (q.reward.tickets) { this.tickets  += q.reward.tickets;  parts.push(`+${q.reward.tickets} 🎫`); }
    if (q.reward.sprouts) { this.sprouts  += q.reward.sprouts;  parts.push(`+${q.reward.sprouts} 🌱`); }
    spawnFloatText(this, this.player.x, this.player.y - 60, `Quest! ${parts.join('  ')}`, '#ffff88');
  }

  _hatchEgg(tier) {
    const type  = getEggBeeType(tier);
    const entry = this._addToInventory(type);
    if (Math.random() < 0.02) {
      entry.gifted = true;
      spawnFloatText(this, this.player.x, this.player.y - 50, `✨ Gifted ${type.name}!`, '#ffffaa');
    } else {
      spawnFloatText(this, this.player.x, this.player.y - 40, `${type.name} hatched!`, type.nameColor);
    }
    // Hatch ring animation
    const ring = this.add.graphics().setDepth(9999);
    ring.lineStyle(3, 0xffdd44, 1);
    ring.strokeCircle(this.player.x, this.player.y, 8);
    this.tweens.add({ targets: ring, scaleX: 5, scaleY: 5, alpha: 0, duration: 700, ease: 'Quad.Out', onComplete: () => ring.destroy() });
    return entry;
  }

  _toggleBear() {
    if (this.scene.isSleeping('BearScene')) {
      this.scene.wake('BearScene');
    } else if (!this.scene.isActive('BearScene')) {
      this.scene.launch('BearScene');
    } else {
      this.scene.sleep('BearScene');
    }
  }

  _startLadybugSpawner() {
    const HIGH_ZONE_NAMES = new Set(['Strawberry Field', 'Blueberry Field', 'Bamboo Field']);
    this.time.addEvent({
      delay: 35_000, loop: true, callback: () => {
        if (this.ladybugs.length >= 3) return;
        const candidates = this.zone.fields.filter(f =>
          f.isAvailable && HIGH_ZONE_NAMES.has(f.zone.name),
        );
        if (!candidates.length) return;
        const field = candidates[Math.floor(Math.random() * candidates.length)];
        this.ladybugs.push(new Ladybug(this, field));
      },
    });
  }

  _startBonusSpawner() {
    this.time.addEvent({
      delay: BONUS_INTERVAL_MS, loop: true, callback: () => {
        const avail = this.zone.fields.filter(f => !f.isDepleted && !f.isBoosted);
        if (!avail.length) return;
        const field = avail[Math.floor(Math.random() * avail.length)];
        field.applyBonus(BONUS_MULT, BONUS_DURATION_MS);
      },
    });
  }

  _checkQuests() {
    for (const q of this.quests) {
      if (q.done) continue;
      if (q.check(this)) {
        q.done = true;
        this.tickets += q.reward;
        const py = this.player.y - 60;
        const t  = this.add.text(this.player.x, py, `${q.icon} Quest done! +${q.reward} 🎫`, {
          fontSize: '16px', color: '#ffff88', stroke: '#000000', strokeThickness: 4, fontStyle: 'bold',
        }).setOrigin(0.5, 1).setDepth(9999);
        this.tweens.add({ targets: t, y: py - 60, alpha: 0, duration: 2500, ease: 'Quad.Out', onComplete: () => t.destroy() });
      }
    }
  }

  _createZone() {
    const farmH  = WORLD_H - VILLAGE_H;
    const fields = [];
    for (let y = 16; y < farmH; y += 32)
      for (let x = PATH_W + 16; x < WORLD_W - PATH_W; x += 32)
        fields.push(new FoodField(this, x, y));
    this.zone = { bounds: new Phaser.Geom.Rectangle(0, 0, WORLD_W, farmH), fields };
  }

  _createGround() {
    this.add.tileSprite(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 'dirt-bg').setDepth(-1).setTileScale(2, 2);

    // Faint colored bands for each named field zone
    const bands = this.add.graphics().setDepth(0);
    const farmH = WORLD_H - VILLAGE_H;
    for (const zone of FIELD_ZONES) {
      const top = Math.max(0, zone.minY);
      const bot = Math.min(farmH, zone.maxY === Infinity ? farmH : zone.maxY);
      bands.fillStyle(zone.bgTint, 0.06);
      bands.fillRect(0, top, WORLD_W, bot - top);
    }

    // Village overlay + divider line
    const v = this.add.graphics().setDepth(0);
    v.fillStyle(0x8b6914, 0.30);
    v.fillRect(0, WORLD_H - VILLAGE_H, WORLD_W, VILLAGE_H);
    v.lineStyle(4, 0xddbb55, 0.8);
    v.lineBetween(0, WORLD_H - VILLAGE_H + 30, WORLD_W, WORLD_H - VILLAGE_H + 30);
    this.add.graphics().setDepth(0).lineStyle(6, 0x1a3a0d, 1).strokeRect(3, 3, WORLD_W - 6, WORLD_H - 6);
  }

  _createAnims() {
    for (const dir of ['north', 'south', 'east', 'west', 'north-east', 'south-east', 'south-west', 'north-west'])
      this.anims.create({ key: `player-walk-${dir}`, frames: Array.from({ length: 6 }, (_, n) => ({ key: `player-walk-${dir}-${n}` })), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'player-idle-south', frames: Array.from({ length: 4 }, (_, n) => ({ key: `player-idle-${n}` })), frameRate: 6, repeat: -1 });
  }

  _generateTextures() {
    const make = (fn, w, h, key) => {
      const g = this.make.graphics({ add: false });
      fn(g); g.generateTexture(key, w, h); g.destroy();
    };
    make(g => {
      g.fillStyle(0x7d5c2e); g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x5c3f1a);
      g.fillRect(2,1,3,2); g.fillRect(8,3,2,2); g.fillRect(12,7,3,2); g.fillRect(1,9,2,3);
      g.fillRect(6,12,3,2); g.fillRect(10,13,4,2); g.fillRect(14,1,2,3); g.fillRect(5,6,2,2);
      g.fillStyle(0xa07840);
      g.fillRect(5,2,2,2); g.fillRect(10,5,3,1); g.fillRect(3,11,2,2); g.fillRect(13,10,2,2);
      g.fillRect(7,14,2,1); g.fillRect(0,6,2,2);
      g.fillStyle(0x6b4e24);
      g.fillRect(9,1,1,1); g.fillRect(4,7,1,1); g.fillRect(15,12,1,1); g.fillRect(11,9,1,1);
    }, 16, 16, 'dirt-bg');
    for (const type of Object.values(BEE_TYPES)) this._makeBeeTexture(type.textureKey, type.bodyColor, type.stripeColor);
  }

  _makeBeeTexture(key, bodyColor, stripeColor) {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.14);   g.fillEllipse(12, 13, 14, 3);
    g.fillStyle(0xd8f2ff, 0.65);   g.fillEllipse(8, 2, 9, 6);  g.fillEllipse(16, 2, 9, 6);
    g.fillStyle(bodyColor);         g.fillCircle(12, 7, 6);
    g.fillStyle(stripeColor, 0.88); g.fillEllipse(12, 4.5, 8, 2.2); g.fillEllipse(12, 7, 10, 2.2); g.fillEllipse(12, 9.5, 8, 2.2);
    g.lineStyle(1, 0x2a1400, 0.5);  g.strokeCircle(12, 7, 6);
    g.generateTexture(key, 24, 14); g.destroy();
  }
}
