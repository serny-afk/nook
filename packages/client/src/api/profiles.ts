import type { Profile, ProfileDraft } from "@nook/shared";
import { env } from "../config/env";

/**
 * Thin REST client for the persistence API's `/profiles` resource. It owns HTTP
 * only — building requests and turning responses into typed {@link Profile}s (or
 * throwing) — so the rest of the client never touches `fetch`, URLs, or status
 * codes directly. The transport seam mirrors {@link NetworkClient} for realtime.
 */

/** An API request that reached the server but returned a non-2xx status. */
export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Issue a request to the API and parse a JSON body. Throws {@link ApiError} on a
 * non-2xx response (with the server's error message when it sent one), or a
 * network error if the API is unreachable.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    // The API's error handler returns `{ error: string }`; fall back to status.
    const message = await res
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => undefined);
    throw new ApiError(res.status, message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Create a new profile. */
export function createProfile(draft: ProfileDraft): Promise<Profile> {
  return request<Profile>("/profiles", {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

/** Fetch a profile by id, or `null` if none exists (404) — other errors throw. */
export async function getProfile(id: string): Promise<Profile | null> {
  try {
    return await request<Profile>(`/profiles/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Update the writable parts of an existing profile. */
export function updateProfile(
  id: string,
  patch: Partial<ProfileDraft>,
): Promise<Profile> {
  return request<Profile>(`/profiles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
