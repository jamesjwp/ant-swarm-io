import Phaser from 'phaser';
import { SHOP_ITEMS } from '../data/ShopItems.js';

const W   = 440;
const CX  = 640;
const CY  = 360;
// Panel fills most of screen height; content area scrolls within it
const PANEL_H    = 620;
const HEADER_H   = 50;
const FOOTER_PAD = 12;
const CONTENT_H  = PANEL_H - HEADER_H - FOOTER_PAD;
const ROW_H      = 90;
const BEE_ROW_H  = 80;

const T = (color, size = '16px', bold = false) => ({
  fontSize: size, color, stroke: '#000000', strokeThickness: 3,
  fontStyle: bold ? 'bold' : 'normal',
});

export default class ShopScene extends Phaser.Scene {
  constructor() { super({ key: 'ShopScene' }); }

  create() {
    // Dim backdrop
    this.add.rectangle(CX, CY, 1280, 720, 0x000000, 0.55).setDepth(20);

    // Panel bg + border
    this.add.rectangle(CX, CY, W, PANEL_H, 0x1a1208, 0.97).setDepth(21);
    this.add.rectangle(CX, CY, W, PANEL_H, 0x000000, 0).setStrokeStyle(2, 0xddbb55, 0.9).setDepth(22);

    // Header
    const panelTop = CY - PANEL_H / 2;
    this.add.text(CX, panelTop + HEADER_H / 2, '🏪  Shop', T('#ffdd44', '22px', true))
      .setOrigin(0.5, 0.5).setDepth(23);

    // ESC hint
    this.add.text(CX - W / 2 + 10, panelTop + HEADER_H / 2, '[ESC]', T('#888888', '12px'))
      .setOrigin(0, 0.5).setDepth(23);

    // X close button
    const xBtn = this.add.text(CX + W / 2 - 14, panelTop + HEADER_H / 2, '✕', T('#888888', '18px', true))
      .setOrigin(1, 0.5).setDepth(23).setInteractive({ useHandCursor: true });
    xBtn.on('pointerover',  () => xBtn.setColor('#ff6666'));
    xBtn.on('pointerout',   () => xBtn.setColor('#888888'));
    xBtn.on('pointerdown',  () => this.scene.get('GameScene')._closeShop());

    // Clip mask for scrollable area
    const contentTop = panelTop + HEADER_H;
    this._maskShape = this.make.graphics({ add: false });
    this._maskShape.fillRect(CX - W / 2, contentTop, W, CONTENT_H);
    const clipMask = new Phaser.Display.Masks.GeometryMask(this, this._maskShape);

    // Scrollable container
    this._itemContainer = this.add.container(0, contentTop).setDepth(23);
    this._itemContainer.setMask(clipMask);
    this._scrollY      = 0;
    this._contentTop   = contentTop;
    this._totalH       = 0;

    // Scrollbar track
    this._sbTrack = this.add.rectangle(CX + W / 2 - 5, contentTop + CONTENT_H / 2, 4, CONTENT_H, 0x444433, 0.6).setDepth(24).setOrigin(0.5, 0.5);
    this._sbThumb = this.add.rectangle(CX + W / 2 - 5, contentTop, 4, 40, 0xddbb55, 0.9).setDepth(24).setOrigin(0.5, 0);

    // Scroll wheel
    const zone = this.add.zone(CX, contentTop + CONTENT_H / 2, W, CONTENT_H).setDepth(25).setInteractive();
    zone.on('wheel', (_p, _dx, dy) => this._scroll(dy * 0.8));

    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.events.on('wake', () => { this._scrollY = 0; this._rebuild(); }, this);
    this._rebuild();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.get('GameScene')._closeShop();
    }
  }

  _scroll(dy) {
    const maxScroll = Math.max(0, this._totalH - CONTENT_H);
    this._scrollY = Phaser.Math.Clamp(this._scrollY - dy, -maxScroll, 0);
    this._itemContainer.setY(this._contentTop + this._scrollY);
    this._updateScrollbar();
  }

  _updateScrollbar() {
    const maxScroll = Math.max(1, this._totalH - CONTENT_H);
    const thumbH    = Math.max(24, (CONTENT_H / Math.max(this._totalH, CONTENT_H)) * CONTENT_H);
    const thumbTravel = CONTENT_H - thumbH;
    const thumbY    = this._contentTop + (-this._scrollY / maxScroll) * thumbTravel;
    this._sbThumb.setPosition(this._sbThumb.x, thumbY).setSize(4, thumbH);
    this._sbTrack.setVisible(this._totalH > CONTENT_H);
    this._sbThumb.setVisible(this._totalH > CONTENT_H);
  }

  _rebuild() {
    this._itemContainer.removeAll(true);
    this._itemContainer.setY(this._contentTop);
    this._scrollY = 0;

    const gs = this.scene.get('GameScene');
    if (!gs) return;

    let curY = 0; // Y offset inside container (relative to contentTop)

    // ── Upgrade rows ──────────────────────────────────────────────────────
    SHOP_ITEMS.forEach(item => {
      const level     = gs.upgrades[item.id] ?? 0;
      const cost      = item.getCost(level);
      const canAfford = gs.cash >= cost;

      this._addRow(gs, curY, ROW_H, item, level, cost, canAfford,
        () => { if (gs.buyUpgrade(item.id)) this._rebuild(); });
      curY += ROW_H;
    });

    // ── Divider ───────────────────────────────────────────────────────────
    const div = this.add.rectangle(CX, this._contentTop + curY + 4, W - 30, 1, 0x887744, 0.5);
    this._itemContainer.add(div);
    curY += 10;

    // ── Buy Random Bee ────────────────────────────────────────────────────
    const beeCost   = gs.nextAntCost;
    const canAfford = gs.cash >= beeCost;
    const by        = curY;

    const beeBg = this.add.rectangle(CX, this._contentTop + by + BEE_ROW_H / 2, W - 30, BEE_ROW_H - 8, 0x2a1e0a, 0.8)
      .setStrokeStyle(1, canAfford ? 0x887744 : 0x443322, 0.7);
    const beeTitle = this.add.text(CX - W / 2 + 24, this._contentTop + by + 8,  '🐝  Buy Random Bee', T('#ffdd88', '16px', true));
    const beeDesc  = this.add.text(CX - W / 2 + 28, this._contentTop + by + 34, 'Rare bees have special abilities!', T('#ccbbaa', '13px'));
    const beeCostT = this.add.text(CX - W / 2 + 28, this._contentTop + by + 52, `Cost: ${beeCost} 💰`, T(canAfford ? '#ffdd44' : '#886644', '14px', true));
    const beeBtnBg = this.add.rectangle(CX + W / 2 - 54, this._contentTop + by + 52, 80, 24, canAfford ? 0x4a7a2a : 0x333333, 1)
      .setStrokeStyle(1, canAfford ? 0x88ff44 : 0x555555);
    const beeBtnTx = this.add.text(CX + W / 2 - 54, this._contentTop + by + 52, 'Buy', T(canAfford ? '#ccffaa' : '#666666', '14px', true)).setOrigin(0.5, 0.5);

    if (canAfford) {
      beeBtnBg.setInteractive({ useHandCursor: true });
      beeBtnBg.on('pointerover', () => beeBtnBg.setFillStyle(0x6aaa3a));
      beeBtnBg.on('pointerout',  () => beeBtnBg.setFillStyle(0x4a7a2a));
      beeBtnBg.on('pointerdown', () => { if (gs.tryBuyAnt()) this._rebuild(); });
    }
    this._itemContainer.add([beeBg, beeTitle, beeDesc, beeCostT, beeBtnBg, beeBtnTx]);
    curY += BEE_ROW_H + 8;

    this._totalH = curY;
    this._updateScrollbar();
  }

  _addRow(gs, localY, rowH, item, level, cost, canAfford, onBuy) {
    const absY = this._contentTop + localY;

    const rowBg = this.add.rectangle(CX, absY + rowH / 2 - 4, W - 30, rowH - 8, 0x2a1e0a, 0.8);
    rowBg.setStrokeStyle(1, canAfford ? 0x887744 : 0x443322, 0.7);
    const nameText = this.add.text(CX - W / 2 + 24, absY + 10, `${item.icon}  ${item.name}`, T('#ffdd88', '16px', true));
    const badge    = this.add.text(CX + W / 2 - 24, absY + 14, `Lv ${level}`, T('#aaaaaa', '12px')).setOrigin(1, 0);
    const descText = this.add.text(CX - W / 2 + 28, absY + 36, item.desc(level), T('#ccbbaa', '13px'));
    const costText = this.add.text(CX - W / 2 + 28, absY + 56, `Cost: ${cost} 💰`, T(canAfford ? '#ffdd44' : '#886644', '14px', true));
    const btnBg    = this.add.rectangle(CX + W / 2 - 54, absY + 62, 80, 24, canAfford ? 0x4a7a2a : 0x333333, 1)
      .setStrokeStyle(1, canAfford ? 0x88ff44 : 0x555555);
    const btnText  = this.add.text(CX + W / 2 - 54, absY + 62, 'Buy', T(canAfford ? '#ccffaa' : '#666666', '14px', true)).setOrigin(0.5, 0.5);

    if (canAfford) {
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerover', () => btnBg.setFillStyle(0x6aaa3a));
      btnBg.on('pointerout',  () => btnBg.setFillStyle(0x4a7a2a));
      btnBg.on('pointerdown', onBuy);
    }

    this._itemContainer.add([rowBg, nameText, badge, descText, costText, btnBg, btnText]);
  }
}
