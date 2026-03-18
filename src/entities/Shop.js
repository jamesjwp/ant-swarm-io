const INTERACT_DIST = 70;

export default class Shop {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    const g = scene.add.graphics().setDepth(1);
    g.fillStyle(0x1a1208, 0.95);
    g.fillRect(x - 28, y - 28, 56, 56);
    g.lineStyle(2, 0xddbb55, 0.9);
    g.strokeRect(x - 28, y - 28, 56, 56);

    scene.add.text(x, y, '🏪', { fontSize: '22px' }).setOrigin(0.5, 0.5).setDepth(2);
    scene.add.text(x, y + 20, 'SHOP', {
      fontSize: '9px', color: '#ffdd88', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(2);

    this.prompt = scene.add.text(x, y + 36, '[E] Shop', {
      fontSize: '12px', color: '#ffff88', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10).setVisible(false);
  }

  update(playerX, playerY) {
    const inRange = Math.hypot(playerX - this.x, playerY - this.y) < INTERACT_DIST;
    this.prompt.setVisible(inRange);
    return inRange;
  }
}
