/**
 * useFateEcho — Main game hook
 *
 * Encapsulates the full on-chain game flow:
 *   1. playGame() — send ETH bet, get requestId
 *   2. Poll isSeedReady() — wait for VRF callback
 *   3. getGame() — fetch seed
 *   4. resolveBattle(seed) — compute battle client side
 *   5. settleBattle() — settle on-chain, receive payout
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { FATE_ECHO_ABI, FATE_ECHO_ADDRESS } from "./contract";
import { resolveBattle, type BattleResult } from "../engine/battleEngine";

// ── Game flow states ──────────────────────────────────────────
export type GameFlowState =
  | "idle" // Ready to play
  | "sending_tx" // Waiting for playGame tx confirmation
  | "waiting_vrf" // Waiting for Chainlink VRF callback
  | "battle_ready" // Seed received, ready to animate
  | "animating" // Battle animation playing
  | "settling" // Sending settleBattle tx
  | "settled" // Game complete
  | "error"; // Something went wrong

export interface GameFlowData {
  requestId: bigint | null;
  seed: string | null;
  betAmount: string; // ETH string
  battleResult: BattleResult | null;
  txHash: `0x${string}` | null;
  settleTxHash: `0x${string}` | null;
  errorMessage: string | null;
  payoutAmount: string | null; // ETH string
}

export function useFateEcho() {
  const { address, isConnected } = useAccount();

  // ── Flow state ──
  const [flowState, setFlowState] = useState<GameFlowState>("idle");
  const [flowData, setFlowData] = useState<GameFlowData>({
    requestId: null,
    seed: null,
    betAmount: "0",
    battleResult: null,
    txHash: null,
    settleTxHash: null,
    errorMessage: null,
    payoutAmount: null,
  });

  // ── Wallet balance ──
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
  });

  // ── Write: playGame ──
  const {
    writeContract: writePlayGame,
    data: playTxHash,
    error: playError,
    isPending: isPlayPending,
    reset: resetPlay,
  } = useWriteContract();

  // ── Wait for playGame tx receipt ──
  const { data: playReceipt, error: playReceiptError } =
    useWaitForTransactionReceipt({
      hash: playTxHash,
    });

  // ── Write: settleBattle ──
  const {
    writeContract: writeSettle,
    data: settleTxHash,
    error: settleError,
    isPending: isSettlePending,
    reset: resetSettle,
  } = useWriteContract();

  // ── Wait for settleBattle tx receipt ──
  const { data: settleReceipt, error: settleReceiptError } =
    useWaitForTransactionReceipt({
      hash: settleTxHash,
    });

  // ── Poll for seed readiness ──
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pollRequestId, setPollRequestId] = useState<bigint | null>(null);

  const { data: seedReady, refetch: refetchSeedReady } = useReadContract({
    address: FATE_ECHO_ADDRESS,
    abi: FATE_ECHO_ABI,
    functionName: "isSeedReady",
    args: pollRequestId ? [pollRequestId] : undefined,
    query: { enabled: !!pollRequestId },
  });

  const { data: gameData, refetch: refetchGame } = useReadContract({
    address: FATE_ECHO_ADDRESS,
    abi: FATE_ECHO_ABI,
    functionName: "getGame",
    args: pollRequestId ? [pollRequestId] : undefined,
    query: { enabled: !!pollRequestId },
  });

  // ──────────────── Step 1: Start game ────────────────
  const startGame = useCallback(
    (betEth: string) => {
      if (!isConnected) return;

      resetPlay();
      resetSettle();
      setFlowState("sending_tx");
      setFlowData({
        requestId: null,
        seed: null,
        betAmount: betEth,
        battleResult: null,
        txHash: null,
        settleTxHash: null,
        errorMessage: null,
        payoutAmount: null,
      });

      writePlayGame({
        address: FATE_ECHO_ADDRESS,
        abi: FATE_ECHO_ABI,
        functionName: "playGame",
        value: parseEther(betEth),
      });
    },
    [isConnected, writePlayGame, resetPlay, resetSettle]
  );

  // ──────────────── Step 2: playGame tx confirmed → extract requestId ────────
  useEffect(() => {
    if (!playReceipt || flowState !== "sending_tx") return;

    // Extract requestId from GameRequested event
    const gameRequestedTopic =
      "0x" +
      // keccak256("GameRequested(uint256,address,uint256)")
      // We'll just grab the first log's first topic (requestId is indexed)
      "";

    let requestId: bigint | null = null;

    for (const log of playReceipt.logs) {
      if (
        log.address.toLowerCase() === FATE_ECHO_ADDRESS.toLowerCase() &&
        log.topics.length >= 2
      ) {
        // topics[1] is the indexed requestId
        requestId = BigInt(log.topics[1]!);
        break;
      }
    }

    if (requestId) {
      setFlowData((prev) => ({
        ...prev,
        requestId,
        txHash: playReceipt.transactionHash,
      }));
      setFlowState("waiting_vrf");
      setPollRequestId(requestId);
    } else {
      setFlowData((prev) => ({
        ...prev,
        errorMessage: "Could not find requestId in transaction logs",
      }));
      setFlowState("error");
    }
  }, [playReceipt, flowState]);

  // ──────────────── Step 3: Poll for VRF seed ────────────────
  useEffect(() => {
    if (flowState !== "waiting_vrf" || !pollRequestId) return;

    // Start polling every 3 seconds
    const poll = setInterval(() => {
      refetchSeedReady();
      refetchGame();
    }, 3000);

    pollRef.current = poll;
    return () => clearInterval(poll);
  }, [flowState, pollRequestId, refetchSeedReady, refetchGame]);

  // ──────────────── Step 4: Seed ready → resolve battle ────────────────
  useEffect(() => {
    if (flowState !== "waiting_vrf") return;
    if (!seedReady || !gameData) return;

    // gameData is the tuple from getGame
    const gameSeed = (gameData as any).seed ?? (gameData as any)[3];
    if (!gameSeed || gameSeed === 0n) return;

    // Stop polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    const seedStr = gameSeed.toString();
    const result = resolveBattle(seedStr);

    setFlowData((prev) => ({
      ...prev,
      seed: seedStr,
      battleResult: result,
    }));
    setFlowState("battle_ready");
  }, [seedReady, gameData, flowState]);

  // ──────────────── Step 5: Settle battle on-chain ──────────────
  const settleBattle = useCallback(() => {
    if (!flowData.requestId) return;

    setFlowState("settling");
    writeSettle({
      address: FATE_ECHO_ADDRESS,
      abi: FATE_ECHO_ABI,
      functionName: "settleBattle",
      args: [flowData.requestId],
    });
  }, [flowData.requestId, writeSettle]);

  // ──────────────── Step 6: settleBattle tx confirmed ──────────────
  useEffect(() => {
    if (!settleReceipt || flowState !== "settling") return;

    // Check for GamePaid event to get payout
    let payout: bigint | null = null;
    for (const log of settleReceipt.logs) {
      if (
        log.address.toLowerCase() === FATE_ECHO_ADDRESS.toLowerCase() &&
        log.topics.length >= 2 &&
        log.data.length > 2
      ) {
        // GamePaid event data contains the payout amount
        try {
          payout = BigInt(log.data);
        } catch {
          // Not the right event format
        }
      }
    }

    setFlowData((prev) => ({
      ...prev,
      settleTxHash: settleReceipt.transactionHash,
      payoutAmount: payout ? formatEther(payout) : "0",
    }));
    setFlowState("settled");
    refetchBalance();
  }, [settleReceipt, flowState, refetchBalance]);

  // ──────────────── Error handling ──────────────
  useEffect(() => {
    const err = playError || playReceiptError || settleError || settleReceiptError;
    if (err && flowState !== "idle" && flowState !== "settled") {
      setFlowData((prev) => ({
        ...prev,
        errorMessage: (err as any)?.shortMessage || err.message || "Unknown error",
      }));
      setFlowState("error");
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [playError, playReceiptError, settleError, settleReceiptError, flowState]);

  // ──────────────── Mark animating ──────────────
  const startAnimation = useCallback(() => {
    setFlowState("animating");
  }, []);

  // ──────────────── Reset ──────────────
  const resetGame = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPollRequestId(null);
    resetPlay();
    resetSettle();
    setFlowState("idle");
    setFlowData({
      requestId: null,
      seed: null,
      betAmount: "0",
      battleResult: null,
      txHash: null,
      settleTxHash: null,
      errorMessage: null,
      payoutAmount: null,
    });
    refetchBalance();
  }, [resetPlay, resetSettle, refetchBalance]);

  return {
    // State
    flowState,
    flowData,
    isConnected,
    address,
    balance: balanceData ? formatEther(balanceData.value) : "0",
    balanceRaw: balanceData?.value ?? 0n,

    // Loading states
    isPlayPending,
    isSettlePending,

    // Actions
    startGame,
    startAnimation,
    settleBattle,
    resetGame,
  };
}
