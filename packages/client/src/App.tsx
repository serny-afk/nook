import { useEffect, useRef, useState } from "react";
import { createGame } from "./game/game";
import type { ConnectionStatus } from "./game/network/NetworkClient";

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

  useEffect(() => {
    if (!gameContainer.current) return;

    const game = createGame(gameContainer.current, setStatus);

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className="app-root">
      <div ref={gameContainer} className="game-container" />
      {status !== "connected" && (
        <div className={`connection-status connection-status--${status}`}>
          {STATUS_LABEL[status]}
        </div>
      )}
    </div>
  );
}

export default App;
