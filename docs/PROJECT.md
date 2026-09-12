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

Phase 1 (Core World) is complete, and Phase 2 (Multiplayer) is underway:

* Monorepo now has all three packages: `client`, `server` (Colyseus), `shared`
  (wire contract — `protocol` messages + `state` schema, imported by both sides)
* A Colyseus `world` room tracks each player's position; the client joins on load
  and streams its resolved position (client-authoritative, relayed by the server)
* Remote players are mirrored as `Character`s driven by `applySnapshot`
  (interpolated), spawned/removed as players join and leave the room

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
4. **Basic interactions** — deferred here from Phase 1. Still to do.

Deferred polish (no blocker; revisit when relevant):

* A real, hand-authored Tiled map to replace the placeholder `world.tmj`.
* Depth / y-sorting so the player draws behind tall objects like rocks.
* More hairstyles + a tools layer, then the Phase 5 customization UI/persistence.
