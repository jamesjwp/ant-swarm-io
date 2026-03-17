import Phaser   from 'phaser';
import Player   from '../entities/Player';
import Ant      from '../entities/Ant';
import FoodField from '../entities/FoodField';
import FoodZone  from '../entities/FoodZone';

const WORLD_W   = 3200;
const WORLD_H   = 3200;
const VILLAGE_H = 400;   // bottom of map reserved for the village/hub
const PATH_W        = 120;   // clear corridor on left and right edges
const PLAYER_FARM_MS = 2000;  // same duration as a bee harvest

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ── Phaser lifecycle ───────────────────────────────────────────────────

  preload() {
    // No external assets — everything is generated in create()
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    this._generateTextures();
    this._createGround();

    // Game state
    this.food        = 0;
    this.antCount    = 0;
    this.nextAntCost     = 1;
    this.currentZone     = null;
    this.playerField     = null;   // field the player is currently harvesting
    this.playerFarmTimer = 0;

    // Entities
    this.player = new Player(this, WORLD_W / 2, WORLD_H - VILLAGE_H / 2);
    this.zones  = this._createZones();
    this.ants   = [];
    this._spawnAnt();

    // Camera follows player smoothly, bounded to world
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);

    // Launch HUD as a parallel scene
    this.scene.launch('UIScene');
  }

  update(_time, delta) {
    this.player.update();
    this._updateZone();
    this._updatePlayerFarming(delta);
    for (const ant of this.ants) ant.update(delta);

    // Refresh HUD every frame (cheap text updates)
    this.scene.get('UIScene')?.refresh(this);
  }

  // ── Public API (called by Ant / UIScene) ───────────────────────────────

  addFood(amount) {
    this.food += amount;
  }

  tryBuyAnt() {
    if (this.food < this.nextAntCost) return false;
    this.food        -= this.nextAntCost;
    this.nextAntCost *= 2;
    this._spawnAnt();
    return true;
  }

  /** Returns the available field nearest to the player.
   *  Only dispatches bees when the player is inside the farming zone. */
  getAvailableField() {
    if (!this.currentZone) return null;
    return this.zones[0]?.getAvailableField(this.player.x, this.player.y) ?? null;
  }

  // ── Private ────────────────────────────────────────────────────────────

  _updateZone() {
    this.currentZone = null;
    for (const zone of this.zones) {
      if (zone.containsPoint(this.player.x, this.player.y)) {
        this.currentZone = zone;
        break;
      }
    }
  }

  _updatePlayerFarming(delta) {
    const fieldUnder = this._getFieldUnder(this.player.x, this.player.y);

    if (fieldUnder !== this.playerField) {
      // Player stepped off their current field — cancel it
      if (this.playerField) {
        this.playerField.abandonField();
        this.playerField     = null;
        this.playerFarmTimer = 0;
      }
      // Start harvesting the new field if it's free
      if (fieldUnder && fieldUnder.isAvailable) {
        this.playerField = fieldUnder;
        this.playerField.claim('player');
        this.playerField.startFarming();
        this.playerFarmTimer = PLAYER_FARM_MS;
      }
    }

    // Advance the harvest timer
    if (this.playerField) {
      this.playerFarmTimer -= delta;
      this.playerField.setProgress(1 - this.playerFarmTimer / PLAYER_FARM_MS);
      if (this.playerFarmTimer <= 0) {
        this.playerField.finishFarming();
        this.addFood(1);
        this.playerField     = null;
        this.playerFarmTimer = 0;
      }
    }
  }

  /** Returns the FoodField whose tile the player is standing on, or null. */
  _getFieldUnder(px, py) {
    const HALF = 22;   // half of the 44 px tile size
    for (const zone of this.zones) {
      for (const field of zone.fields) {
        if (!field.isDepleted &&
            Math.abs(px - field.x) < HALF &&
            Math.abs(py - field.y) < HALF) {
          return field;
        }
      }
    }
    return null;
  }

  _spawnAnt() {
    const x = this.player.x + Phaser.Math.Between(-40, 40);
    const y = this.player.y + Phaser.Math.Between(-40, 40);
    this.ants.push(new Ant(this, x, y));
    this.antCount++;
  }

  _createZones() {
    const farmH   = WORLD_H - VILLAGE_H;
    const SPACING = 60;
    const fields  = [];

    for (let y = SPACING / 2; y < farmH; y += SPACING) {
      for (let x = PATH_W + SPACING / 2; x < WORLD_W - PATH_W; x += SPACING) {
        fields.push(new FoodField(this, x, y));
      }
    }

    // Single zone covering the entire farming area (everything above the village)
    return [new FoodZone(this, WORLD_W / 2, farmH / 2, WORLD_W, farmH, fields)];
  }

  _createGround() {
    // Tiled grass background
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x3d7a2e);
    g.fillRect(0, 0, 128, 128);
    // Small random grass tufts for texture
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0x357020, 0.6);
      g.fillRect(
        Math.random() * 124, Math.random() * 120,
        2 + Math.random() * 3, 4 + Math.random() * 8,
      );
    }
    g.generateTexture('grass', 128, 128);
    g.destroy();

    this.add.tileSprite(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 'grass').setDepth(-1);

    // Village ground — warm earthy overlay over the bottom strip
    const village = this.add.graphics().setDepth(0);
    village.fillStyle(0x8b6914, 0.30);
    village.fillRect(0, WORLD_H - VILLAGE_H, WORLD_W, VILLAGE_H);
    // Dividing line — pushed down 30 px so it clears the last field row
    village.lineStyle(4, 0xddbb55, 0.8);
    village.lineBetween(0, WORLD_H - VILLAGE_H + 30, WORLD_W, WORLD_H - VILLAGE_H + 30);

    // World border so the player knows where the edge is
    const border = this.add.graphics().setDepth(0);
    border.lineStyle(6, 0x1a3a0d, 1);
    border.strokeRect(3, 3, WORLD_W - 6, WORLD_H - 6);
  }

  _generateTextures() {
    const make = (fn, w, h, key) => {
      const g = this.make.graphics({ add: false });
      fn(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // ── Beekeeper (player) — cream suit sphere + dome hat + veil ────────
    make(g => {
      // Ground shadow
      g.fillStyle(0x000000, 0.18);
      g.fillEllipse(29, 60, 38, 10);

      // Suit body — cream sphere
      g.fillStyle(0xf0ece0);
      g.fillCircle(26, 43, 18);
      // Sphere highlight (top-left)
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(20, 37, 7);
      // Suit shading (bottom-right)
      g.fillStyle(0x8a7a50, 0.22);
      g.fillEllipse(31, 50, 18, 9);

      // Hat brim
      g.fillStyle(0xf2efe5);
      g.fillRoundedRect(9, 18, 34, 6, 3);
      // Hat dome
      g.fillStyle(0xf2efe5);
      g.fillRoundedRect(14, 4, 24, 18, 8);
      // Hat band
      g.fillStyle(0x1e1e14);
      g.fillRect(9, 21, 34, 3);
      // Veil mesh (translucent rect)
      g.fillStyle(0xbbb8a0, 0.22);
      g.fillRect(9, 24, 34, 18);

      // Outlines
      g.lineStyle(1.5, 0x2a2210, 0.65);
      g.strokeCircle(26, 43, 18);
      g.strokeRoundedRect(9, 18, 34, 6, 3);
      g.strokeRoundedRect(14, 4, 24, 18, 8);
    }, 52, 62, 'player');

    // ── Bee — striped yellow-and-black circle ────────────────────────────
    make(g => {
      // Airborne shadow
      g.fillStyle(0x000000, 0.14);
      g.fillEllipse(12, 13, 14, 3);

      // Wings — semi-transparent blue-white
      g.fillStyle(0xd8f2ff, 0.65);
      g.fillEllipse(8,  2, 9, 6);
      g.fillEllipse(16, 2, 9, 6);

      // Body — yellow circle
      g.fillStyle(0xf5c800);
      g.fillCircle(12, 7, 6);

      // Black stripes (horizontal ellipses sized to stay inside the circle)
      g.fillStyle(0x1a0800, 0.88);
      g.fillEllipse(12, 4.5,  8, 2.2);   // top stripe
      g.fillEllipse(12, 7,   10, 2.2);   // middle stripe
      g.fillEllipse(12, 9.5,  8, 2.2);   // bottom stripe

      // Body outline
      g.lineStyle(1, 0x2a1400, 0.5);
      g.strokeCircle(12, 7, 6);
    }, 24, 14, 'ant');

    // ── Flower patch — active (golden yellow outline + depth shadow) ──────
    make(g => {
      g.fillStyle(0x7a6000, 0.35);
      g.fillRoundedRect(3, 4, 40, 40, 8);   // depth shadow
      g.lineStyle(2, 0xf5c800, 0.9);
      g.strokeRoundedRect(2, 2, 40, 40, 8);
    }, 44, 44, 'foodField');

    // ── Flower patch — harvested (muted golden fill) ──────────────────────
    make(g => {
      g.fillStyle(0xc49a00, 0.75);
      g.fillRoundedRect(2, 2, 40, 40, 8);
    }, 44, 44, 'foodFieldDepleted');
  }
}
