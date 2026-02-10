import { useState, useCallback } from "react";
import { GameSetup } from "./components/GameSetup";
import { BattleScene } from "./components/BattleScene";
import { GameOver } from "./components/GameOver";
import { CardGallery } from "./components/CardGallery";
import { HowToPlay } from "./components/HowToPlay";
import { SpaceBackground } from "./components/SpaceBackground";
import { resolveBattle, BattleResult } from "./engine/battleEngine";

type GamePhase = "setup" | "battle" | "gameover" | "gallery" | "howtoplay";

function App() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [betAmount, setBetAmount] = useState(100);

  const handleStartGame = useCallback((seed: string, bet: number) => {
    // The "Big Bang": seed determines EVERYTHING
    const result = resolveBattle(seed);
    setBattleResult(result);
    setBetAmount(bet);
    setPhase("battle");

    // Debug: log the entire battle to console for verification
    console.group(`🔮 Battle Resolved — Seed: "${seed}"`);
    console.log(
      "Result:",
      result.playerWon ? "PLAYER WINS" : result.isDraw ? "DRAW" : "ENEMY WINS",
    );
    console.log(
      `Final HP — Player: ${result.playerFinalHp}, Enemy: ${result.enemyFinalHp}`,
    );
    result.rounds.forEach((r) => {
      console.log(
        `  Round ${r.round}: ${r.playerCard.name} vs ${r.enemyCard.name} → ` +
          `Player ${r.playerHpBefore}→${r.playerHpAfter} | Enemy ${r.enemyHpBefore}→${r.enemyHpAfter}`,
      );
    });
    console.groupEnd();
  }, []);

  const handleBattleComplete = useCallback(() => {
    setPhase("gameover");
  }, []);

  const handlePlayAgain = useCallback(() => {
    setBattleResult(null);
    setPhase("setup");
  }, []);

  return (
    <div className="app">
      <SpaceBackground />
      {phase === "setup" && (
        <GameSetup
          onStartGame={handleStartGame}
          onOpenGallery={() => setPhase("gallery")}
          onOpenHowToPlay={() => setPhase("howtoplay")}
        />
      )}

      {phase === "battle" && battleResult && (
        <BattleScene
          battleResult={battleResult}
          betAmount={betAmount}
          onBattleComplete={handleBattleComplete}
        />
      )}

      {phase === "gameover" && battleResult && (
        <GameOver
          battleResult={battleResult}
          betAmount={betAmount}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handlePlayAgain}
        />
      )}

      {phase === "gallery" && <CardGallery onBack={() => setPhase("setup")} />}

      {phase === "howtoplay" && <HowToPlay onBack={() => setPhase("setup")} />}
    </div>
  );
}

export default App;
