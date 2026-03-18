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
    this.sprite.setScale(0.5);

    this.state       = S.TRAILING;
    this.targetField = null;
    this.stateTimer  = 0;
    this.speed       = beeType.speed;
    this.farmMs      = beeType.farmMs;

    this.trailCheckTimer = Math.random() * TRAIL_CHECK_MS;

    const idx        = scene.ants.length;
    this.orbitRadius = 40 + (idx % 4) * 14;
    this.orbitAngle  = (idx / 8) * Math.PI * 2 + Math.random() * 0.8;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  update(delta) {
    this.sprite.setDepth(this.sprite.y);

    switch (this.state) {

      case S.TRAILING: {
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
          this.targetField.startFarming();
          this.state = S.FARMING; this.stateTimer = this.farmMs;
        }
        break;

      case S.FARMING:
        this.stateTimer -= delta;
        this.targetField.setProgress(1 - this.stateTimer / this.farmMs);
        if (this.stateTimer <= 0) { this.targetField.finishFarming(); this.targetField = null; this.state = S.MOVING_HOME; }
        break;

      case S.MOVING_HOME:
        this._moveToward(this.scene.player.x, this.scene.player.y, delta);
        if (this._distTo(this.scene.player.x, this.scene.player.y) < HOME_ARRIVE_DIST) {
          this.scene.addHoney(this.beeType.honey, this.scene.player.x, this.scene.player.y);
          this.state = S.DEPOSITING; this.stateTimer = DEPOSIT_MS;
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

  _moveToward(tx, ty, delta) {
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, tx, ty);
    const dist  = Math.min(this.speed * delta * 0.001, this._distTo(tx, ty));
    this.sprite.x += Math.cos(angle) * dist;
    this.sprite.y += Math.sin(angle) * dist;
  }

  _distTo(x, y) { return Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y); }
}
