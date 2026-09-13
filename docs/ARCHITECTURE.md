# Architecture

How Nook is put together. Most of this documents the infrastructure that
**exists today**; the [Target Architecture](#target-architecture-end-state)
section near the end describes the **end state** we are building toward. The
product roadmap and phase breakdown live in [PROJECT.md](./PROJECT.md).

## Stack

| Layer   | Tech                          |
| ------- | ----------------------------- |
| UI      | React 19 + TypeScript + Vite  |
| 2D world| Phaser 4                      |
| Backend | Deferred (Node · Colyseus · PostgreSQL, added when a phase needs it) |

## Repository layout

The repo is an **npm workspaces monorepo**. Each runtime piece is a package under
`packages/`, so the pieces the [target architecture](#target-architecture-end-state)
describes each get a home as they come online:

```
nook/
├── package.json          workspace root (scripts delegate to packages)
├── tsconfig.json         solution file referencing each package
├── docs/                 this doc + PROJECT.md
└── packages/
    ├── client/           browser app — React shell + Phaser world
    ├── server/           Colyseus realtime server            (Phase 2)
    └── shared/           wire-contract types, imported by both (Phase 2)
```

All three packages now exist (`server` and `shared` came online with Phase 2
multiplayer). `shared` splits its contract into two entry points: `@nook/shared`
(dependency-free `protocol` messages) and `@nook/shared/state` (the Colyseus
`state` schema). Paths below like `src/game/…` are relative to `packages/client`.

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

## Game structure (`packages/client/src/game/`)

```
src/game/
├── game.ts              Phaser configuration only — no game logic.
├── objects/
│   ├── Character.ts       Composed humanoid: move() (intent-driven, local) and
│   │                      applySnapshot() (position-driven, remote players).
│   ├── Player.ts          Local player — a Character wired to keyboard input.
│   └── characterConfig.ts Appearance model + layer/animation key helpers.
├── input/
│   └── KeyboardMovement.ts Reads directional intent from arrows/WASD.
├── interaction/
│   ├── Interactable.ts     A world point the player can act on (data only).
│   ├── InteractionManager.ts Proximity + "press E" prompt + interact key; fires
│   │                       the active interactable's action.
│   └── bridge.ts           Interaction-panel contract surfaced to the React shell.
├── network/
│   └── NetworkClient.ts   Colyseus connection: joins the room, relays the local
│                          position, surfaces remote players to the scene.
└── scenes/
    ├── keys.ts          SceneKeys constant (typo-proof scene references).
    ├── PreloadScene.ts  Loads all assets, then starts the world.
    └── WorldScene.ts    The actual 2D world: map, local + remote players, camera.
```

Scenes boot in array order (`game.ts`): **Preload → World**. `PreloadScene` is
the single place asset `this.load.*` calls belong. Rendering uses
`pixelArt: true` so the pixel-art tiles stay crisp when scaled, with
`Scale.RESIZE` so the canvas fills its parent (the full-viewport container).

## Assets

The world art is the **Sunnyside World** pixel-art pack (16px tileset, layered
strip-based human character, elements). Two locations, two jobs:

- **`assets/` (repo root) — gitignored.** Raw source pack; local staging only.
  Never served or committed. Keep the original download backed up outside the repo.
- **`packages/client/public/assets/` — committed.** Only the curated subset the
  game uses. Vite serves the client's `public/` at the web root, so
  `packages/client/public/assets/tilesets/foo.png` loads in Phaser by the URL
  `/assets/tilesets/foo.png`.

**Adding art:** find it in `assets/` → copy that one file into
`public/assets/…` → load it by its `/assets/…` URL in `PreloadScene`. This keeps
the repo and shipped bundle lean. If large first-party source art appears later,
use Git LFS rather than committing binaries directly.

## Target Architecture (end state)

> **Mostly not built yet.** The realtime server (Colyseus) has come online with
> Phase 2, but the API server, database, and server-authoritative movement below
> are still ahead. Today's multiplayer is client-authoritative (each client
> relays its own resolved position); the server validation / prediction +
> correction described here is the destination, not the current behavior. This
> section is introduced phase by phase (see [PROJECT.md](./PROJECT.md)), never
> upfront. SkyOffice is the closest reference: the same Phaser + Colyseus + React
> shape.

At the end state there are **four runtime pieces** — the browser client, a
realtime server, an API server, and a database — plus a shared-types package that
keeps the wire contracts honest across all of them.

```text
┌───────────────────────────── BROWSER (client) ─────────────────────────────┐
│  React shell ──── UI · menus · productivity · auth forms · HUD overlays      │
│     │ ▲                                                                       │
│     │ │  props / callbacks / events  (the App.tsx bridge)                     │
│     ▼ │                                                                       │
│  Phaser world ── tilemap · local player · remote players · collision ·       │
│     │            camera · animations · interactions                          │
│     │                                                                         │
│  ┌──┴──────────────┐              ┌──────────────────────┐                    │
│  │ Colyseus client │              │ REST client (fetch)  │                    │
│  │ (WebSocket)     │              │ (HTTP + JWT)         │                    │
│  └──────┬──────────┘              └───────────┬──────────┘                    │
└─────────┼─────────────────────────────────────┼─────────────────────────────┘
          │ realtime state (20–60/s)             │ CRUD (occasional)
          ▼                                      ▼
┌────────────────────────┐          ┌──────────────────────────────┐
│ REALTIME SERVER         │          │ API SERVER                   │
│ Node + Colyseus         │          │ Node + Express/Fastify       │
│ · rooms (= spaces)      │          │ · auth (signup/login/JWT)    │
│ · authoritative state   │          │ · profiles / customization   │
│ · movement validation   │          │ · tasks / focus history      │
│ · presence · chat       │          │ · furniture / personal space │
│ · broadcasts deltas     │          │ · ORM (Sequelize/Prisma)     │
└──────────┬──────────────┘          └───────────────┬──────────────┘
           │  durable writes via API/ORM             │
           └────────────────────┬────────────────────┘
                                ▼
                     ┌────────────────────┐
                     │ PostgreSQL          │
                     │ users · profiles ·  │
                     │ customization ·     │
                     │ furniture · tasks · │
                     │ focus logs · social │
                     └────────────────────┘

  (optional, at scale)  Redis ── Colyseus presence/driver across nodes
  Static assets ──────  served from public/ via CDN
```

### What each piece owns

- **Browser client** — two sub-layers behind one bridge (the split above,
  extended). React owns application UI; Phaser owns the world. Two thin
  networking clients are the *only* things that talk to servers: a **Colyseus
  client** (WebSocket, live world state) and a **REST client** (HTTP, durable
  CRUD). React and Phaser go through them, never straight to the network.
- **Realtime server (Colyseus / Node)** — the live, in-memory brain of a shared
  space. A **room = one virtual space/zone**, holding *authoritative* state
  (presence, positions, chat, interaction state) in a Colyseus schema. The
  client requests a move; the server validates and broadcasts the result
  (**server authority**). This state is mostly **ephemeral** — anything that must
  outlive the session is pushed to the database via the API/ORM.
- **API server (Node + Express/Fastify + ORM)** — the conventional full-stack
  half: auth, profiles, character customization, saved personal spaces/furniture,
  productivity data (tasks, focus history), social graph. Classic
  request → ORM → Postgres → JSON. No realtime here.
- **PostgreSQL** — durable source of truth for everything that must survive a
  refresh.
- **Shared types** — one TypeScript package of message/schema contracts imported
  by client *and* both servers, so the wire format cannot drift.

### Two flows worth understanding

**Auth → joining a world** (how the two servers cooperate):

```text
1. Client → API server:  POST /login      → returns a JWT
2. Client → Colyseus:    joinRoom(token)  → Colyseus verifies the JWT
3. Colyseus:             adds player to room, begins syncing state
```

Auth is REST's job; the realtime server just trusts a verified token on join. The
token is the handoff — the two servers barely need to talk.

**Movement** (the realtime loop, Phase 2):

```text
Local player presses a key
  → Phaser moves them immediately  (client-side prediction — feels instant)
  → sends intent to Colyseus
  → server validates, updates authoritative state, broadcasts delta
  → other clients receive the delta, interpolate remote players smoothly
```

"Game logic runs client-side" and "server authority" aren't a contradiction: the
client *predicts* for responsiveness, the server *corrects* for truth.

### When each piece comes online

| Phase | Comes online | Boxes above |
| ----- | ------------ | ----------- |
| **1 (now)** | World renders & plays locally | Browser only (React + Phaser). No servers. |
| **2** | Multiplayer | + Colyseus realtime server (+ Redis only past one node) |
| **3** | Accounts & persistence | + API server + PostgreSQL + ORM |
| **4** | Productivity | Mostly React UI + API/DB; some room-level state in Colyseus (study rooms) |
| **5** | Polish / personal spaces | Furniture & customization persisted in DB, placed live via Colyseus |

### Deployment & hosting notes

The three tiers have very different hosting needs:

- **Frontend** — a static bundle. Any CDN/static host (Vercel, Netlify,
  Cloudflare Pages). Trivial.
- **API server + PostgreSQL** — a stateless HTTP service plus a managed database.
  Completely standard; any Node host + managed Postgres (Railway, Render, Fly.io,
  Supabase, Neon, RDS). Trivial.
- **Colyseus** — the one with real constraints, because it is **stateful and
  WebSocket-based**: a client must stay connected to the *specific* process
  holding its room, over a long-lived connection.
  - **Will not work on serverless/static platforms** (Vercel, Netlify, plain
    Cloudflare Workers) — those are short-lived, stateless request models. This is
    the single biggest gotcha; don't try to deploy the realtime server there.
  - **Does work, easily, on any "real server" host** that keeps WebSockets alive:
    [Colyseus Cloud](https://colyseus.io/) (first-party, purpose-built),
    Fly.io, Railway, Render, or a plain VPS.
  - **Single node carries this app for a long time.** A cozy, low-tick space
    needs only modest resources; one small instance handles many concurrent
    players. Multi-node scaling adds **Redis** (shared presence/matchmaking
    driver) and **sticky routing** — defer both until traffic actually demands it.

  **Verdict:** hosting Colyseus is not a problem for a solo project — as long as
  the realtime server goes on a stateful host and *not* the same static/serverless
  target as the frontend.

## Commands

| Command           | Does                                                    |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Vite dev server with HMR                                |
| `npm run build`   | `tsc -b` type-check, then production build (fails on TS errors) |
| `npm run lint`    | ESLint over the repo                                    |
| `npm run preview` | Serve the production build locally                      |

No test runner is configured yet.
