/**
 * FateEcho smart contract ABI + address
 * Only includes functions used by the frontend
 */

export const FATE_ECHO_ADDRESS = (import.meta.env.VITE_FATE_ECHO_CONTRACT_ADDRESS ||
  "0x64b9c6fdd3020ceb7cfacf7bf6e95a3b0ce0d4ad") as `0x${string}`;

export const FATE_ECHO_ABI = [
  // ── Read Functions ──────────────────────────────────────────
  {
    name: "getGame",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "requestId", type: "uint256" },
          { name: "player", type: "address" },
          { name: "betAmount", type: "uint256" },
          { name: "seed", type: "uint256" },
          { name: "playerWon", type: "bool" },
          { name: "isDraw", type: "bool" },
          { name: "playerFinalHp", type: "uint256" },
          { name: "enemyFinalHp", type: "uint256" },
          { name: "payout", type: "uint256" },
          { name: "state", type: "uint8" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "isSeedReady",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getPlayerGames",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getStats",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "volume", type: "uint256" },
      { name: "payouts", type: "uint256" },
      { name: "balance", type: "uint256" },
      { name: "gameCount", type: "uint256" },
    ],
  },
  {
    name: "MAX_HP",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "HOUSE_EDGE",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  // ── Write Functions ─────────────────────────────────────────
  {
    name: "playGame",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [{ name: "requestId", type: "uint256" }],
  },
  {
    name: "settleBattle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [],
  },

  // ── Events ─────────────────────────────────────────────────
  {
    name: "GameRequested",
    type: "event",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "player", type: "address", indexed: true },
      { name: "betAmount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "GameResolved",
    type: "event",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "player", type: "address", indexed: true },
      { name: "playerWon", type: "bool", indexed: false },
      { name: "payout", type: "uint256", indexed: false },
    ],
  },
  {
    name: "GamePaid",
    type: "event",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "player", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
