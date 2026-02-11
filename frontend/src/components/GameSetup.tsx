import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { soundManager } from "../utils/soundManager";
import type { GameFlowState } from "../web3/useFateEcho";

interface GameSetupProps {
  onStartGame: (betEth: string) => void;
  onOpenGallery: () => void;
  onOpenHowToPlay: () => void;
  flowState: GameFlowState;
  balance: string;
  errorMessage: string | null;
  requestId: bigint | null;
  txHash: string | null;
  onReset: () => void;
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
  flowState,
  balance,
  errorMessage,
  requestId,
  txHash,
  onReset,
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

  const isBusy =
    flowState === "sending_tx" ||
    flowState === "waiting_vrf" ||
    flowState === "settling";

  const potentialWin = (parseFloat(betAmount) * WIN_MULTIPLIER).toFixed(4);
  const potentialProfit = (
    parseFloat(betAmount) * WIN_MULTIPLIER -
    parseFloat(betAmount)
  ).toFixed(4);

  const explorerBase = import.meta.env.VITE_BLOCK_EXPLORER || "https://sepolia.etherscan.io";

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
                    disabled={isBusy}
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
                  disabled={isBusy}
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
                <div className="payout-preview-row lose">
                  <span>Lose</span>
                  <span>-{betAmount} ETH</span>
                </div>
              </div>
            </div>

            {/* ── Game Flow Status ─────────────────────────── */}
            {flowState !== "idle" && (
              <div className="setup-field flow-status">
                <label className="setup-label">
                  <span className="label-icon">📡</span>
                  TX Status
                </label>
                <div className="flow-steps">
                  <FlowStep
                    label="Send Bet TX"
                    state={
                      flowState === "sending_tx"
                        ? "active"
                        : flowState === "idle"
                          ? "pending"
                          : "done"
                    }
                  />
                  <FlowStep
                    label="Waiting for VRF"
                    state={
                      flowState === "waiting_vrf"
                        ? "active"
                        : ["idle", "sending_tx"].includes(flowState)
                          ? "pending"
                          : "done"
                    }
                  />
                  <FlowStep
                    label="Battle Animation"
                    state={
                      flowState === "battle_ready" || flowState === "animating"
                        ? "active"
                        : [
                              "idle",
                              "sending_tx",
                              "waiting_vrf",
                            ].includes(flowState)
                          ? "pending"
                          : "done"
                    }
                  />
                  <FlowStep
                    label="Settle On-Chain"
                    state={
                      flowState === "settling"
                        ? "active"
                        : flowState === "settled"
                          ? "done"
                          : "pending"
                    }
                  />
                </div>

                {txHash && (
                  <a
                    className="tx-link"
                    href={`${explorerBase}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View TX on Etherscan ↗
                  </a>
                )}

                {requestId && (
                  <div className="request-id">
                    Request ID: {requestId.toString().slice(0, 20)}...
                  </div>
                )}
              </div>
            )}

            {/* ── Error Display ─────────────────────────── */}
            {flowState === "error" && errorMessage && (
              <div className="setup-field error-field">
                <div className="error-message">❌ {errorMessage}</div>
                <button className="btn-secondary" onClick={onReset}>
                  🔄 Reset
                </button>
              </div>
            )}

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
              disabled={isBusy || parseFloat(betAmount) < parseFloat(MIN_BET)}
            >
              {isBusy ? (
                <>
                  {flowState === "sending_tx" && "⏳ Sending TX..."}
                  {flowState === "waiting_vrf" && "🔮 Waiting for VRF..."}
                  {flowState === "settling" && "⏳ Settling..."}
                </>
              ) : (
                <>⚔ Place Bet — {betAmount} ETH</>
              )}
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
            Chainlink VRF powered — every result is verifiable on-chain
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Flow Step Indicator ──
function FlowStep({
  label,
  state,
}: {
  label: string;
  state: "pending" | "active" | "done";
}) {
  return (
    <div className={`flow-step ${state}`}>
      <span className="flow-step-icon">
        {state === "done" ? "✅" : state === "active" ? "⏳" : "⬜"}
      </span>
      <span className="flow-step-label">{label}</span>
    </div>
  );
}
