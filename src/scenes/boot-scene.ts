import SceneKey from '../consts/scene-key'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Boot })
  }

  create() {
    this.scene.start(SceneKey.Preloader)
  }
}
