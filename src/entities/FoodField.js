const REGEN_MS = 12_000;

export default class FoodField {
  constructor(scene, x, y) {
    this.scene = scene;
    this._x    = x;
    this._y    = y;

    this.sprite = scene.add.image(x, y, 'flower-tiles').setDepth(1);
    this.assignedAnt  = null;
    this.isDepleted   = false;
    this._progressGfx = null;
  }

  get x() { return this._x; }
  get y() { return this._y; }
  get isAvailable() { return !this.isDepleted && this.assignedAnt === null; }

  claim(ant)       { this.assignedAnt = ant; }

  startFarming() {
    if (!this._progressGfx) this._progressGfx = this.scene.add.graphics().setDepth(2);
    this.setProgress(0);
  }

  setProgress(pct) {
    const gfx = this._progressGfx;
    if (!gfx) return;
    gfx.clear();
    if (pct <= 0) return;
    const H = Math.max(2, Math.round(28 * pct));
    gfx.fillStyle(0xf5c800, 0.9);
    gfx.fillRoundedRect(this._x - 14, this._y + 14 - H, 28, H, Math.min(4, H / 2));
  }

  finishFarming() {
    this.assignedAnt = null;
    if (this._progressGfx) this._progressGfx.clear();
    this._deplete();
  }

  abandonField() {
    this.assignedAnt = null;
    if (this._progressGfx) this._progressGfx.clear();
  }

  _deplete() {
    this.isDepleted = true;
    this.sprite.setTexture('depleted-tiles').setScale(1);
    this.scene.tweens.add({ targets: this.sprite, scaleX: 1.35, scaleY: 1.35, duration: 70, ease: 'Quad.Out', yoyo: true, onComplete: () => this.sprite.setScale(1) });
    this.scene.time.delayedCall(REGEN_MS, () => {
      this.isDepleted = false; this.assignedAnt = null;
      this.sprite.setTexture('flower-tiles').setAlpha(0);
      this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 600, ease: 'Sine.In' });
    });
  }
}
