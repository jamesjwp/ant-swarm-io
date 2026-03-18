const INTERACT_DIST = 60;

const LABEL_STYLE = {
  fontSize: '13px', color: '#ffffff', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
};
const PROMPT_STYLE = {
  fontSize: '12px', color: '#ffff88', stroke: '#000000', strokeThickness: 3,
};

export default class HomeTile {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    // White tile
    this.tile = scene.add.rectangle(x, y, 48, 48, 0xffffff, 0.95).setDepth(0.5);
    scene.add.rectangle(x, y, 48, 48, 0x000000, 0).setStrokeStyle(2, 0xaaaaaa, 1).setDepth(0.6);

    this.label  = scene.add.text(x, y - 34, '🏠 Home', LABEL_STYLE).setOrigin(0.5, 1).setDepth(1);
    this.prompt = scene.add.text(x, y + 34, '[E] Cash out', PROMPT_STYLE).setOrigin(0.5, 0).setDepth(1).setVisible(false);
  }

  update(playerX, playerY) {
    const inRange = Math.hypot(playerX - this.x, playerY - this.y) < INTERACT_DIST;
    this.prompt.setVisible(inRange);
    return inRange;
  }
}
