# Fate's Echo — Provably Fair On-Chain Tarot Battle

<div align="center">

  <img src="https://img.shields.io/badge/Solidity-0.8.19-363636?logo=solidity" alt="Solidity">
  <img src="https://img.shields.io/badge/Chainlink_VRF-v2.5-375BD2?logo=chainlink" alt="Chainlink VRF v2.5">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/wagmi-3.4-1C1C1C" alt="wagmi">
  <img src="https://img.shields.io/badge/Network-Sepolia-6B8AFF" alt="Sepolia">
  <img src="https://img.shields.io/badge/SC6107-Option%204-4CAF50" alt="SC6107">

  **A fully on-chain tarot card battle game with Chainlink VRF randomness, ETH wagering, and mathematically proven house edge.**

  [🎮 Live Demo](https://fate-s-echo.onrender.com/) · [Contract on Etherscan](https://sepolia.etherscan.io/address/0x441846effc4836570e80dbbb43ff041a8ea14910) · [House Edge Analysis](doc/game_design/HOUSE_EDGE_ANALYSIS.md)

</div>

---

## Overview

**Fate's Echo** is a provably fair blockchain game where players wager ETH on a 5-round tarot card battle. A Chainlink VRF seed deterministically generates all 10 cards — the same seed always produces the identical battle. The smart contract independently resolves the fight using the same `keccak256`-based algorithm as the frontend, ensuring trustless settlement.

**Key Metrics** (Monte Carlo, N = 1,000,000):

| Metric | Value |
|--------|-------|
| Player Win Rate | 48.01% |
| Draw Rate | 4.46% |
| House Edge (1.9× payout) | 4.33% |
| Kelly Criterion (player) | −9.77% |

> House edge sits between European Roulette (2.7%) and American Roulette (5.26%) — competitive for a blockchain game with full provable fairness.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Player (Browser)                         │
│  React 19 + TypeScript + Vite                                    │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ GameSetup  │→ │LoadingScreen │→ │  BattleScene (animation) │  │
│  │ (bet ETH)  │  │ (wait VRF)  │  │  5-round card battle     │  │
│  └────────────┘  └──────────────┘  └──────────┬───────────────┘  │
│                                               ↓                  │
│  ┌──────────────────┐    ┌─────────────────────────────────────┐ │
│  │  SettlingScreen   │ ←  │  GameOver (result + Etherscan links)│ │
│  │  (on-chain settle)│    └─────────────────────────────────────┘ │
│  └──────────────────┘                                            │
├──────────────────── wagmi / viem ─────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  FateEcho.sol (Sepolia)                                  │    │
│  │  playGame() → VRF Request → fulfillRandomWords(seed)     │    │
│  │  settleBattle() → _resolveBattle(seed) → payout ETH      │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│                    Chainlink VRF v2.5                             │
└──────────────────────────────────────────────────────────────────┘
```

### Game Flow

1. **Bet** — Player connects MetaMask, selects bet (0.001–1 ETH), calls `playGame()`
2. **VRF** — Chainlink VRF v2.5 generates a cryptographic random seed on-chain
3. **Battle** — Frontend resolves 5 rounds locally using the VRF seed (identical algorithm to contract)
4. **Animate** — Player watches the tarot battle unfold with full animations and sound
5. **Settle** — Player calls `settleBattle()`, contract re-computes the battle and pays out:
   - **Win** → 1.9× bet (after 5% house edge)
   - **Draw** → full refund
   - **Lose** → bet forfeited

---

## Game Mechanics

### Card System — 78 Tarot Cards

| Category | Cards | Role |
|----------|-------|------|
| **Major Arcana** (0–21) | The Fool, The Magician, … The World | Special effects: damage or healing. Even ID = damage, odd ID = heal. Value = `5 + (cardId × 3) % 16` → range [5, 20] |
| **Minor Arcana** (22–77) | 4 suits × 14 ranks | Standard combat. Value = `((cardId − 22) % 14) + 1` → range [1, 14] |

### Card Generation

```
cardId = keccak256(abi.encodePacked(seed, nonce)) % 78
```
Player cards use even nonces (0, 2, 4, 6, 8), enemy cards use odd nonces (1, 3, 5, 7, 9).

### Round Resolution (4 paths)

| Matchup | Resolution |
|---------|-----------|
| **Major vs Major** | `hash = keccak256(pCard, eCard)` → pDmg = 5 + hash%11, eDmg = 5 + (hash>>8)%11 |
| **Major vs Minor** | Major applies effect (damage or heal); minor retaliates `⌊minorValue / 2⌋` |
| **Minor vs Minor** | Compare values (with +3 counter bonus); winner deals `diff + 2`, loser deals `1`; tie = 2/2 |

### Suit Counter System

```
🔥 Wands → 🪙 Pentacles → ⚔️ Swords → 🏆 Cups → 🔥 Wands
```
Counter grants **+3** value bonus in minor-vs-minor combat.

### HP System

- Starting HP: **30** for both sides
- Total Rounds: **5** (or until one side reaches 0 HP)
- Healing from Major Arcana is capped at MAX_HP
- Saturating subtraction (HP never goes below 0)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Smart Contract** | Solidity 0.8.19 | On-chain battle resolution, ETH custody, payout |
| **Randomness** | Chainlink VRF v2.5 | Cryptographically verifiable random seeds |
| **Frontend** | React 19 + TypeScript + Vite | Interactive game UI with battle animations |
| **Web3 Integration** | wagmi 3.4 + viem 2.45 | Wallet connection, contract interaction |
| **State Management** | @tanstack/react-query | Balance caching, async state |
| **Hashing** | ethers.js 6.16 | `keccak256` / `solidityPacked` (matching contract) |
| **Network** | Sepolia Testnet | Deployment and testing |

---

## Project Structure

```
Web3_Casino/
├── contracts/                          # Smart Contracts
│   ├── FateEcho.sol                    # Main game contract (465 lines)
│   ├── FateEchoDeployer.sol            # Remix deployment helper
│   ├── config.js                       # Chainlink VRF parameters
│   └── deploy.js / test.js / networks.js
│
├── frontend/                           # React dApp
│   ├── src/
│   │   ├── engine/                     # Deterministic game logic
│   │   │   ├── battleEngine.ts         # keccak256-based battle (contract-matching)
│   │   │   ├── cardData.ts             # 78 tarot card definitions
│   │   │   ├── contractCardGen.ts      # Card generation helpers
│   │   │   ├── difficulty.ts           # Difficulty parameters
│   │   │   └── seedEngine.ts           # Seed normalization
│   │   ├── web3/                       # Blockchain integration
│   │   │   ├── useFateEcho.ts          # Main game hook (imperative async/await)
│   │   │   ├── contract.ts             # ABI + contract address
│   │   │   └── wagmiConfig.ts          # wagmi / Sepolia config
│   │   ├── components/                 # UI Components
│   │   │   ├── GameSetup.tsx           # Wallet connect + bet selection
│   │   │   ├── LoadingScreen.tsx       # VRF wait screen (fun messages)
│   │   │   ├── BattleScene.tsx         # 5-round battle animation
│   │   │   ├── SettlingScreen.tsx      # On-chain settlement screen
│   │   │   ├── GameOver.tsx            # Results + Etherscan verification
│   │   │   ├── CardDisplay.tsx         # Tarot card renderer
│   │   │   ├── CardGallery.tsx         # Browse all 78 cards
│   │   │   ├── HowToPlay.tsx           # Rules explanation
│   │   │   ├── HealthBar.tsx           # Animated HP bars
│   │   │   ├── BattleEffects.tsx       # Visual battle effects
│   │   │   └── SpaceBackground.tsx     # Animated star background
│   │   ├── utils/
│   │   │   └── soundManager.ts         # BGM + SFX management
│   │   ├── App.tsx                     # Phase router (setup→loading→battle→settling→gameover)
│   │   ├── main.tsx                    # WagmiProvider + QueryClientProvider
│   │   └── index.css                   # Dark mystical theme (~1500 lines)
│   ├── monte_carlo.ts                  # Monte Carlo simulation (1M games)
│   └── package.json
│
├── doc/                                # Documentation
│   ├── game_design/
│   │   └── HOUSE_EDGE_ANALYSIS.md      # Scientific house edge report
│   ├── DEPLOYMENT.md                   # Render deployment guide
│   ├── REMIX_DEPLOY_GUIDE.md           # Contract deployment guide
│   ├── PROJECT_EXPLANATION.md          # Technical deep-dive
│   └── PROJECT_REQUIREMENTS.md         # SC6107 requirements
│
├── resources/                          # Game assets
│   ├── Tarot Playing Cards/            # 78 tarot card images
│   ├── SpaceBackground/               # Background assets
│   └── monogram/                       # Font assets
│
├── .env                                # Environment config (contract address, VRF params)
└── .env.example                        # Template for env config
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **MetaMask** browser extension
- **Sepolia ETH** (from a [faucet](https://sepoliafaucet.com))

### 1. Clone & Install

```bash
git clone https://github.com/Shr1mpTop/Web3_Casino.git
cd Web3_Casino/frontend
npm install
```

### 2. Configure Environment

```bash
cp ../.env.example ../.env
```

The default `.env` points to the deployed contract. Edit if redeploying:

```env
VITE_FATE_ECHO_CONTRACT_ADDRESS=0x441846effc4836570e80dbbb43ff041a8ea14910
VITE_WIN_MULTIPLIER=1.9
VITE_HOUSE_EDGE=5
```

### 3. Run

```bash
npm run dev
```

Open `http://localhost:5173`, connect MetaMask (Sepolia), place a bet, and battle!

### 4. Build for Production

```bash
npm run build
npm run preview
```

---

## Smart Contract

### Deployed Contract

| Item | Value |
|------|-------|
| Network | Sepolia Testnet |
| Address | [`0x441846effc4836570e80dbbb43ff041a8ea14910`](https://sepolia.etherscan.io/address/0x441846effc4836570e80dbbb43ff041a8ea14910) |
| Solidity | 0.8.19 |
| VRF | Chainlink VRF v2.5 |
| Coordinator | `0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B` |

### Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `playGame()` | `payable` | Accept ETH bet, request VRF random seed |
| `settleBattle(requestId)` | `external` | Resolve battle on-chain, pay winner |
| `isSeedReady(requestId)` | `view` | Check if VRF callback completed |
| `getGame(requestId)` | `view` | Fetch full game result |
| `getStats()` | `view` | Total volume, payouts, balance, game count |

### Payout Logic

```solidity
if (playerWon) {
    payout = betAmount × 2 × (100 − HOUSE_EDGE) / 100;  // 1.9× bet
} else if (isDraw) {
    payout = betAmount;  // full refund
} else {
    payout = 0;  // house keeps bet
}
```

### Gas Optimization — Two-Phase Settlement

The VRF callback (`fulfillRandomWords`) only stores the seed (~50k gas). Battle computation runs in `settleBattle()` called by the player, avoiding callback gas limit issues.

### Deployment

Deploy via [Remix IDE](https://remix.ethereum.org). See [`doc/REMIX_DEPLOY_GUIDE.md`](doc/REMIX_DEPLOY_GUIDE.md) for step-by-step instructions.

---

## Provable Fairness

### How It Works

1. **Chainlink VRF** generates a cryptographically random `uint256` seed — neither the player nor the contract owner can predict or manipulate it
2. **Deterministic resolution** — `keccak256(seed, nonce)` generates each card. The same seed always produces the exact same 5-round battle
3. **Dual computation** — Frontend and contract use identical algorithms. Players can verify any game by replaying the seed
4. **On-chain transparency** — All bets, seeds, results, and payouts are publicly verifiable on Etherscan

### Verification

Given a VRF seed, anyone can independently reproduce the battle:

```typescript
import { resolveBattle } from "./engine/battleEngine";
const result = resolveBattle("123456789...");  // VRF seed as string
console.log(result.playerWon, result.playerFinalHp, result.enemyFinalHp);
```

---

## House Edge Analysis

A Monte Carlo simulation of **1,000,000 games** validates the economic model.

### Results Summary

| Metric | Value |
|--------|-------|
| Win Rate | 48.01% ± 0.05% (95% CI) |
| Draw Rate | 4.46% |
| Loss Rate | 47.53% |
| Fair Multiplier | 1.990× |
| Current Multiplier | 1.900× |
| **House Edge** | **4.33%** |
| Single-bet Std Dev | 0.929 ETH / ETH |

### Expected Value

$$E[X] = 0.4801 \times 1.9 + 0.0446 \times 1.0 + 0.4753 \times 0 - 1 = -0.0433$$

The negative Kelly criterion (−9.77%) confirms the house holds a mathematical edge on every bet.

### Comparison

| Game | House Edge |
|------|-----------|
| Blackjack (basic strategy) | 0.5–2% |
| European Roulette | 2.70% |
| **Fate's Echo** | **4.33%** |
| American Roulette | 5.26% |
| Slot Machines | 2–15% |

Full analysis with variance, ruin probability, and profit trajectory: [`doc/game_design/HOUSE_EDGE_ANALYSIS.md`](doc/game_design/HOUSE_EDGE_ANALYSIS.md)

### Run the Simulation

```bash
cd frontend
npx tsx monte_carlo.ts 1000000
```

---

## Development

### Prerequisites

- Node.js 18+, npm
- MetaMask + Sepolia ETH
- (Optional) Remix IDE for contract deployment

### Scripts

```bash
cd frontend
npm run dev          # Start dev server (localhost:5173)
npm run build        # TypeScript check + production build
npm run preview      # Preview production build
npx tsc --noEmit     # Type-check only
npx tsx monte_carlo.ts 1000000  # Run house edge simulation
```

### Key Design Decisions

1. **Imperative async/await** over reactive wagmi hooks — eliminates React re-render timing issues in multi-step blockchain flows
2. **Two-phase settlement** — VRF callback stores only the seed (cheap), battle computation runs in `settleBattle()` (player-paid gas)
3. **keccak256 card generation** — `hash % 78` produces uniform card distribution, matching Solidity's native hashing
4. **AbortController** for cancellation — prevents stale state when user navigates away mid-flow

---

## Documentation

| Document | Description |
|----------|-------------|
| [`doc/game_design/HOUSE_EDGE_ANALYSIS.md`](doc/game_design/HOUSE_EDGE_ANALYSIS.md) | Monte Carlo simulation results, payout optimization, risk analysis |
| [`doc/REMIX_DEPLOY_GUIDE.md`](doc/REMIX_DEPLOY_GUIDE.md) | Step-by-step contract deployment on Remix |
| [`doc/PROJECT_EXPLANATION.md`](doc/PROJECT_EXPLANATION.md) | Technical architecture deep-dive |
| [`doc/PROJECT_REQUIREMENTS.md`](doc/PROJECT_REQUIREMENTS.md) | SC6107 Option 4 requirements mapping |
| [`GAS_OPTIMIZATION.md`](GAS_OPTIMIZATION.md) | VRF callback gas optimization notes |

---

## SC6107 Requirements Checklist

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| On-chain verifiable randomness | ✅ | Chainlink VRF v2.5 |
| At least 1 game type | ✅ | 5-round tarot card battle |
| ETH wagering system | ✅ | 0.001–1 ETH bets via `playGame()` |
| Automatic payout | ✅ | `settleBattle()` — win/draw/lose |
| Fairness verification | ✅ | Deterministic keccak256 algorithm, same on frontend + contract |
| Anti-cheat mechanism | ✅ | VRF seed cannot be predicted; two-phase commit (bet → reveal) |
| House edge analysis | ✅ | Monte Carlo N=1M, 4.33% edge proven |
| Deployed on testnet | ✅ | Sepolia — verified and tested |

---

## License

Academic project for SC6107 Blockchain Development. MIT License.

## Acknowledgments

- **Chainlink VRF** — Verifiable randomness infrastructure
- **Rider-Waite Tarot** — Card artwork reference
- **wagmi / viem** — Elegant React + Ethereum integration
- **ethers.js** — keccak256 hashing for contract-matching

---

<div align="center">
  <strong>🌙 Fate's Echo — Where Destiny Meets Blockchain 🌙</strong>
  <br>
  <em>The seed determines fate. The blockchain guarantees fairness.</em>
</div>
