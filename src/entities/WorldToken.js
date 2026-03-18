const BASE_COLLECT_DIST = 32;

const CFG = {
  honey:  { color: 0xf5c800, glow: 0xffe066, size: 6 },
  cash:   { color: 0x44cc44, glow: 0x88ff88, size: 5 },
  ticket: { color: 0xffffff, glow: 0xffff88, size: 5 },
};

const AMOUNTS = { honey: 8, cash: 12, ticket: 1 };

export default class WorldToken {
  constructor(scene, x, y, type = 'honey') {
    this.scene     = scene;
    this.type      = type;
    this.collected = false;

    const cfg = CFG[type];

    this._glow  = scene.add.circle(0, 0, cfg.size + 4, cfg.glow, 0.45);
    this._orb   = scene.add.circle(0, 0, cfg.size, cfg.color, 1);
    this._shine = scene.add.circle(-Math.floor(cfg.size * 0.4), -Math.floor(cfg.size * 0.4), Math.floor(cfg.size * 0.35), 0xffffff, 0.65);

    this._cont = scene.add.container(x, y, [this._glow, this._orb, this._shine]).setDepth(50);

    // Float tween
    scene.tweens.add({
      targets: this._cont, y: y - 7, duration: 950,
      ease: 'Sine.InOut', yoyo: true, repeat: -1,
    });

    // Pulse glow
    scene.tweens.add({
      targets: this._glow, scaleX: 1.5, scaleY: 1.5, alpha: 0.15,
      duration: 720, ease: 'Sine.InOut', yoyo: true, repeat: -1,
    });
  }

  get x() { return this._cont.x; }
  get y() { return this._cont.y; }

  update(px, py) {
    if (this.collected) return;
    const collectDist = BASE_COLLECT_DIST + (this.scene.playerLuck ?? 0);
    if (Math.hypot(this._cont.x - px, this._cont.y - py) < collectDist) {
      this._collect();
    }
  }

  _collect() {
    this.collected = true;
    const gs     = this.scene;
    const amount = AMOUNTS[this.type];
    const cx     = this._cont.x;
    const cy     = this._cont.y;

    if (this.type === 'honey') {
      gs.addHoney(amount, 0, cx, cy);
    } else {
      if (this.type === 'cash') {
        gs.cash      += amount;
        gs.totalCash += amount;
        _floatText(gs, cx, cy, `+${amount} 💰`, '#66ff66');
      } else {
        gs.tickets += amount;
        _floatText(gs, cx, cy, `+${amount} 🎫`, '#ffff66');
      }
    }

    // Burst ring
    const ring = gs.add.circle(cx, cy, 6, CFG[this.type].glow, 0.85).setDepth(9999);
    gs.tweens.add({ targets: ring, scaleX: 6, scaleY: 6, alpha: 0, duration: 380, ease: 'Quad.Out', onComplete: () => ring.destroy() });

    this._cont.destroy();
  }

  destroy() {
    if (!this._cont.scene) return;
    this._cont.destroy();
  }
}

function _floatText(scene, x, y, msg, color) {
  const t = scene.add.text(x, y, msg, {
    fontSize: '13px', color, stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
  }).setOrigin(0.5, 1).setDepth(9999);
  scene.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: 1100, ease: 'Quad.Out', onComplete: () => t.destroy() });
}
