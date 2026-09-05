import Phaser from "phaser";
import { SceneKeys } from "./keys";

/**
 * The interactive 2D world — tilemap, player, movement, collision, camera,
 * and interactions. Built out incrementally per docs/PROJECT.md Phase 1.
 *
 * For now it renders a placeholder while the asset pipeline is wired up.
 */
export class WorldScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.World);
  }

  create() {
    this.add.text(20, 20, "Nook", { fontSize: "32px" });
  }
}
