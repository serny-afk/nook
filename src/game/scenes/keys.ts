/**
 * Canonical scene keys. Referencing these instead of raw strings keeps
 * `scene.start(...)` calls typo-proof as the number of scenes grows.
 */
export const SceneKeys = {
  Preload: "preload",
  World: "world",
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
