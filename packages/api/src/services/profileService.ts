import type { Appearance } from "@nook/shared";
import { Profile } from "../models/Profile.js";

/**
 * Profile business logic — the layer where the real work lives. Routes stay thin
 * and call these; nothing here knows about HTTP. Returning `null` for a missing
 * profile lets the route decide the response (a 404); the service doesn't throw
 * transport errors.
 */

/** Fields accepted when creating a profile. */
export interface CreateProfileInput {
  displayName: string;
  appearance?: Appearance;
}

/** Fields accepted when updating a profile; each is an optional partial change. */
export interface UpdateProfileInput {
  displayName?: string;
  appearance?: Appearance;
}

export function createProfile(input: CreateProfileInput): Promise<Profile> {
  return Profile.create({
    displayName: input.displayName,
    appearance: input.appearance ?? {},
  });
}

export function getProfile(id: string): Promise<Profile | null> {
  return Profile.findByPk(id);
}

export async function updateProfile(
  id: string,
  patch: UpdateProfileInput,
): Promise<Profile | null> {
  const profile = await Profile.findByPk(id);
  if (!profile) return null;
  if (patch.displayName !== undefined) profile.displayName = patch.displayName;
  if (patch.appearance !== undefined) profile.appearance = patch.appearance;
  await profile.save();
  return profile;
}
