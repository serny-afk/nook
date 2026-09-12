import Phaser from "phaser";
import {
  ANIM_FRAME_RATE,
  layerAnimKey,
  layerTextureKey,
  type AnimState,
} from "./characterConfig";

/** Movement speed in pixels/second. */
const SPEED = 110;

/**
 * A composed humanoid character: a base body plus stacked visual layers (hair,
 * later tools) that animate and face as one. The base body carries the physics
 * body; overlay layers are kept in lockstep with it each frame.
 *
 * Character knows how to *move and animate* itself but not what *drives* it —
 * `Player` drives it from keyboard input; a networked remote player could drive
 * the same class from interpolated snapshots without any change here.
 *
 * The Sunnyside art is side-view, so horizontal facing is a sprite flip and
 * vertical movement reuses the walk cycle.
 */
export class Character extends Phaser.Physics.Arcade.Sprite {
  /** Ordered layer keys, bottom-first; index 0 is the base (this sprite). */
  private readonly layers: string[];
  /** Overlay sprites for layers[1..], drawn above the base and synced to it. */
  private readonly overlays: Phaser.GameObjects.Sprite[] = [];
  private animState: AnimState = "idle";

  constructor(scene: Phaser.Scene, x: number, y: number, layers: string[]) {
    super(scene, x, y, layerTextureKey(layers[0], "idle"));
    this.layers = layers;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // The character fills only a small footprint inside the 96×64 frame
    // (~x43–53, y23–38). Size the body to that so collision is accurate.
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 15);
    body.setOffset(42, 24);
    this.setCollideWorldBounds(true);

    Character.ensureAnimations(scene, layers);

    // Overlay layers render above the base body (added after it) and are
    // repositioned/flipped to match it every frame in preUpdate.
    for (let i = 1; i < layers.length; i++) {
      this.overlays.push(scene.add.sprite(x, y, layerTextureKey(layers[i], "idle")));
    }

    // Start every layer on the idle animation together, in lockstep.
    this.play(layerAnimKey(layers[0], "idle"));
    this.overlays.forEach((overlay, i) =>
      overlay.play(layerAnimKey(layers[i + 1], "idle")),
    );

    // Sync overlays to the base AFTER physics has moved it for the frame.
    // POST_UPDATE runs after Arcade's world post-update writes the body's final
    // position back to the base; syncing earlier leaves overlays a frame behind
    // (visible lag when moving). Clean up the listener and overlays on destroy.
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncOverlays, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncOverlays, this);
      this.overlays.forEach((overlay) => overlay.destroy());
    });
  }

  /** Registers idle/walk animations for each layer once; safe to repeat. */
  private static ensureAnimations(scene: Phaser.Scene, layers: string[]) {
    const states: AnimState[] = ["idle", "walk"];
    for (const layer of layers) {
      for (const state of states) {
        const key = layerAnimKey(layer, state);
        if (scene.anims.exists(key)) continue;
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(layerTextureKey(layer, state), {}),
          frameRate: ANIM_FRAME_RATE[state],
          repeat: -1,
        });
      }
    }
  }

  /**
   * Drive the character with a directional intent (each axis -1/0/1). Sets
   * velocity, facing, and the idle/walk animation. This is the entry point a
   * driver (input, network, AI) calls; it holds no input logic itself.
   */
  move(x: number, y: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Normalize so diagonal movement isn't faster than orthogonal.
    body.setVelocity(x, y);
    body.velocity.normalize().scale(SPEED);

    if (x < 0) this.setFlipX(true);
    else if (x > 0) this.setFlipX(false);

    this.setAnimState(x !== 0 || y !== 0 ? "walk" : "idle");
  }

  /** Switches all layers to a new animation state together, once. */
  private setAnimState(state: AnimState) {
    if (this.animState === state) return;
    this.animState = state;

    this.play(layerAnimKey(this.layers[0], state), true);
    this.overlays.forEach((overlay, i) =>
      overlay.play(layerAnimKey(this.layers[i + 1], state), true),
    );
  }

  /** Glue overlay layers to the base body's transform and animation frame. */
  private syncOverlays() {
    const progress = this.anims.getProgress();
    for (const overlay of this.overlays) {
      overlay.setPosition(this.x, this.y);
      overlay.setFlipX(this.flipX);
      overlay.setDepth(this.depth);
      // Force identical frame so a layer can never drift from the base.
      overlay.anims.setProgress(progress);
    }
  }
}
