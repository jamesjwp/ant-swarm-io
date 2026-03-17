const REGEN_MS = 12_000;   // 12 s to regrow

export default class FoodField {
  constructor(scene, x, y) {
    this.scene = scene;
    this._x    = x;
    this._y    = y;

    this.sprite = scene.add.image(x, y, 'flower-tiles');
    this.sprite.setDepth(1);

    this.assignedAnt = null;   // the one ant currently claiming / farming this field
    this.isDepleted  = false;
    this._progressGfx = null;  // created lazily when farming begins
  }

  get x()           { return this._x; }
  get y()           { return this._y; }

  /** A field is available if it's alive and no ant has claimed it yet. */
  get isAvailable() { return !this.isDepleted && this.assignedAnt === null; }

  /** Called by an ant when it decides to travel here (reserves the slot). */
  claim(ant) {
    this.assignedAnt = ant;
  }

  /** Called when the ant physically arrives and starts eating. */
  startFarming() {
    if (!this._progressGfx) {
      this._progressGfx = this.scene.add.graphics().setDepth(2);
    }
    this.setProgress(0);
  }

  /** pct 0–1: fills the tile from the bottom up while the ant eats. */
  setProgress(pct) {
    const gfx = this._progressGfx;
    if (!gfx) return;
    gfx.clear();
    if (pct <= 0) return;

    const W    = 28;
    const maxH = 28;
    const H    = Math.max(2, Math.round(maxH * pct));
    const r    = Math.min(4, H / 2);

    gfx.fillStyle(0xf5c800, 0.9);
    gfx.fillRoundedRect(this._x - 14, this._y + 14 - H, W, H, r);
  }

  /** Called when the ant finishes farming — depletes the tile. */
  finishFarming() {
    this.assignedAnt = null;
    if (this._progressGfx) this._progressGfx.clear();
    this._deplete();
  }

  /** Called if the ant abandons the field before finishing. */
  abandonField() {
    this.assignedAnt = null;
    if (this._progressGfx) this._progressGfx.clear();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  _deplete() {
    this.isDepleted = true;
    this.sprite.setTexture('depleted-tiles');
    this.sprite.setScale(1);

    // Punch-scale flash on depletion
    this.scene.tweens.add({
      targets:  this.sprite,
      scaleX:   1.35,
      scaleY:   1.35,
      duration: 70,
      ease:     'Quad.Out',
      yoyo:     true,
      onComplete: () => this.sprite.setScale(1),
    });

    this.scene.time.delayedCall(REGEN_MS, () => {
      this.isDepleted  = false;
      this.assignedAnt = null;
      this.sprite.setTexture('flower-tiles');
      this.sprite.setAlpha(0);
      // Fade back in
      this.scene.tweens.add({
        targets:  this.sprite,
        alpha:    1,
        duration: 600,
        ease:     'Sine.In',
      });
    });
  }
}
