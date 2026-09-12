/**
 * Wire contract shared by client and server. Kept dependency-free so the message
 * format has a single source of truth and cannot drift between the two sides.
 *
 * State (the players map) is defined as Colyseus schema on the server and read by
 * the client via colyseus.js reflection; this file covers the client→server
 * messages and the identifiers both sides must agree on.
 */

/** Colyseus room the server registers and the client joins. */
export const ROOM_NAME = "world";

/**
 * Message types sent from client to server. Values are the on-the-wire keys, so
 * both sides register/emit against the same identifiers. Declared as a const map
 * rather than an enum to stay erasable (no runtime TS constructs).
 */
export const ClientMessages = {
  /** The local player's resolved position for this update. */
  Move: "move",
} as const;

export type ClientMessageType =
  (typeof ClientMessages)[keyof typeof ClientMessages];

/**
 * A client-authoritative position update. Movement and collision are resolved on
 * the client (see `Character`); the server stores and relays the result rather
 * than simulating it — matching the MVP's client-authoritative model.
 */
export interface MoveMessage {
  x: number;
  y: number;
  /** Horizontal facing — true when facing left (sprite flipped). */
  flipX: boolean;
}
