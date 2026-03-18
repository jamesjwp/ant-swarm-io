import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import UIScene   from './scenes/UIScene';
import HiveScene from './scenes/HiveScene';
import ShopScene from './scenes/ShopScene';
import BearScene from './scenes/BearScene';
import { createDevPanel } from './DevPanel.js';

createDevPanel();

window.__game = new Phaser.Game({
  type:   Phaser.AUTO,
  width:  1280,
  height: 720,
  pixelArt: true,
  backgroundColor: '#2d5a1b',
  physics: {
    default: 'arcade',
    arcade:  { debug: false },
  },
  scene: [GameScene, UIScene, HiveScene, ShopScene, BearScene],
});
