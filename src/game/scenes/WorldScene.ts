import Phaser from "phaser";
import { SceneKeys } from "./keys";
import { Player } from "../objects/Player";

/**
 * The interactive 2D world — tilemap, player, movement, collision, camera,
 * and interactions. Built out incrementally per docs/PROJECT.md Phase 1.
 *
 * Current step: a Tiled-authored map (larger than the viewport, so the camera
 * scrolls) with a movable player character. Collision and interactions come in
 * later steps.
 */
export class WorldScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super(SceneKeys.World);
  }

  create() {
    // Build the map from the Tiled JSON loaded in PreloadScene. "sunnyside" is
    // the tileset's name inside the .tmj; "tileset" is the loaded atlas key.
    const map = this.make.tilemap({ key: "world" });
    const tileset = map.addTilesetImage("sunnyside", "tileset");
    if (!tileset) return;
    map.createLayer("ground", tileset, 0, 0);

    // Solid props (rocks). Every non-empty tile on this layer blocks movement.
    const obstacles = map.createLayer("obstacles", tileset, 0, 0);
    obstacles?.setCollisionByExclusion([-1]);

    // Keep the player and camera within the map's bounds.
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new Player(this, map.widthInPixels / 2, map.heightInPixels / 2);

    if (obstacles) this.physics.add.collider(this.player, obstacles);

    // Zoom so 16px tiles read clearly, then follow the player with a soft lerp
    // and a center deadzone: small movements near the middle don't scroll the
    // world, and the camera eases in rather than locking rigidly to the player.
    const camera = this.cameras.main;
    camera.setZoom(2.5);
    camera.startFollow(this.player, true, 0.1, 0.1);
    camera.setDeadzone(
      (camera.width / camera.zoom) * 0.3,
      (camera.height / camera.zoom) * 0.3,
    );
  }

  update() {
    this.player.update();
  }
}
