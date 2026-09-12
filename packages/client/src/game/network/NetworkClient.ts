import { Client, getStateCallbacks, type Room } from "colyseus.js";
import { ClientMessages, ROOM_NAME, type MoveMessage } from "@nook/shared";
import type { PlayerState, WorldState } from "@nook/shared/state";

/** Default dev server endpoint; overridable for other environments later. */
const DEFAULT_ENDPOINT = "ws://localhost:2567";

/**
 * Phaser registry key under which the React shell's connection-status callback
 * is stashed, so the scene can report status without game.ts holding any logic.
 */
export const CONNECTION_STATUS_KEY = "onConnectionStatus";

/** How many times to retry a dropped connection before giving up. */
const RECONNECT_ATTEMPTS = 5;
/** Delay between reconnect attempts (ms). Attempts × delay must fit the server's window. */
const RECONNECT_DELAY_MS = 2000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The connection's lifecycle, surfaced to the React shell so it can show the
 * user what's happening instead of silently failing.
 */
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

/**
 * How the scene is notified about other players. The scene turns these into
 * Phaser objects; the network layer never touches the game world itself. The
 * `state` handed to `onAdd` is the live schema object colyseus.js mutates in
 * place as updates arrive, so the scene can read its latest position each frame.
 * `onReset` clears all remotes before a reconnect (the old state graph is stale;
 * a successful reconnect repopulates via `onAdd`).
 */
export interface RemotePlayerHandlers {
  onAdd(sessionId: string, state: PlayerState): void;
  onRemove(sessionId: string): void;
  onReset(): void;
}

/**
 * Thin client-side handle on the multiplayer connection: joins the world room,
 * relays the local player's movement, surfaces other players' state to the
 * scene, and reports connection status. It owns the transport only — game
 * objects live in the scene and talk to the world through this narrow interface,
 * keeping Colyseus out of the rest of the game code.
 *
 * Connecting is best-effort: if the server is unreachable the game keeps running
 * single-player (status "offline"), so the world never depends on the backend.
 * An unexpected drop after a successful connect triggers automatic reconnection.
 */
export class NetworkClient {
  private readonly client: Client;
  private readonly onStatus: (status: ConnectionStatus) => void;
  private room?: Room<WorldState>;
  private handlers?: RemotePlayerHandlers;
  /** True once we deliberately leave, so we don't try to reconnect afterwards. */
  private intentionalLeave = false;

  constructor(
    onStatus: (status: ConnectionStatus) => void = () => {},
    endpoint: string = DEFAULT_ENDPOINT,
  ) {
    this.client = new Client(endpoint);
    this.onStatus = onStatus;
  }

  /**
   * Join the shared world room and wire up remote-player callbacks. Resolves
   * once connected; rejects (and reports "offline") if the server is unreachable.
   */
  async connect(handlers: RemotePlayerHandlers): Promise<void> {
    this.handlers = handlers;
    this.onStatus("connecting");
    try {
      const room = await this.client.joinOrCreate<WorldState>(ROOM_NAME);
      this.bindRoom(room);
    } catch (err) {
      this.onStatus("offline");
      throw err;
    }
  }

  /** Report the local player's resolved position. No-op unless connected. */
  sendMove(message: MoveMessage): void {
    this.room?.send(ClientMessages.Move, message);
  }

  /** Leave the room and drop the connection. Safe to call if never connected. */
  disconnect(): void {
    this.intentionalLeave = true;
    void this.room?.leave();
    this.room = undefined;
  }

  /**
   * Wire a freshly joined (or reconnected) room: `onAdd` fires for players
   * already present as well as future joiners, with the local player filtered
   * out so it isn't drawn twice. Also arms reconnection on unexpected drops.
   */
  private bindRoom(room: Room<WorldState>): void {
    this.room = room;

    const $ = getStateCallbacks(room);
    $(room.state).players.onAdd((state, sessionId) => {
      if (sessionId === room.sessionId) return;
      this.handlers?.onAdd(sessionId, state);
    });
    $(room.state).players.onRemove((_state, sessionId) => {
      this.handlers?.onRemove(sessionId);
    });
    room.onLeave(() => {
      if (!this.intentionalLeave) void this.reconnect();
    });

    this.onStatus("connected");
  }

  /**
   * Try to rejoin after an unexpected drop, retrying with a fixed delay. Remote
   * sprites are cleared first (their state is stale); a success repopulates them.
   */
  private async reconnect(): Promise<void> {
    const token = this.room?.reconnectionToken;
    this.room = undefined; // stop sends going to the dead room
    this.handlers?.onReset();

    if (!token) {
      this.onStatus("offline");
      return;
    }

    this.onStatus("reconnecting");
    for (let attempt = 0; attempt < RECONNECT_ATTEMPTS; attempt++) {
      try {
        const room = await this.client.reconnect(token);
        this.bindRoom(room);
        return;
      } catch {
        await delay(RECONNECT_DELAY_MS);
      }
    }
    this.onStatus("offline");
  }
}
