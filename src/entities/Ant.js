import { BEE_TYPES } from '../data/BeeTypes.js';

const DEPOSIT_MS        = 300;
const FIELD_ARRIVE_DIST = 4;
const HOME_ARRIVE_DIST  = 22;
const TRAIL_CHECK_MS    = 800;

const S = Object.freeze({
  TRAILING: 'trailing', MOVING_TO_FIELD: 'movingToField',
  FARMING: 'farming', MOVING_HOME: 'movingHome', DEPOSITING: 'depositing',
});

export default class Ant {
  constructor(scene, x, y, beeType = BEE_TYPES.worker) {
    this.scene   = scene;
    this.beeType = beeType;

    this.sprite = scene.add.image(x, y, 'bee-south');
    this.sprite.setScale(0.5).setTint(beeType.bodyColor);

    this.state         = S.TRAILING;
    this.targetField   = null;
    this.stateTimer    = 0;
    this.speed         = beeType.speed;
    this.farmMs        = beeType.farmMs;
    this._pendingHoney = 0;
    this.statMult      = 1.0;  // set by GameScene based on bond + gifted
    this.entry         = null; // back-ref to ownedBees entry

    this.trailCheckTimer = Math.random() * TRAIL_CHECK_MS;

    const idx        = scene.ants.length;
    this.orbitRadius = 40 + (idx % 4) * 14;
    this.orbitAngle  = (idx / 8) * Math.PI * 2 + Math.random() * 0.8;
    this.orbitSpeed  = (0.8 + Math.random() * 0.4) * (Math.random() < 0.5 ? 1 : -1);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  update(delta) {
    this.sprite.setDepth(this.sprite.y);

    switch (this.state) {

      case S.TRAILING: {
        this.orbitAngle += this.orbitSpeed * delta * 0.001;
        const offsetX = Math.cos(this.orbitAngle) * this.orbitRadius;
        const offsetY = Math.sin(this.orbitAngle) * this.orbitRadius;
        this.sprite.setPosition(
          this.scene.player.x + offsetX,
          this.scene.player.y + offsetY,
        );
        this.trailCheckTimer -= delta;
        if (this.trailCheckTimer <= 0) { this.trailCheckTimer = TRAIL_CHECK_MS; this._tryGoFarm(); }
        break;
      }

      case S.MOVING_TO_FIELD:
        this._moveToward(this.targetField.x, this.targetField.y, delta);
        if (this._distTo(this.targetField.x, this.targetField.y) < FIELD_ARRIVE_DIST) {
          if (this.beeType.ability === 'marker') this.targetField.mark();
          this.targetField.startFarming(this.beeType.bodyColor);
          this.state = S.FARMING; this.stateTimer = this.farmMs;
        }
        break;

      case S.FARMING:
        this.stateTimer -= delta;
        this.targetField.setProgress(1 - this.stateTimer / this.farmMs);
        if (this.stateTimer <= 0) {
          let honey = this.beeType.honey;
          // Zone multiplier (farther from hive = more honey)
          honey = Math.round(honey * this.targetField.zone.honeyMult);
          if (this.targetField.isMarked)    { honey += 1; this.targetField.unmark(); }
          if (this.targetField.isBoosted)   { honey = Math.round(honey * this.targetField.bonusMult); }
          if (this.targetField.sproutCount > 0) { honey = Math.round(honey * this.targetField.sproutMult); }
          honey = Math.round(honey * this.statMult * (this.scene.dayHoneyMult ?? 1.0) * (this.scene.weatherHoneyMult ?? 1.0) * (this.scene.comboMult ?? 1.0)); // bond + day + weather + streak
          if (this.beeType.ability === 'gentle' && Math.random() < 0.5) {
            this.targetField.abandonField();
          } else {
            this.targetField.finishFarming();
          }
          this._pendingHoney = honey;
          this.targetField   = null;
          this.state         = S.MOVING_HOME;
        }
        break;

      case S.MOVING_HOME:
        this._moveToward(this.scene.player.x, this.scene.player.y, delta);
        if (this._distTo(this.scene.player.x, this.scene.player.y) < HOME_ARRIVE_DIST) {
          let honey = this._pendingHoney;
          if (this.beeType.ability === 'fortune' && Math.random() < 0.25) {
            honey *= 2;
            this._floatText('🍀 Fortune!', '#ffd700', this.scene.player.x, this.scene.player.y - 30);
          }
          this.scene.addHoney(honey, this.beeType.xpMult, this.scene.player.x, this.scene.player.y);
          this.scene.addBond?.(this, 1);
          if (this.beeType.ability === 'scholar') {
            this.scene.spawnXpOrb(this.scene.player.x, this.scene.player.y);
          }
          this.stateTimer = this.beeType.ability === 'tireless' ? 0 : DEPOSIT_MS;
          this.state = S.DEPOSITING;
        }
        break;

      case S.DEPOSITING:
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) { this._tryGoFarm(); }
        break;
    }
  }

  destroy() {
    if (this.targetField) this.targetField.abandonField();
    this.sprite.destroy();
  }

  _tryGoFarm() {
    const field = this.scene.getAvailableField();
    if (!field) { this.state = S.TRAILING; this.trailCheckTimer = TRAIL_CHECK_MS; return; }
    field.claim(this);
    this.targetField = field;
    this.state       = S.MOVING_TO_FIELD;
  }

  _moveToward(tx, ty, delta) {
    const speed = this.speed * (this.scene.weatherSpeedMult ?? 1.0);
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, tx, ty);
    const dist  = Math.min(speed * delta * 0.001, this._distTo(tx, ty));
    this.sprite.x += Math.cos(angle) * dist;
    this.sprite.y += Math.sin(angle) * dist;
  }

  _distTo(x, y) { return Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y); }

  _floatText(text, color, wx, wy) {
    const t = this.scene.add.text(wx, wy, text, {
      fontSize: '14px', color, stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5, 1).setDepth(9999);
    this.scene.tweens.add({ targets: t, y: wy - 44, alpha: 0, duration: 1100, ease: 'Quad.Out', onComplete: () => t.destroy() });
  }
}
