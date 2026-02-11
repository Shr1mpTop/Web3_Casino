/**
 * 验证前端战斗算法与合约完全一致
 * 
 * 使用已知的链上测试结果:
 *   Seed: 37698387514118761970935242375478848299354595623015966326986973238447737190831
 *   合约结果: playerWon=true, playerFinalHp=29, enemyFinalHp=26
 * 
 * 运行: npx tsx test_contract_match.ts
 */

import { resolveBattle } from "./src/engine/battleEngine";

const SEED =
  "37698387514118761970935242375478848299354595623015966326986973238447737190831";

console.log("=".repeat(60));
console.log("🧪 验证前端 battleEngine 与合约一致性");
console.log("=".repeat(60));
console.log(`Seed: ${SEED}`);
console.log();

// 调用我们重写后的 resolveBattle
const result = resolveBattle(SEED);

console.log("📋 卡牌生成:");
result.rounds.forEach((r) => {
  console.log(
    `  回合 ${r.round}: 玩家 [${r.playerCardId}] ${r.playerCard.name} vs 敌人 [${r.enemyCardId}] ${r.enemyCard.name}`
  );
});
console.log();

console.log("⚔️ 战斗过程:");
result.rounds.forEach((r) => {
  console.log(`  回合 ${r.round}:`);
  console.log(
    `    pDmg=${r.playerDamageDealt} eDmg=${r.enemyDamageDealt} pHeal=${r.playerHeal} eHeal=${r.enemyHeal}`
  );
  console.log(`    玩家 HP: ${r.playerHpBefore} → ${r.playerHpAfter}`);
  console.log(`    敌人 HP: ${r.enemyHpBefore} → ${r.enemyHpAfter}`);
  console.log(`    ${r.narrative}`);
});
console.log();

console.log("=".repeat(60));
console.log("📊 最终结果:");
console.log(`  玩家 HP: ${result.playerFinalHp}`);
console.log(`  敌人 HP: ${result.enemyFinalHp}`);
console.log(`  胜者: ${result.playerWon ? "玩家 ✅" : "敌人 ❌"}`);
console.log();

// 验证与合约一致
const expected = { playerWon: true, playerFinalHp: 29, enemyFinalHp: 26 };
const pass =
  result.playerWon === expected.playerWon &&
  result.playerFinalHp === expected.playerFinalHp &&
  result.enemyFinalHp === expected.enemyFinalHp;

if (pass) {
  console.log("✅ 验证通过! 前端 battleEngine 结果与合约完全一致!");
} else {
  console.log("❌ 验证失败! 前端结果与合约不一致!");
}
console.log(
  `  合约: playerWon=${expected.playerWon}, HP ${expected.playerFinalHp} vs ${expected.enemyFinalHp}`
);
console.log(
  `  前端: playerWon=${result.playerWon}, HP ${result.playerFinalHp} vs ${result.enemyFinalHp}`
);
console.log("=".repeat(60));
console.log("完整的战斗逻辑还需要修复 battleEngine.ts 以匹配合约");

console.log("\n" + "=".repeat(60));
