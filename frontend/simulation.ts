/**
 * Monte Carlo Simulation — Scientific Win Rate & House Edge Analysis
 *
 * Runs N battles per difficulty level using the ACTUAL game engine.
 * No approximations — every battle is fully resolved through the real algorithm.
 *
 * Output: precise win/draw/loss rates, expected value, house edge, confidence intervals.
 */

import { resolveBattle } from "./src/engine/battleEngine";
import {
  DifficultyId,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
} from "./src/engine/difficulty";

// ─── Configuration ───────────────────────────────────────────────────────────

const SAMPLES_PER_DIFFICULTY = 200_000; // 200k samples for tight confidence intervals
const CONFIDENCE_Z = 1.96; // 95% CI

// ─── Types ───────────────────────────────────────────────────────────────────

interface DifficultyStats {
  id: DifficultyId;
  totalBattles: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  drawRate: number;
  lossRate: number;
  winRateCI: [number, number]; // 95% confidence interval
  drawRateCI: [number, number];
  lossRateCI: [number, number];

  // Payout analysis (per 1-unit bet)
  avgPayoutPerBet: number; // average return per 1 unit wagered
  expectedValue: number; // EV = avgPayout - 1 (player's perspective)
  houseEdge: number; // = -EV (house's perspective, as %)
  houseEdgeCI: [number, number];

  // HP statistics
  avgPlayerFinalHp: number;
  avgEnemyFinalHp: number;
  avgRoundsPlayed: number;
  earlyTerminations: number; // battles ending before round 5

  // Damage statistics
  avgPlayerDmgPerRound: number;
  avgEnemyDmgPerRound: number;

  // Major Arcana impact
  majorAppearances: number;
  avgMajorsPerBattle: number;

  // Detailed outcome distribution
  playerKORate: number; // player reduced to 0 HP
  enemyKORate: number; // enemy reduced to 0 HP
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wilsonCI(
  p: number,
  n: number,
  z: number = CONFIDENCE_Z,
): [number, number] {
  // Wilson score interval — better than normal approximation for proportions
  const denominator = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [
    Math.max(0, (center - spread) / denominator),
    Math.min(1, (center + spread) / denominator),
  ];
}

function evCI(
  winRate: number,
  drawRate: number,
  lossRate: number,
  n: number,
  multiplier: number,
  drawMultiplier: number,
  z: number = CONFIDENCE_Z,
): [number, number] {
  // Bootstrap-style EV CI using delta method
  // EV = winRate * multiplier + drawRate * drawMultiplier + lossRate * 0 - 1
  // Variance of EV ≈ sum of variance contributions
  const winVar = (winRate * (1 - winRate)) / n;
  const drawVar = (drawRate * (1 - drawRate)) / n;
  const lossVar = (lossRate * (1 - lossRate)) / n;

  // EV variance (delta method)
  const evVar =
    multiplier * multiplier * winVar +
    drawMultiplier * drawMultiplier * drawVar +
    0 * lossVar;
  const evSe = Math.sqrt(evVar);

  const ev =
    winRate * multiplier + drawRate * drawMultiplier + lossRate * 0 - 1;
  return [ev - z * evSe, ev + z * evSe];
}

// ─── Simulation ──────────────────────────────────────────────────────────────

function simulateDifficulty(diffId: DifficultyId): DifficultyStats {
  const diff = DIFFICULTIES[diffId];
  const n = SAMPLES_PER_DIFFICULTY;

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let totalPlayerFinalHp = 0;
  let totalEnemyFinalHp = 0;
  let totalRounds = 0;
  let earlyTerminations = 0;
  let totalPlayerDmg = 0;
  let totalEnemyDmg = 0;
  let totalMajors = 0;
  let playerKOs = 0;
  let enemyKOs = 0;
  let totalRoundsForDmg = 0;

  for (let i = 0; i < n; i++) {
    // Generate unique seed for each battle
    const seed = `sim_${diffId}_${i}_${i * 7919 + 104729}`;
    const result = resolveBattle(seed, diffId);

    if (result.playerWon) wins++;
    else if (result.isDraw) draws++;
    else losses++;

    totalPlayerFinalHp += result.playerFinalHp;
    totalEnemyFinalHp += result.enemyFinalHp;
    totalRounds += result.totalRoundsPlayed;

    if (result.totalRoundsPlayed < 5) earlyTerminations++;
    if (result.playerFinalHp <= 0) playerKOs++;
    if (result.enemyFinalHp <= 0) enemyKOs++;

    for (const round of result.rounds) {
      totalPlayerDmg += round.playerDamageDealt;
      totalEnemyDmg += round.enemyDamageDealt;
      totalRoundsForDmg++;
      if (round.playerCard.type === "major") totalMajors++;
      if (round.enemyCard.type === "major") totalMajors++;
    }
  }

  const winRate = wins / n;
  const drawRate = draws / n;
  const lossRate = losses / n;

  const avgPayout =
    winRate * diff.multiplier + drawRate * diff.drawMultiplier + lossRate * 0;
  const ev = avgPayout - 1;

  const evConfidence = evCI(
    winRate,
    drawRate,
    lossRate,
    n,
    diff.multiplier,
    diff.drawMultiplier,
  );

  return {
    id: diffId,
    totalBattles: n,
    wins,
    draws,
    losses,
    winRate,
    drawRate,
    lossRate,
    winRateCI: wilsonCI(winRate, n),
    drawRateCI: wilsonCI(drawRate, n),
    lossRateCI: wilsonCI(lossRate, n),
    avgPayoutPerBet: avgPayout,
    expectedValue: ev,
    houseEdge: -ev * 100, // as percentage
    houseEdgeCI: [-evConfidence[1] * 100, -evConfidence[0] * 100],
    avgPlayerFinalHp: totalPlayerFinalHp / n,
    avgEnemyFinalHp: totalEnemyFinalHp / n,
    avgRoundsPlayed: totalRounds / n,
    earlyTerminations,
    avgPlayerDmgPerRound:
      totalRoundsForDmg > 0 ? totalPlayerDmg / totalRoundsForDmg : 0,
    avgEnemyDmgPerRound:
      totalRoundsForDmg > 0 ? totalEnemyDmg / totalRoundsForDmg : 0,
    majorAppearances: totalMajors,
    avgMajorsPerBattle: totalMajors / n,
    playerKORate: playerKOs / n,
    enemyKORate: enemyKOs / n,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   MONTE CARLO SIMULATION — Fate's Echo Battle Engine       ║");
  console.log(`║   Samples per difficulty: ${SAMPLES_PER_DIFFICULTY.toLocaleString().padStart(10)}                    ║`);
  console.log(`║   Total battles: ${(SAMPLES_PER_DIFFICULTY * DIFFICULTY_ORDER.length).toLocaleString().padStart(10)}                          ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const allStats: DifficultyStats[] = [];

  for (const diffId of DIFFICULTY_ORDER) {
    const diff = DIFFICULTIES[diffId];
    process.stdout.write(
      `Simulating ${diff.icon} ${diff.name.padEnd(10)} ...`,
    );
    const start = Date.now();
    const stats = simulateDifficulty(diffId);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      ` done in ${elapsed}s — Win: ${(stats.winRate * 100).toFixed(2)}%, Draw: ${(stats.drawRate * 100).toFixed(2)}%, Loss: ${(stats.lossRate * 100).toFixed(2)}%`,
    );
    allStats.push(stats);
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("                       DETAILED RESULTS");
  console.log("═══════════════════════════════════════════════════════════════\n");

  for (const s of allStats) {
    const diff = DIFFICULTIES[s.id];
    console.log(`── ${diff.icon} ${diff.name} (×${diff.multiplier} / draw ×${diff.drawMultiplier}) ──`);
    console.log(`   Player HP: ${diff.playerStartHp} | Enemy HP: ${diff.enemyStartHp} | Enemy Dmg+: ${diff.enemyDmgBonus} | Enemy Heal+: ${diff.enemyHealBonus} | Player Dmg+: ${diff.playerDmgBonus}`);
    console.log(`   Win:  ${(s.winRate * 100).toFixed(3)}%  [${(s.winRateCI[0] * 100).toFixed(3)}% – ${(s.winRateCI[1] * 100).toFixed(3)}%]`);
    console.log(`   Draw: ${(s.drawRate * 100).toFixed(3)}%  [${(s.drawRateCI[0] * 100).toFixed(3)}% – ${(s.drawRateCI[1] * 100).toFixed(3)}%]`);
    console.log(`   Loss: ${(s.lossRate * 100).toFixed(3)}%  [${(s.lossRateCI[0] * 100).toFixed(3)}% – ${(s.lossRateCI[1] * 100).toFixed(3)}%]`);
    console.log(`   EV per unit bet: ${s.expectedValue >= 0 ? "+" : ""}${s.expectedValue.toFixed(5)}`);
    console.log(`   House Edge: ${s.houseEdge.toFixed(3)}%  [${s.houseEdgeCI[0].toFixed(3)}% – ${s.houseEdgeCI[1].toFixed(3)}%]`);
    console.log(`   Avg payout per 1 unit: ${s.avgPayoutPerBet.toFixed(5)}`);
    console.log(`   Avg rounds played: ${s.avgRoundsPlayed.toFixed(2)} / 5`);
    console.log(`   Early terminations: ${s.earlyTerminations} (${((s.earlyTerminations / s.totalBattles) * 100).toFixed(2)}%)`);
    console.log(`   Player KO rate: ${(s.playerKORate * 100).toFixed(2)}%`);
    console.log(`   Enemy KO rate: ${(s.enemyKORate * 100).toFixed(2)}%`);
    console.log(`   Avg player final HP: ${s.avgPlayerFinalHp.toFixed(2)}`);
    console.log(`   Avg enemy final HP: ${s.avgEnemyFinalHp.toFixed(2)}`);
    console.log(`   Avg player dmg/round: ${s.avgPlayerDmgPerRound.toFixed(2)}`);
    console.log(`   Avg enemy dmg/round: ${s.avgEnemyDmgPerRound.toFixed(2)}`);
    console.log(`   Avg majors/battle: ${s.avgMajorsPerBattle.toFixed(2)}`);
    console.log();
  }

  // ── Summary Table ──
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                    HOUSE EDGE SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(
    "Difficulty   | Mult  | Win%     | Draw%    | Loss%    | House Edge    | EV/bet",
  );
  console.log(
    "-------------|-------|----------|----------|----------|---------------|--------",
  );
  for (const s of allStats) {
    const diff = DIFFICULTIES[s.id];
    const name = `${diff.icon} ${diff.name}`.padEnd(12);
    const mult = `×${diff.multiplier}`.padEnd(5);
    const win = `${(s.winRate * 100).toFixed(2)}%`.padStart(7);
    const draw = `${(s.drawRate * 100).toFixed(2)}%`.padStart(7);
    const loss = `${(s.lossRate * 100).toFixed(2)}%`.padStart(7);
    const he = `${s.houseEdge >= 0 ? "+" : ""}${s.houseEdge.toFixed(3)}%`.padStart(13);
    const ev = `${s.expectedValue >= 0 ? "+" : ""}${s.expectedValue.toFixed(4)}`.padStart(7);
    console.log(`${name} | ${mult} | ${win} | ${draw} | ${loss} | ${he} | ${ev}`);
  }

  // ── Revenue projection ──
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("                 REVENUE PROJECTION (per 10,000 bets of 100 tokens each)");
  console.log("═══════════════════════════════════════════════════════════════");
  const projectionBets = 10_000;
  const projectionBetSize = 100;
  for (const s of allStats) {
    const diff = DIFFICULTIES[s.id];
    const totalWagered = projectionBets * projectionBetSize;
    const houseProfit = totalWagered * (s.houseEdge / 100);
    const houseReturn = totalWagered * s.avgPayoutPerBet;
    console.log(
      `${diff.icon} ${diff.name.padEnd(10)}: wagered=${totalWagered.toLocaleString()} → house retains ${houseProfit >= 0 ? "+" : ""}${houseProfit.toFixed(0)} tokens (${s.houseEdge.toFixed(3)}%) | total paid out: ${houseReturn.toFixed(0)}`,
    );
  }

  // ── Output JSON for report ──
  const jsonOutput = allStats.map((s) => ({
    difficulty: s.id,
    multiplier: DIFFICULTIES[s.id].multiplier,
    drawMultiplier: DIFFICULTIES[s.id].drawMultiplier,
    playerStartHp: DIFFICULTIES[s.id].playerStartHp,
    enemyStartHp: DIFFICULTIES[s.id].enemyStartHp,
    enemyDmgBonus: DIFFICULTIES[s.id].enemyDmgBonus,
    enemyHealBonus: DIFFICULTIES[s.id].enemyHealBonus,
    playerDmgBonus: DIFFICULTIES[s.id].playerDmgBonus,
    samples: s.totalBattles,
    winRate: +(s.winRate * 100).toFixed(3),
    drawRate: +(s.drawRate * 100).toFixed(3),
    lossRate: +(s.lossRate * 100).toFixed(3),
    winRateCI95: [
      +(s.winRateCI[0] * 100).toFixed(3),
      +(s.winRateCI[1] * 100).toFixed(3),
    ],
    houseEdge: +s.houseEdge.toFixed(3),
    houseEdgeCI95: [+s.houseEdgeCI[0].toFixed(3), +s.houseEdgeCI[1].toFixed(3)],
    ev: +s.expectedValue.toFixed(5),
    avgPlayerFinalHp: +s.avgPlayerFinalHp.toFixed(2),
    avgEnemyFinalHp: +s.avgEnemyFinalHp.toFixed(2),
    avgRounds: +s.avgRoundsPlayed.toFixed(2),
    earlyTermRate: +((s.earlyTerminations / s.totalBattles) * 100).toFixed(2),
    playerKORate: +(s.playerKORate * 100).toFixed(2),
    enemyKORate: +(s.enemyKORate * 100).toFixed(2),
    avgPlayerDmgPerRound: +s.avgPlayerDmgPerRound.toFixed(2),
    avgEnemyDmgPerRound: +s.avgEnemyDmgPerRound.toFixed(2),
    avgMajorsPerBattle: +s.avgMajorsPerBattle.toFixed(2),
  }));

  console.log("\n\n── JSON DATA (for report generation) ──");
  console.log(JSON.stringify(jsonOutput, null, 2));
}

main();
