import EventKey from '../consts/event-key'
import { BALL_SPEED } from '../consts/globals'
import TextureKey from '../consts/texture-key'

export default class Ball extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKey.Fireball)
    scene.physics.add.existing(this)
    scene.add.existing(this)
    const body = this.body as Phaser.Physics.Arcade.Body
    this.setCollideWorldBounds(true)
    body.setBounce(1)
    body.onWorldBounds = true
  }

  update() {
    const { height } = this.scene.scale
    this.angle += 4
    if (this.y > height) {
      this.deactivate()
    }
  }

  launch(startX: number, startY: number, targetX: number, targetY: number) {
    this.setActive(true)
    this.setVisible(true)
    ;(this.body as Phaser.Physics.Arcade.Body).enable = true

    const velocity = this.scene.physics.velocityFromRotation(
      Phaser.Math.Angle.Between(startX, startY, targetX, targetY),
      BALL_SPEED
    )
    this.setVelocity(velocity.x, velocity.y)
  }

  deactivate() {
    this.setActive(false).setVisible(false)
    ;(this.body as Phaser.Physics.Arcade.Body).enable = false
    this.scene.events.emit(EventKey.BallOut)
  }
}
