/**
 * The seam between the world's interactions and the React shell. When an
 * interactable opens UI, the Phaser world hands React one of these panels (or
 * null to close), mirroring the connection-status bridge — the scene reads a
 * callback from the game registry and never touches React directly.
 */

/** The content of an interaction panel rendered by the React shell. */
export interface InteractionPanel {
  title: string;
  body: string;
}

/**
 * Phaser registry key under which the React shell stashes its "show interaction
 * panel" callback, so the scene can open UI without game.ts holding any logic.
 */
export const INTERACTION_PANEL_KEY = "onInteractionPanel";
