import { Router } from "express";
import type { Appearance } from "@nook/shared";
import { badRequest, notFound } from "../lib/errors.js";
import {
  createProfile,
  getProfile,
  updateProfile,
} from "../services/profileService.js";

/**
 * Profile HTTP routes: thin handlers that validate the request minimally, call
 * the service, and shape the response. Errors are thrown (Express 5 forwards
 * them to the central handler); handlers never format error responses. Rich
 * schema validation (Zod) and auth are deferred to their own milestones — for
 * now these guards just keep obviously-bad data out of the database.
 */
export const profilesRouter = Router();

/** Require a non-blank display name, trimmed; throws 400 otherwise. */
function requireDisplayName(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest("displayName is required");
  }
  return value.trim();
}

/** Accept an appearance only if it's a plain object; `undefined` passes through
 *  (meaning "not provided"). Deep validation comes with the Zod milestone. */
function readAppearance(value: unknown): Appearance | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw badRequest("appearance must be an object");
  }
  return value as Appearance;
}

profilesRouter.post("/", async (req, res) => {
  const displayName = requireDisplayName(req.body?.displayName);
  const appearance = readAppearance(req.body?.appearance);
  const profile = await createProfile({ displayName, appearance });
  res.status(201).json(profile);
});

profilesRouter.get("/:id", async (req, res) => {
  const profile = await getProfile(req.params.id);
  if (!profile) throw notFound("Profile not found");
  res.json(profile);
});

profilesRouter.patch("/:id", async (req, res) => {
  const displayName =
    req.body?.displayName === undefined
      ? undefined
      : requireDisplayName(req.body.displayName);
  const appearance = readAppearance(req.body?.appearance);
  const profile = await updateProfile(req.params.id, { displayName, appearance });
  if (!profile) throw notFound("Profile not found");
  res.json(profile);
});
