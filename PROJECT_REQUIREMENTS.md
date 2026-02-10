# SC6107: Blockchain Development Project

## Option 4: On-Chain Verifiable Random Game Platform

### 1. Project Overview

**Target:** Design and architect an advanced decentralized application (dApp) demonstrating mastery of blockchain principles.
**Key Technology:** Chainlink VRF (Verifiable Random Function) for provably fair outcomes.
**Team:** 2-4 Members.

### 2. Core Requirements

The platform must solve the challenge of generating randomness in a deterministic environment by using oracles.

#### A. Core Features

1.  **Verifiable Randomness**
    - Integrate Chainlink VRF.
    - Implement Callback patterns (Request-Response).
    - Handle failures/retries gracefully.
    - UI to display "Proof of Randomness".
2.  **Game Variety (Must implement at least 2)**
    - _Options provided:_
      - Lottery/Raffle (Time-based).
      - Dice Game (Multiplier betting).
      - Card Game (Simplified Poker/Blackjack).
      - Prediction Market (Binary outcomes).
3.  **Economy & Treasury**
    - Support ETH & ERC-20 betting.
    - House Edge mechanism.
    - Automatic Payouts.
    - Betting Limits (Min/Max).
4.  **Security & Fairness**
    - Anti-Cheating (Commit-Reveal patterns).
    - MEV Protection (Time-locks).
    - Transparent Verification.

#### B. Advanced Features (Bonus)

- Multiplayer turn-based mechanics.
- NFT Items/Achievements.
- Referral Systems.
- ENS Integration.

### 3. Technical Considerations

- **Gas Management:** VRF Callbacks cost gas; verify economic sustainability.
- **Security:** Prevent MEV exploitation (miners/validators front-running bets).
- **Edge Cases:** Handling "No Winner" states in lotteries.

---

_Based on SC6107 Academic Year 2025-26 Instructions._
