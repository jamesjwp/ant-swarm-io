import Phaser from 'phaser';

const ROOT3 = Math.sqrt(3);

function hexPts(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}
function drawHex(g, cx, cy, r, fill, fa, stroke, sa, sw = 2) {
  g.fillStyle(fill, fa);       g.fillPoints(hexPts(cx, cy, r), true);
  g.lineStyle(sw, stroke, sa); g.strokePoints(hexPts(cx, cy, r), true);
}

const SL = {
  locked: [0x0c0a08, 1, 0x151008, 0.28, 1],
  empty:  [0x100e08, 1, 0x5a4010, 0.6,  1],
  filled: [0x3c2a00, 1, 0xf5c800, 1,    2],
};

const EQ_R    = 26, EQ_COLS = 8, EQ_ROWS = 5;
const INV_R   = 28, INV_COLS = 4;
const WIN_BG  = 0x07060f;
const WIN_BDR = 0x3d2e12;
const WIN_BDR2= 0x5a4020;

export default class HiveScene extends Phaser.Scene {
  constructor() { super({ key: 'HiveScene' }); }

  create() {
    this._winDrag  = null;
    this._beeDrag  = null;
    this._eqSlots  = [];

    this._buildEquipWin();
    this._buildInvWin();
    this._eqWin.setVisible(false);
    this._invWin.setVisible(false);

    this.input.keyboard.on('keydown-ESC', () => this._closeAll());
    this.input.on('pointermove', p => this._onMove(p));
    this.input.on('pointerup',   p => this._onUp(p));
    this.events.on('wake', () => { this._cancelBeeDrag(); this._rebuildAll(); this.scene.get('UIScene')._applyToHive(); });
    this.scene.get('UIScene')._applyToHive();
  }

  _closeAll() {
    this._cancelBeeDrag();
    this._eqWin.setVisible(false);
    this._invWin.setVisible(false);
    const ui = this.scene.get('UIScene');
    ui._eqOpen = false;
    ui._invOpen = false;
    ui._updateButtons();
    this.scene.sleep('HiveScene');
  }

  _closeEquip() {
    this._eqWin.setVisible(false);
    const ui = this.scene.get('UIScene');
    ui._eqOpen = false;
    ui._updateButtons();
    if (!ui._invOpen) { this._cancelBeeDrag(); this.scene.sleep('HiveScene'); }
  }

  _closeInv() {
    this._invWin.setVisible(false);
    const ui = this.scene.get('UIScene');
    ui._invOpen = false;
    ui._updateButtons();
    if (!ui._eqOpen) { this._cancelBeeDrag(); this.scene.sleep('HiveScene'); }
  }

  // ── Shared window chrome ────────────────────────────────────────────────

  _addChrome(win, W, H, title) {
    const g = this.add.graphics();
    g.fillStyle(WIN_BG, 1);     g.fillRect(0, 0, W, H);
    g.lineStyle(1, WIN_BDR,  0.9); g.strokeRect(0, 0, W, H);
    g.lineStyle(1, WIN_BDR2, 0.18); g.strokeRect(2, 2, W-4, H-4);
    g.lineStyle(1, WIN_BDR,  0.4);  g.lineBetween(10, 42, W-10, 42);
    win.add(g);

    win.add(this.add.text(W / 2, 16, title, {
      fontSize: '13px', color: '#b07820', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0));

    const dz = this.add.zone(W / 2 - 15, 21, W - 30, 42).setInteractive();
    dz.on('pointerdown', p => {
      this._winDrag = { win, ox: p.x - win.x, oy: p.y - win.y };
      win.setDepth(20);
    });
    win.add(dz);
  }

  // ── Equipment Window ────────────────────────────────────────────────────

  _buildEquipWin() {
    const [W, H] = [810, 684];
    this._eqWin = this.add.container(12, 18).setDepth(10);
    this._addChrome(this._eqWin, W, H, 'E Q U I P M E N T');

    const cl = this.add.text(W - 10, 10, '✕', {
      fontSize: '14px', color: '#4a3820', stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    cl.on('pointerdown', () => this._closeEquip());
    cl.on('pointerover', () => cl.setColor('#dddddd'));
    cl.on('pointerout',  () => cl.setColor('#4a3820'));
    this._eqWin.add(cl);

    const logoG = this.add.graphics();
    const LR = 16, lCx = 52, lCy = 115;
    const pts = [[lCx, lCy], ...Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i;
      return [lCx + ROOT3 * LR * Math.cos(a), lCy + ROOT3 * LR * Math.sin(a)];
    })];
    for (const [hx, hy] of pts) drawHex(logoG, hx, hy, LR, 0x1e1600, 0.9, 0xa87020, 0.5, 1);
    this._eqWin.add(logoG);

    this._eqInfo = this.add.text(W / 2, H - 14, '', {
      fontSize: '11px', color: '#6a5020', letterSpacing: 3,
    }).setOrigin(0.5, 1);
    this._eqWin.add(this._eqInfo);

    this._beeCounter = this.add.text(W - 14, 24, '', {
      fontSize: '12px', color: '#c8a030', stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0.5);
    this._eqWin.add(this._beeCounter);

    this._eqSlotsCont = this.add.container(0, 0);
    this._eqWin.add(this._eqSlotsCont);

    this._eqW = W; this._eqH = H;
    this._rebuildEquip();
  }

  _rebuildEquip() {
    this._eqSlotsCont.removeAll(true);
    this._eqSlots = [];

    const gs      = this.scene.get('GameScene');
    const equipped = gs.ownedBees.filter(b => b.ant);

    const CW = ROOT3 * EQ_R + 6, RH = EQ_R * 1.5 + 5;
    const gW = (EQ_COLS - 1) * CW + CW / 2 + EQ_R * 2;
    const gH = (EQ_ROWS - 1) * RH + EQ_R * 2;
    const OX = (this._eqW - gW) / 2 + EQ_R;
    const OY = 48 + (this._eqH - 48 - 28 - gH) / 2 + EQ_R;

    for (let i = 0; i < EQ_ROWS * EQ_COLS; i++) {
      const col    = i % EQ_COLS, row = Math.floor(i / EQ_COLS);
      const lx     = OX + col * CW + (row & 1) * (CW / 2);
      const ly     = OY + row * RH;
      const active = i < gs.maxHiveCells;
      const entry  = active ? (equipped[i] ?? null) : null;
      const g      = this.add.graphics();

      if (!active) {
        drawHex(g, lx, ly, EQ_R, ...SL.locked);
        this._eqSlotsCont.add(g);
      } else if (entry) {
        drawHex(g, lx, ly, EQ_R, ...SL.filled);
        const icon = this.add.image(lx, ly, entry.type.textureKey).setScale(2.5);
        const xBtn = this.add.text(lx + EQ_R - 2, ly - EQ_R + 3, '✕', {
          fontSize: '10px', color: '#ee6666', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        xBtn.on('pointerdown', () => { gs.unequipBee(entry); this._rebuildAll(); });
        xBtn.on('pointerover', () => xBtn.setColor('#ff3333'));
        xBtn.on('pointerout',  () => xBtn.setColor('#ee6666'));
        this._eqSlotsCont.add([g, icon, xBtn]);
      } else {
        drawHex(g, lx, ly, EQ_R, ...SL.empty);
        this._eqSlotsCont.add(g);
      }
      this._eqSlots.push({ lx, ly, active, filled: !!entry });
    }

    const dep = equipped.length;
    this._eqInfo.setText(`${dep}  /  ${gs.maxHiveCells}  E Q U I P P E D`);
    this._beeCounter.setText(`🐝 ${dep} / ${gs.maxHiveCells}`);
  }

  // ── Inventory Window ────────────────────────────────────────────────────

  _buildInvWin() {
    const [W, H] = [430, 684];
    this._invWin = this.add.container(846, 18).setDepth(10);
    this._addChrome(this._invWin, W, H, 'I N V E N T O R Y');

    const cl = this.add.text(W - 10, 10, '✕', {
      fontSize: '14px', color: '#4a3820', stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    cl.on('pointerdown', () => this._closeInv());
    cl.on('pointerover', () => cl.setColor('#dddddd'));
    cl.on('pointerout',  () => cl.setColor('#4a3820'));
    this._invWin.add(cl);

    this._invBeesCont = this.add.container(0, 0);
    this._invWin.add(this._invBeesCont);

    this._invW = W; this._invH = H;
    this._rebuildInv();
  }

  _rebuildInv() {
    this._invBeesCont.removeAll(true);

    const gs  = this.scene.get('GameScene');
    const CW  = ROOT3 * INV_R + 8, RH = INV_R * 1.5 + 6;
    const gW  = (INV_COLS - 1) * CW + CW / 2 + INV_R * 2;
    const OX  = (this._invW - gW) / 2 + INV_R;
    const OY  = 52 + INV_R;

    for (let i = 0; i < gs.ownedBees.length; i++) {
      const entry = gs.ownedBees[i];
      const col = i % INV_COLS, row = Math.floor(i / INV_COLS);
      const lx  = OX + col * CW + (row & 1) * (CW / 2);
      const ly  = OY + row * RH;
      const isEq = !!entry.ant;

      const g = this.add.graphics();
      drawHex(g, lx, ly, INV_R,
        isEq ? 0x1e1600 : 0x110e07, 1,
        isEq ? 0xc8a030 : 0x7a5c20, isEq ? 0.6 : 0.45, isEq ? 2 : 1);

      const icon = this.add.image(lx, ly, entry.type.textureKey).setScale(2.4).setAlpha(isEq ? 0.35 : 1);

      if (isEq) {
        const dot = this.add.text(lx, ly + INV_R - 7, '●', { fontSize: '8px', color: '#f5c800' }).setOrigin(0.5);
        this._invBeesCont.add([g, icon, dot]);
      } else {
        const hz = this.add.zone(lx, ly, INV_R * 2, INV_R * 1.8).setInteractive({ useHandCursor: true });
        hz.on('pointerover', () => { g.clear(); drawHex(g, lx, ly, INV_R, 0x282010, 1, 0xffe060, 1, 2); });
        hz.on('pointerout',  () => { g.clear(); drawHex(g, lx, ly, INV_R, 0x110e07, 1, 0x7a5c20, 0.45, 1); });
        hz.on('pointerdown', p => this._startBeeDrag(entry, p.x, p.y));
        this._invBeesCont.add([g, icon, hz]);
      }
    }
  }

  // ── Bee drag ────────────────────────────────────────────────────────────

  _startBeeDrag(entry, px, py) {
    this._cancelBeeDrag();
    const g    = this.add.graphics();
    drawHex(g, 0, 0, INV_R, 0x5a4000, 0.92, 0xffe040, 1, 2);
    const icon = this.add.image(0, 0, entry.type.textureKey).setScale(2.4);
    this._beeDrag = { entry, ghost: this.add.container(px, py, [g, icon]).setDepth(200) };
  }

  _cancelBeeDrag() {
    if (this._beeDrag) { this._beeDrag.ghost.destroy(true); this._beeDrag = null; }
  }

  // ── Input handlers ──────────────────────────────────────────────────────

  _onMove(pointer) {
    if (this._winDrag) {
      this._winDrag.win.setPosition(pointer.x - this._winDrag.ox, pointer.y - this._winDrag.oy);
    } else if (this._beeDrag) {
      this._beeDrag.ghost.setPosition(pointer.x, pointer.y);
    }
  }

  _onUp(pointer) {
    if (this._winDrag) { this._winDrag.win.setDepth(10); this._winDrag = null; return; }
    if (!this._beeDrag) return;

    const { entry, ghost } = this._beeDrag;
    this._beeDrag = null;
    ghost.destroy(true);
    if (entry.ant) return;

    const gs = this.scene.get('GameScene');
    const wx = this._eqWin.x, wy = this._eqWin.y;
    let best = null, bestD = EQ_R * 1.6;
    for (const s of this._eqSlots) {
      if (!s.active || s.filled) continue;
      const d = Math.hypot(pointer.x - (wx + s.lx), pointer.y - (wy + s.ly));
      if (d < bestD) { bestD = d; best = s; }
    }
    if (best) { gs.equipBee(entry); this._rebuildAll(); }
  }

  // ── Rebuild ─────────────────────────────────────────────────────────────

  _rebuildAll() { this._rebuildEquip(); this._rebuildInv(); }
}
