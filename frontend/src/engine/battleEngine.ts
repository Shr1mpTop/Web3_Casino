/**
 * Battle Engine — Contract-Matching Algorithm
 *
 * This module deterministically resolves a 5-round tarot battle,
 * producing results IDENTICAL to the FateEcho smart contract.
 *
 * Core principle: Seed → keccak256 card generation → Contract-exact resolution
 * Same seed produces EXACTLY the same result as the on-chain contract.
 *
 * Contract reference: FateEcho.sol _resolveBattle / _resolveRound
 */

import {
  Card,
  FULL_DECK,
  MAX_HP,
  TOTAL_ROUNDS,
  COUNTER_BONUS,
} from "./cardData";
import { ethers } from "ethers";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SpecialEffect =
  | "critical"
  | "counter"
  | "major_clash"
  | "major_ability";

export interface RoundResult {
  round: number; // 1-based
  playerCard: Card;
  enemyCard: Card;
  playerCardId: number;
  enemyCardId: number;
  playerDamageDealt: number; // damage player dealt TO enemy
  enemyDamageDealt: number; // damage enemy dealt TO player
  playerHeal: number;
  enemyHeal: number;
  playerHpBefore: number;
  enemyHpBefore: number;
  playerHpAfter: number;
  enemyHpAfter: number;
  narrative: string; // text description of what happened
  isCritical: boolean;
  specialEffects: SpecialEffect[];
}

export interface BattleResult {
  seed: string;
  rounds: RoundResult[];
  playerWon: boolean;
  playerFinalHp: number;
  enemyFinalHp: number;
  playerMaxHp: number;
  enemyMaxHp: number;
  isDraw: boolean;
  totalRoundsPlayed: number;
}

// ─── Contract-Matching Card Generation ───────────────────────────────────────

/**
 * Matches Solidity: _hashToCardId(seed, nonce)
 * uint256(keccak256(abi.encodePacked(seed, nonce))) % 78
 */
function hashToCardId(seed: string, nonce: number): number {
  const hash = ethers.keccak256(
    ethers.solidityPacked(["uint256", "uint256"], [seed, nonce])
  );
  return Number(BigInt(hash) % 78n);
}

// ─── Contract-Matching Card Properties ───────────────────────────────────────

/** Matches Solidity: cardId < 22 */
function isMajorArcana(cardId: number): boolean {
  return cardId < 22;
}

/** Matches Solidity: ((cardId - 22) % 14) + 1 */
function getMinorValue(cardId: number): number {
  return ((cardId - 22) % 14) + 1;
}

/**
 * Matches Solidity: Suit((cardId - 22) / 14)
 * Returns suit index: 0=Wands, 1=Cups, 2=Swords, 3=Pentacles
 */
function getMinorSuitIndex(cardId: number): number {
  return Math.floor((cardId - 22) / 14);
}

const SUIT_NAMES = ["Wands", "Cups", "Swords", "Pentacles"] as const;

/**
 * Matches Solidity: _doesCounter(attacker, defender)
 * Wands>Pentacles, Pentacles>Swords, Swords>Cups, Cups>Wands
 */
function doesCounter(attackerSuit: number, defenderSuit: number): boolean {
  if (attackerSuit === 0 && defenderSuit === 3) return true; // Wands > Pentacles
  if (attackerSuit === 3 && defenderSuit === 2) return true; // Pentacles > Swords
  if (attackerSuit === 2 && defenderSuit === 1) return true; // Swords > Cups
  if (attackerSuit === 1 && defenderSuit === 0) return true; // Cups > Wands
  return false;
}

/** Matches Solidity: _getMajorEffect — cardId % 2 (0=damage, 1=heal) */
function getMajorEffectType(cardId: number): number {
  return cardId % 2;
}

/** Matches Solidity: _getMajorValue — 5 + (cardId * 3) % 16 */
function getMajorValue(cardId: number): number {
  return 5 + ((cardId * 3) % 16);
}

// ─── Contract-Matching Round Resolution ──────────────────────────────────────

interface RoundDamage {
  pDmg: number; // player deals to enemy
  eDmg: number; // enemy deals to player
  pHeal: number; // player heals self
  eHeal: number; // enemy heals self
}

/**
 * Matches Solidity: _resolveRound(pCardId, eCardId)
 */
function resolveRound(pCardId: number, eCardId: number): RoundDamage {
  const pIsMajor = isMajorArcana(pCardId);
  const eIsMajor = isMajorArcana(eCardId);

  if (pIsMajor && eIsMajor) {
    return resolveMajorClash(pCardId, eCardId);
  } else if (pIsMajor) {
    return resolveMajorVsMinor(pCardId, eCardId, true);
  } else if (eIsMajor) {
    return resolveMajorVsMinor(eCardId, pCardId, false);
  } else {
    return resolveMinorVsMinor(pCardId, eCardId);
  }
}

/**
 * Matches Solidity: _resolveMajorClash(pCardId, eCardId)
 * hash = keccak256(pCardId, eCardId); pDmg = 5+hash%11; eDmg = 5+(hash>>8)%11
 */
function resolveMajorClash(pCardId: number, eCardId: number): RoundDamage {
  const hash = ethers.keccak256(
    ethers.solidityPacked(["uint256", "uint256"], [pCardId, eCardId])
  );
  const hashBigInt = BigInt(hash);
  return {
    pDmg: 5 + Number(hashBigInt % 11n),
    eDmg: 5 + Number((hashBigInt >> 8n) % 11n),
    pHeal: 0,
    eHeal: 0,
  };
}

/**
 * Matches Solidity: _resolveMajorVsMinor(majorId, minorId, majorIsPlayer)
 */
function resolveMajorVsMinor(
  majorId: number,
  minorId: number,
  majorIsPlayer: boolean
): RoundDamage {
  let pDmg = 0,
    eDmg = 0,
    pHeal = 0,
    eHeal = 0;

  const effectType = getMajorEffectType(majorId);
  const value = getMajorValue(majorId);

  if (effectType === 0) {
    // Damage
    if (majorIsPlayer) pDmg = value;
    else eDmg = value;
  } else {
    // Heal
    if (majorIsPlayer) pHeal = value;
    else eHeal = value;
  }

  // Minor card retaliation (half value)
  const minorValue = getMinorValue(minorId);
  const retaliation = Math.floor(minorValue / 2);
  if (majorIsPlayer) eDmg = retaliation;
  else pDmg = retaliation;

  return { pDmg, eDmg, pHeal, eHeal };
}

/**
 * Matches Solidity: _resolveMinorVsMinor(pCardId, eCardId)
 */
function resolveMinorVsMinor(pCardId: number, eCardId: number): RoundDamage {
  let pValue = getMinorValue(pCardId);
  let eValue = getMinorValue(eCardId);
  const pSuit = getMinorSuitIndex(pCardId);
  const eSuit = getMinorSuitIndex(eCardId);

  // Element counters
  if (doesCounter(pSuit, eSuit)) pValue += COUNTER_BONUS;
  if (doesCounter(eSuit, pSuit)) eValue += COUNTER_BONUS;

  let pDmg: number, eDmg: number;

  if (pValue > eValue) {
    pDmg = pValue - eValue + 2;
    eDmg = 1;
  } else if (eValue > pValue) {
    eDmg = eValue - pValue + 2;
    pDmg = 1;
  } else {
    pDmg = 2;
    eDmg = 2;
  }

  return { pDmg, eDmg, pHeal: 0, eHeal: 0 };
}

// ─── Narrative Generation (UI flavor only, does not affect outcome) ──────────

function generateNarrative(
  pCardId: number,
  eCardId: number,
  pCard: Card,
  eCard: Card,
  dmg: RoundDamage
): { narrative: string; isCritical: boolean; effects: SpecialEffect[] } {
  const pIsMajor = isMajorArcana(pCardId);
  const eIsMajor = isMajorArcana(eCardId);
  const effects: SpecialEffect[] = [];
  let narrative = "";
  let isCritical = false;

  if (pIsMajor && eIsMajor) {
    // Major Clash
    narrative = `⚡ FATE CLASH — ${pCard.name} vs ${eCard.name}! Player deals ${dmg.pDmg}, takes ${dmg.eDmg} damage!`;
    isCritical = true;
    effects.push("major_clash");
  } else if (pIsMajor) {
    // Player Major vs Enemy Minor
    const effectWord = getMajorEffectType(pCardId) === 0 ? "strikes" : "heals";
    narrative = `✨ ${pCard.name} ${effectWord}! `;
    if (dmg.pDmg > 0) narrative += `Deals ${dmg.pDmg} damage. `;
    if (dmg.pHeal > 0) narrative += `Heals ${dmg.pHeal} HP. `;
    if (dmg.eDmg > 0)
      narrative += `${eCard.name} retaliates for ${dmg.eDmg}.`;
    isCritical = true;
    effects.push("major_ability");
  } else if (eIsMajor) {
    // Enemy Major vs Player Minor
    const effectWord = getMajorEffectType(eCardId) === 0 ? "strikes" : "heals";
    narrative = `💀 ${eCard.name} ${effectWord}! `;
    if (dmg.eDmg > 0) narrative += `Deals ${dmg.eDmg} damage. `;
    if (dmg.eHeal > 0) narrative += `Heals ${dmg.eHeal} HP. `;
    if (dmg.pDmg > 0)
      narrative += `${pCard.name} retaliates for ${dmg.pDmg}.`;
    isCritical = true;
    effects.push("major_ability");
  } else {
    // Both Minor
    const pSuitName = SUIT_NAMES[getMinorSuitIndex(pCardId)];
    const eSuitName = SUIT_NAMES[getMinorSuitIndex(eCardId)];
    const pCounters = doesCounter(
      getMinorSuitIndex(pCardId),
      getMinorSuitIndex(eCardId)
    );
    const eCounters = doesCounter(
      getMinorSuitIndex(eCardId),
      getMinorSuitIndex(pCardId)
    );

    if (pCounters) {
      narrative += `🔥 ${pSuitName} counters ${eSuitName}! (+${COUNTER_BONUS}) `;
      effects.push("counter");
    } else if (eCounters) {
      narrative += `🔥 ${eSuitName} counters ${pSuitName}! (+${COUNTER_BONUS}) `;
      effects.push("counter");
    }

    if (dmg.pDmg > dmg.eDmg) {
      narrative += `${pCard.name} overpowers ${eCard.name}!`;
      if (dmg.pDmg >= 10) {
        isCritical = true;
        narrative += " 💥 CRITICAL!";
        effects.push("critical");
      }
    } else if (dmg.eDmg > dmg.pDmg) {
      narrative += `${eCard.name} overpowers ${pCard.name}!`;
      if (dmg.eDmg >= 10) {
        isCritical = true;
        narrative += " 💥 CRITICAL!";
        effects.push("critical");
      }
    } else {
      narrative += `${pCard.name} clashes with ${eCard.name}! It's a tie!`;
    }
  }

  return { narrative, isCritical, effects };
}

// ─── Seed Normalization ──────────────────────────────────────────────────────

/**
 * Normalize any string seed to a uint256 decimal string.
 * - If it's already a valid uint256 decimal or hex → use directly
 * - Otherwise, hash it via keccak256 to produce a uint256
 */
function normalizeSeed(input: string): string {
  // Try to parse as BigInt directly (decimal or 0x hex)
  try {
    const val = BigInt(input);
    if (val >= 0n && val < 2n ** 256n) return val.toString();
  } catch {
    // Not a valid number
  }
  // Hash arbitrary string to uint256
  const hash = ethers.keccak256(ethers.toUtf8Bytes(input));
  return BigInt(hash).toString();
}

// ─── Main Battle Resolver ────────────────────────────────────────────────────

/**
 * Resolve a battle deterministically from a VRF seed.
 * The result is IDENTICAL to FateEcho.sol _resolveBattle(seed).
 *
 * @param seed The VRF seed as a decimal string (uint256)
 * @returns Complete battle result with per-round details
 */
export function resolveBattle(seed: string): BattleResult {
  // Normalize seed: arbitrary strings → uint256; VRF seeds pass through
  const normalizedSeed = normalizeSeed(seed);

  // ── Generate cards using contract-matching keccak256 ──
  const playerCardIds: number[] = [];
  const enemyCardIds: number[] = [];

  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    playerCardIds.push(hashToCardId(normalizedSeed, i * 2));
    enemyCardIds.push(hashToCardId(normalizedSeed, i * 2 + 1));
  }

  // ── Simulate battle (contract-exact) ──
  let playerHp = MAX_HP; // 30
  let enemyHp = MAX_HP; // 30
  const rounds: RoundResult[] = [];

  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    if (playerHp === 0 || enemyHp === 0) break;

    const pCardId = playerCardIds[i];
    const eCardId = enemyCardIds[i];
    const pCard = FULL_DECK[pCardId];
    const eCard = FULL_DECK[eCardId];
    const hpBefore = { player: playerHp, enemy: enemyHp };

    // Contract-matching round resolution
    const dmg = resolveRound(pCardId, eCardId);

    // Apply damage (contract-exact: saturating subtraction)
    enemyHp = enemyHp > dmg.pDmg ? enemyHp - dmg.pDmg : 0;
    playerHp = playerHp > dmg.eDmg ? playerHp - dmg.eDmg : 0;

    // Apply healing (contract-exact: cap at MAX_HP)
    playerHp =
      playerHp > MAX_HP - dmg.pHeal ? MAX_HP : playerHp + dmg.pHeal;
    enemyHp =
      enemyHp > MAX_HP - dmg.eHeal ? MAX_HP : enemyHp + dmg.eHeal;

    // Generate narrative for UI (does not affect HP values)
    const { narrative, isCritical, effects } = generateNarrative(
      pCardId,
      eCardId,
      pCard,
      eCard,
      dmg
    );

    rounds.push({
      round: i + 1,
      playerCard: pCard,
      enemyCard: eCard,
      playerCardId: pCardId,
      enemyCardId: eCardId,
      playerDamageDealt: dmg.pDmg,
      enemyDamageDealt: dmg.eDmg,
      playerHeal: dmg.pHeal,
      enemyHeal: dmg.eHeal,
      playerHpBefore: hpBefore.player,
      enemyHpBefore: hpBefore.enemy,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp,
      narrative,
      isCritical,
      specialEffects: effects,
    });
  }

  return {
    seed: normalizedSeed,
    rounds,
    playerWon: playerHp > enemyHp,
    playerFinalHp: Math.max(playerHp, 0),
    enemyFinalHp: Math.max(enemyHp, 0),
    playerMaxHp: MAX_HP,
    enemyMaxHp: MAX_HP,
    isDraw: playerHp === enemyHp,
    totalRoundsPlayed: rounds.length,
  };
}
