import React, { useEffect } from "react";
import { BattleResult } from "../engine/battleEngine";
import { soundManager } from "../utils/soundManager";

const EXPLORER_BASE =
  import.meta.env.VITE_BLOCK_EXPLORER || "https://sepolia.etherscan.io";
const WIN_MULTIPLIER = Number(import.meta.env.VITE_WIN_MULTIPLIER || "1.9");

interface GameOverProps {
  battleResult: BattleResult;
  betAmount: string; // ETH string
  payoutAmount: string | null; // ETH string from contract
  txHash: `0x${string}` | null;
  settleTxHash: `0x${string}` | null;
  requestId: bigint | null;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  battleResult,
  betAmount,
  payoutAmount,
  txHash,
  settleTxHash,
  requestId,
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
    soundManager.playGameOverMusic();
    return () => {
      soundManager.stopBackgroundMusic();
    };
  }, [playerWon, isDraw]);

  const resultText = isDraw ? "DRAW" : playerWon ? "VICTORY" : "DEFEAT";
  const resultClass = isDraw ? "draw" : playerWon ? "victory" : "defeat";

  const betEth = parseFloat(betAmount) || 0;
  const payoutEth = payoutAmount ? parseFloat(payoutAmount) : 0;
  const profitEth = payoutEth - betEth;

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

        {/* On-chain badge */}
        <div className="gameover-difficulty" style={{ color: "#ffd700" }}>
          ⚔ On-Chain — ×{WIN_MULTIPLIER} Payout
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

        {/* Payout — ETH amounts */}
        <div className="gameover-payout">
          <div className="payout-row">
            <span>Bet</span>
            <span>⟠ {betEth.toFixed(4)} ETH</span>
          </div>
          <div className="payout-row">
            <span>Payout</span>
            <span>⟠ {payoutEth.toFixed(4)} ETH</span>
          </div>
          <div
            className={`payout-row total ${profitEth > 0 ? "profit" : profitEth < 0 ? "loss" : ""}`}
          >
            <span>Result</span>
            <span>
              {profitEth > 0 ? "+" : ""}
              {profitEth.toFixed(4)} ETH
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

        {/* Provably Fair + On-Chain Verification */}
        <div className="gameover-verification">
          <h3>🔮 Provably Fair — On-Chain</h3>

          <div className="verification-field">
            <span className="verification-label">Chainlink VRF Seed</span>
            <code className="verification-value">
              {seed
                ? seed.length > 40
                  ? seed.slice(0, 20) + "..." + seed.slice(-20)
                  : seed
                : "—"}
            </code>
          </div>

          {requestId && (
            <div className="verification-field">
              <span className="verification-label">VRF Request ID</span>
              <code className="verification-value">
                {requestId.toString().slice(0, 20)}...
              </code>
            </div>
          )}

          {txHash && (
            <div className="verification-field">
              <span className="verification-label">Bet TX</span>
              <a
                className="verification-link"
                href={`${EXPLORER_BASE}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)} ↗
              </a>
            </div>
          )}

          {settleTxHash && (
            <div className="verification-field">
              <span className="verification-label">Settle TX</span>
              <a
                className="verification-link"
                href={`${EXPLORER_BASE}/tx/${settleTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {settleTxHash.slice(0, 10)}...{settleTxHash.slice(-8)} ↗
              </a>
            </div>
          )}

          <div className="verification-field">
            <span className="verification-label">Events</span>
            <code className="verification-value">
              {majorCount} Major Arcana appeared
            </code>
          </div>

          <p className="verification-hint">
            This battle is provably fair — the Chainlink VRF seed determines all
            cards, and the same seed always produces the exact same result.
            Verify on Etherscan.
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
