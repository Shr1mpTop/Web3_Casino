import { useState, useCallback, useEffect } from "react";
import { GameSetup } from "./components/GameSetup";
import { BattleScene } from "./components/BattleScene";
import { GameOver } from "./components/GameOver";
import { CardGallery } from "./components/CardGallery";
import { HowToPlay } from "./components/HowToPlay";
import { SpaceBackground } from "./components/SpaceBackground";
import { useFateEcho } from "./web3/useFateEcho";

type GamePhase = "setup" | "battle" | "gameover" | "gallery" | "howtoplay";

function App() {
  const [phase, setPhase] = useState<GamePhase>("setup");

  const {
    flowState,
    flowData,
    isConnected,
    balance,
    startGame,
    startAnimation,
    settleBattle,
    resetGame,
  } = useFateEcho();

  // ── Auto-transition: battle_ready → start animation → show BattleScene ──
  useEffect(() => {
    if (flowState === "battle_ready" && flowData.battleResult) {
      startAnimation();
      setPhase("battle");

      // Debug log
      const result = flowData.battleResult;
      console.group(`🔮 Battle Resolved — Seed: "${flowData.seed}"`);
      console.log(
        "Result:",
        result.playerWon ? "PLAYER WINS" : result.isDraw ? "DRAW" : "ENEMY WINS"
      );
      console.log(
        `Final HP — Player: ${result.playerFinalHp}/${result.playerMaxHp}, Enemy: ${result.enemyFinalHp}/${result.enemyMaxHp}`
      );
      result.rounds.forEach((r) => {
        console.log(
          `  Round ${r.round}: ${r.playerCard.name} vs ${r.enemyCard.name} → ` +
            `Player ${r.playerHpBefore}→${r.playerHpAfter} | Enemy ${r.enemyHpBefore}→${r.enemyHpAfter}`
        );
      });
      console.groupEnd();
    }
  }, [flowState, flowData.battleResult, flowData.seed, startAnimation]);

  // ── Auto-transition: settled → show GameOver ──
  useEffect(() => {
    if (flowState === "settled") {
      setPhase("gameover");
    }
  }, [flowState]);

  // ── Handlers ──
  const handleStartGame = useCallback(
    (betEth: string) => {
      startGame(betEth);
      // Stay on "setup" phase — it shows the flow status indicators
    },
    [startGame]
  );

  const handleBattleComplete = useCallback(() => {
    // Animation done → settle on-chain
    settleBattle();
    // Will auto-transition to gameover when settled
  }, [settleBattle]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setPhase("setup");
  }, [resetGame]);

  const betAmountNum = parseFloat(flowData.betAmount) || 0;

  return (
    <div className="app">
      <SpaceBackground />

      {phase === "setup" && (
        <GameSetup
          onStartGame={handleStartGame}
          onOpenGallery={() => setPhase("gallery")}
          onOpenHowToPlay={() => setPhase("howtoplay")}
          flowState={flowState}
          balance={balance}
          errorMessage={flowData.errorMessage}
          requestId={flowData.requestId}
          txHash={flowData.txHash ?? null}
          onReset={handlePlayAgain}
        />
      )}

      {phase === "battle" && flowData.battleResult && (
        <BattleScene
          battleResult={flowData.battleResult}
          betAmount={betAmountNum}
          onBattleComplete={handleBattleComplete}
        />
      )}

      {phase === "gameover" && flowData.battleResult && (
        <GameOver
          battleResult={flowData.battleResult}
          betAmount={flowData.betAmount}
          payoutAmount={flowData.payoutAmount}
          txHash={flowData.txHash}
          settleTxHash={flowData.settleTxHash}
          requestId={flowData.requestId}
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
