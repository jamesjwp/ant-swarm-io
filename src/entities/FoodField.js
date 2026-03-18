import { getZoneForY } from '../data/FieldZones.js';

const REGEN_MS  = 12_000;
const MARK_MS   = 20_000;
const SPROUT_HARVESTS = 5;   // number of boosted harvests per sprout
const SPROUT_MULT     = 2;   // honey multiplier while sprouted

export default class FoodField {
  constructor(scene, x, y) {
    this.scene = scene;
    this._x    = x;
    this._y    = y;

    this.zone   = getZoneForY(y);
    this.sprite = scene.add.image(x, y, 'flower-tiles').setDepth(1).setTint(this.zone.tint);

    this.assignedAnt  = null;
    this.isDepleted   = false;
    this._progressGfx = null;
    this._beeColor    = 0xf5c800;

    this.isMarked   = false;
    this._markGfx   = null;
    this._markTimer = null;

    this.isBoosted   = false;
    this.bonusMult   = 1;
    this._bonusGfx   = null;
    this._bonusTimer = null;

    this.sproutCount  = 0;
    this._sproutGfx   = null;
    this._blockingMob = null;   // set by Ladybug to prevent bee access
  }

  get x() { return this._x; }
  get y() { return this._y; }
  get isAvailable() { return !this.isDepleted && this.assignedAnt === null && !this._blockingMob; }

  blockField(mob)  { this._blockingMob = mob; }
  unblockField()   { this._blockingMob = null; }

  claim(ant) { this.assignedAnt = ant; }

  startFarming(beeColor = 0xf5c800) {
    this._beeColor = beeColor;
    if (!this._progressGfx) this._progressGfx = this.scene.add.graphics().setDepth(2);
    this.setProgress(0);
  }

  setProgress(pct) {
    const gfx = this._progressGfx;
    if (!gfx) return;
    gfx.clear();
    if (pct <= 0) return;
    const H = Math.max(2, Math.round(28 * pct));
    gfx.fillStyle(this._beeColor, 0.9);
    gfx.fillRoundedRect(this._x - 14, this._y + 14 - H, 28, H, Math.min(4, H / 2));
  }

  finishFarming() {
    this.unmark();
    this.clearBonus();
    // Consume one sprout charge
    if (this.sproutCount > 0) {
      this.sproutCount--;
      if (this.sproutCount === 0) { this._sproutGfx?.destroy(); this._sproutGfx = null; }
      else this._drawSprout();
    }
    this.assignedAnt = null;
    if (this._progressGfx) this._progressGfx.clear();
    this._deplete();
  }

  abandonField() {
    this.assignedAnt = null;
    if (this._progressGfx) this._progressGfx.clear();
  }

  // ── Mark (Scout ability) ────────────────────────────────────────────────

  mark() {
    this.isMarked = true;
    if (!this._markGfx) this._markGfx = this.scene.add.graphics().setDepth(3);
    this._drawMark();
    if (this._markTimer) this._markTimer.remove();
    this._markTimer = this.scene.time.delayedCall(MARK_MS, () => this.unmark());
  }

  unmark() {
    if (!this.isMarked) return;
    this.isMarked = false;
    if (this._markGfx) { this._markGfx.clear(); }
    if (this._markTimer) { this._markTimer.remove(); this._markTimer = null; }
  }

  // ── Bonus token (global timed spawner) ─────────────────────────────────

  applyBonus(mult, durationMs) {
    this.isBoosted = true;
    this.bonusMult = mult;
    if (!this._bonusGfx) this._bonusGfx = this.scene.add.graphics().setDepth(3);
    this._drawBonus();
    if (this._bonusTimer) this._bonusTimer.remove();
    this._bonusTimer = this.scene.time.delayedCall(durationMs, () => this.clearBonus());
  }

  clearBonus() {
    this.isBoosted = false;
    this.bonusMult = 1;
    if (this._bonusGfx) { this._bonusGfx.clear(); }
    if (this._bonusTimer) { this._bonusTimer.remove(); this._bonusTimer = null; }
  }

  // ── Sprout system ───────────────────────────────────────────────────────

  plantSprout() {
    if (this.isDepleted || this.sproutCount > 0) return false;
    this.sproutCount = SPROUT_HARVESTS;
    this._drawSprout();
    return true;
  }

  get sproutMult() { return this.sproutCount > 0 ? SPROUT_MULT : 1; }

  // ── Private draw helpers ────────────────────────────────────────────────

  _drawSprout() {
    if (!this._sproutGfx) this._sproutGfx = this.scene.add.graphics().setDepth(4);
    const g = this._sproutGfx;
    const x = this._x, y = this._y;
    g.clear();
    // Stem
    g.fillStyle(0x22aa44, 1);
    g.fillRect(x - 1, y - 14, 2, 10);
    // Left leaf
    g.fillStyle(0x44dd66, 1);
    g.fillTriangle(x - 1, y - 10, x - 7, y - 14, x - 1, y - 14);
    // Right leaf
    g.fillTriangle(x + 1, y - 10, x + 7, y - 14, x + 1, y - 14);
    // Tip bud
    g.fillStyle(0x88ffaa, 1);
    g.fillCircle(x, y - 14, 2);
    // Harvest count badge
    if (this.sproutCount > 1) {
      g.fillStyle(0x004400, 0.85);
      g.fillCircle(x + 7, y - 16, 4);
      g.fillStyle(0xffffff, 1);
      // Can't draw text on Graphics; we'll just leave the badge as a dot
    }
  }

  _drawBonus() {
    const g = this._bonusGfx;
    if (!g) return;
    g.clear();
    g.fillStyle(0xffd700, 0.85);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const px = this._x + Math.cos(a) * 12;
      const py = this._y + Math.sin(a) * 12;
      g.fillCircle(px, py, 3);
    }
    g.fillStyle(0xffd700, 1);
    g.fillCircle(this._x, this._y, 4);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(this._x, this._y, 2);
  }

  _drawMark() {
    const g = this._markGfx;
    if (!g) return;
    g.clear();
    g.lineStyle(2, 0xffd700, 0.9);
    g.strokeCircle(this._x, this._y, 14);
    g.lineStyle(1, 0xffd700, 0.4);
    g.strokeCircle(this._x, this._y, 18);
  }

  _deplete() {
    this.isDepleted = true;
    this.scene.tweens.add({
      targets: this.sprite, alpha: 0.22, duration: 400, ease: 'Quad.Out',
    });
    const regenMs = REGEN_MS * (this.scene.fieldRegenMult ?? 1) * (this.scene.weatherRegenMult ?? 1);
    this.scene.time.delayedCall(regenMs, () => {
      this.isDepleted = false;
      this.assignedAnt = null;
      this.scene.tweens.add({
        targets: this.sprite, alpha: 1, duration: 1200, ease: 'Sine.In',
      });
    });
  }
}
