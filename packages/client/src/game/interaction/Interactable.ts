/**
 * A point in the world the player can walk up to and act on — the data the
 * {@link InteractionManager} needs, with no knowledge of *how* it's detected,
 * prompted, or triggered. New kinds of interaction (sit, read, a productivity
 * station) are just different objects that satisfy this contract.
 */
export interface Interactable {
  /**
   * World anchor: proximity is measured to this point and the prompt floats
   * above it. For a ground-standing prop this is its base.
   */
  readonly x: number;
  readonly y: number;
  /** How close (px) the player must be for this to become the active target. */
  readonly radius: number;
  /** Short label shown in the prompt after the key, e.g. "Read". */
  readonly prompt: string;
  /**
   * How far (px) above the anchor the prompt floats. Defaults to a small gap;
   * tall props raise it clear of their art.
   */
  readonly promptOffsetY?: number;
  /** Run when the player triggers this interactable. */
  onInteract(): void;
}
