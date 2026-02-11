/**
 * Fate's Echo - Chainlink VRF v2.5 Configuration
 *
 * Copy these values to your Remix deployment
 */

// Sepolia Testnet VRF v2.5 Configuration
export const VRF_CONFIG = {
  // VRF Coordinator Address (v2.5)
  COORDINATOR: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",

  // Key Hash (v2.5)
  KEY_HASH: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",

  // Callback Gas Limit (优化后只需 100k)
  CALLBACK_GAS_LIMIT: 100000,

  // Minimum Confirmations
  CONFIRMATIONS: 3,

  // Number of Random Words
  NUM_WORDS: 1,
};

// Game Configuration
export const GAME_CONFIG = {
  MIN_BET: "0.001", // 0.001 ETH
  MAX_BET: "1",     // 1 ETH
  HOUSE_EDGE: 5,    // 5% house edge
  WIN_MULTIPLIER: 1.9, // 1.9x payout (2x - 5% edge)
};

// Useful Links
export const LINKS = {
  CHAINLINK_VRF: "https://vrf.chain.link/sepolia",
  SEPOLIA_FAUCET: "https://sepoliafaucet.com",
  REMIX_IDE: "https://remix.ethereum.org",
  SEPOLIA_EXPLORER: "https://sepolia.etherscan.io",
};