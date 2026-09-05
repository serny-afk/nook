# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Nook is a cozy browser-based virtual space for working, studying, and hanging out — a virtual-world/productivity app, not a traditional game. North-star references: lofi.town (product vision), SkyOffice (multiplayer/MVP), Cozy Zen (aesthetic). The full roadmap and phase breakdown live in `docs/PROJECT.md` — read it before making architectural decisions.

This is a solo hobby project, but it is held to **production-grade quality**. Adhere to solid SWE principles throughout — clear separation of concerns, readable and maintainable code, sensible abstractions, no shortcuts that a real product wouldn't take. Treat "it's just a toy project" as no excuse for lower standards.

Work **incrementally**: prefer small, self-contained, well-scoped changes over large sweeping ones. Introduce complexity only when a concrete need for it exists.

The world uses the **Sunnyside World** pixel-art pack (16px tileset, layered/strip-based human character, elements). See the Assets section below for how assets are sourced and committed.

## Commands

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check with `tsc -b` then produce a production build (build fails on type errors)
- `npm run lint` — run ESLint over the repo
- `npm run preview` — serve the production build locally

There is no test runner configured yet.

## Architecture

The app is a **React shell hosting a Phaser world**. This split is the core design principle and should be preserved:

- **React** owns application UI — menus, productivity features, overlays. Entry: `src/main.tsx` → `src/App.tsx`.
- **Phaser** owns the interactive 2D world — rendering, characters, movement, tilemaps, collision, interactions. Entry: `src/game/game.ts`.

`App.tsx` is the bridge: it creates the Phaser game inside a `useEffect` (mounting it into a `ref`'d `<div>`) and destroys it in the cleanup function. Note `main.tsx` wraps the app in `<StrictMode>`, so in dev the effect runs twice (create → destroy → create) — the cleanup handles this, but keep game creation idempotent and always tear down in cleanup to avoid duplicate canvases.

**Phaser structure:** `game.ts` holds Phaser configuration only — no game logic. Scenes live under `src/game/scenes/` as classes and boot in array order: `PreloadScene` loads all assets (the single point where `this.load.*` calls belong), then starts `WorldScene`, which owns the actual world. Reference scenes via the `SceneKeys` constant (`scenes/keys.ts`), never raw strings.

Keep world/game logic inside `src/game/` and out of React components; communicate across the boundary through explicit interfaces (props/callbacks or Phaser events) rather than reaching into Phaser internals from React or manipulating the DOM from Phaser.

The backend (Node.js, Colyseus, PostgreSQL, REST) is intentionally **deferred** — introduce these only when a phase actually requires them, per `docs/PROJECT.md`. Current state is early Phase 1: the React↔Phaser integration works and the canvas renders a placeholder.

## Assets

Two distinct locations, two jobs:

- **`assets/` (gitignored)** — the raw Sunnyside source pack; local staging only, never served or committed. Keep the original download backed up outside the repo, since git does not track it.
- **`public/assets/` (committed)** — only the curated subset the game actually uses. Vite serves `public/` at the web root, so a file at `public/assets/tilesets/foo.png` loads in Phaser by the URL `/assets/tilesets/foo.png`.

Workflow to add art: find it in `assets/` → copy that one file into `public/assets/...` → load it by its `/assets/...` URL in `PreloadScene`. This keeps the repo and the shipped bundle lean and makes "what art is in the game" explicit. Do not commit the raw pack or point the loader at `assets/`. If large first-party source art appears later, reach for Git LFS rather than committing binaries directly.

## Notes

- `README.md` is still the default Vite template and is not an accurate source of project info — use `docs/PROJECT.md`.
- TypeScript uses project references: `tsconfig.json` composes `tsconfig.app.json` (app code under `src/`) and `tsconfig.node.json` (Vite/build tooling).
