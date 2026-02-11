/**
 * 与合约完全一致的卡牌生成算法
 * 使用 keccak256 哈希，与 Solidity 合约匹配
 */

import { Card, FULL_DECK } from "./cardData";
import { ethers } from "ethers";

/**
 * 生成卡牌 ID（0-77）
 * 完全匹配合约的 _hashToCardId 函数
 */
function hashToCardId(seed: string, nonce: number): number {
  // 使用 ethers.js 的 keccak256，与 Solidity 完全一致
  const hash = ethers.keccak256(
    ethers.solidityPacked(["uint256", "uint256"], [seed, nonce]),
  );

  // 转换为 BigInt 并模 78
  const hashBigInt = BigInt(hash);
  const cardId = Number(hashBigInt % 78n);

  return cardId;
}

/**
 * 生成玩家和敌人的卡牌（5 张 × 2）
 * 完全匹配合约逻辑
 */
export function generateCards(seed: string): {
  playerCards: Card[];
  enemyCards: Card[];
} {
  const playerCards: Card[] = [];
  const enemyCards: Card[] = [];

  for (let i = 0; i < 5; i++) {
    // 玩家卡牌：nonce = i * 2
    const playerCardId = hashToCardId(seed, i * 2);
    playerCards.push(FULL_DECK[playerCardId]);

    // 敌人卡牌：nonce = i * 2 + 1
    const enemyCardId = hashToCardId(seed, i * 2 + 1);
    enemyCards.push(FULL_DECK[enemyCardId]);
  }

  return { playerCards, enemyCards };
}

/**
 * 测试函数：验证与合约的一致性
 */
export function testCardGeneration(seed: string) {
  console.log("🎴 测试卡牌生成（与合约匹配）");
  console.log("Seed:", seed);
  console.log("=".repeat(50));

  const { playerCards, enemyCards } = generateCards(seed);

  console.log("\n玩家卡牌:");
  playerCards.forEach((card, i) => {
    const nonce = i * 2;
    const cardId = hashToCardId(seed, nonce);
    console.log(`  回合 ${i + 1}: [${cardId}] ${card.name}`);
  });

  console.log("\n敌人卡牌:");
  enemyCards.forEach((card, i) => {
    const nonce = i * 2 + 1;
    const cardId = hashToCardId(seed, nonce);
    console.log(`  回合 ${i + 1}: [${cardId}] ${card.name}`);
  });

  return { playerCards, enemyCards };
}
