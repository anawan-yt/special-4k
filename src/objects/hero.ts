import TextureKey from '../consts/texture-key'

export default class Hero extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKey.Mage)

    this.anims.create({
      key: 'idle',
      repeat: -1,
      frameRate: 8,
      frames: this.anims.generateFrameNumbers(TextureKey.Mage, {
        start: 0,
        end: 3,
      }),
    })

    this.play('idle')
    scene.add.existing(this)
  }
}
