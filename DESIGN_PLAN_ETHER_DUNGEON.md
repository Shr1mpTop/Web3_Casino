# ⚔️ Ether Dungeon: Endless Siege (无尽地牢：围攻) - 游戏设计与架构文档

**版本**: v1.1 (针对 SC6107 课程要求优化版)  
**日期**: 2026-02-10  
**类型**: Web3 GameFi / Roguelike Auto-Battler  
**相关课程**: SC6107 - Blockchain Development Fundamentals (Part 2)

---

## 1. 🎯 项目愿景与课程要求对标 (Compliance Matrix)

本项目旨在构建一个**可证明公平 (Provably Fair)** 的链上闯关平台。设计方案严格遵循 SC6107 课程的开发要求：

| 课程要求                          | 我们的实现方案 (Ether Dungeon)                                                                                                                                                                            |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core 1: Verifiable Randomness** | 集成 **Chainlink VRF V2.5**。使用“请求-回调”模式生成初始手牌和随机事件，确保“地牢生成”不可预测且无法被 MEV 操纵。                                                                                         |
| **Core 2: Two Game Types**        | **1. 策略博弈 (Card Strategy)**: 核心的自走棋闯关模式 (Auto-Battler)。<br>**2. 概率博弈 (Dice/Lottery)**: 嵌入在地牢中的“命运房间 (Room of Fate)”，纯粹基于概率的风险/奖励骰子游戏。                      |
| **Core 3: Betting & Treasury**    | **国库模型**: 玩家入场费进入奖池 (Jackpot)。<br>**抽水 (House Edge)**: 5% 入场费自动划转至开发者金库。<br>**代币支持**: 支持 ETH 及 ERC-20 (USDC)。                                                       |
| **Core 4: Anti-Cheating**         | **防 MEV**: 采用两步交易 (Commit-Reveal)。玩家先提交 `startGame` 交易并锁定资金，随后 VRF 回调才揭示结果。攻击者无法通过预览随机数来撤单。 <br>**链上验证**: 所有战斗逻辑在链上或通过 ZK 验证，防止篡改。 |
| **Bonus: Advanced Features**      | **NFT 集成**: 幸存的 MVP 角色可铸造为 ERC-721。<br>**排行榜**: 链上记录最高层数玩家。                                                                                                                     |

---

## 2. 🎮 游戏策划方案 (Game Design)

### 2.1 核心体验 loop

**"贪婪是唯一的敌人。"** — 玩家带领军团进入无限深渊。每通过一关，奖金池叠加。玩家需要在每一关结束后做出抉择：

- **撤退 (Cash Out)**：安全带走当前奖金。
- **继续 (Next Level)**：冒着本局归零的风险，博取更高倍率收益。

### 2.2 双重游戏模式详解

#### 模式 A：无尽围攻 (Main Mode - Card Strategy)

- **流程**：
  1.  **招募**：调用 VRF 随机抽取 3 个兵种 ID（如 #10 兽人, #05 弓手）。
  2.  **布阵**：玩家根据敌方情报，调整自己 3 个单位的站位顺序。
  3.  **战斗**：基于确定性算法的“队列对冲”。即 `My[0]` vs `Enemy[0]`，死者退场，生者继续。
- **策略点**：利用兵种属性（坦克在前，输出在后）来最小化战损。

#### 模式 B：命运轮盘 (Event Mode - Dice Game)

- **触发机制**：每 3 层（Level 3, 6, 9...）必须触发一次。
- **玩法**：这是一个纯概率的骰子游戏，模拟“宝箱怪”或“神庙祈祷”。
- **规则**：
  - 请求一次新的 VRF 随机数 (1-100)。
  - **1-15 (大凶)**：遭到诅咒，扣除 25% 累计奖金。
  - **16-50 (平庸)**：获得少量补给（回复 10% HP）。
  - **51-90 (吉)**：奖金池直接翻倍 (x1.2 Multiplier)。
  - **91-100 (大吉)**：全队复活 + 获得稀有装备（临时 Buff）。
- **设计目的**：满足课程关于“Dice/Lottery”类型的要求，增加纯运气成分的刺激感。

---

## 3. 🏗️ 技术架构设计 (Technical Architecture)

### 3.1 技术栈 (Tech Stack)

- **智能合约**: Solidity (Foundry 框架)
- **前端**: Next.js + RainbowKit + Wagmi
- **预言机**: Chainlink VRF V2.5
- **网络**: Sepolia Testnet (EVM)

### 3.2 智能合约架构图

```mermaid
graph TD
    User[玩家] -->|1. startGame Pay ETH| Engine[DungeonEngine.sol]
    Engine -->|2. requestRandomWords| VRF[Chainlink VRF]
    VRF -->|3. fulfillRandomWords| Engine

    Engine -->|4. Get Unit Stats| Registry[CardRegistry.sol]
    Registry -->|Return ATK/HP| Engine

    User -->|5. executeBattle| Engine
    Engine -->|6. Mint (Optional)| NFT[HeroNFT.sol]

    subgraph Data Storage
        Registry
    end

    subgraph Core Logic
        Engine
    end
```

### 3.3 关键技术难点解决方案

#### Q1: 如何防止 VRF 回调的 Gas 限制？

- **方案**：我们将逻辑拆分。
  - `fulfillRandomWords` 只负责将随机数保存到 `session.randomSeed` 并将状态设为 `READY`。它不做复杂的逻辑计算。
  - 复杂的兵种生成逻辑放在用户调用的 `reveal` 或 `battle` 函数中，用户自己支付计算 Gas。

#### Q2: 如何防止 MEV (抢跑/三明治攻击)?

- **方案**：**Commit-Reveal 变体**。
  - 玩家下注时，资金已被锁定在合约中。
  - 随机数生成是异步的。当 VRF 回调时，结果已定。
  - 玩家无法在看到随机数不满意后撤回资金，因为 `cancelGame` 只有在 VRF 超时未响应（如24小时）后才允许调用。

#### Q3: 庄家优势 (House Edge) 如何设计？

- **方案**：
  1.  **入场费抽水**：固定 5%。
  2.  **赔率控制**：关卡难度的数值设计使得玩家获胜概率随层数递减，且长期期望回报率略低于 100%（例如 98%），确保奖池长期可持续。

---

## 4. 📅 开发计划 (Implementation Plan)

### Phase 1: 核心合约 (Week 1)

- [ ] `CardRegistry.sol`: 录入 5-10 种单位属性。
- [ ] `DungeonEngine.sol`: 实现 `battle(uint[] squad)` 纯逻辑，测试战斗算法正确性。

### Phase 2: 集成与随机性 (Week 2)

- [ ] 集成 Chainlink VRF。
- [ ] 实现“命运轮盘”骰子逻辑。
- [ ] 完善资金池逻辑 (Deposit/Withdraw)。

### Phase 3: 前端与交互 (Week 3)

- [ ] Next.js 界面开发：战场可视化（左侧我方，右侧敌方）。
- [ ] 连接钱包，展示实时 Log。

### Phase 4: 测试与文档 (Week 4)

- [ ] 编写测试脚本 (Foundry test)。
- [ ] 生成演示视频和文档，准备 Presentation。
