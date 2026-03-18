const MAX_SPEED = 300;
const ACCEL     = 2400;
const DRAG      = 1600;

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this._currentAnim = null;

    this.sprite = scene.physics.add.sprite(x, y, 'player-walk-south-0');
    this.sprite.setScale(2);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setMaxVelocity(MAX_SPEED, MAX_SPEED);
    this.sprite.body.setDrag(DRAG, DRAG);
    this.sprite.play('player-idle-south');
    this._currentAnim = 'player-idle-south';

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
    if (Math.hypot(vx, vy) < 20) { this._playAnim('player-idle-south'); return; }
    const dir = this._cardinal(Math.atan2(vy, vx));
    this._playAnim(`player-walk-${dir}`);
  }

  _playAnim(key) {
    if (this._currentAnim !== key) { this.sprite.play(key); this._currentAnim = key; }
  }

  _cardinal(angle) {
    const deg = ((angle * 180 / Math.PI) + 360) % 360;
    if (deg < 45 || deg >= 315) return 'east';
    if (deg < 135) return 'south';
    if (deg < 225) return 'west';
    return 'north';
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
