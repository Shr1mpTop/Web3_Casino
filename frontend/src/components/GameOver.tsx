import React from "react";
import { BattleResult } from "../engine/battleEngine";
import { MAX_HP } from "../engine/cardData";

interface GameOverProps {
  battleResult: BattleResult;
  betAmount: number;
  onPlayAgain: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  battleResult,
  betAmount,
  onPlayAgain,
}) => {
  const {
    playerWon,
    isDraw,
    playerFinalHp,
    enemyFinalHp,
    rounds,
    seed,
    seedHash,
  } = battleResult;

  const resultText = isDraw ? "DRAW" : playerWon ? "VICTORY" : "DEFEAT";
  const resultClass = isDraw ? "draw" : playerWon ? "victory" : "defeat";

  // Calculate payout
  const multiplier = isDraw ? 1 : playerWon ? 2 : 0;
  const payout = betAmount * multiplier;
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

        {/* Final HP comparison */}
        <div className="gameover-hp">
          <div className="hp-final player">
            <span className="hp-label">You</span>
            <span className="hp-value">
              {playerFinalHp} / {MAX_HP}
            </span>
            <div className="hp-bar-mini">
              <div
                className="hp-bar-mini-fill player"
                style={{ width: `${(playerFinalHp / MAX_HP) * 100}%` }}
              />
            </div>
          </div>
          <div className="hp-vs">VS</div>
          <div className="hp-final enemy">
            <span className="hp-label">Enemy</span>
            <span className="hp-value">
              {enemyFinalHp} / {MAX_HP}
            </span>
            <div className="hp-bar-mini">
              <div
                className="hp-bar-mini-fill enemy"
                style={{ width: `${(enemyFinalHp / MAX_HP) * 100}%` }}
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
            <span className="verification-label">Seed</span>
            <code className="verification-value">{seed}</code>
          </div>
          <div className="verification-field">
            <span className="verification-label">Hash</span>
            <code className="verification-value">{seedHash}</code>
          </div>
          <div className="verification-field">
            <span className="verification-label">Events</span>
            <code className="verification-value">
              {majorCount} Major Arcana appeared
            </code>
          </div>
          <p className="verification-hint">
            Enter the same seed to replay this exact battle — every card, every
            outcome, identical.
          </p>
        </div>

        <button className="btn-primary" onClick={onPlayAgain}>
          🔄 Play Again
        </button>
      </div>
    </div>
  );
};
