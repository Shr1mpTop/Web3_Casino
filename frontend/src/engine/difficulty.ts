/**
 * Difficulty / Risk System
 *
 * Each difficulty level modifies battle parameters and reward multipliers.
 * The seed + difficulty together deterministically define the complete battle outcome.
 * Higher risk = higher reward multiplier, but the enemy becomes significantly stronger.
 */

export type DifficultyId = "safe" | "normal" | "risky" | "extreme" | "abyss";

export interface DifficultyConfig {
  id: DifficultyId;
  name: string;
  icon: string;
  description: string;
  color: string; // CSS color for UI theming
  multiplier: number; // Win payout multiplier
  drawMultiplier: number; // Draw payout multiplier

  // Battle modifiers
  playerStartHp: number;
  enemyStartHp: number;
  enemyDmgBonus: number; // Flat bonus added to all enemy damage
  enemyHealBonus: number; // Flat bonus to enemy healing
  playerDmgBonus: number; // Flat bonus added to all player damage (can be negative)

  // Visual
  glowColor: string;
  borderColor: string;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  safe: {
    id: "safe",
    name: "Safe",
    icon: "🌙",
    description: "A gentle fate. Enemy is weakened, but the reward is modest.",
    color: "#6ec6ff",
    multiplier: 1.5,
    drawMultiplier: 1,
    playerStartHp: 30,
    enemyStartHp: 25,
    enemyDmgBonus: 0,
    enemyHealBonus: 0,
    playerDmgBonus: 1,
    glowColor: "rgba(110, 198, 255, 0.3)",
    borderColor: "rgba(110, 198, 255, 0.5)",
  },
  normal: {
    id: "normal",
    name: "Normal",
    icon: "⚔",
    description: "The standard duel. Fair odds, balanced combat.",
    color: "#ffd700",
    multiplier: 2.0,
    drawMultiplier: 1,
    playerStartHp: 30,
    enemyStartHp: 30,
    enemyDmgBonus: 0,
    enemyHealBonus: 0,
    playerDmgBonus: 0,
    glowColor: "rgba(255, 215, 0, 0.3)",
    borderColor: "rgba(255, 215, 0, 0.5)",
  },
  risky: {
    id: "risky",
    name: "Risky",
    icon: "🔥",
    description: "The enemy is empowered. Greater danger, greater reward.",
    color: "#ff8c00",
    multiplier: 3.0,
    drawMultiplier: 1.5,
    playerStartHp: 30,
    enemyStartHp: 35,
    enemyDmgBonus: 2,
    enemyHealBonus: 1,
    playerDmgBonus: 0,
    glowColor: "rgba(255, 140, 0, 0.3)",
    borderColor: "rgba(255, 140, 0, 0.5)",
  },
  extreme: {
    id: "extreme",
    name: "Extreme",
    icon: "💀",
    description:
      "A deadly gambit. The enemy is a titan. Only the bold survive.",
    color: "#ff4444",
    multiplier: 5.0,
    drawMultiplier: 2.0,
    playerStartHp: 25,
    enemyStartHp: 40,
    enemyDmgBonus: 3,
    enemyHealBonus: 2,
    playerDmgBonus: 0,
    glowColor: "rgba(255, 68, 68, 0.3)",
    borderColor: "rgba(255, 68, 68, 0.5)",
  },
  abyss: {
    id: "abyss",
    name: "Abyss",
    icon: "☠",
    description: "The void beckons. Near-impossible odds, legendary payout.",
    color: "#cc00ff",
    multiplier: 10.0,
    drawMultiplier: 3.0,
    playerStartHp: 20,
    enemyStartHp: 50,
    enemyDmgBonus: 5,
    enemyHealBonus: 3,
    playerDmgBonus: -1,
    glowColor: "rgba(204, 0, 255, 0.3)",
    borderColor: "rgba(204, 0, 255, 0.5)",
  },
};

export const DIFFICULTY_ORDER: DifficultyId[] = [
  "safe",
  "normal",
  "risky",
  "extreme",
  "abyss",
];

/** Calculate expected win rate estimate (approximate, for display) */
export function estimateWinRate(id: DifficultyId): number {
  const rates: Record<DifficultyId, number> = {
    safe: 0.72,
    normal: 0.48,
    risky: 0.32,
    extreme: 0.18,
    abyss: 0.08,
  };
  return rates[id];
}

/** Calculate expected value for display: EV = winRate * (mult - 1) - (1 - winRate) */
export function expectedValue(id: DifficultyId): number {
  const wr = estimateWinRate(id);
  const d = DIFFICULTIES[id];
  return wr * (d.multiplier - 1) - (1 - wr);
}
