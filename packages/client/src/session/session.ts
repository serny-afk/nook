import type { Profile } from "@nook/shared";
import { getProfile } from "../api/profiles";

/**
 * Lightweight, password-less identity. A player's profile is cached in
 * localStorage, so the same browser is recognised across reloads without any
 * login. This is deliberately the thin slice the MVP needs; real auth (accounts,
 * sessions across devices) slots in later without changing how the world reads
 * identity — it still gets a resolved {@link Profile}.
 *
 * Caching the whole profile (not just its id) also keeps identity working
 * offline: a returning player enters with their saved name and look even if the
 * API is unreachable, mirroring how the world stays playable with no realtime
 * server.
 */

const STORAGE_KEY = "nook:profile";

/** Read the cached profile, clearing it if the stored value is corrupt. */
function readCache(): Profile | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/** Remember this profile as the local identity (after create/update). */
export function storeSession(profile: Profile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/** Forget the local identity, so the next load starts onboarding fresh. */
export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Resolve the returning player's profile, or `null` if there's none yet (so the
 * caller shows onboarding). When a cached profile exists it's revalidated
 * against the API and refreshed; if the API says it's gone the cache is cleared,
 * and if the API is simply unreachable the cached copy is used as-is.
 */
export async function resolveSession(): Promise<Profile | null> {
  const cached = readCache();
  if (!cached) return null;
  try {
    const fresh = await getProfile(cached.id);
    if (!fresh) {
      clearSession(); // deleted server-side — start over
      return null;
    }
    storeSession(fresh);
    return fresh;
  } catch {
    return cached; // API unreachable — enter with the cached identity
  }
}
