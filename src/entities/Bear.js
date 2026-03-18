const NEAR_DIST = 100;

export default class Bear {
  constructor(scene, x, y, {
    label      = 'Black Bear',
    textureKey = 'bear-npc-south',
    questsKey  = 'bearQuests',
    bearId     = 'black',
  } = {}) {
    this.scene      = scene;
    this.x          = x;
    this.y          = y;
    this._questsKey = questsKey;
    this.bearId     = bearId;

    // Use PixelLab-generated sprite; fall back to programmatic if not loaded
    const texKey = scene.textures.exists(textureKey) ? textureKey : '_bear-fallback';
    if (!scene.textures.exists(texKey)) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.18); g.fillEllipse(16, 26, 22, 7);
      g.fillStyle(0x2a1a09);       g.fillEllipse(16, 16, 20, 19);
      g.fillStyle(0x2a1a09);       g.fillCircle(8, 7, 4.5); g.fillCircle(24, 7, 4.5);
      g.fillStyle(0x5a3320);       g.fillCircle(8, 7, 2.5); g.fillCircle(24, 7, 2.5);
      g.fillStyle(0x4a3020);       g.fillEllipse(16, 19, 11, 8);
      g.fillStyle(0x1a0a00);       g.fillEllipse(16, 16, 5, 3);
      g.fillStyle(0x000000);       g.fillCircle(11, 13, 1.8); g.fillCircle(21, 13, 1.8);
      g.generateTexture('_bear-fallback', 32, 32); g.destroy();
    }

    this.sprite = scene.add.image(x, y, texKey).setScale(3).setDepth(y);

    this._labelText = scene.add.text(x, y - 52, label, {
      fontSize: '11px', color: '#ffdd88', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(y + 1);

    this._hint = scene.add.text(x, y + 42, '[E] Talk', {
      fontSize: '10px', color: '#cccccc', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(y + 1).setVisible(false);

    // Exclamation bubble for available quests
    this._bubble = scene.add.text(x + 26, y - 52, '!', {
      fontSize: '18px', color: '#ffff00', stroke: '#000', strokeThickness: 4, fontStyle: 'bold',
    }).setOrigin(0.5, 1).setDepth(y + 2).setVisible(false);
  }

  // Returns true if player is close enough for interaction
  update(playerX, playerY) {
    const near = Math.hypot(this.x - playerX, this.y - playerY) < NEAR_DIST;
    this._hint.setVisible(near);

    const hasReady = this.scene[this._questsKey]?.some(q => !q.claimed && q.check(this.scene));
    this._bubble.setVisible(hasReady);
    if (hasReady) {
      this._bubble.setAlpha(0.7 + Math.sin(Date.now() * 0.006) * 0.3);
    }

    return near;
  }
}
