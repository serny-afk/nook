import { useEffect, useRef, useState } from "react";
import { createGame } from "./game/game";
import type { ConnectionStatus } from "./game/network/NetworkClient";
import type { InteractionPanel } from "./game/interaction/bridge";

/** User-facing label per connection status; "connected" shows nothing. */
const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: "Connecting…",
  connected: "",
  reconnecting: "Reconnecting…",
  offline: "Offline",
};

function App() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [panel, setPanel] = useState<InteractionPanel | null>(null);

  useEffect(() => {
    if (!gameContainer.current) return;

    const game = createGame(gameContainer.current, setStatus, setPanel);

    return () => {
      game.destroy(true);
    };
  }, []);

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
    </div>
  );
}

export default App;
