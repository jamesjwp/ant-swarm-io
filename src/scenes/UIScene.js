import Phaser from 'phaser';
import { FIELD_ZONES } from '../data/FieldZones.js';
import { BADGES }      from '../data/Badges.js';

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

    // Stat points (conditional) — click to open allocation panel
    this.statText   = this.add.text(LEFT, LEFT + ROW_H * 3, '', {
      fontSize: '13px', color: '#ffff55', stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setVisible(false).setInteractive({ useHandCursor: true });
    this.statText.on('pointerdown', () => this._toggleStatPanel());
    this.statText.on('pointerover', () => this.statText.setAlpha(0.75));
    this.statText.on('pointerout',  () => this.statText.setAlpha(1));

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

    this.badgeBtn = this.add.text(1264, 96, '[ 🏅 Badges ]', btnStyle)
      .setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.badgeBtn.on('pointerdown', () => this._toggleBadges());
    this.badgeBtn.on('pointerover', () => this.badgeBtn.setAlpha(0.75));
    this.badgeBtn.on('pointerout',  () => this.badgeBtn.setAlpha(1));

    // Streak display (bottom-left, above hint)
    this.streakText = this.add.text(LEFT, 654, '', {
      fontSize: '12px', color: '#ff7733', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setVisible(false);

    // Weather status label
    this._weatherLabel = this.add.text(LEFT, 672, '', {
      fontSize: '11px', color: '#88ccff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5);

    const hint = this.add.text(640, 700, 'WASD to move  ·  bees collect honey  ·  return home & press E to cash out  ·  visit the shop to buy upgrades', {
      fontSize: '13px', color: '#cccccc', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 1);
    this.time.delayedCall(5000, () => this.tweens.add({ targets: hint, alpha: 0, duration: 1500 }));

    this._buildMinimap();
    this._buildStatPanel();
    this._buildBadgePanel();
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

    const hasPoints = gs.statPoints > 0;
    this.statText.setText(`⭐ ${gs.statPoints} stat point${gs.statPoints > 1 ? 's' : ''} — click to spend!`);
    this.statText.setVisible(hasPoints);
    if (!hasPoints && this._statPanel?.visible) this._statPanel.setVisible(false);

    // Minimap refresh
    this._refreshMinimap(gs);

    // Stat alloc counts
    if (this._statAllocRefs && gs.statAlloc) {
      for (const [id, ref] of Object.entries(this._statAllocRefs)) {
        ref.setText(`×${gs.statAlloc[id] ?? 0}`);
      }
    }

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

    // Harvest streak
    if ((gs.comboCount ?? 0) > 0) {
      this.streakText.setText(`🔥 ×${(gs.comboMult ?? 1).toFixed(1)} Streak  (${gs.comboCount} hits)`).setVisible(true);
    } else {
      this.streakText.setVisible(false);
    }

    // Weather status
    if (gs.weather) {
      this._weatherLabel?.setText(`${gs.weather.name}  ${Math.ceil(gs.weather.timeLeft / 1000)}s`);
    } else {
      this._weatherLabel?.setText('');
    }

    // Badge panel rows
    if (this._badgeRows && gs.badges) {
      for (const [id, row] of Object.entries(this._badgeRows)) {
        const earned = gs.badges.has(id);
        row.nameText.setColor(earned ? '#ffffff' : '#555555');
        row.icon.setAlpha(earned ? 1 : 0.35);
      }
      const earned = gs.badges.size;
      this.badgeBtn.setText(`[ 🏅 ${earned}/${BADGES.length} ]`);
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

  // ── Minimap ───────────────────────────────────────────────────────────────

  _buildMinimap() {
    const MINI_W = 160, MINI_H = 160;
    const MX = 1280 - 14 - MINI_W;   // 1106
    const MY = 720  - 14 - MINI_H;   // 546
    this._miniX = MX;
    this._miniY = MY;
    this._miniW = MINI_W;
    this._miniH = MINI_H;

    const WORLD_W = 3200, WORLD_H = 3200, VILLAGE_H = 400;
    const sx = MINI_W / WORLD_W;
    const sy = MINI_H / WORLD_H;
    const farmH = WORLD_H - VILLAGE_H;

    // Static background
    const bg = this.add.graphics();
    bg.fillStyle(0x111111, 0.88);
    bg.fillRect(MX, MY, MINI_W, MINI_H);

    // Zone bands
    for (const zone of FIELD_ZONES) {
      const top = Math.max(0, zone.minY);
      const bot = Math.min(farmH, zone.maxY === Infinity ? farmH : zone.maxY);
      bg.fillStyle(zone.bgTint, 0.28);
      bg.fillRect(MX, MY + Math.round(top * sy), MINI_W, Math.max(1, Math.round((bot - top) * sy)));
    }

    // Village band
    bg.fillStyle(0x8b6914, 0.38);
    bg.fillRect(MX, MY + Math.round(farmH * sy), MINI_W, MINI_H - Math.round(farmH * sy));

    // Border
    bg.lineStyle(1, 0x888888, 0.9);
    bg.strokeRect(MX, MY, MINI_W, MINI_H);

    // Dynamic layer
    this._minimapDyn = this.add.graphics();

    // Header
    this.add.text(MX + MINI_W / 2, MY - 2, 'MAP', {
      fontSize: '9px', color: '#aaaaaa', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1);

    this._dayPhaseLabel = this.add.text(MX + MINI_W - 2, MY - 2, 'Day', {
      fontSize: '9px', color: '#ffee88', stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 1);
  }

  _refreshMinimap(gs) {
    if (!this._minimapDyn) return;
    const sx = this._miniW / 3200;
    const sy = this._miniH / 3200;
    const MX = this._miniX;
    const MY = this._miniY;
    const g  = this._minimapDyn;
    g.clear();

    // Static NPCs
    const npcs = [
      { x: gs.homeTile?.x,   y: gs.homeTile?.y,   color: 0xffff44, w: 4, h: 4 },
      { x: gs.shop?.x,       y: gs.shop?.y,       color: 0x44ff88, w: 4, h: 4 },
      { x: gs.bear?.x,       y: gs.bear?.y,       color: 0xcc7733, w: 3, h: 3 },
      { x: gs.motherBear?.x, y: gs.motherBear?.y, color: 0xff8844, w: 3, h: 3 },
      { x: gs.brownBear?.x,  y: gs.brownBear?.y,  color: 0x8b4513, w: 3, h: 3 },
      { x: gs.spiritBear?.x, y: gs.spiritBear?.y, color: 0xaabbff, w: 3, h: 3 },
    ];
    for (const n of npcs) {
      if (n.x == null) continue;
      g.fillStyle(n.color, 0.9);
      g.fillRect(MX + Math.round(n.x * sx) - Math.floor(n.w / 2), MY + Math.round(n.y * sy) - Math.floor(n.h / 2), n.w, n.h);
    }

    // World tokens
    for (const tok of (gs.worldTokens ?? [])) {
      const tc = tok.type === 'honey' ? 0xf5c800 : tok.type === 'cash' ? 0x44cc44 : 0xffffff;
      g.fillStyle(tc, 0.8);
      g.fillRect(MX + Math.round(tok.x * sx) - 1, MY + Math.round(tok.y * sy) - 1, 2, 2);
    }

    // Player dot
    g.fillStyle(0xffffff, 1);
    g.fillCircle(MX + Math.round(gs.player?.x * sx), MY + Math.round(gs.player?.y * sy), 3);

    // Day phase label
    const PHASE_LABELS = { day: 'Day ☀', dusk: 'Dusk 🌆', night: 'Night 🌙', dawn: 'Dawn 🌤' };
    this._dayPhaseLabel?.setText(PHASE_LABELS[gs.dayPhase] ?? 'Day ☀');
  }

  // ── Stat Panel ────────────────────────────────────────────────────────────

  _buildStatPanel() {
    const PX = LEFT;
    const PY = LEFT + ROW_H * 3 + 18;
    const PANEL_W = 192;

    const stats = [
      { id: 'agility',  icon: '👟', label: 'Agility',  desc: '+4% bee spd, +18 run' },
      { id: 'capacity', icon: '🎒', label: 'Capacity', desc: '+8 honey storage'     },
      { id: 'commerce', icon: '💹', label: 'Commerce', desc: '+15% cash per sell'   },
      { id: 'fortune',  icon: '🍀', label: 'Fortune',  desc: '+6px token pickup'    },
    ];
    const ROW    = 30;
    const PANEL_H = stats.length * ROW + 12;

    const cont = this.add.container(PX, PY);

    const bg = this.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x000000, 0.84).setOrigin(0, 0);
    const bd = this.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x000000, 0).setStrokeStyle(1, 0x666666, 0.9).setOrigin(0, 0);
    cont.add([bg, bd]);

    this._statAllocRefs = {};

    for (let i = 0; i < stats.length; i++) {
      const s  = stats[i];
      const ry = 6 + i * ROW;

      const lbl = this.add.text(8, ry + 8, `${s.icon} ${s.label}`, {
        fontSize: '12px', color: '#eeeeee', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0, 0.5);

      const desc = this.add.text(8, ry + 21, s.desc, {
        fontSize: '9px', color: '#999999', stroke: '#000', strokeThickness: 1,
      }).setOrigin(0, 0.5);

      const allocTxt = this.add.text(PANEL_W - 44, ry + 8, '×0', {
        fontSize: '11px', color: '#88ccff', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5, 0.5);

      const btn = this.add.text(PANEL_W - 10, ry + 8, '[+]', {
        fontSize: '13px', color: '#ffff55', stroke: '#000', strokeThickness: 3,
        backgroundColor: '#00000088', padding: { x: 3, y: 1 },
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

      const sid = s.id;
      btn.on('pointerdown', () => this.scene.get('GameScene')?.spendStatPoint(sid));
      btn.on('pointerover', () => btn.setAlpha(0.7));
      btn.on('pointerout',  () => btn.setAlpha(1));

      cont.add([lbl, desc, allocTxt, btn]);
      this._statAllocRefs[s.id] = allocTxt;
    }

    this._statPanel = cont;
    cont.setVisible(false);
  }

  _toggleStatPanel() {
    if (!this._statPanel) return;
    this._statPanel.setVisible(!this._statPanel.visible);
  }

  // ── Weather Banner ────────────────────────────────────────────────────────

  _showWeatherBanner(name) {
    const t = this.add.text(640, 58, name, {
      fontSize: '22px', color: '#ffffff', stroke: '#000000', strokeThickness: 5,
      fontStyle: 'bold', backgroundColor: '#00000099', padding: { x: 18, y: 7 },
    }).setOrigin(0.5, 0.5).setDepth(500);
    this.tweens.add({ targets: t, alpha: 0, duration: 900, delay: 3500, ease: 'Quad.In', onComplete: () => t.destroy() });
  }

  // ── Badge Panel ───────────────────────────────────────────────────────────

  _buildBadgePanel() {
    const COL_W = 200;
    const ROW_H = 26;
    const COLS  = 2;
    const ROWS  = Math.ceil(BADGES.length / COLS);
    const PW    = COL_W * COLS + 16;
    const PH    = ROWS * ROW_H + 30;
    const PX    = 1264 - PW;
    const PY    = 136;

    const cont = this.add.container(PX, PY);
    const bg   = this.add.rectangle(0, 0, PW, PH, 0x000000, 0.88).setOrigin(0, 0);
    const bd   = this.add.rectangle(0, 0, PW, PH, 0x000000, 0).setStrokeStyle(1, 0x666666, 0.8).setOrigin(0, 0);
    const hdr  = this.add.text(PW / 2, 10, '🏅 Badges', {
      fontSize: '13px', color: '#ffdd44', stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    cont.add([bg, bd, hdr]);

    this._badgeRows = {};
    for (let i = 0; i < BADGES.length; i++) {
      const b   = BADGES[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const bx  = 8 + col * COL_W;
      const by  = 24 + row * ROW_H;

      const icon = this.add.text(bx + 2, by, b.icon, { fontSize: '13px' }).setOrigin(0, 0.5);
      const nameText = this.add.text(bx + 22, by, b.name, {
        fontSize: '10px', color: '#555555', stroke: '#000', strokeThickness: 1,
      }).setOrigin(0, 0.5);

      cont.add([icon, nameText]);
      this._badgeRows[b.id] = { icon, nameText };
    }

    this._badgePanel = cont;
    cont.setVisible(false);
  }

  _toggleBadges() {
    if (!this._badgePanel) return;
    const open = !this._badgePanel.visible;
    this._badgePanel.setVisible(open);
    this.badgeBtn.setColor(open ? '#ff8888' : '#ffdd44');
  }
}
