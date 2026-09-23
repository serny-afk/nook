import { Schema, MapSchema, type } from "@colyseus/schema";

/**
 * Colyseus room state — the other half of the wire contract (see protocol.ts for
 * client→server messages). Defined once here so the server can mutate it and the
 * client can read it (type-only; colyseus.js decodes the live data via schema
 * reflection) without the shape drifting between them.
 */

/**
 * A player's appearance as synced state — the Colyseus mirror of the plain
 * {@link Appearance} shape (which stays the persisted/rendered form). Kept as its
 * own schema so it can grow (hair colour, outfit, …) without reshaping
 * PlayerState. An empty `hair` string means "no hair".
 */
export class AppearanceState extends Schema {
  @type("string") hair = "";
}

/**
 * One player's server-synced state. Positions are client-authoritative (each
 * client resolves its own movement/collision and reports the result); the server
 * holds and relays them. Decorated fields are the ones replicated to clients.
 *
 * Identity (name + appearance) is set once from the client's join options and
 * relayed unchanged, so every other client can render who a player is.
 */
export class PlayerState extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;
  /** Horizontal facing — true when facing left (sprite flipped). */
  @type("boolean") flipX = false;
  /** Display name, shown as a floating label above the character. */
  @type("string") name = "";
  /** Chosen appearance, synced so others render the right look. */
  @type(AppearanceState) appearance = new AppearanceState();
}

/**
 * Full room state: every player currently present, keyed by Colyseus session id.
 * colyseus.js mirrors this map on each client so remote players can be spawned,
 * moved, and removed as the map changes.
 */
export class WorldState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
