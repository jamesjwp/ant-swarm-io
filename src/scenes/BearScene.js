import Phaser from 'phaser';

const W = 1280, H = 720;
const PW = 560, PH = 500;
const PX = (W - PW) / 2, PY = (H - PH) / 2;
const PAD = 20;

export default class BearScene extends Phaser.Scene {
  constructor() { super({ key: 'BearScene' }); }

  create() {
    // Dim overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(0);

    // Panel background
    this.add.rectangle(PX + PW / 2, PY + PH / 2, PW, PH, 0x1a0f04, 0.97)
      .setStrokeStyle(2, 0xaa7733).setDepth(1);

    // Title (updated dynamically in _rebuild)
    this._titleText = this.add.text(PX + PW / 2, PY + PAD + 10, '🐻  Black Bear', {
      fontSize: '22px', color: '#ffdd88', stroke: '#000', strokeThickness: 4, fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(2);

    this.add.text(PX + PW / 2, PY + PAD + 42, '"Hello, young beekeeper! I have tasks for you."', {
      fontSize: '12px', color: '#ccaa88', stroke: '#000', strokeThickness: 2, fontStyle: 'italic',
    }).setOrigin(0.5, 0).setDepth(2);

    // Divider
    this.add.graphics().setDepth(2)
      .lineStyle(1, 0xaa7733, 0.5)
      .lineBetween(PX + PAD, PY + 80, PX + PW - PAD, PY + 80);

    // X button
    const xBtn = this.add.text(PX + PW - PAD, PY + PAD, '✕', {
      fontSize: '18px', color: '#ff8888', stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(3).setInteractive({ useHandCursor: true });
    xBtn.on('pointerdown', () => this._close());
    xBtn.on('pointerover',  () => xBtn.setColor('#ff4444'));
    xBtn.on('pointerout',   () => xBtn.setColor('#ff8888'));

    this.input.keyboard.on('keydown-ESC', () => this._close());

    this._questContainer = this.add.container(0, 0).setDepth(2);
    this._rebuild();

    // Refresh every 500ms so claim buttons enable in real time
    this.time.addEvent({ delay: 500, loop: true, callback: () => this._rebuild() });
    this.events.on('wake', () => this._rebuild());
  }

  _rebuild() {
    this._questContainer.removeAll(true);

    const gs = this.scene.get('GameScene');
    const isMother = gs?._activeBear === 'mother';
    const quests   = isMother ? gs?.motherBearQuests : gs?.bearQuests;
    if (!quests) return;

    this._titleText.setText(isMother ? '🐻  Mother Bear' : '🐻  Black Bear');

    const rowH   = 58;
    const startY = PY + 90;

    quests.forEach((q, i) => {
      const ry = startY + i * rowH;
      const done = q.check(gs);

      // Row bg
      const rowBg = this.add.rectangle(PX + PW / 2, ry + rowH / 2 - 2, PW - PAD * 2, rowH - 6,
        q.claimed ? 0x0a1a0a : done ? 0x1a2a0a : 0x100808, 0.9)
        .setStrokeStyle(1, q.claimed ? 0x226622 : done ? 0x44aa44 : 0x443322);

      // Status icon
      const statusIcon = this.add.text(PX + PAD + 6, ry + rowH / 2 - 4,
        q.claimed ? '✅' : done ? '🟢' : '⬜', { fontSize: '16px' }).setOrigin(0, 0.5);

      // Quest icon + description
      const descText = this.add.text(PX + PAD + 34, ry + 10,
        `${q.icon}  ${q.desc}`, {
          fontSize: '13px', color: q.claimed ? '#668866' : '#ddccaa', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0, 0);

      // Progress
      const progText = this.add.text(PX + PAD + 34, ry + 28,
        q.claimed ? '— Claimed —' : q.progress(gs), {
          fontSize: '11px', color: q.claimed ? '#558855' : done ? '#88ff88' : '#997766',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0, 0);

      // Reward label
      const rewardParts = [];
      if (q.reward.tickets) rewardParts.push(`+${q.reward.tickets} 🎫`);
      if (q.reward.sprouts) rewardParts.push(`+${q.reward.sprouts} 🌱`);
      const rewardText = this.add.text(PX + PW - PAD - (done && !q.claimed ? 80 : 10),
        ry + rowH / 2 - 4, rewardParts.join('  '), {
          fontSize: '12px', color: '#ffee88', stroke: '#000', strokeThickness: 2,
        }).setOrigin(1, 0.5);

      // Claim button (only when done & not claimed)
      let claimBtn = null;
      if (done && !q.claimed) {
        claimBtn = this.add.text(PX + PW - PAD - 4, ry + rowH / 2 - 4, '[ Claim! ]', {
          fontSize: '13px', color: '#ffff44', stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        claimBtn.on('pointerdown', () => { gs.claimBearQuest(q.id, isMother ? 'mother' : 'black'); this._rebuild(); });
        claimBtn.on('pointerover',  () => claimBtn.setColor('#ffffff'));
        claimBtn.on('pointerout',   () => claimBtn.setColor('#ffff44'));
      }

      this._questContainer.add([rowBg, statusIcon, descText, progText, rewardText, ...(claimBtn ? [claimBtn] : [])]);
    });
  }

  _close() {
    this.scene.sleep('BearScene');
  }
}
