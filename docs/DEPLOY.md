# Deploying Nook

This is the runbook for putting the MVP online. Nook is a monorepo of four
packages; three are deployed and one (`shared`) is a build-time dependency of the
others:

| Package          | What it is                        | Where it runs                         |
| ---------------- | --------------------------------- | ------------------------------------- |
| `client`         | React + Phaser static site        | Static host (Vercel / Cloudflare Pages) |
| `server`         | Colyseus realtime (websockets)    | Railway service                       |
| `api`            | Express REST + Sequelize          | Railway service                       |
| _(Postgres)_     | Database                          | Railway plugin (or Neon)              |
| `shared`         | Wire-contract types               | built into the other three            |

The recommended stack is **Railway** for the two Node services + Postgres (it
supports long-running processes, websockets, and managed Postgres in one place)
and **Vercel or Cloudflare Pages** for the static client (free CDN hosting). Any
host with equivalent capabilities works — the only hard requirements are
persistent websockets for `server` and a `DATABASE_URL` for `api`.

## Prerequisites

- The repo pushed to GitHub.
- A [Railway](https://railway.app) account (server, api, Postgres).
- A [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com)
  account (client).

## Environment variables

| Service | Variable          | Value                                             |
| ------- | ----------------- | ------------------------------------------------- |
| api     | `DATABASE_URL`    | from the Postgres service                         |
| api     | `DATABASE_SSL`    | `true` if the DB requires TLS (see step 1)        |
| api     | `CLIENT_ORIGIN`   | the deployed **client** origin (e.g. `https://nook.vercel.app`) |
| api     | `NODE_ENV`        | `production`                                       |
| api     | `PORT`            | _provided automatically by Railway_               |
| server  | `NODE_ENV`        | `production`                                       |
| server  | `PORT`            | _provided automatically by Railway_               |
| client  | `VITE_SERVER_URL` | the deployed **server** URL as `wss://…`          |
| client  | `VITE_API_URL`    | the deployed **api** URL as `https://…`           |

`VITE_*` vars are inlined into the client **at build time**, so the client must
be (re)built after the server/api URLs are known — see the deploy order below.

## Deploy order

The URLs form a small cycle (the client needs the api/server URLs; the api needs
the client URL for CORS). Break it in this order:

### 1. Postgres

Create a Postgres database (Railway: **New → Database → PostgreSQL**). Copy its
connection string.

- **Railway, same project:** use the **private** `DATABASE_URL` variable
  reference — no TLS needed, so leave `DATABASE_SSL` unset/`false`.
- **Neon or any public URL:** set `DATABASE_SSL=true` on the api service.

### 2. API service (Railway)

Create a service from the GitHub repo with **Root Directory = repo root** (the
build needs the workspace so it can compile `shared` first):

- **Build command:** `npm ci && npm run build:api`
- **Pre-deploy command:** `npm run db:migrate:prod --workspace @nook/api`
  _(runs the compiled Umzug migrations against `DATABASE_URL` before each release)_
- **Start command:** `npm run start --workspace @nook/api`
- **Variables:** `DATABASE_URL`, `NODE_ENV=production`, and `DATABASE_SSL` if
  needed. Leave `CLIENT_ORIGIN` unset for now (set it in step 5).

Deploy, then note the public api URL (e.g. `https://nook-api.up.railway.app`).
Hit `GET /health` — it should return `{"status":"ok","db":"connected"}`,
confirming the DB connection and that migrations ran (`profiles` table exists).

### 3. Server service (Railway)

Add a second service from the same repo, **Root Directory = repo root**:

- **Build command:** `npm ci && npm run build:server`
- **Start command:** `npm run start --workspace @nook/server`
- **Variables:** `NODE_ENV=production`.

Deploy, then note the public server URL. Its websocket form is the same host with
`wss://` (e.g. `wss://nook-server.up.railway.app`). Colyseus sets permissive CORS
on its matchmaking endpoint, so no extra config is needed here.

### 4. Client (Vercel / Cloudflare Pages)

Create a project from the repo:

- **Root Directory:** repo root
- **Install command:** `npm ci`
- **Build command:** `npm run build` _(builds `shared` then the client)_
- **Output directory:** `packages/client/dist`
- **Environment variables:**
  - `VITE_SERVER_URL` = the step-3 `wss://…` URL
  - `VITE_API_URL` = the step-2 `https://…` URL

Deploy, then note the public client URL.

### 5. Close the loop

Set `CLIENT_ORIGIN` on the **api** service to the client URL from step 4 and
redeploy the api (this scopes CORS to your site). The client and server are
already pointed at the right places from step 4.

## Verify

1. Open the client URL → onboarding appears → set a name + hair → the world loads
   with that look.
2. Reload → it skips onboarding (profile persisted) and drops straight in.
3. Open a second browser/incognito window with a **different** name + hair → each
   window sees the other avatar with the correct hair and a name label.
4. `GET <api>/health` → `{"status":"ok","db":"connected"}`.

## Notes & gotchas

- **Redeploy the client** whenever the server/api URLs change — the `VITE_*`
  values are baked in at build time, not read at runtime.
- **`wss://` not `ws://`:** the client is served over HTTPS, so the realtime
  connection must be secure or browsers will block it. Railway's public domains
  are HTTPS/WSS.
- **CORS:** `CLIENT_ORIGIN` must be the client's exact origin (scheme + host, no
  trailing slash). A mismatch shows up as blocked `/profiles` requests in the
  browser console.
- **Migrations** run in the api's pre-deploy step from compiled output
  (`db:migrate:prod`); no `.ts`/`tsx` is needed at runtime. New migrations ship by
  adding a file under `packages/api/src/migrations/` and redeploying.
- **Auth is still password-less** (localStorage identity, unguessable profile
  UUIDs). Fine for the MVP; add real auth before this holds anything sensitive.
