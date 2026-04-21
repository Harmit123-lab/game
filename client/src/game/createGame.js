import Phaser from "phaser";
import PhaserTableScene from "./PhaserTableScene";

export const createPhaserGame = (containerId) =>
  new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: containerId,
    transparent: true,
    scene: [PhaserTableScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  });
