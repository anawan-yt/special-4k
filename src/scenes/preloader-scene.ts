import AudioKey from '../consts/audio-key'
import { TILE_SIZE } from '../consts/globals'
import SceneKey from '../consts/scene-key'
import TextureKey from '../consts/texture-key'

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Preloader })
  }

  preload() {
    this.load.setBaseURL('assets')

    for (let i = 0; i < 4; i++) {
      this.load.spritesheet(TextureKey[`Enemy${i + 1}` as keyof typeof TextureKey], `orc${i + 1}.png`, {
        frameWidth: TILE_SIZE,
        frameHeight: TILE_SIZE,
      })
    }

    this.load.spritesheet(TextureKey.Mage, 'mage.png', {
      frameWidth: TILE_SIZE,
      frameHeight: 40,
    })

    this.load.spritesheet(TextureKey.Mute, 'mute.png', {
      frameWidth: 16,
    })

    this.load.image(TextureKey.Background, 'background.png')
    this.load.image(TextureKey.Fireball, 'fireball.png')
    this.load.json(TextureKey.Pseudos, 'enemies.json')
    this.load.bitmapFont(TextureKey.Font, 'fonts/gothic.png', 'fonts/gothic.xml')

    this.load.audio(AudioKey.Music, 'audio/music.mp3')
    this.load.audio(AudioKey.Pop, 'audio/pop.wav')
  }

  create() {
    const backgroundMusic = this.sound.add(AudioKey.Music, {
      loop: true,
    })
    backgroundMusic.play({ volume: 0.5 })
    this.scene.start(SceneKey.Game)
  }
}
