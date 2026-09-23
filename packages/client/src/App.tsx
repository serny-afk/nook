import { useEffect, useRef, useState } from "react";
import type { Profile } from "@nook/shared";
import { createGame } from "./game/game";
import type { ConnectionStatus } from "./game/network/NetworkClient";
import type { InteractionPanel } from "./game/interaction/bridge";
import { resolveSession } from "./session/session";
import { Onboarding } from "./ui/Onboarding";

/** User-facing label per connection status; "connected" shows nothing. */
const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: "Connecting…",
  connected: "",
  reconnecting: "Reconnecting…",
  offline: "Offline",
};

/**
 * Boot flow: resolve the player's saved identity, then either onboard a new
 * player or drop straight into the world.
 * - `loading`: resolving the session (checking for a saved profile).
 * - `onboarding`: no profile yet — show the setup form.
 * - `ready`: profile in hand — mount the Phaser world.
 */
type Phase = "loading" | "onboarding" | "ready";

function App() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [panel, setPanel] = useState<InteractionPanel | null>(null);

  // Resolve any returning player's saved profile once on mount. The `cancelled`
  // guard makes this safe under StrictMode's double-invoke (only the second run
  // commits) and against a slow response after unmount.
  useEffect(() => {
    let cancelled = false;
    resolveSession().then((resolved) => {
      if (cancelled) return;
      setProfile(resolved);
      setPhase(resolved ? "ready" : "onboarding");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mount the Phaser game once we're ready with a profile. Runs after the
  // game-container div is rendered (ready phase), and tears the game down on
  // cleanup so StrictMode's create→destroy→create leaves no duplicate canvas.
  useEffect(() => {
    if (phase !== "ready" || !profile || !gameContainer.current) return;
    const game = createGame(gameContainer.current, profile, setStatus, setPanel);
    return () => {
      game.destroy(true);
    };
  }, [phase, profile]);

  // Let Escape close an open interaction panel.
  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  return (
    <div className="app-root">
      {phase === "onboarding" && (
        <Onboarding
          onComplete={(created) => {
            setProfile(created);
            setPhase("ready");
          }}
        />
      )}
      {phase === "ready" && (
        <>
          <div ref={gameContainer} className="game-container" />
          {status !== "connected" && (
            <div className={`connection-status connection-status--${status}`}>
              {STATUS_LABEL[status]}
            </div>
          )}
          {panel && (
            <div className="interaction-panel" role="dialog" aria-modal="true">
              <h2 className="interaction-panel__title">{panel.title}</h2>
              <p className="interaction-panel__body">{panel.body}</p>
              <button
                type="button"
                className="interaction-panel__close"
                onClick={() => setPanel(null)}
              >
                Close
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
