# @nook/api

The REST/persistence tier for Nook — accounts, profiles, and (later) productivity
data. A conventional full-stack API: `request → route → service → model →
Postgres → JSON`, deliberately separate from the realtime Colyseus server
(`@nook/server`). See [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) for how
it fits the whole system and [`docs/PROJECT.md`](../../docs/PROJECT.md) for the
phase roadmap.

## Stack

- **Express 5** + **TypeScript** (ESM, `nodenext`)
- **Sequelize** + **Postgres** (via the `pg` driver)
- **Docker Compose** for local Postgres
- **Vitest** for tests

## Layout

```
src/
├── config/       env → typed config (fails fast on missing vars)
├── lib/          logger (and other cross-cutting helpers)
├── db/           the single Sequelize instance + connection check
├── middleware/   Express middleware (central error handler)
├── models/       Sequelize models                     (coming next)
├── services/     business logic — the real work        (coming next)
├── routes/       thin HTTP handlers → services          (coming next)
├── app.ts        Express app factory (importable by tests, no port/DB bind)
└── server.ts     startup: connect DB → listen → graceful shutdown
```

Routes stay thin; logic lives in services; Sequelize models are the data layer.
`app.ts` is separated from `server.ts` so tests can exercise the app without
opening a port.

## Prerequisites

- Node (repo root `npm install` installs this workspace's deps)
- **Docker Desktop** running — for local Postgres. (Or point `DATABASE_URL` at a
  managed Postgres like Neon/Supabase; no code changes needed.)

## Setup & run

From this directory unless noted:

```sh
cp .env.example .env          # defaults match docker-compose.yml
docker compose up -d          # start local Postgres (or: npm run db:up)
npm install                   # from the repo ROOT (workspaces)
npm run dev:api               # from the repo ROOT — tsx watch, HMR-style restart
```

Verify it's healthy (in another shell):

```sh
curl http://localhost:4000/health
# → {"status":"ok","db":"connected"}
```

Stop Postgres with `npm run db:down` (data persists in the `nook-pgdata` volume).

## Scripts

| Command            | Does                                             |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | `tsx watch` the server (restarts on change)      |
| `npm run build`    | `tsc -b` type-check + emit to `dist/`            |
| `npm run start`    | run the built server from `dist/`                |
| `npm run test`     | run Vitest                                       |
| `npm run db:up`    | start the Dockerized Postgres                    |
| `npm run db:down`  | stop it                                          |

## Status

Foundation only: a typed Express server that connects to Postgres and serves
`/health`. **Next:** a `Profile` model + migration + service + routes. Auth and
request validation are deferred to their own milestone. See `docs/PROJECT.md`
(Phase 3 progress) for the full plan.
