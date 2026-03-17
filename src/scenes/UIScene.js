import Phaser from 'phaser';

const STYLE_BASE = {
  fontSize:        '22px',
  color:           '#ffffff',
  stroke:          '#000000',
  strokeThickness: 4,
};

export default class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    // ── Left panel ───────────────────────────────────────────────────────
    this.foodText = this.add.text(16, 16, 'Honey: 0', STYLE_BASE);
    this.antText  = this.add.text(16, 48, 'Bees: 1',  STYLE_BASE);

    // ── Buy Ant button ───────────────────────────────────────────────────
    this.buyBtn = this.add.text(16, 660, '[ Buy Ant — 10 food ]', {
      ...STYLE_BASE,
      fontSize:        '20px',
      color:           '#ffdd44',
      backgroundColor: '#00000099',
      padding:         { x: 12, y: 6 },
    }).setInteractive({ useHandCursor: true });

    this.buyBtn.on('pointerdown', () => {
      this.scene.get('GameScene').tryBuyAnt();
    });
    this.buyBtn.on('pointerover', () => this.buyBtn.setAlpha(0.75));
    this.buyBtn.on('pointerout',  () => this.buyBtn.setAlpha(1));

    // ── Controls reminder (fades out after 5 s) ──────────────────────────
    const hint = this.add.text(640, 700, 'WASD to move  ·  bees collect honey automatically', {
      fontSize:        '14px',
      color:           '#cccccc',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1);

    this.time.delayedCall(5000, () => {
      this.tweens.add({ targets: hint, alpha: 0, duration: 1500 });
    });
  }

  /** Called every frame by GameScene.update() */
  refresh(gs) {
    this.foodText.setText(`Honey: ${gs.food}`);
    this.antText.setText(`Bees: ${gs.antCount}`);

    const canAfford = gs.food >= gs.nextAntCost;
    this.buyBtn.setText(`[ Recruit Bee — ${gs.nextAntCost} 🍯 ]`);
    this.buyBtn.setAlpha(canAfford ? 1 : 0.4);
    this.buyBtn.setInteractive(canAfford);
  }
}
