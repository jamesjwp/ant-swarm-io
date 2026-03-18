import Phaser from 'phaser';

const LABEL_STYLE = { fontSize: '13px', color: '#cccccc', stroke: '#000000', strokeThickness: 3 };
const VAL_STYLE   = { fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };

const BAR_W = 130;
const BAR_H = 12;
const LBL_W = 62;
const ROW_H = 28;
const LEFT  = 14;

function makeBar(scene, x, y, bgColor, fillColor) {
  const bg   = scene.add.rectangle(x, y, BAR_W, BAR_H, bgColor, 0.85).setOrigin(0, 0.5);
  const fill = scene.add.rectangle(x, y, 0,     BAR_H, fillColor, 1).setOrigin(0, 0.5);
  return { bg, fill };
}

export default class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    const BX = LEFT + LBL_W;   // bar x

    // Row 0 — Honey
    this.honeyLabel = this.add.text(LEFT, LEFT + ROW_H * 0, '🍯 Honey', LABEL_STYLE).setOrigin(0, 0.5);
    this.honeyBar   = makeBar(this, BX, LEFT + ROW_H * 0, 0x3a2a00, 0xf5c800);
    this.honeyVal   = this.add.text(BX + BAR_W + 6, LEFT + ROW_H * 0, '0/10', VAL_STYLE).setOrigin(0, 0.5);

    // Row 1 — Cash
    this.cashLabel  = this.add.text(LEFT, LEFT + ROW_H * 1, '💰 Cash', LABEL_STYLE).setOrigin(0, 0.5);
    this.cashBar    = makeBar(this, BX, LEFT + ROW_H * 1, 0x0a2a0a, 0x44cc44);
    this.cashVal    = this.add.text(BX + BAR_W + 6, LEFT + ROW_H * 1, '0', VAL_STYLE).setOrigin(0, 0.5);

    // Below cash — tickets & sprouts (shown only when > 0)
    this.ticketText = this.add.text(BX + BAR_W + 6, LEFT + ROW_H * 1 + 12, '', {
      fontSize: '11px', color: '#ffff88', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0, 0.5).setVisible(false);
    this.sproutText = this.add.text(LEFT, LEFT + ROW_H * 1 + 12, '', {
      fontSize: '11px', color: '#88ff99', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0, 0.5).setVisible(false);
    // Consumables row (star treats / royal jelly)
    this.consumableText = this.add.text(LEFT, LEFT + ROW_H * 1 + 24, '', {
      fontSize: '11px', color: '#ffddff', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0, 0.5).setVisible(false);

    // Row 2 — XP
    this.levelText  = this.add.text(LEFT, LEFT + ROW_H * 2, 'Lv. 1', LABEL_STYLE).setOrigin(0, 0.5);
    this.xpBar      = makeBar(this, BX, LEFT + ROW_H * 2, 0x0a1a3a, 0x44aaff);
    this.xpVal      = this.add.text(BX + BAR_W + 6, LEFT + ROW_H * 2, '0/10 XP', VAL_STYLE).setOrigin(0, 0.5);

    // Stat points (conditional)
    this.statText   = this.add.text(LEFT, LEFT + ROW_H * 3, '', {
      fontSize: '13px', color: '#ffff55', stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setVisible(false);

    const btnStyle = { fontSize: '18px', color: '#ffdd44', stroke: '#000000', strokeThickness: 4, backgroundColor: '#00000099', padding: { x: 10, y: 5 } };

    this._eqOpen  = false;
    this._invOpen = false;

    this.eqBtn = this.add.text(1264, 16, '[ ⚙ Equip ]', btnStyle)
      .setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.eqBtn.on('pointerdown', () => this._toggleEquip());
    this.eqBtn.on('pointerover', () => this.eqBtn.setAlpha(0.75));
    this.eqBtn.on('pointerout',  () => this.eqBtn.setAlpha(1));

    this.invBtn = this.add.text(1264, 56, '[ 🎒 Inv ]', btnStyle)
      .setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.invBtn.on('pointerdown', () => this._toggleInv());
    this.invBtn.on('pointerover', () => this.invBtn.setAlpha(0.75));
    this.invBtn.on('pointerout',  () => this.invBtn.setAlpha(1));

    const hint = this.add.text(640, 700, 'WASD to move  ·  bees collect honey  ·  return home & press E to cash out  ·  visit the shop to buy upgrades', {
      fontSize: '13px', color: '#cccccc', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 1);
    this.time.delayedCall(5000, () => this.tweens.add({ targets: hint, alpha: 0, duration: 1500 }));
  }

  refresh(gs) {
    // Honey bar
    const hPct = gs.storageMax > 0 ? Math.min(gs.storage / gs.storageMax, 1) : 0;
    this.honeyBar.fill.setSize(Math.round(BAR_W * hPct), BAR_H);
    this.honeyVal.setText(`${gs.storage}/${gs.storageMax}`);

    // Cash bar — fills toward next bee cost
    const cPct = gs.nextAntCost > 0 ? Math.min(gs.cash / gs.nextAntCost, 1) : 1;
    this.cashBar.fill.setSize(Math.round(BAR_W * cPct), BAR_H);
    this.cashVal.setText(`${gs.cash} 💰`);

    // XP bar
    const xpNeeded = gs.xpForNextLevel();
    const xPct     = xpNeeded > 0 ? Math.min(gs.xp / xpNeeded, 1) : 0;
    this.xpBar.fill.setSize(Math.round(BAR_W * xPct), BAR_H);
    this.xpVal.setText(`${gs.xp}/${xpNeeded} XP`);
    this.levelText.setText(`Lv. ${gs.level}`);

    this.statText.setText(`⭐ ${gs.statPoints} stat point${gs.statPoints > 1 ? 's' : ''} available!`);
    this.statText.setVisible(gs.statPoints > 0);

    // Tickets (shown only when > 0)
    if (gs.tickets > 0) {
      this.ticketText.setText(`🎫 ${gs.tickets} ticket${gs.tickets !== 1 ? 's' : ''}`).setVisible(true);
    } else {
      this.ticketText.setVisible(false);
    }

    // Sprouts
    if (gs.sprouts > 0) {
      this.sproutText.setText(`🌱 ${gs.sprouts} sprout${gs.sprouts !== 1 ? 's' : ''}  [F]`).setVisible(true);
    } else {
      this.sproutText.setVisible(false);
    }

    // Consumables
    const parts = [];
    if ((gs.starTreats   ?? 0) > 0) parts.push(`⭐×${gs.starTreats}`);
    if ((gs.royalJellies ?? 0) > 0) parts.push(`👑×${gs.royalJellies}`);
    if (parts.length) {
      this.consumableText.setText(parts.join('  ')).setVisible(true);
    } else {
      this.consumableText.setVisible(false);
    }
  }

  _toggleEquip() {
    this._eqOpen = !this._eqOpen;
    this._updateButtons();
    this._syncHive();
  }

  _toggleInv() {
    this._invOpen = !this._invOpen;
    this._updateButtons();
    this._syncHive();
  }

  _updateButtons() {
    this.eqBtn.setText(this._eqOpen   ? '[ ✕ Equip ]' : '[ ⚙ Equip ]').setColor(this._eqOpen   ? '#ff8888' : '#ffdd44');
    this.invBtn.setText(this._invOpen ? '[ ✕ Inv ]'   : '[ 🎒 Inv ]') .setColor(this._invOpen ? '#ff8888' : '#ffdd44');
  }

  _syncHive() {
    const anyOpen = this._eqOpen || this._invOpen;
    if (anyOpen) {
      if (this.scene.isSleeping('HiveScene')) {
        this.scene.wake('HiveScene');
      } else if (!this.scene.isActive('HiveScene')) {
        this.scene.launch('HiveScene');
      } else {
        this._applyToHive();
      }
    } else {
      if (this.scene.isActive('HiveScene') && !this.scene.isSleeping('HiveScene')) {
        this.scene.get('HiveScene')._cancelBeeDrag();
        this.scene.sleep('HiveScene');
      }
    }
  }

  _applyToHive() {
    const hive = this.scene.get('HiveScene');
    if (!hive) return;
    hive._eqWin.setVisible(this._eqOpen);
    hive._invWin.setVisible(this._invOpen);
    if (this._eqOpen)  hive._rebuildEquip();
    if (this._invOpen) hive._rebuildInv();
  }
}
