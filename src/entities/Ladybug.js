const LIFETIME_MS  = 30_000;  // how long it stays on a field
const SCARED_MS    = 8_000;   // remaining time when player gets close
const SCARE_DIST   = 110;     // player proximity that triggers fear

export default class Ladybug {
  constructor(scene, field) {
    this.scene    = scene;
    this.field    = field;
    this.timer    = LIFETIME_MS;
    this.destroyed = false;

    field.blockField(this);

    // Generate texture once
    if (!scene.textures.exists('ladybug')) {
      const g = scene.make.graphics({ add: false });
      // Shadow
      g.fillStyle(0x000000, 0.18);
      g.fillEllipse(8, 14, 13, 4);
      // Red body
      g.fillStyle(0xdd2222);
      g.fillCircle(8, 8, 7);
      // Wing divide line
      g.lineStyle(1.5, 0x220000, 0.8);
      g.lineBetween(8, 2, 8, 14);
      // Black head
      g.fillStyle(0x111111);
      g.fillCircle(8, 2, 3.5);
      // Antennae
      g.lineStyle(1, 0x111111, 1);
      g.lineBetween(6, 0, 4, -3);
      g.lineBetween(10, 0, 12, -3);
      // Spots
      g.fillStyle(0x220000, 0.85);
      g.fillCircle(5, 8, 2);
      g.fillCircle(11, 8, 2);
      g.fillCircle(8, 12, 1.5);
      // Outline
      g.lineStyle(1, 0x220000, 0.6);
      g.strokeCircle(8, 8, 7);
      g.generateTexture('ladybug', 16, 16);
      g.destroy();
    }

    this.sprite = scene.add.image(field.x, field.y, 'ladybug')
      .setScale(1.5).setDepth(field.y + 5);

    // Scared indicator (hidden by default)
    this._scaredText = scene.add.text(field.x, field.y - 18, '😨', { fontSize: '12px' })
      .setOrigin(0.5, 1).setDepth(field.y + 6).setVisible(false);
  }

  update(playerX, playerY, delta) {
    if (this.destroyed) return;

    // Shrink timer faster if player is nearby
    const dist = Math.hypot(this.field.x - playerX, this.field.y - playerY);
    const scared = dist < SCARE_DIST;
    this._scaredText.setVisible(scared);
    if (scared && this.timer > SCARED_MS) this.timer = SCARED_MS;

    this.timer -= delta;
    // Bob the sprite slightly
    this.sprite.y = this.field.y + Math.sin(Date.now() * 0.003) * 2;

    if (this.timer <= 0) this._leave();
  }

  _leave() {
    this.destroyed = true;
    this.field.unblockField();
    this._scaredText.destroy();

    // Small XP drop reward for scaring it off
    this.scene.spawnXpOrb(this.field.x, this.field.y);

    this.scene.tweens.add({
      targets: this.sprite, y: this.sprite.y - 30, alpha: 0, duration: 500,
      ease: 'Quad.Out', onComplete: () => this.sprite.destroy(),
    });
  }
}
