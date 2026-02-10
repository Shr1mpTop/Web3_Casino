# EVM-Solana-Casino-Games 项目说明与部署指南

## 1. 项目简介

**EVM-Solana-Casino-Games** 是一个开源的去中心化赌场（Web3 Casino）游戏平台项目。它提供了在 Solana 和 EVM 兼容链（如 Ethereum, Base, Arbitrum, Polygon）上运行的智能合约。

### 核心特点
*   **多链支持**：同时支持 Solana (Rust + Anchor) 和 EVM (Solidity + Foundry)。
*   **可证明公平 (Provably Fair)**：集成 VRF (可验证随机函数) 确保游戏结果的随机性和透明度。EVM 链使用 Chainlink VRF，Solana 使用 ORAO VRF。
*   **通用代币支持**：支持 SPL 代币 (Solana) 和 ERC-20 代币 (EVM)，允许使用 USDC, USDT 等稳定币。
*   **丰富的游戏库**：包含 10 种经典赌场游戏核心逻辑。

### 包含的游戏
项目目前包含以下游戏的智能合约实现：
1.  **Plinko** (弹珠)
2.  **Crash** (爆点/曲线崩溃)
3.  **Dice** (骰子)
4.  **Blackjack** (21点)
5.  **Roulette** (轮盘)
6.  **Poker** (德州扑克)
7.  **Slots** (老虎机)
8.  **CoinFlip** (抛硬币)
9.  **Lottery** (彩票)
10. **Jackpot** (奖池)

---

## 2. 仓库结构

该仓库主要关注**智能合约（后端）**的实现：

*   `web3/solana/`: Solana 版本的智能合约源码 (Rust + Anchor)。
*   `web3/evm/`: EVM 版本的智能合约源码 (Solidity + Foundry)。
*   `telegram-bot/`: Telegram 机器人集成的脚手架代码。
*   `docs/`: 项目文档，包含架构图和 API 说明。

---

## 3. 部署指南

### 前置准备 (Prerequisites)
在开始之前，请确保你的开发环境安装了以下工具：
*   **Node.js** (v18+)
*   **Rust** (v1.70+) & **Solana CLI** (用于 Solana 开发)
*   **Foundry** 或 **Hardhat** (用于 EVM 开发，推荐 Foundry)
*   **Git**

### 第一步：克隆项目
```bash
git clone https://github.com/LaChance-Lab/EVM-Solana-Casino-Games.git
cd EVM-Solana-Casino-Games
```

### 第二步：部署 Solana 合约

1.  进入 Solana 目录：
    ```bash
    cd web3/solana
    ```
2.  安装依赖：
    ```bash
    npm install
    ```
3.  构建程序：
    ```bash
    anchor build
    ```
4.  运行测试（建议）：
    ```bash
    anchor test
    ```
5.  部署到网络（以 Devnet 为例）：
    ```bash
    # 确保配置了 solana 钱包并领取了测试币
    anchor deploy --provider.cluster devnet
    ```

### 第三步：部署 EVM 合约

1.  进入 EVM 目录：
    ```bash
    cd web3/evm
    ```
2.  安装依赖：
    ```bash
    forge install
    ```
3.  编译合约：
    ```bash
    forge build
    ```
4.  运行测试：
    ```bash
    forge test -vvv
    ```
5.  部署脚本（以 Sepolia 测试网为例）：
    ```bash
    # 需要替换你的 RPC URL 和私钥
    forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
    ```

---

## 4. 注意事项

1.  **前端开发**：此仓库主要提供链上逻辑。要构建完整的用户应用，你需要开发一个前端（通常使用 Next.js + React），通过 Web3 库（如 ethers.js 或 @solana/web3.js）与部署好的合约进行交互。
2.  **安全性**：虽然项目声称包含审计部分，但在主网部署真实资金前，务必对你部署的合约进行独立审计。
3.  **VRF 配置**：在不同网络部署时，需要配置相应的 Chainlink 或 ORAO VRF 的订阅 ID 和 Coordinator 地址，以确保随机数生成功能正常工作。
