import React, { useEffect } from "react";
import { BattleResult } from "../engine/battleEngine";
import { soundManager } from "../utils/soundManager";

interface GameOverProps {
  battleResult: BattleResult;
  betAmount: number;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  battleResult,
  betAmount,
  onPlayAgain,
  onReturnHome,
}) => {
  const {
    playerWon,
    isDraw,
    playerFinalHp,
    enemyFinalHp,
    playerMaxHp,
    enemyMaxHp,
    rounds,
    seed,
  } = battleResult;

  // Play victory/defeat sound on mount
  useEffect(() => {
    if (playerWon) {
      soundManager.playVictory();
    } else if (!isDraw) {
      soundManager.playDefeat();
    }

    // Play game over background music
    soundManager.playGameOverMusic();

    return () => {
      soundManager.stopBackgroundMusic();
    };
  }, [playerWon, isDraw]);

  const diff = { color: "#ffd700", icon: "⚔", name: "On-Chain", multiplier: 1.9, drawMultiplier: 1 };
  const resultText = isDraw ? "DRAW" : playerWon ? "VICTORY" : "DEFEAT";
  const resultClass = isDraw ? "draw" : playerWon ? "victory" : "defeat";

  // Calculate payout (5% house edge, matching contract)
  const multiplier = isDraw
    ? diff.drawMultiplier
    : playerWon
      ? diff.multiplier
      : 0;
  const payout = Math.floor(betAmount * multiplier);
  const profit = payout - betAmount;

  // Count major arcana appearances
  const majorCount = rounds.reduce((acc, r) => {
    return (
      acc +
      (r.playerCard.type === "major" ? 1 : 0) +
      (r.enemyCard.type === "major" ? 1 : 0)
    );
  }, 0);

  return (
    <div className={`gameover-container ${resultClass}`}>
      <div className="gameover-backdrop" />

      <div className="gameover-content">
        <div className={`gameover-title ${resultClass}`}>{resultText}</div>

        <div className="gameover-subtitle">
          {isDraw
            ? "The scales of fate are balanced."
            : playerWon
              ? "Fortune favors the bold."
              : "The cards have spoken."}
        </div>

        {/* Difficulty badge */}
        <div className="gameover-difficulty" style={{ color: diff.color }}>
          {diff.icon} {diff.name} — ×{diff.multiplier} Payout
        </div>

        {/* Final HP comparison */}
        <div className="gameover-hp">
          <div className="hp-final player">
            <span className="hp-label">You</span>
            <span className="hp-value">
              {playerFinalHp} / {playerMaxHp}
            </span>
            <div className="hp-bar-mini">
              <div
                className="hp-bar-mini-fill player"
                style={{ width: `${(playerFinalHp / playerMaxHp) * 100}%` }}
              />
            </div>
          </div>
          <div className="hp-vs">VS</div>
          <div className="hp-final enemy">
            <span className="hp-label">Enemy</span>
            <span className="hp-value">
              {enemyFinalHp} / {enemyMaxHp}
            </span>
            <div className="hp-bar-mini">
              <div
                className="hp-bar-mini-fill enemy"
                style={{ width: `${(enemyFinalHp / enemyMaxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Payout */}
        <div className="gameover-payout">
          <div className="payout-row">
            <span>Bet</span>
            <span>{betAmount} tokens</span>
          </div>
          <div className="payout-row">
            <span>Multiplier</span>
            <span>×{multiplier}</span>
          </div>
          <div
            className={`payout-row total ${profit > 0 ? "profit" : profit < 0 ? "loss" : ""}`}
          >
            <span>Result</span>
            <span>
              {profit > 0 ? "+" : ""}
              {profit} tokens
            </span>
          </div>
        </div>

        {/* Battle Summary */}
        <div className="gameover-summary">
          <h3>Battle Log</h3>
          <div className="summary-rounds">
            {rounds.map((r) => (
              <div key={r.round} className="summary-round">
                <div className="summary-round-header">
                  Round {r.round}
                  {r.isCritical && <span className="critical-badge">⚡</span>}
                </div>
                <div className="summary-round-cards">
                  <span
                    className={`summary-card ${r.playerCard.type === "major" ? "major" : ""}`}
                  >
                    {r.playerCard.name}
                  </span>
                  <span className="summary-vs">vs</span>
                  <span
                    className={`summary-card ${r.enemyCard.type === "major" ? "major" : ""}`}
                  >
                    {r.enemyCard.name}
                  </span>
                </div>
                <div className="summary-round-result">
                  You: {r.playerHpBefore} → {r.playerHpAfter} HP
                  {" | "}
                  Enemy: {r.enemyHpBefore} → {r.enemyHpAfter} HP
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provably Fair verification */}
        <div className="gameover-verification">
          <h3>🔮 Provably Fair</h3>
          <div className="verification-field">
            <span className="verification-label">VRF Seed</span>
            <code className="verification-value">{seed}</code>
          </div>
          <div className="verification-field">
            <span className="verification-label">Events</span>
            <code className="verification-value">
              {majorCount} Major Arcana appeared
            </code>
          </div>
          <p className="verification-hint">
            This battle is provably fair — the same VRF seed always produces the
            exact same result, verifiable on-chain.
          </p>
        </div>

        <div className="gameover-actions">
          <button className="btn-primary" onClick={onPlayAgain}>
            🔄 Play Again
          </button>
          <button className="btn-secondary" onClick={onReturnHome}>
            🏠 Return Home
          </button>
        </div>
      </div>
    </div>
  );
};
