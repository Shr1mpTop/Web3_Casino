import React, { useState, useEffect, useCallback } from "react";
import { BattleResult, RoundResult } from "../engine/battleEngine";
import { MAX_HP } from "../engine/cardData";
import { CardDisplay } from "./CardDisplay";
import { HealthBar } from "./HealthBar";

type Phase = "intro" | "deal" | "flip" | "effect" | "narrative" | "next";

interface BattleSceneProps {
  battleResult: BattleResult;
  betAmount: number;
  onBattleComplete: () => void;
}

const PHASE_DURATIONS: Record<Phase, number> = {
  intro: 1500,
  deal: 800,
  flip: 900,
  effect: 1400,
  narrative: 2200,
  next: 600,
};

export const BattleScene: React.FC<BattleSceneProps> = ({
  battleResult,
  betAmount,
  onBattleComplete,
}) => {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(-1); // -1 = intro
  const [phase, setPhase] = useState<Phase>("intro");
  const [displayPlayerHp, setDisplayPlayerHp] = useState(MAX_HP);
  const [displayEnemyHp, setDisplayEnemyHp] = useState(MAX_HP);
  const [hpAnimating, setHpAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentRound: RoundResult | null =
    currentRoundIndex >= 0 && currentRoundIndex < battleResult.rounds.length
      ? battleResult.rounds[currentRoundIndex]
      : null;

  const totalRounds = battleResult.rounds.length;

  // Auto-advance phases
  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      switch (phase) {
        case "intro":
          setCurrentRoundIndex(0);
          setPhase("deal");
          break;

        case "deal":
          setPhase("flip");
          break;

        case "flip":
          setPhase("effect");
          break;

        case "effect":
          // Update HP display
          if (currentRound) {
            setHpAnimating(true);
            setDisplayPlayerHp(currentRound.playerHpAfter);
            setDisplayEnemyHp(currentRound.enemyHpAfter);
          }
          setPhase("narrative");
          break;

        case "narrative":
          setHpAnimating(false);
          setPhase("next");
          break;

        case "next":
          if (currentRoundIndex < totalRounds - 1) {
            setCurrentRoundIndex((r) => r + 1);
            setPhase("deal");
          } else {
            onBattleComplete();
          }
          break;
      }
    }, PHASE_DURATIONS[phase]);

    return () => clearTimeout(timer);
  }, [
    phase,
    currentRoundIndex,
    totalRounds,
    currentRound,
    isPaused,
    onBattleComplete,
  ]);

  // Click to skip current phase
  const handleClick = useCallback(() => {
    if (phase === "narrative" || phase === "effect") {
      if (currentRound) {
        setDisplayPlayerHp(currentRound.playerHpAfter);
        setDisplayEnemyHp(currentRound.enemyHpAfter);
        setHpAnimating(false);
      }
      setPhase("next");
    }
  }, [phase, currentRound]);

  // Show damage/heal numbers only during effect phase
  const showNumbers = phase === "effect" || phase === "narrative";

  return (
    <div className="battle-container" onClick={handleClick}>
      {/* Round indicator */}
      <div className="round-indicator">
        {currentRoundIndex < 0
          ? "Shuffling the Deck of Fate..."
          : `Round ${currentRoundIndex + 1} of ${totalRounds}`}
      </div>

      {/* Seed display */}
      <div className="seed-display">
        Seed: <span className="seed-value">{battleResult.seed}</span>
      </div>

      {/* Battle arena */}
      <div className="battle-arena">
        {/* Enemy side */}
        <div className="battle-side enemy-side">
          <HealthBar
            current={displayEnemyHp}
            max={MAX_HP}
            label="Enemy"
            side="enemy"
            animating={hpAnimating}
          />
          <CardDisplay
            card={currentRound?.enemyCard ?? null}
            revealed={
              phase !== "deal" && phase !== "intro" && currentRound !== null
            }
            side="enemy"
            glowing={currentRound?.isCritical && showNumbers}
            damageNumber={showNumbers ? currentRound?.playerDamageDealt : null}
            healNumber={showNumbers ? currentRound?.enemyHeal : null}
          />
          {currentRound && phase !== "intro" && phase !== "deal" && (
            <div className="card-name-tag enemy">
              {currentRound.enemyCard.name}
              {currentRound.enemyCard.type === "major" && (
                <span className="major-badge">EVENT</span>
              )}
            </div>
          )}
        </div>

        {/* VS divider */}
        <div className={`vs-divider ${phase === "flip" ? "clash" : ""}`}>
          {currentRoundIndex < 0 ? "☽" : "⚔️"}
        </div>

        {/* Player side */}
        <div className="battle-side player-side">
          <HealthBar
            current={displayPlayerHp}
            max={MAX_HP}
            label="You"
            side="player"
            animating={hpAnimating}
          />
          <CardDisplay
            card={currentRound?.playerCard ?? null}
            revealed={
              phase !== "deal" && phase !== "intro" && currentRound !== null
            }
            side="player"
            glowing={currentRound?.isCritical && showNumbers}
            damageNumber={showNumbers ? currentRound?.enemyDamageDealt : null}
            healNumber={showNumbers ? currentRound?.playerHeal : null}
          />
          {currentRound && phase !== "intro" && phase !== "deal" && (
            <div className="card-name-tag player">
              {currentRound.playerCard.name}
              {currentRound.playerCard.type === "major" && (
                <span className="major-badge">EVENT</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Narrative box */}
      <div
        className={`narrative-box ${phase === "narrative" || phase === "effect" ? "visible" : ""}`}
      >
        {currentRound?.narrative.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      {/* Battle log (previous rounds) */}
      {currentRoundIndex > 0 && (
        <div className="battle-log">
          {battleResult.rounds.slice(0, currentRoundIndex).map((r) => (
            <div key={r.round} className="log-entry">
              <span className="log-round">R{r.round}</span>
              <span className="log-cards">
                {r.playerCard.name} vs {r.enemyCard.name}
              </span>
              <span className="log-result">
                You: {r.playerHpAfter}HP | Enemy: {r.enemyHpAfter}HP
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="battle-controls">
        <button
          className="btn-small"
          onClick={(e) => {
            e.stopPropagation();
            setIsPaused(!isPaused);
          }}
        >
          {isPaused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <span className="click-hint">Click anywhere to speed up</span>
      </div>
    </div>
  );
};
