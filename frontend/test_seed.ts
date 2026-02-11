/**
 * 验证链上 seed 的战斗结果
 */

import { resolveBattle } from "./src/engine/battleEngine";

// 从链上获取的 seed
const SEED_FROM_CHAIN =
  "37698387514118761970935242375478848299354595623015966326986973238447737190831";

console.log("🎴 测试 Seed:", SEED_FROM_CHAIN);
console.log("=".repeat(50));

// 解析战斗
const result = resolveBattle(SEED_FROM_CHAIN);

console.log("\n📊 战斗结果:");
console.log("玩家最终 HP:", result.playerHp);
console.log("敌人最终 HP:", result.enemyHp);
console.log("玩家获胜:", result.playerHp > result.enemyHp ? "✅ 是" : "❌ 否");

console.log("\n⚔️ 回合详情:");
result.rounds.forEach((round, index) => {
  console.log(`\n回合 ${index + 1}:`);
  console.log(`  玩家卡牌: ${round.playerCard.name}`);
  console.log(`  敌人卡牌: ${round.enemyCard.name}`);
  console.log(`  玩家造成伤害: ${round.playerDamage}`);
  console.log(`  敌人造成伤害: ${round.enemyDamage}`);
  console.log(`  回合后玩家 HP: ${round.playerHpAfter}`);
  console.log(`  回合后敌人 HP: ${round.enemyHpAfter}`);
});

console.log("\n💰 奖金计算:");
const betAmount = 0.001; // ETH
const houseEdge = 0.05; // 5%
const playerWon = result.playerHp > result.enemyHp;

if (playerWon) {
  const payout = betAmount * 2 * (1 - houseEdge);
  console.log(`投注: ${betAmount} ETH`);
  console.log(`获胜奖金: ${payout} ETH`);
  console.log(`预期: 0.0019 ETH`);
  console.log(`匹配: ${payout === 0.0019 ? "✅" : "❌"}`);
} else {
  console.log("输了，无奖金");
}

console.log("\n" + "=".repeat(50));
console.log("验证完成！");
