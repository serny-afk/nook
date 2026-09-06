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
* Basic interactions

### Phase 2 — Multiplayer

* Rooms
* Real-time player movement
* Shared state
* Server authority
* Reconnection/interpolation

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
* React + TypeScript + Vite configured
* Phaser installed; React ↔ Phaser integration working
* Scene architecture in place: `game.ts` (config) → `PreloadScene` → `WorldScene`
* Asset pipeline defined: Sunnyside pack staged in gitignored `assets/`, curated files committed under `public/assets/`
* World renders a placeholder; no Sunnyside art on screen yet

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the infrastructure fits together
today, and its **Target Architecture** section for the full end-state design.

Next development focus (Phase 1): render the tilemap, then add the player, movement, animations, collision, and camera.
