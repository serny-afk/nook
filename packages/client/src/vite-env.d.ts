/// <reference types="vite/client" />

/**
 * Typed build-time env vars. Vite only exposes `VITE_`-prefixed vars to the
 * browser, inlined at build time; declaring them here makes `import.meta.env`
 * type-checked instead of `any`. See `src/config/env.ts` for how they're read.
 */
interface ImportMetaEnv {
  /** Colyseus realtime server URL (websocket), e.g. wss://nook-server.example. */
  readonly VITE_SERVER_URL?: string;
  /** REST/persistence API base URL, e.g. https://nook-api.example. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
