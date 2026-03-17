const MAX_SPEED = 300;   // px/s top speed
const ACCEL     = 2400;  // px/s² — snappy build-up (~0.12 s to full speed)
const DRAG      = 1600;  // px/s² — stops cleanly when keys released (~0.19 s)

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    this.sprite = scene.physics.add.image(x, y, 'player');
    this.sprite.setDepth(4);
    this.sprite.setCollideWorldBounds(true);

    // Shift the origin so the world position tracks the suit body centre
    // (texture is 52×62; body centre is at pixel (26, 43))
    this.sprite.setOrigin(0.5, 43 / 62);

    // Circular physics body centred on the suit (not the hat)
    // setCircle(radius, offsetX, offsetY) — offsets from the body's top-left
    this.sprite.body.setCircle(18, 8, 25);

    // Acceleration-based movement with linear drag
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

    // Normalise diagonal acceleration so it isn't faster
    if (ax !== 0 && ay !== 0) { ax *= 0.707; ay *= 0.707; }

    this.sprite.body.setAcceleration(ax, ay);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
