const MAX_SPEED = 300;
const ACCEL     = 2400;
const DRAG      = 1600;

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this._currentAnim = null;

    this.sprite = scene.physics.add.sprite(x, y, 'idle-south-0');
    this.sprite.setScale(2);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setMaxVelocity(MAX_SPEED, MAX_SPEED);
    this.sprite.body.setDrag(DRAG, DRAG);
    this.sprite.play('idle-south');
    this._currentAnim = 'idle-south';

    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W, down:  Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D,
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
    this.sprite.setDepth(this.sprite.y);
    this._updateAnimation();
  }

  _updateAnimation() {
    const { x: vx, y: vy } = this.sprite.body.velocity;
    if (Math.hypot(vx, vy) < 20) { this._playAnim('idle-south'); return; }
    const dir = this._octant(Math.atan2(vy, vx));
    const walk = { north:'walk-north', south:'walk-south', east:'walk-east', west:'walk-west' }[dir];
    if (walk) {
      this._playAnim(walk);
    } else {
      const rotKey = `rotate-${dir}`;
      if (this._currentAnim !== rotKey) { this.sprite.stop(); this.sprite.setTexture(rotKey); this._currentAnim = rotKey; }
    }
  }

  _playAnim(key) {
    if (this._currentAnim !== key) { this.sprite.play(key); this._currentAnim = key; }
  }

  _octant(angle) {
    const deg = ((angle * 180 / Math.PI) + 360) % 360;
    if (deg < 22.5 || deg >= 337.5) return 'east';
    if (deg < 67.5)  return 'south-east';
    if (deg < 112.5) return 'south';
    if (deg < 157.5) return 'south-west';
    if (deg < 202.5) return 'west';
    if (deg < 247.5) return 'north-west';
    if (deg < 292.5) return 'north';
    return 'north-east';
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
