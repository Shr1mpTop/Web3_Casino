import { hashString, createRNG } from "./src/engine/seedEngine";
import { resolveBattle } from "./src/engine/battleEngine";
import { MAX_HP, FULL_DECK } from "./src/engine/cardData";

let passed = 0;
let failed = 0;
function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.log(`  FAIL: ${label}${detail ? " — " + detail : ""}`);
  }
}

// ===== Test 1: Determinism =====
console.log("=== TEST 1: Seed Determinism ===");
const seed = "test_seed_123";
const r1 = resolveBattle(seed);
const r2 = resolveBattle(seed);
assert("Same seed same result", JSON.stringify(r1) === JSON.stringify(r2));

const r3 = resolveBattle("different_seed");
assert(
  "Different seed different result",
  JSON.stringify(r1) !== JSON.stringify(r3),
);

// Run 50 seeds twice to be thorough
for (let i = 0; i < 50; i++) {
  const s = `determ_${i}`;
  const a = resolveBattle(s);
  const b = resolveBattle(s);
  assert(`Determinism seed ${s}`, JSON.stringify(a) === JSON.stringify(b));
}
console.log(`  52 determinism checks done`);

// ===== Test 2: HP Math =====
console.log("\n=== TEST 2: HP Calculation ===");
const testSeeds = [
  "alpha",
  "beta",
  "gamma",
  "hello",
  "world",
  "test123",
  "abc",
  "xyz",
  "moon",
  "sun",
  "star",
  "wheel",
  "death",
  "tower",
  "fool",
  "magician",
  "seed_0",
  "seed_1",
  "seed_2",
  "seed_99",
  "seed_999",
];

for (const s of testSeeds) {
  const res = resolveBattle(s);
  let pHp = MAX_HP;
  let eHp = MAX_HP;

  for (const r of res.rounds) {
    assert(
      `${s} R${r.round} pHpBefore`,
      r.playerHpBefore === pHp,
      `expected=${pHp} got=${r.playerHpBefore}`,
    );
    assert(
      `${s} R${r.round} eHpBefore`,
      r.enemyHpBefore === eHp,
      `expected=${eHp} got=${r.enemyHpBefore}`,
    );

    const hasSwap = r.specialEffects.includes("swap_hp");
    const hasAvg = r.specialEffects.includes("average_hp");

    if (hasSwap) {
      const temp = pHp;
      pHp = eHp;
      eHp = temp;
    } else if (hasAvg) {
      const avg = Math.floor((pHp + eHp) / 2);
      pHp = avg;
      eHp = avg;
    } else {
      eHp = Math.max(
        0,
        Math.min(MAX_HP, eHp - r.playerDamageDealt + r.enemyHeal),
      );
      pHp = Math.max(
        0,
        Math.min(MAX_HP, pHp - r.enemyDamageDealt + r.playerHeal),
      );
    }

    assert(
      `${s} R${r.round} pHpAfter`,
      r.playerHpAfter === pHp,
      `expected=${pHp} got=${r.playerHpAfter}`,
    );
    assert(
      `${s} R${r.round} eHpAfter`,
      r.enemyHpAfter === eHp,
      `expected=${eHp} got=${r.enemyHpAfter}`,
    );

    pHp = r.playerHpAfter;
    eHp = r.enemyHpAfter;
  }

  // Check final HP matches
  assert(`${s} finalPlayerHp`, res.playerFinalHp === Math.max(pHp, 0));
  assert(`${s} finalEnemyHp`, res.enemyFinalHp === Math.max(eHp, 0));

  // Check win/draw logic
  assert(`${s} playerWon`, res.playerWon === pHp > eHp);
  assert(`${s} isDraw`, res.isDraw === (pHp === eHp));
}
console.log(`  ${testSeeds.length} seeds HP math checked`);

// ===== Test 3: Hash Distribution =====
console.log("\n=== TEST 3: Hash Distribution ===");
const hashes = new Set<number>();
for (let i = 0; i < 1000; i++) {
  hashes.add(hashString("seed_" + i));
}
assert(
  "Hash uniqueness (1000 seeds)",
  hashes.size >= 950,
  `got ${hashes.size}`,
);

// Edge cases
assert("Empty string hash non-zero", hashString("") >= 0);
assert("Single char hash", hashString("a") !== hashString("b"));
console.log(`  ${hashes.size}/1000 unique hashes`);

// ===== Test 4: RNG Properties =====
console.log("\n=== TEST 4: RNG Properties ===");
const rng = createRNG(42);
const vals: number[] = [];
for (let i = 0; i < 10000; i++) {
  const v = rng.next();
  vals.push(v);
  assert(`RNG range check ${i}`, v >= 0 && v < 1, `got ${v}`);
}
// Check average is roughly 0.5
const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
assert("RNG average ~0.5", Math.abs(avg - 0.5) < 0.02, `got ${avg}`);

// Shuffle preserves all elements
const rng2 = createRNG(42);
const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const shuffled = rng2.shuffle(arr);
assert("Shuffle preserves length", shuffled.length === arr.length);
assert(
  "Shuffle preserves elements",
  shuffled.sort((a, b) => a - b).join(",") === arr.join(","),
);

// ===== Test 5: Deck Integrity =====
console.log("\n=== TEST 5: Deck Integrity ===");
assert("78 cards total", FULL_DECK.length === 78);
const majors = FULL_DECK.filter((c) => c.type === "major");
const minors = FULL_DECK.filter((c) => c.type === "minor");
assert("22 major arcana", majors.length === 22);
assert("56 minor arcana", minors.length === 56);

// Check all majors have effects
for (const m of majors) {
  assert(`Major ${m.name} has effect`, m.effect !== undefined);
  assert(`Major ${m.name} has image`, m.image.startsWith("/cards/"));
}

// Check minor suits
const suits = ["Cups", "Pentacles", "Swords", "Wands"];
for (const suit of suits) {
  const suitCards = minors.filter((c) => c.suit === suit);
  assert(`${suit} has 14 cards`, suitCards.length === 14);
  const values = suitCards.map((c) => c.value!).sort((a, b) => a - b);
  assert(
    `${suit} values 1-14`,
    values.join(",") === "1,2,3,4,5,6,7,8,9,10,11,12,13,14",
  );
}

// Unique IDs
const ids = new Set(FULL_DECK.map((c) => c.id));
assert("All card IDs unique", ids.size === 78);

// ===== Test 6: Early Termination =====
console.log("\n=== TEST 6: Early Termination ===");
let earlyTermCount = 0;
for (let i = 0; i < 500; i++) {
  const res = resolveBattle("earlyterm_" + i);
  if (res.totalRoundsPlayed < 5) {
    earlyTermCount++;
    const lastRound = res.rounds[res.rounds.length - 1];
    assert(
      `earlyterm_${i} has 0HP side`,
      lastRound.playerHpAfter <= 0 || lastRound.enemyHpAfter <= 0,
    );
  }
  // Verify rounds don't exceed 5
  assert(`earlyterm_${i} rounds <= 5`, res.totalRoundsPlayed <= 5);
}
console.log(`  ${earlyTermCount}/500 games terminated early`);

// ===== Test 7: Animation Mid-HP State =====
console.log(
  "\n=== TEST 7: Animation Mid-HP (getHpAfterPlayerAttack logic) ===",
);
for (let i = 0; i < 100; i++) {
  const res = resolveBattle("anim_" + i);
  for (const r of res.rounds) {
    const hasSwap = r.specialEffects.includes("swap_hp");
    const hasAvg = r.specialEffects.includes("average_hp");
    if (hasSwap || hasAvg) continue; // these alter HP in a special way

    // This is the getHpAfterPlayerAttack logic from BattleScene
    const midEnemyHp = Math.max(
      0,
      Math.min(MAX_HP, r.enemyHpBefore - r.playerDamageDealt + r.enemyHeal),
    );

    // The final enemy HP should equal mid HP (since engine applies all at once)
    assert(
      `anim_${i} R${r.round} midEnemyHp == final`,
      midEnemyHp === r.enemyHpAfter,
      `mid=${midEnemyHp} final=${r.enemyHpAfter}`,
    );
  }
}
console.log(`  100 seeds mid-HP checked`);

// ===== Summary =====
console.log("\n" + "=".repeat(50));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log("✅ ALL TESTS PASSED");
} else {
  console.log("❌ SOME TESTS FAILED");
}
