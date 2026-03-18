import { BEE_TYPES } from '../data/BeeTypes.js';

const DEPOSIT_MS        = 300;
const FIELD_ARRIVE_DIST = 4;
const HOME_ARRIVE_DIST  = 22;
const TRAIL_CHECK_MS    = 800;
const SEP_RADIUS        = 20;
const SEP_FORCE         = 200;

const S = Object.freeze({
  TRAILING: 'trailing', MOVING_TO_FIELD: 'movingToField',
  FARMING: 'farming', MOVING_HOME: 'movingHome', DEPOSITING: 'depositing',
});

export default class Ant {
  constructor(scene, x, y, beeType = BEE_TYPES.worker) {
    this.scene   = scene;
    this.beeType = beeType;

    this.sprite = scene.physics.add.image(x, y, beeType.textureKey);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setDamping(false);
    this.sprite.body.setCircle(5, 7, 2);

    this.state       = S.TRAILING;
    this.targetField = null;
    this.stateTimer  = 0;
    this.speed       = beeType.speed;
    this.farmMs      = beeType.farmMs;

    this.trailCheckTimer = Math.random() * TRAIL_CHECK_MS;

    const idx        = scene.ants.length;
    this.orbitRadius = 40 + (idx % 4) * 14;
    this.orbitAngle  = (idx / 8) * Math.PI * 2 + Math.random() * 0.8;
    this.orbitSpeed  = 1.0 + Math.random() * 0.5;
  }

  update(delta) {
    this.sprite.setDepth(this.sprite.y);
    switch (this.state) {

      case S.TRAILING: {
        this.orbitAngle += this.orbitSpeed * delta * 0.001;
        this._moveToward(
          this.scene.player.x + Math.cos(this.orbitAngle) * this.orbitRadius,
          this.scene.player.y + Math.sin(this.orbitAngle) * this.orbitRadius,
        );
        this.trailCheckTimer -= delta;
        if (this.trailCheckTimer <= 0) { this.trailCheckTimer = TRAIL_CHECK_MS; this._tryGoFarm(); }
        break;
      }

      case S.MOVING_TO_FIELD:
        this._moveToward(this.targetField.x, this.targetField.y);
        if (this._distTo(this.targetField.x, this.targetField.y) < FIELD_ARRIVE_DIST) {
          this.targetField.startFarming();
          this.state = S.FARMING; this.stateTimer = this.farmMs;
          this.sprite.body.setVelocity(0, 0);
        }
        break;

      case S.FARMING:
        this.stateTimer -= delta;
        this.targetField.setProgress(1 - this.stateTimer / this.farmMs);
        if (this.stateTimer <= 0) { this.targetField.finishFarming(); this.targetField = null; this.state = S.MOVING_HOME; }
        break;

      case S.MOVING_HOME:
        this._moveToward(this.scene.player.x, this.scene.player.y);
        if (this._distTo(this.scene.player.x, this.scene.player.y) < HOME_ARRIVE_DIST) {
          this.scene.addHoney(this.beeType.honey, this.scene.player.x, this.scene.player.y);
          this.state = S.DEPOSITING; this.stateTimer = DEPOSIT_MS;
          this.sprite.body.setVelocity(0, 0);
        }
        break;

      case S.DEPOSITING:
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) { this.orbitAngle = Math.random() * Math.PI * 2; this._tryGoFarm(); }
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

  _moveToward(tx, ty) {
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, tx, ty);
    let vx = Math.cos(angle) * this.speed;
    let vy = Math.sin(angle) * this.speed;
    for (const ant of this.scene.ants) {
      if (ant === this) continue;
      const dx = this.sprite.x - ant.sprite.x;
      const dy = this.sprite.y - ant.sprite.y;
      const d  = Math.hypot(dx, dy);
      if (d > 0.1 && d < SEP_RADIUS) {
        const s = (SEP_RADIUS - d) / SEP_RADIUS;
        vx += (dx / d) * s * SEP_FORCE;
        vy += (dy / d) * s * SEP_FORCE;
      }
    }
    this.sprite.body.setVelocity(vx, vy);
  }

  _distTo(x, y) { return Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y); }
}
