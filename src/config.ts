import BootScene from './scenes/boot-scene'
import PreloaderScene from './scenes/preloader-scene'
import GameScene from './scenes/game-scene'

export const GameConfig: Phaser.Types.Core.GameConfig = {
  title: '4K',
  version: '1.0.0',
  parent: 'game',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 288,
    height: 512,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  type: Phaser.AUTO,
  pixelArt: true,
  roundPixels: false,
  antialias: false,

  backgroundColor: '#000000',
  scene: [BootScene, PreloaderScene, GameScene],
}
