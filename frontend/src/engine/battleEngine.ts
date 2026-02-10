/**
 * Battle Engine — The "Big Bang" Algorithm
 *
 * Given a seed string, this module deterministically resolves an entire
 * 5-round tarot battle. The result is a complete battle log that the
 * front-end can replay with animations.
 *
 * Core principle: Seed → Shuffle → Deal → Resolve → Result
 * Same seed ALWAYS produces the exact same battle.
 */

import {
  Card,
  FULL_DECK,
  COUNTER_MAP,
  MAX_HP,
  TOTAL_ROUNDS,
  COUNTER_BONUS,
  Suit,
  EffectType,
} from "./cardData";
import { createRNG, hashString } from "./seedEngine";
import { DifficultyConfig, DifficultyId, DIFFICULTIES } from "./difficulty";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SpecialEffect =
  | "swap_hp"
  | "average_hp"
  | "dodge"
  | "drain"
  | "both_damage"
  | "both_heal"
  | "skip"
  | "critical";

export interface RoundResult {
  round: number; // 1-based
  playerCard: Card;
  enemyCard: Card;
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
  seedHash: number;
  difficultyId: DifficultyId;
  rounds: RoundResult[];
  playerWon: boolean;
  playerFinalHp: number;
  enemyFinalHp: number;
  playerMaxHp: number;
  enemyMaxHp: number;
  isDraw: boolean;
  totalRoundsPlayed: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function doesCounter(attacker: Suit, defender: Suit): boolean {
  return COUNTER_MAP[attacker] === defender;
}

// ─── Minor vs Minor Combat ──────────────────────────────────────────────────

function resolveMinorVsMinor(
  pCard: Card,
  eCard: Card,
): {
  pDmg: number;
  eDmg: number;
  pHeal: number;
  eHeal: number;
  narrative: string;
  critical: boolean;
} {
  let pPower = pCard.value!;
  let ePower = eCard.value!;
  let narrative = "";
  let critical = false;

  // Element counter
  const pCounters = doesCounter(pCard.suit!, eCard.suit!);
  const eCounters = doesCounter(eCard.suit!, pCard.suit!);

  if (pCounters) {
    pPower += COUNTER_BONUS;
    narrative += `🔥 ${pCard.suit} counters ${eCard.suit}! (+${COUNTER_BONUS}) `;
  } else if (eCounters) {
    ePower += COUNTER_BONUS;
    narrative += `🔥 ${eCard.suit} counters ${pCard.suit}! (+${COUNTER_BONUS}) `;
  }

  const diff = Math.abs(pPower - ePower);
  let pDmg = 0; // damage player deals TO enemy
  let eDmg = 0; // damage enemy deals TO player

  if (pPower > ePower) {
    pDmg = diff + 2;
    eDmg = 1;
    narrative += `${pCard.name} [${pPower}] overpowers ${eCard.name} [${ePower}]!`;
    if (diff >= 8) {
      critical = true;
      narrative += " 💥 CRITICAL HIT!";
    }
  } else if (ePower > pPower) {
    eDmg = diff + 2;
    pDmg = 1;
    narrative += `${eCard.name} [${ePower}] overpowers ${pCard.name} [${pPower}]!`;
    if (diff >= 8) {
      critical = true;
      narrative += " 💥 CRITICAL HIT!";
    }
  } else {
    pDmg = 2;
    eDmg = 2;
    narrative += `Clash! ${pCard.name} [${pPower}] ties with ${eCard.name} [${ePower}]!`;
  }

  return { pDmg, eDmg, pHeal: 0, eHeal: 0, narrative, critical };
}

// ─── Apply a Single Major Arcana Effect ──────────────────────────────────────

interface EffectResult {
  damageToOpponent: number;
  damageToSelf: number;
  healSelf: number;
  healOpponent: number;
  special: SpecialEffect | null;
  narrative: string;
}

function applyMajorEffect(
  card: Card,
  ownerHp: number,
  opponentHp: number,
  ownerLabel: string,
): EffectResult {
  const fx = card.effect!;
  const result: EffectResult = {
    damageToOpponent: 0,
    damageToSelf: 0,
    healSelf: 0,
    healOpponent: 0,
    special: null,
    narrative: "",
  };

  switch (fx.type as EffectType) {
    case "dodge":
      result.special = "dodge";
      result.narrative = `${ownerLabel} plays ${card.name} — dodges all damage!`;
      break;

    case "damage":
      result.damageToOpponent = fx.value;
      result.narrative = `${ownerLabel} plays ${card.name} — deals ${fx.value} damage!`;
      break;

    case "heal":
      result.healSelf = fx.value;
      result.narrative = `${ownerLabel} plays ${card.name} — heals ${fx.value} HP!`;
      break;

    case "both_heal":
      result.healSelf = fx.value;
      result.healOpponent = fx.value;
      result.special = "both_heal";
      result.narrative = `${ownerLabel} plays ${card.name} — blessing! Both heal ${fx.value} HP!`;
      break;

    case "drain":
      result.damageToOpponent = fx.value;
      result.healSelf = fx.value;
      result.special = "drain";
      result.narrative = `${ownerLabel} plays ${card.name} — drains ${fx.value} HP!`;
      break;

    case "swap":
      result.special = "swap_hp";
      result.narrative = `${ownerLabel} plays ${card.name} — HP SWAPPED! (${ownerHp} ↔ ${opponentHp})`;
      break;

    case "average":
      result.special = "average_hp";
      result.narrative = `${ownerLabel} plays ${card.name} — HP equalized to ${Math.floor((ownerHp + opponentHp) / 2)}!`;
      break;

    case "both_damage":
      result.damageToOpponent = fx.value;
      result.damageToSelf = fx.value;
      result.special = "both_damage";
      result.narrative = `${ownerLabel} plays ${card.name} — DESTRUCTION! Both take ${fx.value} damage!`;
      break;

    case "skip":
      result.healSelf = fx.value;
      result.healOpponent = fx.value;
      result.special = "skip";
      result.narrative = `${ownerLabel} plays ${card.name} — time stands still. Both heal ${fx.value}.`;
      break;

    case "conditional": {
      const idx = card.majorIndex!;
      if (idx === 11) {
        // Justice: damage = |HP difference|
        const diff = Math.abs(ownerHp - opponentHp);
        result.damageToOpponent = Math.max(diff, 3);
        result.narrative = `${ownerLabel} plays ${card.name} — Balance! Deals ${result.damageToOpponent} damage (HP diff)!`;
      } else if (idx === 20) {
        // Judgement: if losing, deal 18; else deal 5
        if (ownerHp < opponentHp) {
          result.damageToOpponent = 18;
          result.narrative = `${ownerLabel} plays ${card.name} — RECKONING! Underdog fury deals 18 damage!`;
        } else {
          result.damageToOpponent = 5;
          result.narrative = `${ownerLabel} plays ${card.name} — Judgement passed. Deals 5 damage.`;
        }
      }
      break;
    }

    case "damage_heal":
      result.damageToOpponent = fx.value;
      result.healSelf = fx.secondaryValue ?? 0;
      result.narrative = `${ownerLabel} plays ${card.name} — deals ${fx.value} damage & heals ${fx.secondaryValue} HP!`;
      break;
  }

  return result;
}

// ─── Main Battle Resolver ────────────────────────────────────────────────────

export function resolveBattle(
  seedString: string,
  difficultyId: DifficultyId = "normal",
): BattleResult {
  const diff: DifficultyConfig = DIFFICULTIES[difficultyId];
  const seedNum = hashString(seedString);
  const rng = createRNG(seedNum);

  // Shuffle the 78-card deck deterministically
  const shuffled = rng.shuffle(FULL_DECK);

  // Deal: alternate player/enemy for TOTAL_ROUNDS
  const playerCards: Card[] = [];
  const enemyCards: Card[] = [];
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    playerCards.push(shuffled[i * 2]);
    enemyCards.push(shuffled[i * 2 + 1]);
  }

  const playerMaxHp = diff.playerStartHp;
  const enemyMaxHp = diff.enemyStartHp;
  let playerHp = playerMaxHp;
  let enemyHp = enemyMaxHp;
  const rounds: RoundResult[] = [];

  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    // Early termination: if either side is at 0 HP
    if (playerHp <= 0 || enemyHp <= 0) break;

    const pCard = playerCards[i];
    const eCard = enemyCards[i];
    const hpBefore = { player: playerHp, enemy: enemyHp };

    let pDmg = 0; // damage player deals to enemy
    let eDmg = 0; // damage enemy deals to player
    let pHeal = 0;
    let eHeal = 0;
    let narrative = "";
    let isCritical = false;
    const specialEffects: SpecialEffect[] = [];

    const pIsMajor = pCard.type === "major";
    const eIsMajor = eCard.type === "major";

    if (pIsMajor && eIsMajor) {
      // ── Both Major: "Fate Clash" ──
      narrative = `⚡ FATE CLASH — ${pCard.name} vs ${eCard.name}!\n`;
      isCritical = true;

      const pEffect = applyMajorEffect(pCard, playerHp, enemyHp, "You");
      const eEffect = applyMajorEffect(eCard, enemyHp, playerHp, "Enemy");

      // Handle specials that alter HP directly first
      if (pEffect.special === "swap_hp" || eEffect.special === "swap_hp") {
        const temp = playerHp;
        playerHp = enemyHp;
        enemyHp = temp;
        specialEffects.push("swap_hp");
        narrative += "HP has been swapped!\n";
      } else if (
        pEffect.special === "average_hp" ||
        eEffect.special === "average_hp"
      ) {
        const avg = Math.floor((playerHp + enemyHp) / 2);
        playerHp = avg;
        enemyHp = avg;
        specialEffects.push("average_hp");
        narrative += `HP equalized to ${avg}!\n`;
      } else {
        // Normal effect resolution
        let playerDodge = pEffect.special === "dodge";
        let enemyDodge = eEffect.special === "dodge";

        pDmg = playerDodge ? 0 : eEffect.damageToOpponent;
        eDmg = enemyDodge ? 0 : pEffect.damageToOpponent;

        // Self-damage
        pDmg += pEffect.damageToSelf;
        eDmg += eEffect.damageToSelf;

        pHeal = pEffect.healSelf + eEffect.healOpponent;
        eHeal = eEffect.healSelf + pEffect.healOpponent;

        if (playerDodge) specialEffects.push("dodge");
        if (pEffect.special === "drain" || eEffect.special === "drain")
          specialEffects.push("drain");
        if (
          pEffect.special === "both_damage" ||
          eEffect.special === "both_damage"
        )
          specialEffects.push("both_damage");

        narrative += pEffect.narrative + "\n" + eEffect.narrative;
      }
    } else if (pIsMajor) {
      // ── Player Major vs Enemy Minor ──
      const pEffect = applyMajorEffect(pCard, playerHp, enemyHp, "You");

      if (pEffect.special === "swap_hp") {
        const temp = playerHp;
        playerHp = enemyHp;
        enemyHp = temp;
        specialEffects.push("swap_hp");
        narrative = pEffect.narrative;
      } else if (pEffect.special === "average_hp") {
        const avg = Math.floor((playerHp + enemyHp) / 2);
        playerHp = avg;
        enemyHp = avg;
        specialEffects.push("average_hp");
        narrative = pEffect.narrative;
      } else if (pEffect.special === "skip") {
        pHeal = pEffect.healSelf;
        eHeal = pEffect.healOpponent;
        specialEffects.push("skip");
        narrative = pEffect.narrative;
      } else {
        // Major effect fires
        pDmg = 0;
        eDmg = 0;

        // Player deals major damage
        eDmg = 0; // enemy takes nothing from player's "attack" — we use effect damage
        const effectDmgToEnemy = pEffect.damageToOpponent;
        const effectDmgToSelf = pEffect.damageToSelf;

        // Enemy minor card still does reduced damage
        const enemyAttack = Math.max(Math.ceil(eCard.value! / 2), 1);

        if (pEffect.special === "dodge") {
          pDmg = effectDmgToEnemy; // to enemy
          eDmg = 0; // player dodges
          specialEffects.push("dodge");
        } else {
          pDmg = effectDmgToEnemy;
          eDmg = enemyAttack + effectDmgToSelf;
        }

        pHeal = pEffect.healSelf;
        eHeal = pEffect.healOpponent;

        if (pEffect.special === "drain") specialEffects.push("drain");
        if (pEffect.special === "both_damage")
          specialEffects.push("both_damage");
        if (pEffect.special === "both_heal") specialEffects.push("both_heal");

        narrative = `✨ ${pEffect.narrative}\n📎 Enemy retaliates with ${eCard.name} for ${enemyAttack} damage.`;
      }

      isCritical = true;
    } else if (eIsMajor) {
      // ── Enemy Major vs Player Minor ──
      const eEffect = applyMajorEffect(eCard, enemyHp, playerHp, "Enemy");

      if (eEffect.special === "swap_hp") {
        const temp = playerHp;
        playerHp = enemyHp;
        enemyHp = temp;
        specialEffects.push("swap_hp");
        narrative = eEffect.narrative;
      } else if (eEffect.special === "average_hp") {
        const avg = Math.floor((playerHp + enemyHp) / 2);
        playerHp = avg;
        enemyHp = avg;
        specialEffects.push("average_hp");
        narrative = eEffect.narrative;
      } else if (eEffect.special === "skip") {
        pHeal = eEffect.healOpponent;
        eHeal = eEffect.healSelf;
        specialEffects.push("skip");
        narrative = eEffect.narrative;
      } else {
        const effectDmgToPlayer = eEffect.damageToOpponent;
        const effectDmgToSelf = eEffect.damageToSelf;

        // Player minor card does reduced damage
        const playerAttack = Math.max(Math.ceil(pCard.value! / 2), 1);

        if (eEffect.special === "dodge") {
          eDmg = effectDmgToPlayer; // to player
          pDmg = 0; // enemy dodges player's attack
          specialEffects.push("dodge");
        } else {
          eDmg = effectDmgToPlayer + effectDmgToSelf;
          pDmg = playerAttack;
        }

        pHeal = eEffect.healOpponent;
        eHeal = eEffect.healSelf;

        if (eEffect.special === "drain") specialEffects.push("drain");
        if (eEffect.special === "both_damage")
          specialEffects.push("both_damage");
        if (eEffect.special === "both_heal") specialEffects.push("both_heal");

        narrative = `💀 ${eEffect.narrative}\n📎 You retaliate with ${pCard.name} for ${playerAttack} damage.`;
      }

      isCritical = true;
    } else {
      // ── Both Minor: Normal Combat ──
      const result = resolveMinorVsMinor(pCard, eCard);
      pDmg = result.pDmg; // player deals to enemy
      eDmg = result.eDmg; // enemy deals to player
      pHeal = result.pHeal;
      eHeal = result.eHeal;
      narrative = result.narrative;
      isCritical = result.critical;
      if (isCritical) specialEffects.push("critical");
    }

    // Apply damage and healing (skip for already-applied swap/average)
    const isDirectHpChange =
      specialEffects.includes("swap_hp") ||
      specialEffects.includes("average_hp");
    if (!isDirectHpChange) {
      // Apply difficulty damage bonuses
      const finalPlayerDmg = Math.max(0, pDmg + diff.playerDmgBonus);
      const finalEnemyDmg = Math.max(0, eDmg + diff.enemyDmgBonus);
      const finalEnemyHeal = eHeal + diff.enemyHealBonus;

      enemyHp = clamp(enemyHp - finalPlayerDmg + finalEnemyHeal, 0, enemyMaxHp);
      playerHp = clamp(playerHp - finalEnemyDmg + pHeal, 0, playerMaxHp);

      // Update displayed damage/heal to match actual HP changes
      pDmg = finalPlayerDmg;
      eDmg = finalEnemyDmg;
      eHeal = finalEnemyHeal;
    }

    rounds.push({
      round: i + 1,
      playerCard: pCard,
      enemyCard: eCard,
      playerDamageDealt: pDmg,
      enemyDamageDealt: eDmg,
      playerHeal: pHeal,
      enemyHeal: eHeal,
      playerHpBefore: hpBefore.player,
      enemyHpBefore: hpBefore.enemy,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp,
      narrative,
      isCritical,
      specialEffects,
    });
  }

  return {
    seed: seedString,
    seedHash: seedNum,
    difficultyId,
    rounds,
    playerWon: playerHp > enemyHp,
    playerFinalHp: Math.max(playerHp, 0),
    enemyFinalHp: Math.max(enemyHp, 0),
    playerMaxHp,
    enemyMaxHp,
    isDraw: playerHp === enemyHp,
    totalRoundsPlayed: rounds.length,
  };
}
