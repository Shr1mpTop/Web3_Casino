# Fate's Echo - Provably Fair Tarot Battle

## 🎴 游戏概述

**Fate's Echo** 是一个基于区块链的塔罗牌对战游戏，使用 Chainlink VRF 确保完全公平的随机性。游戏采用"种子决定命运"的机制：一个随机种子决定整个5回合战斗的所有结果。

### 核心特性
- ⚔️ **5回合塔罗牌对战**：22张大阿卡纳 + 56张小阿卡纳
- 🎲 **Chainlink VRF**：可验证的随机数生成
- 💰 **ETH赌注**：直接使用 Sepolia ETH 进行投注
- 🔍 **完全透明**：任何人都可以验证游戏公平性

## 🏗️ 智能合约架构

### FateEcho.sol
主游戏合约，集成以下功能：
- Chainlink VRF 随机数请求
- 确定性战斗结果计算
- ETH 赌注和自动支付
- 游戏历史记录

### 技术规格
- **网络**: Sepolia 测试网
- **随机性**: Chainlink VRF v2
- **赌注**: 0.001 - 1 ETH
- **抽成**: 5% 平台抽成
- **支付**: 自动支付获胜者

## 🚀 部署指南

### 1. 环境准备

#### 配置 MetaMask (或 Remix 内置钱包)
1. 切换到 **Sepolia 测试网**
2. 获取测试 ETH: https://sepoliafaucet.com/

#### 配置 Chainlink VRF
1. 访问 [Chainlink VRF](https://vrf.chain.link/sepolia)
2. 创建订阅 (Subscription)
3. 充值 LINK 代币 (至少 1 LINK)
4. 记录你的 **Subscription ID**

### 2. 在 Remix 上部署

#### 步骤 1: 导入合约
1. 打开 [Remix IDE](https://remix.ethereum.org/)
2. 创建新文件 `FateEcho.sol`
3. 复制 `contracts/FateEcho.sol` 的内容

#### 步骤 2: 安装依赖
在 Remix 中安装 OpenZeppelin 和 Chainlink 合约：
```solidity
// 在文件顶部添加
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
```

#### 步骤 3: 配置参数
在构造函数中更新你的 Subscription ID：
```solidity
uint64 constant SUBSCRIPTION_ID = YOUR_SUBSCRIPTION_ID; // 替换为你的订阅ID
```

#### 步骤 4: 部署合约
1. 选择 **Sepolia** 网络
2. 编译合约 (Compiler: 0.8.19)
3. 部署合约
4. 记录部署的合约地址

#### 快速部署脚本
使用 `contracts/deploy.js` 快速部署：

1. 在 Remix 中打开 `contracts/deploy.js`
2. 修改 `YOUR_SUBSCRIPTION_ID` 为你的订阅 ID
3. 复制代码到 Remix 控制台运行
4. 合约将自动部署并显示地址

#### 测试合约
使用 `contracts/test.js` 测试部署的合约：

1. 修改 `CONTRACT_ADDRESS` 为你的合约地址
2. 在 Remix 控制台运行测试脚本
3. 脚本会自动测试基本功能并模拟一局游戏

### 3. 合约配置

#### VRF 参数 (Sepolia)
```solidity
VRF_COORDINATOR: 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
KEY_HASH: 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c
CALLBACK_GAS_LIMIT: 500000
```

#### 游戏参数
- **最小赌注**: 0.001 ETH
- **最大赌注**: 1 ETH
- **平台抽成**: 5%
- **获胜倍率**: 1.9x (2x 减去 5% 抽成)

## 🎮 游戏流程

### 前端集成
1. 用户输入赌注金额 (0.001-1 ETH)
2. 前端调用 `playGame()` 并发送 ETH
3. 等待 Chainlink VRF 回调 (约 30 秒)
4. 前端使用返回的种子重现战斗动画
5. 用户调用 `claimWinnings()` 领取奖金

### 合约函数

#### 游戏相关
```solidity
// 开始游戏 (发送 ETH)
function playGame() external payable returns (uint256 requestId)

// 领取奖金
function claimWinnings(uint256 requestId) external

// 查询游戏结果
function getGame(uint256 requestId) external view returns (GameResult memory)
```

#### 管理相关
```solidity
// 提取合约余额 (仅所有者)
function withdrawFunds() external onlyOwner

// 查询统计数据
function getStats() external view returns (uint256 volume, uint256 payouts, uint256 balance, uint256 gameCount)
```

## 🔧 前端集成

### 连接合约
```javascript
import { ethers } from 'ethers';

// 合约地址 (替换为你的部署地址)
const CONTRACT_ADDRESS = '0x...';

// 合约 ABI (从 Remix 导出)
const CONTRACT_ABI = [...];

// 连接到 Sepolia
const provider = new ethers.providers.JsonRpcProvider('https://rpc.sepolia.org');
const signer = provider.getSigner();
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
```

### 游戏流程
```javascript
// 1. 开始游戏
const tx = await contract.playGame({ value: ethers.utils.parseEther('0.1') });
await tx.wait();

// 2. 监听游戏结果
contract.on('GameResolved', (requestId, player, playerWon, payout) => {
  console.log('Game resolved:', { requestId, playerWon, payout });
});

// 3. 领取奖金
await contract.claimWinnings(requestId);
```

## 🔍 公平性验证

### 验证原理
1. **种子公开**: 每个游戏的 VRF 种子都记录在链上
2. **确定性算法**: 相同种子总是产生相同结果
3. **前端重现**: 玩家可以在本地验证战斗过程

### 验证步骤
1. 获取游戏的 `seed` 值
2. 在前端使用相同算法重现战斗
3. 比较结果是否一致

## 📊 统计数据

合约提供以下统计信息：
- **总投注量**: `totalVolume`
- **总支付量**: `totalPayouts`
- **合约余额**: `address(this).balance`
- **游戏数量**: 通过事件日志统计

## 🛡️ 安全特性

- **VRF 验证**: Chainlink 保证随机数不可预测且不可篡改
- **时间锁**: 防止 MEV 攻击
- **所有权控制**: 只有合约所有者可以提取资金
- **赌注限制**: 防止过大损失

## 📝 开发说明

### 本地测试
```bash
# 安装依赖
npm install

# 启动前端
npm run dev
```

### 测试网络部署
1. 使用 Remix 在 Sepolia 上部署
2. 更新前端的合约地址
3. 测试完整游戏流程

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License