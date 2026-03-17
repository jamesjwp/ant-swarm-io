const SPEED             = 150;   // bees are a bit quicker
const FARM_MS           = 2_000;
const DEPOSIT_MS        = 300;
const FIELD_ARRIVE_DIST = 4;
const HOME_ARRIVE_DIST  = 22;
const TRAIL_CHECK_MS    = 800;

// Separation: keep bees from stacking on top of each other
const SEP_RADIUS = 20;
const SEP_FORCE  = 200;

const State = Object.freeze({
  TRAILING:        'trailing',
  MOVING_TO_FIELD: 'movingToField',
  FARMING:         'farming',
  MOVING_HOME:     'movingHome',
  DEPOSITING:      'depositing',
});

export default class Ant {
  constructor(scene, x, y) {
    this.scene = scene;

    this.sprite = scene.physics.add.image(x, y, 'ant');
    this.sprite.setDepth(3);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setDamping(false);
    // Small circular physics body centred on the bee body (texture is 24×14)
    this.sprite.body.setCircle(5, 7, 2);

    this.state       = State.TRAILING;
    this.targetField = null;
    this.stateTimer  = 0;
    this.speed       = SPEED;

    // Stagger farm checks so bees don't all claim the same field at once
    this.trailCheckTimer = Math.random() * TRAIL_CHECK_MS;

    // Each bee gets its own orbit parameters so they fan out naturally
    const idx        = scene.ants.length;   // 0-based index at construction time
    this.orbitRadius = 40 + (idx % 4) * 14; // 40 / 54 / 68 / 82 px rings
    this.orbitAngle  = (idx / 8) * Math.PI * 2 + Math.random() * 0.8;
    this.orbitSpeed  = 1.0 + Math.random() * 0.5; // rad / s
  }

  update(delta) {
    switch (this.state) {

      case State.TRAILING: {
        // Orbit the beekeeper in a lazy circle instead of beelining to them
        this.orbitAngle += this.orbitSpeed * delta * 0.001;
        const tx = this.scene.player.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        const ty = this.scene.player.y + Math.sin(this.orbitAngle) * this.orbitRadius;
        this._moveToward(tx, ty);

        this.trailCheckTimer -= delta;
        if (this.trailCheckTimer <= 0) {
          this.trailCheckTimer = TRAIL_CHECK_MS;
          this._tryGoFarm();
        }
        break;
      }

      case State.MOVING_TO_FIELD:
        this._moveToward(this.targetField.x, this.targetField.y);
        if (this._distTo(this.targetField.x, this.targetField.y) < FIELD_ARRIVE_DIST) {
          this.targetField.startFarming();
          this.state      = State.FARMING;
          this.stateTimer = FARM_MS;
          this.sprite.body.setVelocity(0, 0);
        }
        break;

      case State.FARMING:
        this.stateTimer -= delta;
        this.targetField.setProgress(1 - this.stateTimer / FARM_MS);
        if (this.stateTimer <= 0) {
          this.targetField.finishFarming();
          this.targetField = null;
          this.state       = State.MOVING_HOME;
        }
        break;

      case State.MOVING_HOME:
        this._moveToward(this.scene.player.x, this.scene.player.y);
        if (this._distTo(this.scene.player.x, this.scene.player.y) < HOME_ARRIVE_DIST) {
          this.scene.addFood(1);
          this.state      = State.DEPOSITING;
          this.stateTimer = DEPOSIT_MS;
          this.sprite.body.setVelocity(0, 0);
        }
        break;

      case State.DEPOSITING:
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
          // Randomise orbit angle so returning bees spread out again
          this.orbitAngle = Math.random() * Math.PI * 2;
          this._tryGoFarm();
        }
        break;
    }
  }

  // ── Private ──────────────────────────────────────────────────────────────

  _tryGoFarm() {
    const field = this.scene.getAvailableField();
    if (!field) {
      this.state           = State.TRAILING;
      this.trailCheckTimer = TRAIL_CHECK_MS;
      return;
    }
    field.claim(this);
    this.targetField = field;
    this.state       = State.MOVING_TO_FIELD;
  }

  _moveToward(tx, ty) {
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, tx, ty);

    let vx = Math.cos(angle) * this.speed;
    let vy = Math.sin(angle) * this.speed;

    // Separation steering — push away from nearby bees
    for (const ant of this.scene.ants) {
      if (ant === this) continue;
      const dx = this.sprite.x - ant.sprite.x;
      const dy = this.sprite.y - ant.sprite.y;
      const d  = Math.hypot(dx, dy);
      if (d > 0.1 && d < SEP_RADIUS) {
        const strength = (SEP_RADIUS - d) / SEP_RADIUS;
        vx += (dx / d) * strength * SEP_FORCE;
        vy += (dy / d) * strength * SEP_FORCE;
      }
    }

    this.sprite.body.setVelocity(vx, vy);
  }

  _distTo(x, y) {
    return Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y);
  }
}
