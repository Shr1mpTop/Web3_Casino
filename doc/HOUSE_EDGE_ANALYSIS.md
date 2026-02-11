# Fate's Echo — House Edge Scientific Analysis

## 庄家收益数学建模与蒙特卡洛验证报告

---

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| **Sample Size** | 1,000,000 games |
| **Player Win Rate** | 48.0054% ± 0.050% |
| **Draw Rate** | 4.4618% |
| **Player Loss Rate** | 47.5328% |
| **Current Multiplier** | 1.9x |
| **Actual House Edge** | **4.33%** |
| **Kelly Criterion (player)** | -9.77% (negative = house advantage) |
| **Comparable Casino Games** | Roulette (2.7%), Blackjack (0.5-2%), Slots (2-15%) |

> **Conclusion**: With a 1.9x payout multiplier and draw-refund mechanism, the house maintains a sustainable 4.33% edge — positioned between roulette and standard slot machines, ideal for a blockchain game targeting fair-but-profitable operation.

---

## 2. Methodology

### 2.1 Monte Carlo Simulation Design

```
Algorithm: Contract-matching keccak256 deterministic battle
Seed Generation: keccak256(solidityPacked(["uint256"], [i])) for i ∈ [0, N)
Games Simulated: N = 1,000,000
Execution Time: ~285 seconds
RNG Quality: Cryptographic (keccak256) — mirrors Chainlink VRF distribution
```

**Key Design Principle**: The simulation uses the **exact same battle algorithm** as the deployed FateEcho.sol smart contract, including:
- Same card generation: `keccak256(abi.encodePacked(seed, nonce)) % 78`
- Same round resolution logic (Major Clash / Major vs Minor / Minor vs Minor)
- Same counter system (Wands→Pentacles→Swords→Cups→Wands)
- Same HP mechanics (MAX_HP=30, 5 rounds, saturating subtraction, healing cap)

### 2.2 Statistical Confidence

For binomial proportion estimation with N = 1,000,000:

$$SE = \sqrt{\frac{p(1-p)}{n}} = \sqrt{\frac{0.48 \times 0.52}{1000000}} \approx 0.0005$$

**95% Wilson Score Confidence Interval** for win rate:

$$\text{CI}_{95\%} = [47.91\%, \; 48.10\%]$$

The margin of error (±0.05%) provides extremely high precision for house edge calculation.

---

## 3. Core Results

### 3.1 Outcome Distribution

```
┌────────────┬──────────┬────────────┐
│ Outcome    │ Count    │ Rate       │
├────────────┼──────────┼────────────┤
│ Player Win │ 480,054  │ 48.0054%   │
│ Draw       │  44,618  │  4.4618%   │
│ Player Loss│ 475,328  │ 47.5328%   │
└────────────┴──────────┴────────────┘
```

**Observations**:
1. The game is remarkably close to symmetric (48.0% vs 47.5%)
2. The ~0.47% player advantage comes from the card assignment order (player uses even nonces, enemy uses odd nonces), creating a subtle first-mover bias in the keccak256 distribution
3. Draw rate of 4.46% is significant — higher than most PvE games, due to the symmetric damage model

### 3.2 Combat Statistics (Per Game Average)

| Metric | Value | Interpretation |
|--------|-------|---------------|
| Player Damage Dealt | 22.37 | Slightly higher than enemy |
| Enemy Damage Dealt | 22.25 | Close to symmetric |
| Player Healing | 6.30 HP | Major Arcana heal effect |
| Enemy Healing | 6.32 HP | Near-identical |
| Player Final HP | 12.28 / 30 | 40.9% survival |
| Enemy Final HP | 12.20 / 30 | 40.7% survival |
| Avg HP Difference | +0.081 | Marginal player advantage |
| Major Arcana/Game | 2.65 / 10 | ~26.5% major card rate |
| Early Finish Rate | 21.41% | Someone hits 0 HP before Round 5 |
| Close Games (|Δ|≤3) | 19.75% | Nearly 1 in 5 games |
| Blowouts (|Δ|≥15) | 31.11% | High variance game |

### 3.3 HP Difference Distribution

```
≤ -20 (enemy crushes)     :  7.87%  ████████
-19 to -10 (enemy wins big): 17.69%  ██████████████████
 -9 to  -1 (enemy wins)    : 21.97%  ██████████████████████
      0    (draw)           :  4.46%  ████
 +1 to  +9 (player wins)   : 22.04%  ██████████████████████
+10 to +19 (player wins big): 17.95%  ██████████████████
≥ +20 (player crushes)     :  8.02%  ████████
```

The distribution is nearly **symmetric and bell-shaped**, confirming the game's fairness. The slight rightward skew (player advantage) is consistent with the 0.47% win rate differential.

---

## 4. House Edge Derivation

### 4.1 Payout Structure

| Outcome | Probability | Player Receives | Net for Player |
|---------|-------------|----------------|----------------|
| Win | $P_w = 0.4801$ | $m \times \text{bet}$ | $(m-1) \times \text{bet}$ |
| Draw | $P_d = 0.0446$ | $1.0 \times \text{bet}$ (refund) | $0$ |
| Lose | $P_l = 0.4753$ | $0$ | $-\text{bet}$ |

Where $m$ = win multiplier (currently 1.9).

### 4.2 Expected Value Calculation

$$E[X] = P_w \cdot m + P_d \cdot 1 + P_l \cdot 0 - 1$$

$$E[X] = 0.4801 \times 1.9 + 0.0446 \times 1.0 + 0.4753 \times 0 - 1$$

$$E[X] = 0.9122 + 0.0446 + 0 - 1 = -0.0433$$

**House Edge = $-E[X] = 4.33\%$**

### 4.3 Fair Multiplier Derivation

For zero house edge ($E[X] = 0$):

$$P_w \cdot m^* + P_d - 1 = 0$$

$$m^* = \frac{1 - P_d}{P_w} = \frac{1 - 0.0446}{0.4801} = 1.9902$$

**Fair multiplier ≈ 1.99x** (the theoretical break-even multiplier).

### 4.4 Contract Payout Formula Verification

The smart contract uses:
```solidity
payout = (betAmount * 2 * (100 - HOUSE_EDGE)) / 100
```

With `HOUSE_EDGE = 5`:
$$\text{payout} = \text{bet} \times 2 \times 0.95 = 1.9 \times \text{bet}$$

This yields **exactly 1.9x** as the configured payout — confirmed matching.

---

## 5. Optimal Multiplier Table

For different target house edges, the required multiplier is:

$$m = \frac{1 - P_d - H}{P_w}$$

Where $H$ = target house edge (as decimal).

| Target House Edge | Win Multiplier | Expected Value | House per 1000 ETH Volume |
|------------------|---------------|----------------|--------------------------|
| 1% | 1.9693x | -0.0100 | 10 ETH |
| 2% | 1.9485x | -0.0200 | 20 ETH |
| **3%** | **1.9277x** | **-0.0300** | **30 ETH** |
| **4% (near current)** | **1.9068x** | **-0.0400** | **40 ETH** |
| **5%** | **1.8860x** | **-0.0500** | **50 ETH** |
| 6% | 1.8652x | -0.0600 | 60 ETH |
| 7% | 1.8443x | -0.0700 | 70 ETH |
| 8% | 1.8235x | -0.0800 | 80 ETH |
| 10% | 1.7818x | -0.1000 | 100 ETH |
| 15% | 1.6777x | -0.1500 | 150 ETH |
| 20% | 1.5735x | -0.2000 | 200 ETH |

---

## 6. Variance & Risk Analysis

### 6.1 Single Bet Variance

Player return $X$ takes values: $\{1.9, 1.0, 0\}$ with probabilities $\{P_w, P_d, P_l\}$.

$$E[X] = P_w \cdot 1.9 + P_d \cdot 1.0 = 0.9568$$

$$E[X^2] = P_w \cdot 1.9^2 + P_d \cdot 1.0^2 = 0.4801 \times 3.61 + 0.0446 = 1.7777$$

$$\text{Var}(X) = E[X^2] - E[X]^2 = 1.7777 - 0.9155 = 0.8622$$

$$\sigma = \sqrt{0.8622} = 0.9286$$

**Volatility**: σ/E[X] = 97.1% — This is a **high-variance** game, providing exciting swings for players.

### 6.2 House Ruin Probability

Using the simplified Gambler's Ruin model for a fixed-bet player against the house:

$$P(\text{ruin}) \approx e^{-\frac{2hB}{\sigma^2}}$$

Where $h = 0.0433$ (house edge per unit bet), $B$ = house bankroll, σ² = 0.8622.

| House Bankroll | P(Ruin) |
|---------------|---------|
| 10 ETH | 36.7% |
| 50 ETH | 0.67% |
| **100 ETH** | **0.0044%** |
| 200 ETH | < 0.00002% |

**Recommendation**: House should maintain **≥ 50 ETH** reserve for safe operation (P(ruin) < 1%).

### 6.3 Kelly Criterion (Player Perspective)

The optimal bet fraction for a player (maximizing log-wealth growth):

$$f^* = \frac{P_w \cdot m - 1}{m - 1} = \frac{0.4801 \times 1.9 - 1}{0.9} = \frac{-0.0878}{0.9} = -9.77\%$$

**Kelly value is negative** → No positive-EV strategy exists for the player. The house has a mathematical advantage in every single bet. A rational Kelly-criterion gambler would never place a bet.

---

## 7. House Profit Trajectory

Simulation of 10,000 bets at 0.01 ETH each:

```
After    100 bets: House +0.037 ETH  (3.70%)
After    500 bets: House +0.373 ETH  (7.46%)
After  1,000 bets: House +0.309 ETH  (3.09%)
After  2,000 bets: House +0.995 ETH  (4.98%)
After  5,000 bets: House +2.375 ETH  (4.75%)
After 10,000 bets: House +4.400 ETH  (4.40%)
```

By the Law of Large Numbers, the house profit rate converges to the theoretical house edge (4.33%) as sample size increases. The trajectory shows healthy positive trend despite short-term variance.

---

## 8. Major Arcana Impact Analysis

| Major Cards in Game | Win Rate | Frequency | Notes |
|--------------------|----------|-----------|-------|
| 0 | 48.66% | 4.23% | Pure minor combat |
| 1 | 49.00% | 16.39% | Highest player advantage |
| 2 | 48.74% | 27.15% | Most common scenario |
| 3 | 48.03% | 26.64% | Near baseline |
| 4 | 46.78% | 16.53% | Declining player advantage |
| 5 | 45.97% | 6.81% | Major-heavy = more chaotic |
| 6+ | 45.49% | 2.26% | Rare, high chaos |

**Finding**: More Major Arcana cards slightly *reduce* player win rate (49.0% → 45.5%). This is because Major Arcana introduce more healing (odd IDs) and high-variance damage, which tends to neutralize minor card counter-bonus advantages and push outcomes toward draws or enemy advantage.

---

## 9. Comparison with Traditional Casino Games

| Game | House Edge | Volatility | Skill Factor |
|------|-----------|------------|-------------|
| Blackjack (basic strategy) | 0.5-2% | Low | High |
| Baccarat | 1.06-1.24% | Medium | None |
| European Roulette | 2.70% | Medium | None |
| Craps (pass line) | 1.41% | Medium | None |
| **Fate's Echo (1.9x)** | **4.33%** | **High** | **None** |
| Slot Machines | 2-15% | High | None |
| American Roulette | 5.26% | Medium | None |
| Keno | 25-40% | Very High | None |

Fate's Echo sits comfortably between European Roulette and American Roulette — a **competitive house edge** for a blockchain game, especially given:
- **Provably fair** (Chainlink VRF + on-chain resolution)
- **High entertainment value** (5-round tarot battle with animations)
- **Transparent** (all calculations verifiable on-chain)

---

## 10. Recommendations

### 10.1 Payout Configuration Options

| Strategy | Multiplier | House Edge | Use Case |
|----------|-----------|------------|----------|
| **Aggressive Growth** | 1.93x | ~3% | Early user acquisition, high competition |
| **Balanced (Current)** | 1.90x | ~4.3% | Sustainable long-term operation ✅ |
| **Conservative** | 1.82x | ~8% | Maximum house safety, low volume tolerance |

### 10.2 Current 1.9x Assessment

✅ **Keep 1.9x** — The current multiplier provides:
- Competitive house edge vs. established casinos
- Strong marketing appeal ("×1.9 payout!")
- Sufficient margin to cover gas costs and operational expenses
- Negative Kelly criterion = mathematically guaranteed long-term house profit

### 10.3 Draw Mechanic

The 4.46% draw rate with full refund is a **player-friendly feature** that:
- Reduces perceived "unfairness" (player loses less often than expected)
- Creates a distinct third outcome that adds excitement
- Costs the house only ~0% per draw (refund = zero net effect)
- Effectively reduces play-through rate by 4.46% (benign impact)

### 10.4 Reserve Requirements

| Daily Volume | Monthly Volume | Monthly House Profit (Expected) | Recommended Reserve |
|-------------|---------------|--------------------------------|-------------------|
| 1 ETH | 30 ETH | 1.30 ETH | 10 ETH |
| 10 ETH | 300 ETH | 12.99 ETH | 50 ETH |
| 100 ETH | 3,000 ETH | 129.9 ETH | 200 ETH |

---

## 11. Mathematical Proof of Long-Term Profitability

### Theorem
*Given the measured win rate $P_w = 0.4801$, draw rate $P_d = 0.0446$, and multiplier $m = 1.9$, the house has a strictly positive expected profit per bet.*

### Proof

Let $R$ = house profit per unit bet.

$$E[R] = P_l \cdot 1 + P_d \cdot 0 + P_w \cdot (1 - m)$$

$$= 0.4753 \cdot 1 + 0.0446 \cdot 0 + 0.4801 \cdot (1 - 1.9)$$

$$= 0.4753 - 0.4321 = 0.0433$$

Since $E[R] = 0.0433 > 0$, by the **Strong Law of Large Numbers**:

$$\lim_{n \to \infty} \frac{1}{n} \sum_{i=1}^{n} R_i = E[R] = 0.0433 \quad \text{almost surely}$$

Therefore, the house profit per unit bet converges to 4.33% with probability 1 as the number of games approaches infinity. **∎**

---

## 12. Appendix: Simulation Source

See [`frontend/monte_carlo.ts`](../frontend/monte_carlo.ts) — a standalone TypeScript script that:
- Uses `ethers.js` keccak256 to match the exact contract algorithm
- Generates 1,000,000 pseudo-random seeds
- Resolves each game through the full 5-round battle system
- Computes comprehensive statistical analysis
- Runtime: ~285 seconds on standard hardware

**Reproducibility**: Run `npx tsx monte_carlo.ts 1000000` in the `frontend/` directory.

---

*Report generated: 2026-02-11*  
*Algorithm: FateEcho.sol v2.5 (keccak256 deterministic battle)*  
*Validation: Monte Carlo N=1,000,000, 95% CI*
