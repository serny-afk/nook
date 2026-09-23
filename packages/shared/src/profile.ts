import type { Appearance } from "./appearance.js";

/**
 * A persisted player profile as it crosses the wire — the shape the `/profiles`
 * API returns and the client consumes. Defined here so the API's serialized
 * Profile and the client that reads it can't drift; it's the persistence
 * counterpart to {@link Appearance} (durable identity vs. durable look).
 *
 * Timestamps are ISO strings, not `Date`s: JSON has no date type, so a profile
 * that has been through `JSON` carries them as strings.
 */
export interface Profile {
  id: string;
  displayName: string;
  appearance: Appearance;
  createdAt: string;
  updatedAt: string;
}

/**
 * The user-chosen, writable part of a profile — the body of a create/update
 * request. The server owns everything else (id, timestamps).
 */
export interface ProfileDraft {
  displayName: string;
  appearance?: Appearance;
}
