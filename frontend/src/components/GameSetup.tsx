import React, { useState } from "react";

interface GameSetupProps {
  onStartGame: (seed: string, betAmount: number) => void;
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
    onStartGame(finalSeed, betAmount);
  };

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
            Same seed = same destiny. Share seeds to verify fairness.
          </p>
        </div>

        <div className="setup-field">
          <label className="setup-label">
            <span className="label-icon">💰</span>
            Bet Amount
          </label>
          <div className="bet-presets">
            {[50, 100, 250, 500].map((amount) => (
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
            max="1000"
            step="10"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="bet-slider"
          />
          <div className="bet-display">{betAmount} tokens</div>
        </div>

        <button className="btn-primary" onClick={handleStart}>
          ⚔️ Begin the Duel
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
