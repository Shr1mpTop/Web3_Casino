# Fate's Echo - Remix 部署完整指南

> 📅 适用于 Sepolia 测试网 + Chainlink VRF v2

---

## 📋 部署前准备清单

| 步骤 | 说明 | 完成 |
|------|------|------|
| 1 | MetaMask 已安装并切换到 Sepolia | ☐ |
| 2 | 钱包中有 Sepolia ETH（≥ 0.1） | ☐ |
| 3 | 钱包中有 Sepolia LINK（≥ 2） | ☐ |
| 4 | 已创建 Chainlink VRF Subscription | ☐ |
| 5 | 已记录 Subscription ID | ☐ |

---

## 第一步：获取 Sepolia ETH 和 LINK

### 1.1 获取 Sepolia ETH
访问以下任一水龙头：
- **Chainlink Faucet**（推荐，同时可领 ETH + LINK）: https://faucets.chain.link/sepolia
- **Alchemy Faucet**: https://sepoliafaucet.com
- **Infura Faucet**: https://www.infura.io/faucet/sepolia

### 1.2 获取 Sepolia LINK
- 访问 https://faucets.chain.link/sepolia
- 勾选 LINK 选项
- 连接钱包领取（每次约 20 LINK）

> ⚠️ **注意**：本合约使用 **Chainlink VRF v2.5**（支持 uint256 Subscription ID）

---

## 第二步：创建 Chainlink VRF Subscription

### 2.1 打开 Chainlink VRF 管理面板
1. 访问 https://vrf.chain.link/sepolia
2. 点击右上角 **Connect Wallet**，连接 MetaMask
3. 确认网络为 **Sepolia**

### 2.2 创建 Subscription
1. 点击 **Create Subscription**
2. 确认交易（0 ETH，仅消耗 Gas）
3. 等待交易确认

### 2.3 充值 LINK
1. 在刚创建的 Subscription 页面，点击 **Fund Subscription**
2. 输入金额：**2 LINK**（足够测试多次）
3. 确认交易

### 2.4 ⚠️ 记录你的 Subscription ID
> Subscription ID 显示在页面顶部（如 `#12345`）。
> **后面部署合约需要用到这个数字！**

---

## 第三步：在 Remix 中编译合约

### 3.1 打开 Remix IDE
1. 访问 https://remix.ethereum.org
2. 在左侧文件面板中，新建文件 `FateEcho.sol`

### 3.2 复制合约代码
1. 打开本项目的 `contracts/FateEcho.sol`
2. **全选复制** 所有内容
3. 粘贴到 Remix 的 `FateEcho.sol` 中

### 3.3 编译合约
1. 点击左侧 **Solidity Compiler** 图标（蓝色"S"）
2. 设置编译器版本：**0.8.19**
3. 勾选 **Enable optimization**（优化 runs: 200）
4. 点击 **Compile FateEcho.sol**
5. ✅ 看到绿色对勾表示编译成功

> ⚠️ 如果提示找不到 `@chainlink/contracts`，Remix 会自动从 npm 下载依赖，
> 等待几秒即可。如果持续报错，手动在 Remix 中安装：
> File Explorer → npm → 搜索 `@chainlink/contracts` → Install

---

## 第四步：部署合约

### 4.1 配置部署环境
1. 点击左侧 **Deploy & Run Transactions** 图标（橙色箭头）
2. **ENVIRONMENT** 选择：`Injected Provider - MetaMask`
3. MetaMask 弹窗会要求授权，点击 **连接**
4. 确认显示的网络为 **Sepolia (11155111)**

### 4.2 选择合约
1. **CONTRACT** 下拉框选择：`FateEcho - contracts/FateEcho.sol`

### 4.3 填写构造函数参数
展开 **Deploy** 按钮旁的参数区域，填入以下 4 个参数：

| 参数 | 值 | 说明 |
|------|----|------|
| `vrfCoordinator` | `0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B` | Sepolia VRF v2.5 Coordinator 地址 |
| `subscriptionId` | `你的 Subscription ID`（如 `92203...60039`） | 第二步中记录的完整数字（uint256，可能超过 20 位） |
| `keyHash` | `0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae` | Sepolia VRF v2.5 Key Hash（完整 bytes32） |
| `callbackGasLimit` | `500000` | VRF 回调 Gas 上限 |

> ⚠️ **Subscription ID 注意事项**：
> - Subscription ID 是一个很大的 **uint256** 数字，不要尝试缩短
> - 直接从 VRF 面板复制完整数字（可能 70+ 位）
> - Remix 会自动处理这个大数字，不需要引号

### 4.4 部署
1. 点击 **transact**（或 **Deploy**）
2. MetaMask 弹窗确认交易（Gas 约 0.01-0.03 ETH）
3. 等待交易确认（约 15-30 秒）
4. ✅ 在 Remix 底部控制台会显示部署成功信息

### 4.5 ⚠️ 记录合约地址
> 部署成功后，在 **Deployed Contracts** 区域可以看到合约地址。
> **复制这个地址**，后续所有操作都需要它！
>
> 📍 合约地址格式：`0x1234...abcd`

---

## 第五步：添加合约为 VRF Consumer

> **这一步非常关键！不做这一步，VRF 请求会失败！**

1. 回到 Chainlink VRF 管理面板: https://vrf.chain.link/sepolia
2. 点击你的 Subscription
3. 点击 **Add Consumer**
4. 粘贴你刚部署的合约地址
5. 确认交易

---

## 第六步：测试合约

### 6.1 在 Remix 中测试基础功能
在 **Deployed Contracts** 区域展开你的合约，可以调用以下函数：

#### 查看游戏参数（免费调用）
- 点击 `MAX_HP` → 应该返回 `30`
- 点击 `TOTAL_ROUNDS` → 应该返回 `5`
- 点击 `HOUSE_EDGE` → 应该返回 `5`
- 点击 `owner` → 应该返回你的钱包地址

#### 查看统计数据（免费调用）
- 点击 `getStats` → 应返回 volume=0, payouts=0, balance=0, gameCount=0

### 6.2 测试游戏（需要 ETH）
1. 在 **VALUE** 输入框中输入 `10000000000000000`（0.01 ETH，单位 wei）
   - 或切换单位为 Ether，输入 `0.01`
2. 点击 `playGame`
3. MetaMask 确认交易
4. 等待交易确认 → 控制台显示 `GameRequested` 事件
5. **等待 30-60 秒**，Chainlink VRF 回调会自动触发
6. 点击 `getStats` 检查 gameCount 是否变为 1

### 6.3 查询游戏结果
1. 从 `GameRequested` 事件中获取 `requestId`
2. 在 `getGame` 输入框填入 requestId
3. 点击 `getGame` 查看结果：
   - `playerWon`: 是否获胜
   - `playerFinalHp`: 玩家最终生命值
   - `enemyFinalHp`: 敌人最终生命值
   - `payout`: 获胜奖金（wei）
   - `state`: 0=等待中, 1=已结算, 2=已支付

### 6.4 领取奖金（如果获胜）
1. 在 `claimWinnings` 输入 requestId
2. 确认交易
3. 奖金自动转入你的钱包

---

## 第七步：更新项目配置

部署成功后，将合约地址更新到本地配置：

### 更新 `.env`
```
VITE_FATE_ECHO_CONTRACT_ADDRESS=0x你的合约地址
VITE_VRF_SUBSCRIPTION_ID=你的SubscriptionID
```

### 更新 `contracts/networks.js`
```javascript
export const CONTRACT_ADDRESSES = {
  11155111: "0x你的合约地址",
};
```

---

## 🔧 常见问题

### Q: 编译时报错 "Source not found"？
Remix 需要从 npm 下载 `@chainlink/contracts`。确保网络畅通，等待几秒重试。

### Q: 部署时报错 "value out-of-bounds" 或 "INVALID_ARGUMENT"？
**最常见原因**：Subscription ID 格式不正确。
- ✅ 正确做法：直接复制完整的 Subscription ID（70+ 位数字），**不要加引号**
- ❌ 错误做法：尝试缩短数字、添加引号、或使用科学计数法
- 示例正确格式：`92203804540253177398615463812268143329720836751227537635235006783480287060039`
- 如果提示 keyHash 错误，确保复制完整的 `0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c`（66 个字符）

### Q: 部署交易失败？
- 检查钱包中是否有足够的 Sepolia ETH
- 确认 MetaMask 已切换到 Sepolia 网络
- 确认编译器版本为 0.8.19

### Q: `playGame` 交易失败？
- 检查 bet 金额是否在 0.001-1 ETH 之间
- 确认 VALUE 字段已填写（必须发送 ETH）

### Q: VRF 回调没有触发？
- **最常见原因**：没有完成第五步（添加 Consumer）！
- 检查 Subscription 的 LINK 余额是否充足
- 回调通常需要 30-60 秒，耐心等待
- 在 https://vrf.chain.link/sepolia 查看你的 Subscription 的请求历史

### Q: `claimWinnings` 失败？
- 确认游戏状态为 `Resolved`（state = 1）
- 确认你是该游戏的玩家
- 确认合约余额足够支付奖金

---

## 📊 部署参考值速查

```
VRF Coordinator (Sepolia v2.5):  0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B
Key Hash (VRF v2.5):             0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae
Callback Gas Limit:              500000
Min Bet:                         0.001 ETH = 1000000000000000 wei
Max Bet:                         1 ETH     = 1000000000000000000 wei
Test Bet:                        0.01 ETH  = 10000000000000000 wei
```

---

## ✅ 部署完成后确认清单

| 检查项 | 状态 |
|--------|------|
| 合约成功部署到 Sepolia | ☐ |
| 合约地址已记录 | ☐ |
| 合约已添加为 VRF Consumer | ☐ |
| Subscription 有充足 LINK | ☐ |
| `MAX_HP` 返回 30 | ☐ |
| `owner` 返回你的地址 | ☐ |
| `playGame` 测试通过 | ☐ |
| VRF 回调成功触发 | ☐ |
| `.env` 已更新合约地址 | ☐ |
