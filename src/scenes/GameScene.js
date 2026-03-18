import Phaser    from 'phaser';
import Player    from '../entities/Player';
import Ant       from '../entities/Ant';
import FoodField from '../entities/FoodField';
import { BEE_TYPES } from '../data/BeeTypes.js';

const WORLD_W        = 3200;
const WORLD_H        = 3200;
const VILLAGE_H      = 400;
const PATH_W         = 120;

function spawnFloatText(scene, worldX, worldY, text, color = '#ffffff') {
  const t = scene.add.text(worldX, worldY, text, {
    fontSize: '13px', color, stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
  }).setOrigin(0.5, 1).setDepth(9999);
  scene.tweens.add({ targets: t, y: worldY - 44, alpha: 0, duration: 1100, ease: 'Quad.Out', onComplete: () => t.destroy() });
}

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  preload() {
    for (const dir of ['north', 'south', 'east', 'west'])
      for (let i = 0; i < 6; i++)
        this.load.image(`walk-${dir}-${i}`, `assets/animations/walk/${dir}/frame_00${i}.png`);
    for (let i = 0; i < 4; i++)
      this.load.image(`idle-south-${i}`, `assets/animations/breathing-idle/south/frame_00${i}.png`);
    for (const dir of ['north','north-east','east','south-east','south','south-west','west','north-west'])
      this.load.image(`rotate-${dir}`, `assets/rotations/${dir}.png`);
    this.load.image('grass-bg',       'assets/tiles/grass-bg.png');
    this.load.image('flower-tiles',   'assets/tiles/flower-field.png');
    this.load.image('depleted-tiles', 'assets/tiles/depleted-field.png');
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this._generateTextures();
    this._createAnims();
    this._createGround();

    this.food            = 0;
    this.nextAntCost     = 1;
    this.maxHiveCells    = 40;
    this.currentZone     = null;
    this.xp              = 0;
    this.level           = 1;
    this.statPoints      = 0;
    this.ownedBees       = [];
    this.ants            = [];

    this.player = new Player(this, WORLD_W / 2, WORLD_H - VILLAGE_H / 2);
    this._createZone();

    const workerEntry = this._addToInventory(BEE_TYPES.worker);
    this._addToInventory(BEE_TYPES.scout);
    this._addToInventory(BEE_TYPES.harvester);
    this.equipBee(workerEntry);

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.scene.launch('UIScene');
  }

  update(_time, delta) {
    this.player.update();
    this._updateZone();
    for (const ant of this.ants) ant.update(delta);
    this.scene.get('UIScene')?.refresh(this);
  }

  // Public API

  addHoney(amount, worldX, worldY) {
    this.food += amount;
    spawnFloatText(this, worldX, worldY, `+${amount} 🍯`, '#ffdd44');
    this._addXp(amount, worldX, worldY - 18);
  }

  tryBuyAnt() {
    if (this.food < this.nextAntCost) return false;
    this.food -= this.nextAntCost;
    this.nextAntCost *= 2;
    const entry = this._addToInventory(BEE_TYPES.worker);
    if (this.ownedBees.filter(b => b.ant).length < this.maxHiveCells) this.equipBee(entry);
    return true;
  }

  equipBee(entry) {
    if (entry.ant) return;
    entry.ant = new Ant(this, this.player.x + Phaser.Math.Between(-40, 40), this.player.y + Phaser.Math.Between(-40, 40), entry.type);
    this.ants.push(entry.ant);
  }

  unequipBee(entry) {
    if (!entry.ant) return;
    const idx = this.ants.indexOf(entry.ant);
    if (idx !== -1) this.ants.splice(idx, 1);
    entry.ant.destroy();
    entry.ant = null;
  }

  get antCount()   { return this.ants.length; }
  xpForNextLevel() { return this.level * 10; }

  getAvailableField() {
    if (!this.currentZone) return null;
    const avail = this.zone.fields.filter(f => f.isAvailable);
    if (!avail.length) return null;
    const { x: px, y: py } = this.player;
    return avail.sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[0];
  }

  // Private

  _addToInventory(type) {
    const entry = { type, ant: null };
    this.ownedBees.push(entry);
    return entry;
  }

  _addXp(amount, worldX, worldY) {
    this.xp += amount;
    spawnFloatText(this, worldX, worldY, `+${amount} xp`, '#88ddff');
    if (this.xp >= this.xpForNextLevel()) {
      this.xp -= this.xpForNextLevel();
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
    const v = this.add.graphics().setDepth(0);
    v.fillStyle(0x8b6914, 0.30);
    v.fillRect(0, WORLD_H - VILLAGE_H, WORLD_W, VILLAGE_H);
    v.lineStyle(4, 0xddbb55, 0.8);
    v.lineBetween(0, WORLD_H - VILLAGE_H + 30, WORLD_W, WORLD_H - VILLAGE_H + 30);
    this.add.graphics().setDepth(0).lineStyle(6, 0x1a3a0d, 1).strokeRect(3, 3, WORLD_W - 6, WORLD_H - 6);
  }

  _createAnims() {
    for (const dir of ['north', 'south', 'east', 'west'])
      this.anims.create({ key: `walk-${dir}`, frames: Array.from({ length: 6 }, (_, i) => ({ key: `walk-${dir}-${i}` })), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'idle-south', frames: Array.from({ length: 4 }, (_, i) => ({ key: `idle-south-${i}` })), frameRate: 4, repeat: -1 });
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
