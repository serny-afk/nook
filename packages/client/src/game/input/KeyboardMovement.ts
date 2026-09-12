import Phaser from "phaser";

/** Directional movement intent for a single frame: each axis is -1, 0, or 1. */
export interface MovementIntent {
  x: number;
  y: number;
}

type DirectionKeys = Record<
  "up" | "down" | "left" | "right",
  Phaser.Input.Keyboard.Key
>;

/**
 * Reads directional movement intent from the keyboard (arrow keys + WASD).
 *
 * Kept separate from the entity it drives so the same character can later be
 * moved by a different source — e.g. interpolated network snapshots for remote
 * players in multiplayer — without touching movement or animation code.
 */
export class KeyboardMovement {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: DirectionKeys;

  constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as DirectionKeys;
  }

  /** The current directional intent this frame (unnormalized). */
  read(): MovementIntent {
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    return {
      x: (right ? 1 : 0) - (left ? 1 : 0),
      y: (down ? 1 : 0) - (up ? 1 : 0),
    };
  }
}
