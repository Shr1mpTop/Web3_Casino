import React, { useState } from "react";
import {
  DifficultyId,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  estimateWinRate,
} from "../engine/difficulty";

interface GameSetupProps {
  onStartGame: (
    seed: string,
    betAmount: number,
    difficulty: DifficultyId,
  ) => void;
  onOpenGallery: () => void;
  onOpenHowToPlay: () => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({
  onStartGame,
  onOpenGallery,
  onOpenHowToPlay,
}) => {
  const [seed, setSeed] = useState("");
  const [betAmount, setBetAmount] = useState(100);
  const [difficulty, setDifficulty] = useState<DifficultyId>("normal");

  const diff = DIFFICULTIES[difficulty];
  const winRate = estimateWinRate(difficulty);

  const generateRandomSeed = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSeed(result);
  };

  const handleStart = () => {
    const finalSeed = seed.trim() || `random_${Date.now()}`;
    onStartGame(finalSeed, betAmount, difficulty);
  };

  // Payout calculations
  const potentialWin = Math.floor(betAmount * diff.multiplier);
  const potentialProfit = potentialWin - betAmount;
  const drawReturn = Math.floor(betAmount * diff.drawMultiplier);

  return (
    <div className="setup-container">
      {/* Background mystical particles */}
      <div className="particles">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="setup-card">
        <div className="setup-logo">
          <div className="logo-symbol">☽</div>
          <h1 className="setup-title">Fate's Echo</h1>
          <p className="setup-subtitle">Tarot Battle — Provably Fair</p>
        </div>

        <div className="setup-divider" />

        {/* ── Risk / Difficulty Selector ─────────────────────────── */}
        <div className="setup-field">
          <label className="setup-label">
            <span className="label-icon">⚡</span>
            Risk Level
          </label>

          <div className="difficulty-selector">
            {DIFFICULTY_ORDER.map((id) => {
              const d = DIFFICULTIES[id];
              const active = difficulty === id;
              return (
                <button
                  key={id}
                  className={`difficulty-btn ${active ? "active" : ""}`}
                  onClick={() => setDifficulty(id)}
                  style={{
                    borderColor: active ? d.borderColor : undefined,
                    boxShadow: active ? `0 0 16px ${d.glowColor}` : undefined,
                  }}
                >
                  <span className="diff-icon">{d.icon}</span>
                  <span className="diff-name">{d.name}</span>
                  <span className="diff-mult" style={{ color: d.color }}>
                    ×{d.multiplier}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Difficulty detail panel */}
          <div
            className="difficulty-detail"
            style={{ borderColor: diff.borderColor }}
          >
            <div className="diff-detail-header">
              <span className="diff-detail-icon">{diff.icon}</span>
              <span className="diff-detail-name" style={{ color: diff.color }}>
                {diff.name}
              </span>
              <span className="diff-detail-mult">
                ×{diff.multiplier} payout
              </span>
            </div>
            <p className="diff-detail-desc">{diff.description}</p>

            <div className="diff-stats-grid">
              <div className="diff-stat">
                <span className="diff-stat-label">Your HP</span>
                <span className="diff-stat-value">{diff.playerStartHp}</span>
              </div>
              <div className="diff-stat">
                <span className="diff-stat-label">Enemy HP</span>
                <span className="diff-stat-value">{diff.enemyStartHp}</span>
              </div>
              <div className="diff-stat">
                <span className="diff-stat-label">Enemy Dmg+</span>
                <span className="diff-stat-value">+{diff.enemyDmgBonus}</span>
              </div>
              <div className="diff-stat">
                <span className="diff-stat-label">Win Rate</span>
                <span className="diff-stat-value">
                  ~{Math.round(winRate * 100)}%
                </span>
              </div>
            </div>

            {/* Risk meter bar */}
            <div className="risk-meter">
              <div className="risk-meter-label">Risk</div>
              <div className="risk-meter-track">
                <div
                  className="risk-meter-fill"
                  style={{
                    width: `${((DIFFICULTY_ORDER.indexOf(difficulty) + 1) / DIFFICULTY_ORDER.length) * 100}%`,
                    background: `linear-gradient(90deg, #6ec6ff, ${diff.color})`,
                  }}
                />
              </div>
              <div className="risk-meter-label">Reward</div>
            </div>
          </div>
        </div>

        {/* ── Seed Input ─────────────────────────── */}
        <div className="setup-field">
          <label className="setup-label">
            <span className="label-icon">🔮</span>
            Destiny Seed
          </label>
          <div className="seed-input-row">
            <input
              type="text"
              className="setup-input"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter a seed or generate one..."
            />
            <button className="btn-secondary" onClick={generateRandomSeed}>
              🎲 Random
            </button>
          </div>
          <p className="setup-hint">
            Same seed + same difficulty = same destiny.
          </p>
        </div>

        {/* ── Bet Amount ─────────────────────────── */}
        <div className="setup-field">
          <label className="setup-label">
            <span className="label-icon">💰</span>
            Bet Amount
          </label>
          <div className="bet-presets">
            {[50, 100, 250, 500, 1000].map((amount) => (
              <button
                key={amount}
                className={`btn-preset ${betAmount === amount ? "active" : ""}`}
                onClick={() => setBetAmount(amount)}
              >
                {amount}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="10"
            max="2000"
            step="10"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="bet-slider"
          />
          <div className="bet-display">{betAmount} tokens</div>

          {/* Payout summary */}
          <div className="payout-preview">
            <div className="payout-preview-row win">
              <span>Win</span>
              <span style={{ color: diff.color }}>
                +{potentialProfit} tokens (×{diff.multiplier})
              </span>
            </div>
            <div className="payout-preview-row draw">
              <span>Draw</span>
              <span>
                {drawReturn === betAmount
                  ? "Refund"
                  : `+${drawReturn - betAmount} tokens`}
              </span>
            </div>
            <div className="payout-preview-row lose">
              <span>Lose</span>
              <span>-{betAmount} tokens</span>
            </div>
          </div>
        </div>

        <button className="btn-primary start-btn" onClick={handleStart}>
          {diff.icon} Begin the Duel — ×{diff.multiplier}
        </button>

        <div className="setup-nav-buttons">
          <button className="btn-secondary" onClick={onOpenGallery}>
            📖 Card Gallery
          </button>
          <button className="btn-secondary" onClick={onOpenHowToPlay}>
            📜 How to Play
          </button>
        </div>

        <div className="setup-footer">
          <p>5 rounds of fate. 78 tarot cards. One destiny.</p>
          <p className="footer-small">
            Powered by deterministic PRNG — every result is verifiable
          </p>
        </div>
      </div>
    </div>
  );
};
