import Phaser from "phaser";
import { SceneKeys } from "./keys";
import {
  FRAME_HEIGHT,
  FRAME_WIDTH,
  HUMAN_LAYERS,
  layerTextureKey,
} from "../objects/characterConfig";

/**
 * Loads every asset the game needs, then hands off to the world.
 *
 * All `this.load.*` calls belong here so there is a single, predictable point
 * where assets enter the game: the world tileset, the Tiled map, and the
 * layered human character spritesheets.
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

    // World map authored in Tiled and exported as JSON. Its embedded tileset
    // ("sunnyside") is backed by the "tileset" atlas loaded above.
    this.load.tilemapTiledJSON("world", "/assets/maps/world.tmj");

    // Layered Sunnyside human: each configured layer (base body, hair, …) is a
    // horizontal strip of 96×64 frames, loaded as "<layer>-idle"/"<layer>-walk"
    // so a character can be composed by stacking layers (see Character).
    const frame = { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT };
    for (const [layer, def] of Object.entries(HUMAN_LAYERS)) {
      this.load.spritesheet(layerTextureKey(layer, "idle"), def.idle, frame);
      this.load.spritesheet(layerTextureKey(layer, "walk"), def.walk, frame);
    }
  }

  create() {
    this.scene.start(SceneKeys.World);
  }
}
