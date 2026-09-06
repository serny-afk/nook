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
    // Sunnyside 16px world tileset — a single 1024×1024 atlas (64×64 tiles).
    this.load.image(
      "tileset",
      "/assets/tilesets/spr_tileset_sunnysideworld_16px.png",
    );

    // Player character — layered Sunnyside human, "base" body for now.
    // Each animation is a horizontal strip of 96×64 frames.
    this.load.spritesheet(
      "player-idle",
      "/assets/characters/human/base_idle_strip9.png",
      { frameWidth: 96, frameHeight: 64 },
    );
    this.load.spritesheet(
      "player-walk",
      "/assets/characters/human/base_walk_strip8.png",
      { frameWidth: 96, frameHeight: 64 },
    );
  }

  create() {
    this.scene.start(SceneKeys.World);
  }
}
