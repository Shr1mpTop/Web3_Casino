import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { soundManager } from "../utils/soundManager";

interface GameSetupProps {
  onStartGame: (betEth: string) => void;
  onOpenGallery: () => void;
  onOpenHowToPlay: () => void;
  balance: string;
}

const MIN_BET = import.meta.env.VITE_MIN_BET || "0.001";
const MAX_BET = import.meta.env.VITE_MAX_BET || "1";
const HOUSE_EDGE = Number(import.meta.env.VITE_HOUSE_EDGE || "5");
const WIN_MULTIPLIER = Number(import.meta.env.VITE_WIN_MULTIPLIER || "1.9");

// Preset bet amounts in ETH
const BET_PRESETS = ["0.001", "0.005", "0.01", "0.05", "0.1"];

export const GameSetup: React.FC<GameSetupProps> = ({
  onStartGame,
  onOpenGallery,
  onOpenHowToPlay,
  balance,
}) => {
  const { isConnected, address } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [betAmount, setBetAmount] = useState("0.01");
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    soundManager.playMenuMusic();
    return () => {
      soundManager.stopBackgroundMusic();
    };
  }, []);

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleStart = () => {
    const bet = betAmount.trim() || MIN_BET;
    onStartGame(bet);
  };

  const potentialProfit = (
    parseFloat(betAmount) * WIN_MULTIPLIER -
    parseFloat(betAmount)
  ).toFixed(4);

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
          <p className="setup-subtitle">On-Chain Tarot Battle — Provably Fair</p>
        </div>

        <div className="setup-divider" />

        {/* ── Wallet Connection ─────────────────────────── */}
        <div className="setup-field">
          <label className="setup-label">
            <span className="label-icon">🔗</span>
            Wallet
          </label>
          {!isConnected ? (
            <button className="btn-primary" onClick={handleConnect}>
              🦊 Connect MetaMask
            </button>
          ) : (
            <div className="wallet-info">
              <div className="wallet-address">
                <span className="wallet-dot" />
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              <div className="wallet-balance">
                ⟠ {parseFloat(balance).toFixed(4)} ETH
              </div>
              <button
                className="btn-small btn-disconnect"
                onClick={() => disconnect()}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {isConnected && (
          <>
            {/* ── Bet Amount (ETH) ─────────────────────────── */}
            <div className="setup-field">
              <label className="setup-label">
                <span className="label-icon">⟠</span>
                Bet Amount (ETH)
              </label>
              <div className="bet-presets">
                {BET_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    className={`btn-preset ${betAmount === amount ? "active" : ""}`}
                    onClick={() => setBetAmount(amount)}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <div className="bet-input-row">
                <input
                  type="number"
                  className="setup-input"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min={MIN_BET}
                  max={MAX_BET}
                  step="0.001"
                  placeholder={`${MIN_BET} - ${MAX_BET} ETH`}
                />
                <span className="input-suffix">ETH</span>
              </div>

              {/* Payout summary */}
              <div className="payout-preview">
                <div className="payout-preview-row win">
                  <span>Win ({HOUSE_EDGE}% house edge)</span>
                  <span style={{ color: "#ffd700" }}>
                    +{potentialProfit} ETH (×{WIN_MULTIPLIER})
                  </span>
                </div>
                <div className="payout-preview-row draw">
                  <span>Draw</span>
                  <span style={{ color: "#b0b0b0" }}>
                    Refund {betAmount} ETH
                  </span>
                </div>
                <div className="payout-preview-row lose">
                  <span>Lose</span>
                  <span>-{betAmount} ETH</span>
                </div>
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="setup-field sound-toggle-field">
              <label className="sound-toggle-label">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setSoundEnabled(enabled);
                    soundManager.setEnabled(enabled);
                    if (enabled) {
                      soundManager.playCardFlip();
                      soundManager.playMenuMusic();
                    }
                  }}
                  className="sound-checkbox"
                />
                <span className="sound-icon">
                  {soundEnabled ? "🔊" : "🔇"}
                </span>
                <span>Sound Effects & Music</span>
              </label>
            </div>

            {/* Start Button */}
            <button
              className="btn-primary start-btn"
              onClick={handleStart}
              disabled={parseFloat(betAmount) < parseFloat(MIN_BET)}
            >
              ⚔ Place Bet — {betAmount} ETH
            </button>
          </>
        )}

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
            Provably fair — every result is verifiable on-chain
          </p>
        </div>
      </div>
    </div>
  );
};
