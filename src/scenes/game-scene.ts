import AudioKey from '../consts/audio-key'
import EventKey from '../consts/event-key'
import {
  BALLS_SHOOT_DELAY,
  CANNON_MIN_DISTANCE,
  ENEMIES_KILLED_TRESHOLD,
  EnemyData,
  TILE_SIZE,
} from '../consts/globals'
import SceneKey from '../consts/scene-key'
import TextureKey from '../consts/texture-key'
import Ball from '../objects/ball'
import Enemy from '../objects/enemy'
import Hero from '../objects/hero'

export default class GameScene extends Phaser.Scene {
  private maxBalls!: number
  private balls!: Phaser.Physics.Arcade.Group
  private enemies!: Phaser.Physics.Arcade.StaticGroup
  private walls!: Phaser.Physics.Arcade.StaticGroup
  private hero!: Hero
  private canShoot!: boolean
  private line!: Phaser.GameObjects.Graphics
  private level!: number
  private enemiesUpgradeCount!: number
  private totalEnemies!: number
  private enemiesKilled!: number
  private subscribers!: EnemyData[]
  private startText!: Phaser.GameObjects.BitmapText
  private winText!: Phaser.GameObjects.BitmapText
  private waveText!: Phaser.GameObjects.BitmapText
  private enemiesText!: Phaser.GameObjects.BitmapText
  private hasStarted!: boolean
  private toastContainer!: Phaser.GameObjects.Container
  private killsToasts: Phaser.GameObjects.BitmapText[] = []
  private btnMute!: Phaser.GameObjects.Sprite
  private hudLayer!: Phaser.GameObjects.Layer

  constructor() {
    super({ key: SceneKey.Game })
  }

  create() {
    const { width, height } = this.scale
    this.canShoot = true
    this.enemiesUpgradeCount = 0
    this.enemiesKilled = 0
    this.level = 0
    this.hasStarted = false
    this.maxBalls = 1

    let pseudos = (this.cache.json.get(TextureKey.Pseudos) || []) as EnemyData[]
    this.subscribers = [...this.shuffleArray(pseudos.slice(0, 50)), ...this.shuffleArray(pseudos.slice(50))]
    this.totalEnemies = this.subscribers.length

    const background = this.add.image(0, 0, TextureKey.Background)
    background.setOrigin(0)
    this.add.existing(background)

    this.walls = this.physics.add.staticGroup()
    const wallTop = this.add.rectangle(0, TILE_SIZE * 2, width, TILE_SIZE, 0xffffff, 0)
    wallTop.setOrigin(0)
    const wallLeft = this.add.rectangle(0, TILE_SIZE * 3, 22, height - TILE_SIZE * 3, 0xffffff, 0)
    wallLeft.setOrigin(0)
    const wallRight = this.add.rectangle(width - 22, TILE_SIZE * 3, 22, height - TILE_SIZE * 3, 0xffffff, 0)
    wallRight.setOrigin(0)
    this.walls.addMultiple([wallTop, wallLeft, wallRight])

    this.hero = new Hero(this, width / 2, height - TILE_SIZE * 2 + TILE_SIZE / 2)
    this.physics.world.setBoundsCollision(true, true, true, false)

    this.enemies = this.physics.add.staticGroup({
      classType: Enemy,
    })

    this.balls = this.physics.add.group({
      classType: Ball,
      runChildUpdate: true,
    })

    this.line = this.add.graphics({ lineStyle: { width: 2, color: 0xffffff } })

    this.startText = this.add.bitmapText(width / 2, 30, TextureKey.Font, 'CLIQUER POUR TIRER', 16).setOrigin(0.5)
    this.tweens.add({
      targets: this.startText,
      alpha: 0,
      ease: 'Quad.easeIn',
      duration: 800,
      repeat: -1,
      yoyo: true,
    })

    this.waveText = this.add.bitmapText(14, 10, TextureKey.Font, `Vague: ${this.level}`, 16).setVisible(false)
    this.enemiesText = this.add
      .bitmapText(14, 31, TextureKey.Font, `Enemis tues: ${this.enemiesKilled}`, 16)
      .setVisible(false)

    this.winText = this.add
      .bitmapText(width / 2, 30, TextureKey.Font, `BRAVO ! ${this.totalEnemies} ENNEMIS VAINCUS :)`, 16)
      .setOrigin(0.5)
      .setVisible(false)

    this.toastContainer = this.add.container(32, height - TILE_SIZE * 4 + 12)

    this.btnMute = this.add.sprite(width - 14, 20, TextureKey.Mute)
    this.btnMute.setOrigin(1, 0)
    this.btnMute.setInteractive()
    this.btnMute.on('pointerdown', this.toggleMute, this)

    this.hudLayer = this.add.layer()
    this.hudLayer.add([this.startText, this.waveText, this.toastContainer, this.btnMute, this.enemiesText])
    this.hudLayer.setDepth(1000)

    this.physics.add.collider(this.balls, this.enemies, this.handleEnemyHit, undefined, this)
    this.physics.add.collider(this.balls, this.walls)

    this.input.on('pointerup', this.shootMultiple, this)
    this.input.on('pointermove', this.drawLine, this)
    this.events.on(EventKey.BallOut, this.handleBallOut, this)
    this.events.on(EventKey.EnemyDeath, this.handleEnemyDeath, this)

    this.events.once('shutdown', () => {
      this.events.off(EventKey.BallOut, this.handleBallOut, this)
      this.events.off(EventKey.EnemyDeath, this.handleEnemyDeath, this)
    })

    this.createNextWave()
  }

  toggleMute() {
    this.sound.mute = !this.sound.mute
    this.btnMute.setFrame(this.sound.mute ? 0 : 1)
  }

  handleEnemyDeath(enemy: Enemy) {
    this.enemiesUpgradeCount++
    this.enemiesKilled++
    this.enemiesText.setText(`Enemis tues: ${this.enemiesKilled}`)
    this.addToast(enemy)

    if (this.enemiesUpgradeCount >= ENEMIES_KILLED_TRESHOLD) {
      this.enemiesUpgradeCount = 0
      this.maxBalls++
    }

    if (this.enemiesKilled >= this.totalEnemies) {
      this.waveText.setVisible(false)
      this.enemiesText.setVisible(false)
      this.winText.setVisible(true)
      this.btnMute.setVisible(false)
      this.canShoot = false
    }
  }

  movePreviousWave() {
    this.enemies
      .getChildren()
      .filter((child) => child.active)
      .forEach((object) => (object as Enemy).moveToNextLine())
  }

  createNextWave() {
    this.movePreviousWave()
    this.level++
    this.waveText.setText(`Vague: ${this.level}`)
    const waveCount = Phaser.Math.Between(1, 4)
    const freePos = [0, 1, 2, 3, 4, 5, 6]

    for (let i = 0; i < waveCount; i++) {
      const randomIndex = Phaser.Math.Between(0, freePos.length - 1)
      const tileNumber = freePos[randomIndex]
      freePos.splice(randomIndex, 1)
      const subscriber = this.subscribers.shift()

      if (subscriber) {
        const enemy = new Enemy(
          this,
          (tileNumber + 1) * TILE_SIZE + TILE_SIZE / 2,
          TILE_SIZE * 4 + TILE_SIZE / 2,
          this.level,
          subscriber
        )
        this.enemies.add(enemy)
      }
    }
  }

  drawLine(pointer: Phaser.Input.Pointer) {
    if (!this.canShoot) return

    this.hero.flipX = pointer.x < this.scale.width / 2

    this.line.clear()
    this.drawDottedLine(this.hero.x, this.hero.y, pointer.x, pointer.y, 10, 5)
  }

  drawDottedLine(x1: number, y1: number, x2: number, y2: number, segmentLength: number, gapLength: number) {
    // Réinitialiser le graphique
    this.line.clear()

    if (y2 > y1 - CANNON_MIN_DISTANCE || y2 < TILE_SIZE * 2) {
      return
    }

    // Calculer la distance totale entre les deux points
    const dx = x2 - x1
    const dy = y2 - y1
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Calculer la direction unitaire du vecteur
    const angle = Math.atan2(dy, dx)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    // Initialiser les coordonnées actuelles
    let currentX = x1
    let currentY = y1
    let remainingDistance = distance

    // Dessiner des segments et des espaces
    while (remainingDistance > 0) {
      // Calculer la longueur du segment actuel
      const drawLength = Math.min(segmentLength, remainingDistance)

      // Calculer les coordonnées de la fin du segment
      const nextX = currentX + cos * drawLength
      const nextY = currentY + sin * drawLength

      // Dessiner le segment
      this.line.beginPath()
      this.line.moveTo(currentX, currentY)
      this.line.lineTo(nextX, nextY)
      this.line.strokePath()

      // Avancer les coordonnées
      currentX = nextX + cos * gapLength
      currentY = nextY + sin * gapLength

      // Réduire la distance restante
      remainingDistance -= drawLength + gapLength
    }
  }

  shootMultiple(pointer: Phaser.Input.Pointer) {
    if (!this.canShoot || pointer.y > this.hero.y - CANNON_MIN_DISTANCE || pointer.y < TILE_SIZE * 2) return

    if (!this.hasStarted) {
      this.hasStarted = true
      this.startText.destroy()
      this.waveText.setVisible(true)
      this.enemiesText.setVisible(true)
    }
    this.line.clear()
    this.canShoot = false
    let ballsFired = 0
    const { x: startX, y: startY } = this.hero
    const { x: targetX, y: targetY } = pointer

    const shoot = () => {
      const ball = this.balls.get(startX, startY) as Ball
      if (ball) {
        ball.setBounce(1).setCollideWorldBounds(true)
        ball.launch(startX, startY, targetX, targetY)
      }

      ballsFired++
      if (ballsFired >= this.maxBalls) {
        clearInterval(intervalId)
      }
    }

    const intervalId = setInterval(shoot, BALLS_SHOOT_DELAY)
  }

  handleEnemyHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_: any, object: any) => {
    const enemy = object as Enemy
    enemy.takeDamage()
    this.sound.play(AudioKey.Pop)
  }

  handleBallOut() {
    if (this.balls.countActive() > 0) return

    const hasEnemyReachedCannon = this.enemies
      .getChildren()
      .some((enemy) => (enemy as Enemy).y > this.hero.y - TILE_SIZE * 2)

    if (hasEnemyReachedCannon) {
      this.scene.restart()
    } else if (!this.winText.visible) {
      this.createNextWave()
      this.canShoot = true
    }
  }

  shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  addToast(enemy: Enemy) {
    let toast: Phaser.GameObjects.BitmapText
    toast = this.add
      .bitmapText(0, 0, TextureKey.Font, `xxx ${enemy.pseudo} xxx`, 16)
      .setCharacterTint(4, enemy.pseudo.length, true, 0xff004d)

    this.toastContainer.add(toast)
    this.killsToasts.push(toast)
    this.positionToasts()

    this.tweens.add({
      targets: toast,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        toast.destroy()
        this.killsToasts.shift()
        this.positionToasts()
      },
    })
  }

  positionToasts() {
    let currentY = 0
    for (let i = this.killsToasts.length - 1; i >= 0; i--) {
      const toast = this.killsToasts[i]
      toast.setPosition(0, -currentY)
      currentY += 18
    }
  }
}
