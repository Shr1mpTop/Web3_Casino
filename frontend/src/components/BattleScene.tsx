import React, { useState, useEffect, useCallback } from "react";
import { BattleResult, RoundResult } from "../engine/battleEngine";

import { CardDisplay } from "./CardDisplay";
import { HealthBar } from "./HealthBar";
import { BattleEffects, EffectTrigger } from "./BattleEffects";

/**
 * Turn-based battle phases per round:
 *   intro → deal → flip → player-attack → enemy-attack → narrative → next
 */
type Phase =
  | "intro"
  | "deal"
  | "flip"
  | "player-attack"
  | "enemy-attack"
  | "narrative"
  | "next";

interface BattleSceneProps {
  battleResult: BattleResult;
  betAmount: number;
  onBattleComplete: () => void;
}

const PHASE_DURATIONS: Record<Phase, number> = {
  intro: 2000,
  deal: 1200,
  flip: 1400,
  "player-attack": 2000,
  "enemy-attack": 2000,
  narrative: 2800,
  next: 1000,
};

export const BattleScene: React.FC<BattleSceneProps> = ({
  battleResult,
  betAmount,
  onBattleComplete,
}) => {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(-1);
  const [phase, setPhase] = useState<Phase>("intro");
  const [displayPlayerHp, setDisplayPlayerHp] = useState(
    battleResult.playerMaxHp,
  );
  const [displayEnemyHp, setDisplayEnemyHp] = useState(battleResult.enemyMaxHp);
  const [hpAnimatingPlayer, setHpAnimatingPlayer] = useState(false);
  const [hpAnimatingEnemy, setHpAnimatingEnemy] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [effectTrigger, setEffectTrigger] = useState<EffectTrigger | null>(
    null,
  );
  const [attackingLabel, setAttackingLabel] = useState<string>("");

  // Track displayed card data separately so we can hide cards before loading new round
  const [displayedPlayerCard, setDisplayedPlayerCard] = useState<
    import("../engine/cardData").Card | null
  >(null);
  const [displayedEnemyCard, setDisplayedEnemyCard] = useState<
    import("../engine/cardData").Card | null
  >(null);

  const currentRound: RoundResult | null =
    currentRoundIndex >= 0 && currentRoundIndex < battleResult.rounds.length
      ? battleResult.rounds[currentRoundIndex]
      : null;

  const totalRounds = battleResult.rounds.length;

  // Compute intermediate HP after player attacks but before enemy attacks
  const getHpAfterPlayerAttack = useCallback(
    (round: RoundResult) => {
      // Player deals damage to enemy, player heals (from player's own card effects)
      const enemyHpAfterPlayerAtk = Math.max(
        0,
        Math.min(
          battleResult.enemyMaxHp,
          round.enemyHpBefore - round.playerDamageDealt + round.enemyHeal,
        ),
      );
      return {
        playerHp: round.playerHpBefore, // player hasn't been hit yet
        enemyHp: enemyHpAfterPlayerAtk,
      };
    },
    [battleResult.enemyMaxHp],
  );

  // Sync HP updates with damage number visibility (delay ~300ms so
  // the floating number has time to animate in before the bar starts moving)
  const HP_SYNC_DELAY = 300;

  useEffect(() => {
    if (!currentRound) return;

    if (phase === "player-attack") {
      const t = setTimeout(() => {
        setHpAnimatingEnemy(true);
        const midHp = getHpAfterPlayerAttack(currentRound);
        setDisplayEnemyHp(midHp.enemyHp);
      }, HP_SYNC_DELAY);
      return () => clearTimeout(t);
    }

    if (phase === "enemy-attack") {
      const t = setTimeout(() => {
        setHpAnimatingPlayer(true);
        setDisplayPlayerHp(currentRound.playerHpAfter);
        setDisplayEnemyHp(currentRound.enemyHpAfter);
      }, HP_SYNC_DELAY);
      return () => clearTimeout(t);
    }
  }, [phase, currentRound, getHpAfterPlayerAttack]);

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
          // Cards dealt face-down → now update displayed card data and flip
          if (currentRound) {
            setDisplayedPlayerCard(currentRound.playerCard);
            setDisplayedEnemyCard(currentRound.enemyCard);
          }
          setPhase("flip");
          break;

        case "flip":
          // Flip done → START player attack (VFX + label appear NOW)
          if (currentRound) {
            const pCard = currentRound.playerCard;
            setAttackingLabel(`⚔ ${pCard.name} attacks!`);
            setEffectTrigger({
              suit: pCard.suit,
              isMajor: pCard.type === "major",
              isCritical: currentRound.isCritical,
              specialEffects: currentRound.specialEffects,
              side: "enemy",
            });
          }
          setPhase("player-attack");
          break;

        case "player-attack":
          // Player attack done → START enemy attack (clear old VFX, fire new)
          if (currentRound) {
            const eCard = currentRound.enemyCard;
            setAttackingLabel(`💀 ${eCard.name} strikes back!`);
            setHpAnimatingEnemy(false);
            setEffectTrigger(null);
            requestAnimationFrame(() => {
              setEffectTrigger({
                suit: eCard.suit,
                isMajor: eCard.type === "major",
                isCritical: currentRound.isCritical,
                specialEffects: currentRound.specialEffects,
                side: "player",
              });
            });
          }
          setPhase("enemy-attack");
          break;

        case "enemy-attack":
          // Enemy attack done → show narrative
          setAttackingLabel("");
          setEffectTrigger(null);
          setPhase("narrative");
          break;

        case "narrative":
          setHpAnimatingPlayer(false);
          setHpAnimatingEnemy(false);
          // Instantly flip cards back (no animation) before loading next round
          setDisplayedPlayerCard(null);
          setDisplayedEnemyCard(null);
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
    getHpAfterPlayerAttack,
  ]);

  // Click to skip to narrative
  const handleClick = useCallback(() => {
    if (
      phase === "narrative" ||
      phase === "player-attack" ||
      phase === "enemy-attack"
    ) {
      if (currentRound) {
        setDisplayPlayerHp(currentRound.playerHpAfter);
        setDisplayEnemyHp(currentRound.enemyHpAfter);
        setHpAnimatingPlayer(false);
        setHpAnimatingEnemy(false);
      }
      setAttackingLabel("");
      setEffectTrigger(null);
      setPhase("next");
    }
  }, [phase, currentRound]);

  // Cards are revealed (face-up) when displayed card data exists AND we've passed the flip phase
  const cardsRevealed =
    displayedPlayerCard !== null &&
    phase !== "deal" &&
    phase !== "intro" &&
    phase !== "next";

  // Disable flip CSS transition during "next" phase (instant flip-back)
  const instantFlip = phase === "next";

  // Determine which side is "active" (attacking)
  const playerAttacking = phase === "player-attack";
  const enemyAttacking = phase === "enemy-attack";

  // Show damage numbers ONLY during the specific attack phase (no carry-over)
  const showPlayerDmgOnEnemy = playerAttacking;
  const showEnemyDmgOnPlayer = enemyAttacking;

  return (
    <div className="battle-container" onClick={handleClick}>
      {/* Battle VFX Layer */}
      <BattleEffects trigger={effectTrigger} />

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

      {/* Attack action label */}
      <div className={`attack-label ${attackingLabel ? "visible" : ""}`}>
        {attackingLabel}
      </div>

      {/* Battle arena */}
      <div className="battle-arena">
        {/* Player side (LEFT) */}
        <div
          className={`battle-side player-side ${playerAttacking ? "attacking" : ""} ${enemyAttacking ? "defending" : ""}`}
        >
          <div className="side-label player">YOU</div>
          <HealthBar
            current={displayPlayerHp}
            max={battleResult.playerMaxHp}
            label="You"
            side="player"
            animating={hpAnimatingPlayer}
          />
          <CardDisplay
            card={displayedPlayerCard}
            revealed={cardsRevealed}
            side="player"
            glowing={playerAttacking}
            roundKey={currentRoundIndex}
            instantFlip={instantFlip}
            damageNumber={
              showEnemyDmgOnPlayer ? currentRound?.enemyDamageDealt : null
            }
            healNumber={showEnemyDmgOnPlayer ? currentRound?.playerHeal : null}
          />
        </div>

        {/* VS divider */}
        <div
          className={`vs-divider ${playerAttacking || enemyAttacking ? "clash" : ""}`}
        >
          {currentRoundIndex < 0 ? "☽" : "⚔"}
        </div>

        {/* Enemy side (RIGHT) */}
        <div
          className={`battle-side enemy-side ${enemyAttacking ? "attacking" : ""} ${playerAttacking ? "defending" : ""}`}
        >
          <div className="side-label enemy">ENEMY</div>
          <HealthBar
            current={displayEnemyHp}
            max={battleResult.enemyMaxHp}
            label="Enemy"
            side="enemy"
            animating={hpAnimatingEnemy}
          />
          <CardDisplay
            card={displayedEnemyCard}
            revealed={cardsRevealed}
            side="enemy"
            glowing={enemyAttacking}
            roundKey={currentRoundIndex}
            instantFlip={instantFlip}
            damageNumber={
              showPlayerDmgOnEnemy ? currentRound?.playerDamageDealt : null
            }
            healNumber={showPlayerDmgOnEnemy ? currentRound?.enemyHeal : null}
          />
        </div>
      </div>

      {/* Narrative box */}
      <div
        className={`narrative-box ${phase === "narrative" ? "visible" : ""}`}
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
        <span className="click-hint">Click anywhere to skip</span>
      </div>
    </div>
  );
};
