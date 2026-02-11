/**
 * wagmi + viem configuration for Sepolia testnet
 */
import { http, createConfig, fallback } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// Use env RPC as primary, with public fallbacks
const rpcUrl = import.meta.env.VITE_RPC_URL || "";

const transports = [
  // User-provided RPC (highest priority)
  ...(rpcUrl ? [http(rpcUrl)] : []),
  // Reliable public fallbacks
  http("https://ethereum-sepolia-rpc.publicnode.com"),
  http("https://sepolia.gateway.tenderly.co"),
  http("https://rpc2.sepolia.org"),
];

// WalletConnect Project ID (get from https://cloud.walletconnect.com)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "d7c9bd88d1b3419e9f0c5e8c6f8c1a4b";

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(), // MetaMask, Coinbase Wallet, etc.
    walletConnect({
      projectId,
      metadata: {
        name: "Fate's Echo",
        description: "On-Chain Tarot Battle Game",
        url: "https://fates-echo.onrender.com",
        icons: ["https://fates-echo.onrender.com/logo.png"],
      },
      showQrModal: true, // 显示二维码模态框
    }),
  ],
  transports: {
    [sepolia.id]: fallback(transports),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
