/**
 * A character's customizable appearance — the durable, renderer-agnostic part of
 * a player's identity. Shared so the persistence tier (`@nook/api` Profile) and
 * the client's character composition read/write the exact same shape, and so the
 * realtime tier can add it to synced state later without redefining it.
 *
 * The client resolves an Appearance into a stack of sprite layers (see the
 * client's characterConfig); this package intentionally holds only the data
 * shape, not the asset/layer mapping, which is client-specific.
 */

/** Selectable hairstyles. Each value is also a client sprite-layer key. */
export const HAIR_OPTIONS = ["shorthair", "longhair"] as const;
export type Hair = (typeof HAIR_OPTIONS)[number];

/** A character's chosen appearance. Grows over time (hair colour, outfit, …). */
export interface Appearance {
  /** Chosen hairstyle, or omitted for none (bald). */
  hair?: Hair;
}
