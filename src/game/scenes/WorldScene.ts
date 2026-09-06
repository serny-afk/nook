import Phaser from "phaser";
import { SceneKeys } from "./keys";
import { Player } from "../objects/Player";

/**
 * The interactive 2D world — tilemap, player, movement, collision, camera,
 * and interactions. Built out incrementally per docs/PROJECT.md Phase 1.
 *
 * Current step: a grass field with a movable player character. Real maps will
 * be authored in Tiled and loaded as JSON in a later step.
 */
export class WorldScene extends Phaser.Scene {
  /** Sunnyside tileset geometry: 16px tiles on a 64-wide atlas. */
  private static readonly TILE_SIZE = 16;
  /** A uniform grass tile in the atlas (row 1, col 1 → 1*64 + 1). */
  private static readonly GRASS = 65;
  /** Placeholder map size, in tiles. */
  private static readonly MAP_WIDTH = 20;
  private static readonly MAP_HEIGHT = 15;

  private player!: Player;

  constructor() {
    super(SceneKeys.World);
  }

  create() {
    const { TILE_SIZE, GRASS, MAP_WIDTH, MAP_HEIGHT } = WorldScene;
    const worldWidth = MAP_WIDTH * TILE_SIZE;
    const worldHeight = MAP_HEIGHT * TILE_SIZE;

    // A grass field: a MAP_HEIGHT × MAP_WIDTH grid of the grass tile index.
    const data = Array.from({ length: MAP_HEIGHT }, () =>
      Array.from({ length: MAP_WIDTH }, () => GRASS),
    );

    const map = this.make.tilemap({
      data,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const tileset = map.addTilesetImage(
      "sunnyside",
      "tileset",
      TILE_SIZE,
      TILE_SIZE,
    );
    if (!tileset) return;
    map.createLayer(0, tileset, 0, 0);

    // Keep the player and camera within the map.
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    this.player = new Player(this, worldWidth / 2, worldHeight / 2);

    // Zoom so 16px tiles read clearly, and follow the player.
    this.cameras.main.setZoom(2.5);
    this.cameras.main.startFollow(this.player, true);
  }

  update() {
    this.player.update();
  }
}
