import { Schema, MapSchema, type } from "@colyseus/schema";

/**
 * Colyseus room state — the other half of the wire contract (see protocol.ts for
 * client→server messages). Defined once here so the server can mutate it and the
 * client can read it (type-only; colyseus.js decodes the live data via schema
 * reflection) without the shape drifting between them.
 */

/**
 * One player's server-synced state. Positions are client-authoritative (each
 * client resolves its own movement/collision and reports the result); the server
 * holds and relays them. Decorated fields are the ones replicated to clients.
 */
export class PlayerState extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;
  /** Horizontal facing — true when facing left (sprite flipped). */
  @type("boolean") flipX = false;
}

/**
 * Full room state: every player currently present, keyed by Colyseus session id.
 * colyseus.js mirrors this map on each client so remote players can be spawned,
 * moved, and removed as the map changes.
 */
export class WorldState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
