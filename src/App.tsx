import { useEffect, useRef } from "react";
import { createGame } from "./game/game";

function App() {
  const gameContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameContainer.current) return;

    const game = createGame(gameContainer.current);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameContainer} className="game-container" />;
}

export default App;