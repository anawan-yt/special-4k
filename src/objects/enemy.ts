import EventKey from '../consts/event-key'
import { EnemyData, TILE_SIZE } from '../consts/globals'
import TextureKey from '../consts/texture-key'

export default class Enemy extends Phaser.GameObjects.Container {
  private health: number
  private healthText: Phaser.GameObjects.BitmapText
  private sprite: Phaser.Physics.Arcade.Sprite
  private subscriber: EnemyData
  private pseudoText: Phaser.GameObjects.BitmapText

  get pseudo() {
    return this.subscriber.pseudo
  }

  constructor(scene: Phaser.Scene, x: number, y: number, health: number, subscriber: EnemyData) {
    super(scene, x, y)
    this.health = health + subscriber.count - 1
    this.subscriber = subscriber

    let key: TextureKey
    if (subscriber.count >= 12) {
      key = TextureKey.Enemy4
    } else if (subscriber.count >= 8) {
      key = TextureKey.Enemy3
    } else if (subscriber.count >= 5) {
      key = TextureKey.Enemy2
    } else {
      key = TextureKey.Enemy1
    }

    this.sprite = scene.physics.add.sprite(0, 0, key)
    this.healthText = scene.add.bitmapText(0, -15, TextureKey.Font, `${this.health}`, 16).setOrigin(0.5)

    this.pseudoText = scene.add.bitmapText(0, 24, TextureKey.Font, this.pseudo, 16).setOrigin(0.5).setVisible(false)

    this.sprite.anims.create({
      key: 'idle',
      repeat: -1,
      frameRate: 8,
      frames: this.sprite.anims.generateFrameNumbers(key, {
        start: 0,
        end: 3,
      }),
    })

    this.sprite.play('idle')

    this.add([this.sprite, this.healthText, this.pseudoText])
    this.setSize(TILE_SIZE, TILE_SIZE)
    scene.physics.world.enable(this, 1)
    scene.add.existing(this)

    this.setInteractive()
    this.on('pointerover', () => {
      this.pseudoText.setVisible(true)
    })
    this.on('pointerout', () => {
      this.pseudoText.setVisible(false)
    })
  }

  takeDamage() {
    this.health--
    if (this.health <= 0) {
      return this.die()
    }

    this.flash()
    this.healthText.setText(`${this.health}`)
  }

  flash() {
    this.sprite.setTint(0xff004d)
    this.scene.time.delayedCall(100, () => {
      this.sprite.clearTint()
    })
  }

  moveToNextLine() {
    this.y += TILE_SIZE
    const body = this.body as Phaser.Physics.Arcade.StaticBody
    body.y += TILE_SIZE
  }

  die() {
    this.scene.events.emit(EventKey.EnemyDeath, this)
    this.destroy()
  }
}
