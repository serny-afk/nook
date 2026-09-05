# Architecture

How Nook is put together. This documents the *current* infrastructure; the
product roadmap lives in [PROJECT.md](./PROJECT.md).

## Stack

| Layer   | Tech                          |
| ------- | ----------------------------- |
| UI      | React 19 + TypeScript + Vite  |
| 2D world| Phaser 4                      |
| Backend | Deferred (Node · Colyseus · PostgreSQL, added when a phase needs it) |

## The core split: React shell hosts a Phaser world

React and Phaser own separate concerns and this boundary is deliberate:

- **React** — application UI: menus, productivity features, overlays.
- **Phaser** — the interactive 2D world: rendering, characters, movement,
  tilemaps, collision, camera, interactions.

`src/App.tsx` is the bridge. It creates the Phaser game in a `useEffect`
(mounting it into a `ref`'d `<div>`) and destroys it in the cleanup function.
Because `main.tsx` wraps the app in `<StrictMode>`, that effect runs twice in
dev (create → destroy → create); the cleanup makes this safe, so game creation
must stay idempotent and always tear down.

Game logic stays inside `src/game/` and out of React components. Communicate
across the boundary through explicit interfaces (props/callbacks or Phaser
events), never by reaching into Phaser internals from React or touching the DOM
from Phaser.

## Game structure (`src/game/`)

```
src/game/
├── game.ts              Phaser configuration only — no game logic.
└── scenes/
    ├── keys.ts          SceneKeys constant (typo-proof scene references).
    ├── PreloadScene.ts  Loads all assets, then starts the world.
    └── WorldScene.ts    The actual 2D world (grows through Phase 1).
```

Scenes boot in array order (`game.ts`): **Preload → World**. `PreloadScene` is
the single place asset `this.load.*` calls belong. Rendering uses
`pixelArt: true` so the pixel-art tiles stay crisp when scaled, with
`Scale.FIT` + centering.

## Assets

The world art is the **Sunnyside World** pixel-art pack (16px tileset, layered
strip-based human character, elements). Two locations, two jobs:

- **`assets/` — gitignored.** Raw source pack; local staging only. Never served
  or committed. Keep the original download backed up outside the repo.
- **`public/assets/` — committed.** Only the curated subset the game uses. Vite
  serves `public/` at the web root, so `public/assets/tilesets/foo.png` loads in
  Phaser by the URL `/assets/tilesets/foo.png`.

**Adding art:** find it in `assets/` → copy that one file into
`public/assets/…` → load it by its `/assets/…` URL in `PreloadScene`. This keeps
the repo and shipped bundle lean. If large first-party source art appears later,
use Git LFS rather than committing binaries directly.

## Commands

| Command           | Does                                                    |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Vite dev server with HMR                                |
| `npm run build`   | `tsc -b` type-check, then production build (fails on TS errors) |
| `npm run lint`    | ESLint over the repo                                    |
| `npm run preview` | Serve the production build locally                      |

No test runner is configured yet.
