import Phaser from "phaser";
import type { Interactable } from "./Interactable";

/** Default gap (px) between an interactable's anchor and its floating prompt. */
const DEFAULT_PROMPT_OFFSET_Y = 20;
/** Prompts draw above everything in the world. */
const PROMPT_DEPTH = 10_000;

/**
 * Owns the world's interactables: each frame it finds the nearest one within
 * range of the player, floats a "press E" prompt over it, and triggers it when
 * the interact key is pressed. Interactables are plain data ({@link Interactable});
 * this class holds all the proximity, prompt, and input logic so they don't.
 */
export class InteractionManager {
  private readonly scene: Phaser.Scene;
  private readonly interactables: Interactable[] = [];
  private readonly interactKeys: Phaser.Input.Keyboard.Key[];
  private readonly prompt: Phaser.GameObjects.Text;
  /** The interactable currently in range and targeted, or null. */
  private active: Interactable | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const keyboard = scene.input.keyboard!;
    this.interactKeys = [
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    ];

    // One reusable prompt, moved onto whichever interactable is active. Scaling
    // by 1/zoom holds it at a fixed on-screen size — and keeps it crisp, since
    // the camera's zoom then cancels this down-scale to a net 1:1 render.
    this.prompt = scene.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(PROMPT_DEPTH)
      .setScale(1 / scene.cameras.main.zoom)
      .setVisible(false);
  }

  /** Register an interactable in the world. */
  add(interactable: Interactable): this {
    this.interactables.push(interactable);
    return this;
  }

  /**
   * Called each frame with the player's position: refresh which interactable is
   * active, reposition the prompt, and fire the active one on a key press.
   */
  update(playerX: number, playerY: number): void {
    this.active = this.nearest(playerX, playerY);

    if (!this.active) {
      this.prompt.setVisible(false);
      return;
    }

    const offset = this.active.promptOffsetY ?? DEFAULT_PROMPT_OFFSET_Y;
    this.prompt
      .setText(`E  ${this.active.prompt}`)
      .setPosition(this.active.x, this.active.y - offset)
      .setVisible(true);

    if (this.interactKeys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.active.onInteract();
    }
  }

  /** The closest interactable within its own radius, or null if none are in range. */
  private nearest(x: number, y: number): Interactable | null {
    let best: Interactable | null = null;
    let bestDist = Infinity;
    for (const it of this.interactables) {
      const dist = Phaser.Math.Distance.Between(x, y, it.x, it.y);
      if (dist <= it.radius && dist < bestDist) {
        best = it;
        bestDist = dist;
      }
    }
    return best;
  }

  /** Destroy the prompt and release the interact keys. */
  destroy(): void {
    this.prompt.destroy();
    const keyboard = this.scene.input.keyboard;
    for (const key of this.interactKeys) keyboard?.removeKey(key);
    this.interactables.length = 0;
    this.active = null;
  }
}
