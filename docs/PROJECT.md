# Nook

A cozy browser-based virtual space to work, study, and hang out.

## Vision

Nook is inspired by:

* **lofi.town** — north-star product vision
* **SkyOffice** — MVP and multiplayer reference
* **Cozy Zen** — cozy study/coworking aesthetic

The goal is a polished virtual-world/productivity app, not a traditional game.

## Stack

### Frontend

* React
* TypeScript
* Vite

### 2D World

* Phaser

### Planned Backend

* Node.js
* Colyseus
* PostgreSQL
* REST API

Backend technologies should be introduced when needed rather than upfront.

## Architecture

```text
React
├── UI
├── Menus
└── Productivity features

Phaser
├── World
├── Characters
├── Movement
├── Animations
├── Tilemaps
├── Collision
└── Interactions

Backend (later)
├── REST API
├── Multiplayer / Colyseus
└── PostgreSQL
```

React handles the application UI while Phaser handles the interactive 2D world.

## Development Phases

### Phase 1 — Core World

* Pixel-art environment
* Tilemap
* Player character
* Movement
* Animations
* Collision
* Camera

### Phase 2 — Multiplayer

* Rooms
* Real-time player movement
* Shared state
* Server authority
* Reconnection/interpolation
* Basic interactions (deferred from Phase 1)

### Phase 3 — Persistence

* Authentication
* User profiles
* PostgreSQL
* Character/customization persistence

### Phase 4 — Productivity

* Focus sessions
* Timers
* Tasks
* Study rooms
* Music/ambient features

### Phase 5 — Polish

* Customization
* Personal spaces
* Furniture
* Social features
* Performance/deployment

## Current State

* GitHub repo: `nook`
* React + TypeScript + Vite configured; React ↔ Phaser integration working
* Scene architecture: `game.ts` (config) → `PreloadScene` → `WorldScene`
* Asset pipeline: Sunnyside pack staged in gitignored `assets/`, curated files committed under `public/assets/`
* Canvas fills the browser and is responsive (Phaser `Scale.RESIZE`)
* World loads a map authored in Tiled (`public/assets/maps/world.tmj`), larger than the viewport, with a `ground` layer and an `obstacles` layer
* Collision: player collides with the obstacles layer (rocks)
* Camera follows the player with a soft lerp and a center deadzone, bounded to the map
* Player built from stacked Sunnyside layers (base body + hair), composed via an `Appearance` model; movement input is a separate module (keyboard now, ready for network-driven remote players)

Phases 1 (Core World) and 2 (Multiplayer) are complete; Phase 3 (Persistence)
has begun:

* Monorepo has four packages: `client`, `server` (Colyseus realtime), `shared`
  (wire contract — `protocol` messages + `state` schema, imported by both sides),
  and `api` (the REST/persistence tier, new — see Phase 3 progress below)
* A Colyseus `world` room tracks each player's position; the client joins on load
  and streams its resolved position (client-authoritative, relayed by the server)
* Remote players are mirrored as `Character`s driven by `applySnapshot`
  (interpolated), spawned/removed as players join and leave the room
* A data-driven interaction system: interactables carry a world anchor, radius,
  prompt, and action; the nearest in-range one shows a floating "press E" prompt
  and fires on the interact key. The first opens a React overlay via the same
  registry bridge as connection status

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the infrastructure fits together
today, and its **Target Architecture** section for the full end-state design.

## Short-term TODO

Phase 1 (Core World) is complete: Tiled map + loader, fullscreen/responsive
canvas, collision, camera feel, and a layered, customizable character (with
movement input already extracted for future network-driven players).

**MVP target:** Phase 1 + a thin slice of Phase 2 (a few players in a shared
room, client-authoritative movement relayed by the server) + lightweight account
persistence. Real OAuth is deferred; the backend is introduced once, when the
world is solid — multiplayer and persistence then share it.

Phase 2 — Multiplayer, progress:

1. ~~**Colyseus server** — introduce the Node/Colyseus backend and a room.~~ Done.
2. ~~**Shared movement** — broadcast each client's position, spawn and interpolate
   remote players (reusing `Character` with a network-driven driver instead of
   keyboard).~~ Done (client-authoritative position relay + `applySnapshot`).
3. ~~**Join / leave / reconnection** — handle players entering, leaving,
   dropping.~~ Done: seamless reconnection (server holds a dropped slot ~20s;
   client auto-retries with backoff) and connection state surfaced to the user
   via a status pill in the React shell (connecting / reconnecting / offline).
4. ~~**Basic interactions** — deferred here from Phase 1.~~ Done: a data-driven
   interaction system (proximity detection + a floating "press E" prompt + an
   interact key) drives interactables — plain objects with a world anchor,
   radius, prompt, and action. The first is a landmark pine that opens a React
   panel, exercising the React↔Phaser bridge end to end and setting the pattern
   future productivity "stations" reuse.

Phase 3 — Persistence, progress:

1. **Custom API foundation** — a new `packages/api` (Express + Sequelize +
   Postgres, TypeScript, layered: `server` → `app` → routes → services →
   models). Scaffolded so far: typed config, JSON logger, Sequelize connection,
   an app factory with a DB-pinging `/health`, graceful shutdown, and a
   Dockerized Postgres (`docker-compose.yml`). **Status: written, not yet
   installed / run / verified / committed.** See `packages/api/README.md` to run
   it.
2. **Profile resource** — a `Profile` model + migration + service + routes
   (display name + appearance), proving route → service → model → Postgres end
   to end. *Next up.*
3. **Auth + validation** — signup/login, hashed passwords, JWT, and request
   validation (Zod, shared via `@nook/shared`). *Deferred to its own milestone.*
4. **Client wiring** — a REST client, session handling, an onboarding UI, and
   loading the persisted appearance into the world.
5. **Realtime handoff** — Colyseus verifies the JWT on join; name/appearance
   added to `PlayerState` so other players see them (retires the hardcoded
   `REMOTE_APPEARANCE`).

Decision on record: we build this tier ourselves (custom API + Postgres) rather
than a BaaS like Supabase — the project is held to production standards and
building the backend is an explicit goal. Supabase/Neon as *managed Postgres*
stays a drop-in option (it's just a different `DATABASE_URL`).

Deferred polish (no blocker; revisit when relevant):

* A real, hand-authored Tiled map to replace the placeholder `world.tmj`.
* Depth / y-sorting: characters now sort by their feet (so they pass behind the
  pine); extending this to the tilemap's tall props (e.g. rocks) is still open.
* More hairstyles + a tools layer, then the Phase 5 customization UI/persistence.
