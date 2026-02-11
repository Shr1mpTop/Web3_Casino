/**
 * Network Configurations for Fate's Echo
 */

export const NETWORKS = {
  sepolia: {
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia ETH",
      symbol: "ETH",
      decimals: 18,
    },
    vrf: {
      coordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
      keyHash:
        "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
      callbackGasLimit: 500000,
      confirmations: 3,
    },
  },

  // For future multi-chain support
  amoy: {
    name: "Amoy",
    chainId: 80002,
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    vrf: {
      // Add Amoy VRF config when available
      coordinator: "",
      keyHash: "",
      callbackGasLimit: 500000,
      confirmations: 3,
    },
  },
};

// Current active network
export const ACTIVE_NETWORK = NETWORKS.sepolia;

// Game configuration
export const GAME_CONFIG = {
  minBet: "0.001", // 0.001 ETH
  maxBet: "1", // 1 ETH
  houseEdge: 5, // 5%
  winMultiplier: 1.9, // 1.9x payout
  maxHp: 30,
  totalRounds: 5,
};

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  [NETWORKS.sepolia.chainId]: "0xB2a7CB454234049AC1dDc742384E12E7018Dda9B", // Replace with your deployed address
};
