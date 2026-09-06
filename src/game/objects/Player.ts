import Phaser from "phaser";

/** Texture keys, matching what PreloadScene loads. */
const Texture = {
  Idle: "player-idle",
  Walk: "player-walk",
} as const;

/** Animation keys, registered once per scene. */
const Anim = {
  Idle: "player-idle-anim",
  Walk: "player-walk-anim",
} as const;

/** Movement speed in pixels/second. */
const SPEED = 110;

type DirectionKeys = Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;

/**
 * The player-controlled human character.
 *
 * Owns its sprite, animations, keyboard input, and movement. The Sunnyside
 * human art is side-view (idle + walk), so horizontal facing is done by
 * flipping the sprite; vertical movement reuses the walk cycle for now.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: DirectionKeys;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, Texture.Idle);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // The character fills only a small footprint inside the 96×64 frame
    // (~x43–53, y23–38). Size the body to that so collision is accurate.
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 15);
    body.setOffset(42, 24);
    this.setCollideWorldBounds(true);

    Player.ensureAnimations(scene);
    this.play(Anim.Idle);

    // Support both arrow keys and WASD.
    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as DirectionKeys;
  }

  /** Registers the shared animations once; safe to call repeatedly. */
  private static ensureAnimations(scene: Phaser.Scene) {
    if (scene.anims.exists(Anim.Idle)) return;

    scene.anims.create({
      key: Anim.Idle,
      frames: scene.anims.generateFrameNumbers(Texture.Idle, {}),
      frameRate: 9,
      repeat: -1,
    });
    scene.anims.create({
      key: Anim.Walk,
      frames: scene.anims.generateFrameNumbers(Texture.Walk, {}),
      frameRate: 12,
      repeat: -1,
    });
  }

  /** Called each frame by the scene: reads input, moves, and animates. */
  update() {
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    const dx = (right ? 1 : 0) - (left ? 1 : 0);
    const dy = (down ? 1 : 0) - (up ? 1 : 0);

    const body = this.body as Phaser.Physics.Arcade.Body;
    // Normalize so diagonal movement isn't faster than orthogonal.
    body.setVelocity(dx, dy);
    body.velocity.normalize().scale(SPEED);

    if (dx < 0) this.setFlipX(true);
    else if (dx > 0) this.setFlipX(false);

    const moving = dx !== 0 || dy !== 0;
    this.play(moving ? Anim.Walk : Anim.Idle, true);
  }
}
