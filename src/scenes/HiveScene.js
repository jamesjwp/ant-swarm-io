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
    this._buildBeeTooltip();
  }

  _rebuildInv() {
    this._invBeesCont.removeAll(true);

    const gs  = this.scene.get('GameScene');
    const CW  = ROOT3 * INV_R + 8, RH = INV_R * 1.5 + 6;
    const gW  = (INV_COLS - 1) * CW + CW / 2 + INV_R * 2;
    const OX  = (this._invW - gW) / 2 + INV_R;
    const OY  = 52 + INV_R;

    for (let i = 0; i < gs.ownedBees.length; i++) {
      const entry  = gs.ownedBees[i];
      const col    = i % INV_COLS, row = Math.floor(i / INV_COLS);
      const lx     = OX + col * CW + (row & 1) * (CW / 2);
      const ly     = OY + row * RH;
      const isEq   = !!entry.ant;
      const bondLv = Math.min(5, Math.floor((entry.bond ?? 0) / 100));

      const g = this.add.graphics();
      // Gifted bees get a golden sparkle border
      if (entry.gifted) {
        drawHex(g, lx, ly, INV_R,
          isEq ? 0x1e1600 : 0x110e07, 1,
          0xffd700, 1, 2);
      } else {
        drawHex(g, lx, ly, INV_R,
          isEq ? 0x1e1600 : 0x110e07, 1,
          isEq ? 0xc8a030 : 0x7a5c20, isEq ? 0.6 : 0.45, isEq ? 2 : 1);
      }

      const icon = this.add.image(lx, ly, entry.type.textureKey).setScale(2.4).setAlpha(isEq ? 0.35 : 1);

      // Bond level indicator at bottom of hex
      const bondItems = [];
      if (bondLv > 0) {
        const bondTxt = this.add.text(lx, ly + INV_R - 5, `♥${bondLv}`, {
          fontSize: '8px', color: '#ff99cc', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5, 1);
        bondItems.push(bondTxt);
      }
      // Gifted star overlay
      if (entry.gifted) {
        const star = this.add.text(lx + INV_R - 6, ly - INV_R + 4, '✨', { fontSize: '9px' }).setOrigin(0.5);
        bondItems.push(star);
      }

      if (isEq) {
        const dot = this.add.text(lx, ly + INV_R - 7, '●', { fontSize: '8px', color: '#f5c800' }).setOrigin(0.5);
        this._invBeesCont.add([g, icon, dot, ...bondItems]);
      } else {
        const hz = this.add.zone(lx, ly, INV_R * 2, INV_R * 1.8).setInteractive({ useHandCursor: true });
        hz.on('pointerover', () => {
          g.clear();
          drawHex(g, lx, ly, INV_R, 0x282010, 1, entry.gifted ? 0xffd700 : 0xffe060, 1, 2);
          this._showBeeTooltip(entry);
        });
        hz.on('pointerout', () => {
          g.clear();
          if (entry.gifted) {
            drawHex(g, lx, ly, INV_R, 0x110e07, 1, 0xffd700, 1, 2);
          } else {
            drawHex(g, lx, ly, INV_R, 0x110e07, 1, 0x7a5c20, 0.45, 1);
          }
          this._hideBeeTooltip();
        });
        hz.on('pointerdown', p => this._startBeeDrag(entry, p.x, p.y));
        this._invBeesCont.add([g, icon, hz, ...bondItems]);
      }
    }
  }

  _buildBeeTooltip() {
    const W = this._invW, TY = 548, TH = 124;
    const barX = 20, barW = W - 40;

    const bg = this.add.graphics();
    bg.fillStyle(0x0c0a06, 0.96);
    bg.fillRoundedRect(8, TY, W - 16, TH, 4);
    bg.lineStyle(1, 0x7a5c20, 0.7);
    bg.strokeRoundedRect(8, TY, W - 16, TH, 4);

    this._ttName    = this.add.text(W / 2, TY + 10, '', { fontSize: '12px', color: '#ddcc88', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5, 0);
    this._ttBond    = this.add.text(W / 2, TY + 28, '', { fontSize: '10px', color: '#aaddaa' }).setOrigin(0.5, 0);
    const barBg     = this.add.rectangle(barX, TY + 44, barW, 7, 0x1a1408, 1).setOrigin(0, 0);
    this._ttBarFill = this.add.rectangle(barX, TY + 44, 1, 7, 0xffaa00, 1).setOrigin(0, 0);
    this._ttBarMaxW = barW;

    this._ttStarBtn = this.add.text(W / 2 - 64, TY + 62, '⭐ Star Treat (0)', {
      fontSize: '11px', color: '#ffff44', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#222200', padding: { x: 5, y: 3 },
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    this._ttStarBtn.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (this._tooltipEntry && gs.applyStarTreat(this._tooltipEntry)) this._showBeeTooltip(this._tooltipEntry);
    });
    this._ttStarBtn.on('pointerover', () => this._ttStarBtn.setColor('#ffffff'));
    this._ttStarBtn.on('pointerout',  () => this._ttStarBtn.setColor('#ffff44'));

    this._ttJellyBtn = this.add.text(W / 2 + 70, TY + 62, '👑 Royal Jelly (0)', {
      fontSize: '11px', color: '#ff88ff', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#220022', padding: { x: 5, y: 3 },
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    this._ttJellyBtn.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (this._tooltipEntry && gs.applyRoyalJelly(this._tooltipEntry)) {
        this._showBeeTooltip(this._tooltipEntry);
        this._rebuildInv();
      }
    });
    this._ttJellyBtn.on('pointerover', () => this._ttJellyBtn.setColor('#ffffff'));
    this._ttJellyBtn.on('pointerout',  () => this._ttJellyBtn.setColor('#ff88ff'));

    this._ttGifted = this.add.text(W / 2, TY + 92, '', { fontSize: '10px', color: '#ffffaa', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5, 0);

    this._tooltipCont = this.add.container(0, 0, [bg, this._ttName, this._ttBond, barBg, this._ttBarFill, this._ttStarBtn, this._ttJellyBtn, this._ttGifted]);
    this._invWin.add(this._tooltipCont);
    this._tooltipEntry = null;
    this._tooltipCont.setVisible(false);
  }

  _showBeeTooltip(entry) {
    this._tooltipEntry = entry;
    const bond     = entry.bond ?? 0;
    const bondLv   = Math.min(5, Math.floor(bond / 100));
    const xpInLv   = bond % 100;
    const isMax    = bondLv >= 5;
    const statPct  = Math.round((entry.gifted ? 1.2 : 1.0) * (1 + bondLv * 0.05) * 100 - 100);

    this._ttName.setText(`${entry.type.name}${entry.gifted ? '  ✨ Gifted' : ''}`);
    this._ttBond.setText(isMax ? `Bond: MAX  (+${statPct}% stats)` : `Bond Lv.${bondLv}  ·  ${xpInLv}/100 XP  (+${statPct}% stats)`);
    this._ttBarFill.width = isMax ? this._ttBarMaxW : Math.max(1, Math.round((xpInLv / 100) * this._ttBarMaxW));

    const gs = this.scene.get('GameScene');
    const stars   = gs?.starTreats   ?? 0;
    const jellies = gs?.royalJellies ?? 0;
    this._ttStarBtn.setText(`⭐ Star Treat (${stars})`).setVisible(stars > 0 && !isMax);
    this._ttJellyBtn.setText(`👑 Royal Jelly (${jellies})`).setVisible(jellies > 0);
    this._ttGifted.setText(entry.gifted ? '✨ Gifted: +20% stat bonus included' : '');

    this._tooltipCont.setVisible(true);
  }

  _hideBeeTooltip() {
    this._tooltipCont?.setVisible(false);
    this._tooltipEntry = null;
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
