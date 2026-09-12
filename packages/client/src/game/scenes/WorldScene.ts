import Phaser from "phaser";
import { SceneKeys } from "./keys";
import { Player } from "../objects/Player";
import { Character } from "../objects/Character";
import { appearanceToLayers, type Appearance } from "../objects/characterConfig";
import {
  NetworkClient,
  CONNECTION_STATUS_KEY,
  type ConnectionStatus,
} from "../network/NetworkClient";
import type { PlayerState } from "@nook/shared/state";

/** Last position reported to the server, used to skip redundant sends. */
interface SentState {
  x: number;
  y: number;
  flipX: boolean;
}

/**
 * A remote player: the Character drawn locally, paired with the live server
 * state it eases toward each frame.
 */
interface RemotePlayer {
  character: Character;
  state: PlayerState;
}

/** Look for remote players until per-player appearance is synced (Phase 5). */
const REMOTE_APPEARANCE: Appearance = { hair: "longhair" };

/**
 * The interactive 2D world — tilemap, player, movement, collision, camera,
 * and interactions. Built out incrementally per docs/PROJECT.md.
 *
 * Phase 2 (multiplayer): the scene owns a {@link NetworkClient}, streams the
 * local player's position to the server, and mirrors every other player as a
 * Character eased toward its latest server position.
 */
export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private network!: NetworkClient;
  /** Last position sent, so we only transmit when something actually changed. */
  private lastSent: SentState = { x: NaN, y: NaN, flipX: false };
  /** Remote players currently in the room, keyed by Colyseus session id. */
  private readonly remotePlayers = new Map<string, RemotePlayer>();

  constructor() {
    super(SceneKeys.World);
  }

  create() {
    // Build the map from the Tiled JSON loaded in PreloadScene. "sunnyside" is
    // the tileset's name inside the .tmj; "tileset" is the loaded atlas key.
    const map = this.make.tilemap({ key: "world" });
    const tileset = map.addTilesetImage("sunnyside", "tileset");
    if (!tileset) return;
    map.createLayer("ground", tileset, 0, 0);

    // Solid props (rocks). Every non-empty tile on this layer blocks movement.
    const obstacles = map.createLayer("obstacles", tileset, 0, 0);
    obstacles?.setCollisionByExclusion([-1]);

    // Keep the player and camera within the map's bounds.
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new Player(this, map.widthInPixels / 2, map.heightInPixels / 2);

    if (obstacles) this.physics.add.collider(this.player, obstacles);

    // Zoom so 16px tiles read clearly, then follow the player with a soft lerp
    // and a center deadzone: small movements near the middle don't scroll the
    // world, and the camera eases in rather than locking rigidly to the player.
    const camera = this.cameras.main;
    camera.setZoom(2.5);
    camera.startFollow(this.player, true, 0.1, 0.1);
    camera.setDeadzone(
      (camera.width / camera.zoom) * 0.3,
      (camera.height / camera.zoom) * 0.3,
    );

    // Join the shared world room. Best-effort: if the server is down the world
    // still runs single-player. Always tear down when the scene stops (including
    // React/StrictMode teardown) so connections and sprites aren't leaked.
    const onStatus = this.registry.get(CONNECTION_STATUS_KEY) as
      | ((status: ConnectionStatus) => void)
      | undefined;
    this.network = new NetworkClient(onStatus);
    this.network
      .connect({
        onAdd: (id, state) => this.spawnRemotePlayer(id, state),
        onRemove: (id) => this.despawnRemotePlayer(id),
        onReset: () => this.clearRemotePlayers(),
      })
      .catch((err) => console.warn("[nook] running offline (no server):", err));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardownNetwork());
  }

  update() {
    this.player.update();
    this.reportPosition();

    // Ease each remote player toward its latest server position.
    for (const { character, state } of this.remotePlayers.values()) {
      character.applySnapshot(state.x, state.y, state.flipX);
    }
  }

  /** Send the local player's position to the server, but only when it changes. */
  private reportPosition() {
    const x = Math.round(this.player.x);
    const y = Math.round(this.player.y);
    const flipX = this.player.flipX;
    if (x === this.lastSent.x && y === this.lastSent.y && flipX === this.lastSent.flipX) {
      return;
    }
    this.lastSent = { x, y, flipX };
    this.network.sendMove({ x, y, flipX });
  }

  /** Draw a newly joined remote player at its current server position. */
  private spawnRemotePlayer(sessionId: string, state: PlayerState) {
    // Guard against a stale duplicate (e.g. if a slot is re-added).
    this.despawnRemotePlayer(sessionId);
    const character = new Character(
      this,
      state.x,
      state.y,
      appearanceToLayers(REMOTE_APPEARANCE),
    );
    this.remotePlayers.set(sessionId, { character, state });
  }

  /** Remove a remote player that left the room. */
  private despawnRemotePlayer(sessionId: string) {
    this.remotePlayers.get(sessionId)?.character.destroy();
    this.remotePlayers.delete(sessionId);
  }

  /** Destroy every remote sprite (on reconnect the state graph is replaced). */
  private clearRemotePlayers() {
    for (const { character } of this.remotePlayers.values()) character.destroy();
    this.remotePlayers.clear();
  }

  /** Leave the room and destroy every remote sprite. */
  private teardownNetwork() {
    this.network.disconnect();
    this.clearRemotePlayers();
  }
}
