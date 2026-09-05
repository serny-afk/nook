import Phaser from "phaser";
import { SceneKeys } from "./keys";

/**
 * Loads every asset the game needs, then hands off to the world.
 *
 * All `this.load.*` calls belong here so there is a single, predictable point
 * where assets enter the game. Nothing is loaded yet — art is brought in
 * incrementally (tileset, then player) in later Phase 1 steps.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Preload);
  }

  preload() {
    // Asset loading goes here as files land in public/assets/, e.g.:
    // this.load.image("tileset", "/assets/tilesets/sunnyside_16px.png");
  }

  create() {
    this.scene.start(SceneKeys.World);
  }
}
