import Phaser from 'phaser';

const S = { fontSize:'22px', color:'#ffffff', stroke:'#000000', strokeThickness:4 };

export default class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    this.foodText  = this.add.text(16, 16, 'Honey: 0',  S);
    this.antText   = this.add.text(16, 48, 'Bees: 0/0', S);
    this.levelText = this.add.text(16, 80, 'Lv. 1',     S);

    this.xpBarBg = this.add.rectangle(16, 114, 140, 12, 0x333333, 0.9).setOrigin(0, 0.5);
    this.xpBar   = this.add.rectangle(16, 114,   0, 12, 0x44aaff, 1.0).setOrigin(0, 0.5);
    this.xpText  = this.add.text(16, 122, '0/10 XP', { fontSize:'12px', color:'#88ddff', stroke:'#000', strokeThickness:3 });

    this.statText = this.add.text(16, 140, '', {
      fontSize:'14px', color:'#ffff55', stroke:'#000', strokeThickness:3, fontStyle:'bold',
    }).setVisible(false);

    this.buyBtn = this.add.text(16, 660, '[ Recruit Bee — 1 🍯 ]', {
      ...S, fontSize:'20px', color:'#ffdd44', backgroundColor:'#00000099', padding:{ x:12, y:6 },
    }).setInteractive({ useHandCursor: true });
    this.buyBtn.on('pointerdown', () => this.scene.get('GameScene').tryBuyAnt());
    this.buyBtn.on('pointerover', () => this.buyBtn.setAlpha(0.75));
    this.buyBtn.on('pointerout',  () => this.buyBtn.setAlpha(1));

    const btnStyle = { fontSize:'18px', color:'#ffdd44', stroke:'#000000', strokeThickness:4, backgroundColor:'#00000099', padding:{ x:10, y:5 } };

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

    const hint = this.add.text(640, 700, 'WASD to move  ·  bees collect honey automatically', {
      fontSize:'14px', color:'#cccccc', stroke:'#000000', strokeThickness:3,
    }).setOrigin(0.5, 1);
    this.time.delayedCall(5000, () => this.tweens.add({ targets: hint, alpha: 0, duration: 1500 }));
  }

  refresh(gs) {
    this.foodText.setText(`Honey: ${gs.food}`);
    this.antText.setText(`Bees: ${gs.antCount}/${gs.ownedBees.length}`);
    this.levelText.setText(`Lv. ${gs.level}`);

    const xpNeeded = gs.xpForNextLevel();
    this.xpBar.setSize(Math.round(140 * Math.min(gs.xp / xpNeeded, 1)), 12);
    this.xpText.setText(`${gs.xp}/${xpNeeded} XP`);

    this.statText.setText(`⭐ ${gs.statPoints} stat point${gs.statPoints > 1 ? 's' : ''} available!`);
    this.statText.setVisible(gs.statPoints > 0);

    const canAfford = gs.food >= gs.nextAntCost;
    this.buyBtn.setText(`[ Recruit Bee — ${gs.nextAntCost} 🍯 ]`);
    this.buyBtn.setAlpha(canAfford ? 1 : 0.4);
    this.buyBtn.setInteractive(canAfford);
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
        this.scene.wake('HiveScene'); // wake event calls _applyToHive
      } else if (!this.scene.isActive('HiveScene')) {
        this.scene.launch('HiveScene'); // create() calls _applyToHive at end
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
