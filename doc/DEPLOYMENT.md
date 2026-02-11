# Render Deployment Guide — Fate's Echo

## 🚀 快速部署到 Render

### 方法 1：自动部署（推荐） — Blueprint

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "Add Render deployment config"
   git push origin main
   ```

2. **在 Render 创建服务**
   - 访问 [Render Dashboard](https://dashboard.render.com)
   - 点击 **New +** → **Blueprint**
   - 连接你的 GitHub 仓库 `Shr1mpTop/Web3_Casino`
   - Render 会自动读取 `render.yaml` 配置

3. **配置环境变量**（在 Render Dashboard 中）

   进入创建的 Web Service → Environment → 添加以下环境变量：

   ```env
   VITE_CHAIN_ID=11155111
   VITE_NETWORK_NAME=Sepolia
   VITE_RPC_URL=https://rpc.sepolia.org
   VITE_BLOCK_EXPLORER=https://sepolia.etherscan.io
   VITE_FATE_ECHO_CONTRACT_ADDRESS=0x441846effc4836570e80dbbb43ff041a8ea14910
   VITE_VRF_COORDINATOR=0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B
   VITE_VRF_KEY_HASH=0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae
   VITE_VRF_SUBSCRIPTION_ID=92203804540253177398615463812268143329720836751227537635235006783480287060039
   VITE_VRF_CALLBACK_GAS_LIMIT=200000
   VITE_MIN_BET=0.001
   VITE_MAX_BET=1
   VITE_HOUSE_EDGE=5
   VITE_WIN_MULTIPLIER=1.9
   ```

4. **部署完成**
   - Render 会自动运行 `npm install && npm run build`
   - 部署成功后会分配一个 URL，例如：`https://fates-echo.onrender.com`

---

### 方法 2：手动部署 — Web Service

1. **在 Render 创建 Web Service**
   - 点击 **New +** → **Web Service**
   - 连接 GitHub 仓库：`Shr1mpTop/Web3_Casino`

2. **填写配置**

   | 配置项 | 值 |
   |-------|-----|
   | **Name** | `fates-echo` |
   | **Region** | Singapore / Oregon / Frankfurt |
   | **Branch** | `main` |
   | **Root Directory** | `frontend` |
   | **Environment** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npx serve -s dist -l $PORT` |
   | **Plan** | Free (或 Starter $7/月) |

3. **添加环境变量**（同上 👆 方法 1 第 3 步）

4. **手动触发部署**
   - 点击 **Create Web Service**
   - 等待构建和部署完成

---

## 📋 部署检查清单

### 构建前检查

- [ ] 所有 TypeScript 编译错误已修复（`npm run build` 本地测试通过）
- [ ] `.env` 文件中的合约地址正确 → `0x441846effc4836570e80dbbb43ff041a8ea14910`
- [ ] 图片资源路径正确（`resources/Tarot Playing Cards/PNG/`）
- [ ] Git 仓库已推送到 GitHub

### Render 配置检查

- [ ] Root Directory 设置为 `frontend`（重要！）
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npx serve -s dist -l $PORT`
- [ ] Node 版本：18.x 或更高
- [ ] 所有 14 个环境变量已添加

### 部署后验证

- [ ] 网站可以正常打开（无 404 或白屏）
- [ ] MetaMask 可以连接
- [ ] 可以切换到 Sepolia 网络
- [ ] 余额显示正常
- [ ] 塔罗牌图片正常加载
- [ ] 可以下注并触发交易
- [ ] 音效和动画正常

---

## 🔧 常见问题

### 1. 部署后页面空白或 404

**原因**：静态资源路径错误或构建失败。

**解决方案**：
- 检查 Render 日志中的构建错误
- 确认 `vite.config.ts` 中 `base` 路径正确（默认为 `/`）
- 检查 `dist/` 目录是否生成

### 2. 环境变量不生效

**原因**：Vite 环境变量必须以 `VITE_` 开头，且在构建时注入。

**解决方案**：
- 确保所有环境变量都以 `VITE_` 开头
- 在 Render Dashboard 修改环境变量后，**手动触发重新部署**（Settings → Manual Deploy → Deploy latest commit）

### 3. 图片/资源加载失败

**原因**：Vite 构建时未正确处理 `resources/` 目录。

**解决方案**：
```bash
# 在 frontend/ 目录创建 public/ 目录，复制资源
mkdir -p public/cards
cp -r ../resources/"Tarot Playing Cards"/PNG/* public/cards/
```

然后在代码中引用 `/cards/xxx.png`（Vite 会自动从 `public/` 目录提供）

### 4. 构建超时（Free 计划限制）

**原因**：Free 计划构建时间限制为 15 分钟，Node 依赖安装慢。

**解决方案**：
- 升级到 Starter 计划（$7/月）
- 或优化 `package.json`，移除不必要的依赖

### 5. MetaMask 连接后无反应

**原因**：RPC URL 不可用或合约地址错误。

**解决方案**：
- 使用备用 Sepolia RPC：
  - `https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY`
  - `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`
- 确认合约地址：`0x441846effc4836570e80dbbb43ff041a8ea14910`
- 在 Etherscan 验证合约已部署且有余额

---

## 🔄 自动重新部署

Render 支持 GitHub 集成自动部署：

1. **开启自动部署**（默认已开启）
   - Settings → Build & Deploy → Auto-Deploy: **Yes**

2. **每次推送代码到 `main` 分支**
   ```bash
   git add .
   git commit -m "Update frontend logic"
   git push origin main
   ```
   Render 会自动触发构建和部署

3. **部署通知**
   - 可以在 Settings → Notifications 配置 Slack/Discord/Email 通知

---

## 💰 成本

| 计划 | 价格 | 适用场景 |
|-----|------|---------|
| **Free** | $0/月 | 测试/演示项目，服务闲置 15 分钟后休眠 |
| **Starter** | $7/月 | 生产环境，无休眠，更高构建和运行时性能 |
| **Standard** | $25/月 | 高流量应用 |

**Free 计划限制**：
- 750 小时/月免费运行时间（≈ 31 天）
- 闲置 15 分钟后服务休眠（下次访问需 30 秒冷启动）
- 100 GB 出站流量/月
- 共享 CPU 和内存

**推荐**：对于 SC6107 课程项目，Free 计划完全够用。

---

## 🌐 自定义域名（可选）

如果有自己的域名（例如 `fates-echo.com`）：

1. **在 Render Dashboard**
   - Settings → Custom Domain → Add Custom Domain
   - 输入你的域名

2. **在域名提供商（如 GoDaddy/Cloudflare）配置 DNS**
   - 添加 CNAME 记录：`www` → `fates-echo.onrender.com`
   - 或添加 A 记录指向 Render 提供的 IP

3. **SSL 证书**
   - Render 自动提供免费 Let's Encrypt SSL 证书

---

## 📊 监控和日志

### 查看日志

1. **构建日志**
   - Dashboard → fates-echo → Manual Deploy → View logs

2. **运行时日志**
   - Dashboard → fates-echo → Logs（实时流式日志）

### 监控指标

- Dashboard → Metrics 可查看：
  - CPU 使用率
  - 内存使用量
  - 请求响应时间
  - HTTP 状态码分布

---

## 🎯 部署后的 URL

部署成功后，你的应用会托管在：

```
https://fates-echo.onrender.com
```

或自定义的域名。将此 URL 分享给用户，或提交给课程作业。

---

## 📚 相关文档

- [Render Web Services 文档](https://render.com/docs/web-services)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [环境变量配置](https://render.com/docs/environment-variables)

---

<div align="center">
  <strong>🚀 Happy Deploying! 🚀</strong>
</div>
