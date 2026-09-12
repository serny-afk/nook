import { Room, type Client } from "colyseus";
import { ClientMessages, type MoveMessage } from "@nook/shared";
import { PlayerState, WorldState } from "@nook/shared/state";

/** Where a newly joined player appears. Mirrors WorldScene's map-centre spawn. */
const SPAWN = { x: 400, y: 300 } as const;

/** Cap concurrent occupants of a single world room (MVP: a small shared space). */
const MAX_CLIENTS = 16;

/** Seconds a dropped player's slot is held open for a seamless reconnect. */
const RECONNECT_WINDOW = 20;

/**
 * The shared world room. Tracks who is present and each player's position,
 * relaying client-reported movement to everyone else. Movement is not simulated
 * here — the client is authoritative for its own character (see docs/PROJECT.md,
 * MVP scope).
 */
export class WorldRoom extends Room<WorldState> {
  override maxClients = MAX_CLIENTS;

  override onCreate() {
    this.state = new WorldState();

    // A player reports its resolved position; store it so the change replicates
    // to every other client via the synced state.
    this.onMessage(ClientMessages.Move, (client, message: MoveMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.x = message.x;
      player.y = message.y;
      player.flipX = message.flipX;
    });
  }

  override onJoin(client: Client) {
    const player = new PlayerState();
    player.x = SPAWN.x;
    player.y = SPAWN.y;
    this.state.players.set(client.sessionId, player);
    console.log(`[world] ${client.sessionId} joined (${this.clients.length} online)`);
  }

  override async onLeave(client: Client, consented: boolean) {
    // A clean leave (tab closed, navigated away) removes the player at once.
    if (consented) {
      this.state.players.delete(client.sessionId);
      console.log(`[world] ${client.sessionId} left (${this.clients.length} online)`);
      return;
    }

    // An unexpected drop: keep the player's slot so a reconnect within the
    // window is seamless to everyone else. If they don't return, remove them.
    console.log(`[world] ${client.sessionId} dropped, awaiting reconnect…`);
    try {
      await this.allowReconnection(client, RECONNECT_WINDOW);
      console.log(`[world] ${client.sessionId} reconnected`);
    } catch {
      this.state.players.delete(client.sessionId);
      console.log(`[world] ${client.sessionId} gone (${this.clients.length} online)`);
    }
  }
}
