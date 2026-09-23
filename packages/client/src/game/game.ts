import Phaser from "phaser";
import type { Profile } from "@nook/shared";
import { PreloadScene } from "./scenes/PreloadScene";
import { WorldScene } from "./scenes/WorldScene";
import { CONNECTION_STATUS_KEY, type ConnectionStatus } from "./network/NetworkClient";
import { INTERACTION_PANEL_KEY, type InteractionPanel } from "./interaction/bridge";
import { LOCAL_PLAYER_KEY, type LocalPlayer } from "./localPlayer";

/**
 * Creates and returns the Phaser game, mounted into the given DOM element.
 * This module owns configuration only — all game logic lives in the scenes.
 *
 * The game is created only once the player's `profile` is resolved (see App.tsx),
 * so its name/appearance are available to the world from the first frame. Along
 * with the profile, two callbacks bridge back to React; all three are stashed in
 * the game registry so the scenes can reach them without game.ts knowing any
 * logic: `onConnectionStatus` reports multiplayer connection state, and
 * `onInteractionPanel` opens (or closes, with null) an interaction panel.
 */
export function createGame(
  parent: HTMLElement,
  profile: Profile,
  onConnectionStatus?: (status: ConnectionStatus) => void,
  onInteractionPanel?: (panel: InteractionPanel | null) => void,
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    // Start at the current viewport size; RESIZE then keeps the canvas matched
    // to its parent (the full-viewport .game-container) as the window changes.
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#1a1a2e",
    // Pixel-art assets must not be smoothed when scaled.
    pixelArt: true,
    // RESIZE keeps the canvas matched to its parent; it fills the box, so no
    // centering/letterboxing is involved.
    scale: {
      mode: Phaser.Scale.RESIZE,
    },
    // Top-down world: no gravity. Arcade handles movement and (later) collision.
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    // Scenes boot in array order: Preload runs first, then starts World.
    scene: [PreloadScene, WorldScene],
  });

  const localPlayer: LocalPlayer = {
    displayName: profile.displayName,
    appearance: profile.appearance,
  };
  game.registry.set(LOCAL_PLAYER_KEY, localPlayer);

  if (onConnectionStatus) {
    game.registry.set(CONNECTION_STATUS_KEY, onConnectionStatus);
  }
  if (onInteractionPanel) {
    game.registry.set(INTERACTION_PANEL_KEY, onInteractionPanel);
  }

  return game;
}
