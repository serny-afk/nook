import Phaser from "phaser";
import { Character } from "./Character";
import { KeyboardMovement } from "../input/KeyboardMovement";
import { appearanceToLayers, type Appearance } from "./characterConfig";

/** Default look for a new local player, until customization/persistence exists. */
const DEFAULT_APPEARANCE: Appearance = { hair: "longhair" };

/**
 * The local, player-controlled character: a {@link Character} driven by
 * keyboard input. All movement/animation lives in Character; Player only wires
 * input to it, so remote players can reuse Character with a different driver.
 *
 * The appearance is resolved to a layer stack at construction, so giving a
 * player a different look (or, later, a customized/persisted one) is just a
 * matter of passing a different Appearance.
 */
export class Player extends Character {
  private readonly movement: KeyboardMovement;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    appearance: Appearance = DEFAULT_APPEARANCE,
  ) {
    super(scene, x, y, appearanceToLayers(appearance));
    this.movement = new KeyboardMovement(scene.input.keyboard!);
  }

  /** Called each frame by the scene: reads input and drives the character. */
  update() {
    const { x, y } = this.movement.read();
    this.move(x, y);
  }
}
