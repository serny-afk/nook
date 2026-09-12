/**
 * Sunnyside human character: layer assets and animation timing.
 *
 * A character is composed by stacking a list of these layers (e.g.
 * ["base", "longhair"]), all sharing the same frame geometry so they overlay
 * pixel-perfectly. This is the seam where customization plugs in later —
 * swapping hair or adding a tools layer is just a change to the layer list.
 */

export type AnimState = "idle" | "walk";

/** Every human layer strip shares this frame size. */
export const FRAME_WIDTH = 96;
export const FRAME_HEIGHT = 64;

/** Per-state animation frame rate (frame counts come from the strips). */
export const ANIM_FRAME_RATE: Record<AnimState, number> = {
  idle: 9,
  walk: 12,
};

export interface CharacterLayerDef {
  idle: string;
  walk: string;
}

const DIR = "/assets/characters/human";

/**
 * The available character layers, keyed by layer name. Only layers listed here
 * are loaded (see PreloadScene) and available to compose onto a character.
 */
export const HUMAN_LAYERS: Record<string, CharacterLayerDef> = {
  base: {
    idle: `${DIR}/base_idle_strip9.png`,
    walk: `${DIR}/base_walk_strip8.png`,
  },
  shorthair: {
    idle: `${DIR}/shorthair_idle_strip9.png`,
    walk: `${DIR}/shorthair_walk_strip8.png`,
  },
  longhair: {
    idle: `${DIR}/longhair_idle_strip9.png`,
    walk: `${DIR}/longhair_walk_strip8.png`,
  },
};

/** The base body layer, always present beneath any appearance. */
const BASE_LAYER = "base";

/** Selectable hairstyles; each value is a layer key in HUMAN_LAYERS. */
export const HAIR_OPTIONS = ["shorthair", "longhair"] as const;
export type Hair = (typeof HAIR_OPTIONS)[number];

/**
 * A character's chosen appearance — the customizable selection that resolves to
 * a stack of layers. This is the model a customization UI and persistence will
 * eventually read/write; it can grow (hair colour, outfit, tools) without
 * touching Character, which only ever sees the resolved layer list.
 */
export interface Appearance {
  /** Chosen hairstyle, or omitted for none (bald). */
  hair?: Hair;
}

/** Resolves an appearance into the ordered, bottom-first layer list that a
 *  Character composes. */
export function appearanceToLayers(appearance: Appearance): string[] {
  const layers = [BASE_LAYER];
  if (appearance.hair) layers.push(appearance.hair);
  return layers;
}

/** Texture key for a layer's spritesheet in a given state, e.g. "base-idle". */
export const layerTextureKey = (layer: string, state: AnimState) =>
  `${layer}-${state}`;

/** Animation key for a layer in a given state, e.g. "longhair-walk". */
export const layerAnimKey = (layer: string, state: AnimState) =>
  `${layer}-${state}`;
