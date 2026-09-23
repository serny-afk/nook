import type { Appearance } from "@nook/shared";

/**
 * Phaser registry key under which the local player's identity is stashed, so
 * WorldScene can build the local Player from the persisted profile without
 * game.ts holding any logic (mirrors the connection-status / interaction keys).
 */
export const LOCAL_PLAYER_KEY = "localPlayer";

/**
 * The local player's identity as the world needs it: the chosen appearance to
 * render, and the display name (used for the realtime handoff — see Phase 2 #5 —
 * so other players see who this is).
 */
export interface LocalPlayer {
  displayName: string;
  appearance: Appearance;
}
