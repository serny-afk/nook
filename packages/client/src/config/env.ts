/**
 * Client runtime config, resolved once from Vite's build-time env.
 *
 * Vite inlines `VITE_`-prefixed vars into the bundle at build time, so the
 * production URLs are baked in when `npm run build` runs. Locally, no `.env` is
 * needed: the defaults below point at the dev server and API on localhost. See
 * `.env.example` for the vars a non-local build overrides.
 */
export const env = {
  /** Colyseus realtime server endpoint (websocket). */
  serverUrl: import.meta.env.VITE_SERVER_URL ?? "ws://localhost:2567",
  /** REST/persistence API base URL (no trailing slash). */
  apiUrl: (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, ""),
} as const;
