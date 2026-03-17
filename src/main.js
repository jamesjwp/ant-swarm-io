import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import UIScene   from './scenes/UIScene';

new Phaser.Game({
  type:   Phaser.AUTO,
  width:  1280,
  height: 720,
  backgroundColor: '#2d5a1b',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade:  { debug: false },
  },
  scene: [GameScene, UIScene],
});
