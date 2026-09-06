import Phaser from "phaser";
import { PreloadScene } from "./scenes/PreloadScene";
import { WorldScene } from "./scenes/WorldScene";

/**
 * Creates and returns the Phaser game, mounted into the given DOM element.
 * This module owns configuration only — all game logic lives in the scenes.
 */
export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 600,
    backgroundColor: "#1a1a2e",
    // Pixel-art assets must not be smoothed when scaled.
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // Top-down world: no gravity. Arcade handles movement and (later) collision.
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    // Scenes boot in array order: Preload runs first, then starts World.
    scene: [PreloadScene, WorldScene],
  });
}
