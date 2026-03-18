const MAX_SPEED = 300;
const ACCEL     = 2400;
const DRAG      = 1600;

const DIR8_CARD = { 0: 'east', 2: 'south', 4: 'west', 6: 'north' };
const DIR8_DIAG = { 1: 'south-east', 3: 'south-west', 5: 'north-west', 7: 'north-east' };

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
    const speed = Math.hypot(vx, vy);

    if (speed < 20) {
      this._play('player-idle-south');
      return;
    }

    const deg  = ((Math.atan2(vy, vx) * 180 / Math.PI) + 360) % 360;
    const dir8 = Math.round(deg / 45) % 8;
    const dir  = DIR8_DIAG[dir8] ?? DIR8_CARD[dir8];
    this._play(`player-walk-${dir}`);
  }

  _play(key) {
    if (this._currentAnim !== key) { this.sprite.play(key); this._currentAnim = key; }
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
