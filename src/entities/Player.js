const MAX_SPEED = 300;   // px/s top speed
const ACCEL     = 2400;  // px/s² — snappy build-up (~0.12 s to full speed)
const DRAG      = 1600;  // px/s² — stops cleanly when keys released (~0.19 s)
const SCALE     = 3;     // pixel-art upscale

export default class Player {
  constructor(scene, x, y) {
    this.scene   = scene;
    this._facing = 'south';

    this.sprite = scene.physics.add.sprite(x, y, 'player_south');
    this.sprite.setScale(SCALE);
    this.sprite.setDepth(4);
    this.sprite.setCollideWorldBounds(true);

    // Circular physics body — adjust radius/offsets if sprite size changes
    const hw = this.sprite.width  * SCALE / 2;
    const hh = this.sprite.height * SCALE / 2;
    const r  = Math.min(hw, hh) * 0.45;
    this.sprite.body.setCircle(r, hw - r, hh - r * 0.5);

    this.sprite.body.setMaxVelocity(MAX_SPEED, MAX_SPEED);
    this.sprite.body.setDrag(DRAG, DRAG);

    // WASD keys
    this.keys = scene.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  update() {
    const { up, down, left, right } = this.keys;
    let ax = 0, ay = 0;

    if (left.isDown)  ax -= ACCEL;
    if (right.isDown) ax += ACCEL;
    if (up.isDown)    ay -= ACCEL;
    if (down.isDown)  ay += ACCEL;

    if (ax !== 0 && ay !== 0) { ax *= 0.707; ay *= 0.707; }

    this.sprite.body.setAcceleration(ax, ay);

    // Update facing sprite when moving
    if (ax !== 0 || ay !== 0) {
      const dir = this._dirFromVector(ax, ay);
      if (dir !== this._facing) {
        this._facing = dir;
        this.sprite.setTexture(`player_${dir}`);
      }
    }
  }

  _dirFromVector(ax, ay) {
    const angle = Math.atan2(ay, ax) * 180 / Math.PI;
    if (angle >= -22.5  && angle <  22.5)  return 'east';
    if (angle >=  22.5  && angle <  67.5)  return 'south-east';
    if (angle >=  67.5  && angle < 112.5)  return 'south';
    if (angle >= 112.5  && angle < 157.5)  return 'south-west';
    if (angle >=  157.5 || angle < -157.5) return 'west';
    if (angle >= -157.5 && angle < -112.5) return 'north-west';
    if (angle >= -112.5 && angle <  -67.5) return 'north';
    return 'north-east';
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
