// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title Fate's Echo - Provably Fair Tarot Battle
 * @notice A blockchain-based tarot card battle game using Chainlink VRF
 * @dev Implements deterministic battle resolution based on VRF-generated seeds
 */
contract FateEcho is VRFConsumerBaseV2Plus {
    // Chainlink VRF Configuration
    uint256 private immutable i_subscriptionId;
    bytes32 private immutable i_keyHash;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Game Constants
    uint256 public constant MAX_HP = 30;
    uint256 public constant TOTAL_ROUNDS = 5;
    uint256 public constant COUNTER_BONUS = 3;
    uint256 public constant HOUSE_EDGE = 5; // 5% house edge

    // Suits for Minor Arcana
    enum Suit { Wands, Cups, Swords, Pentacles }

    // Card Types
    enum CardType { Major, Minor }

    // Game States
    enum GameState { Pending, Resolved, Paid }

    // Events
    event GameRequested(uint256 indexed requestId, address indexed player, uint256 betAmount);
    event GameResolved(uint256 indexed requestId, address indexed player, bool playerWon, uint256 payout);
    event GamePaid(uint256 indexed requestId, address indexed player, uint256 amount);

    // Structs
    struct Card {
        uint256 id;
        CardType cardType;
        string name;
        Suit suit;
        uint256 value;
        uint256 majorIndex;
    }

    struct GameResult {
        uint256 requestId;
        address player;
        uint256 betAmount;
        uint256 seed;
        bool playerWon;
        uint256 playerFinalHp;
        uint256 enemyFinalHp;
        uint256 payout;
        GameState state;
        uint256 timestamp;
    }

    // Storage
    mapping(uint256 => GameResult) public games;
    mapping(address => uint256[]) public playerGames;

    // Treasury
    uint256 public totalVolume;
    uint256 public totalPayouts;
    uint256 public totalGames;

    // Modifiers
    modifier validBet(uint256 amount) {
        require(amount >= 0.001 ether && amount <= 1 ether, "Bet must be between 0.001 and 1 ETH");
        _;
    }

    /**
     * @notice Constructor
     * @param vrfCoordinator Address of the VRF Coordinator
     * @param subscriptionId Chainlink subscription ID (uint256)
     * @param keyHash Gas lane key hash
     * @param callbackGasLimit Gas limit for callback
     */
    constructor(
        address vrfCoordinator,
        uint256 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2Plus(vrfCoordinator) {
        i_subscriptionId = subscriptionId;
        i_keyHash = keyHash;
        i_callbackGasLimit = callbackGasLimit;
    }

    /**
     * @notice Start a new game with ETH bet
     * @return requestId The VRF request ID
     */
    function playGame() external payable validBet(msg.value) returns (uint256 requestId) {
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: i_keyHash,
                subId: i_subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: i_callbackGasLimit,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
            })
        );

        games[requestId] = GameResult({
            requestId: requestId,
            player: msg.sender,
            betAmount: msg.value,
            seed: 0,
            playerWon: false,
            playerFinalHp: 0,
            enemyFinalHp: 0,
            payout: 0,
            state: GameState.Pending,
            timestamp: block.timestamp
        });

        playerGames[msg.sender].push(requestId);
        totalVolume += msg.value;
        totalGames++;

        emit GameRequested(requestId, msg.sender, msg.value);
    }

    /**
     * @notice VRF callback function - 只存储 seed，节省 Gas
     * @param requestId The request ID
     * @param randomWords Array of random words
     */
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        GameResult storage game = games[requestId];
        require(game.state == GameState.Pending, "Game not pending");
        require(game.player != address(0), "Game not found");

        // 只存储 seed，不做任何计算！
        game.seed = randomWords[0];
        game.state = GameState.Resolved;

        emit GameResolved(requestId, game.player, false, 0); // 占位事件
    }

    /**
     * @notice 结算战斗并支付奖金（玩家在前端看完动画后调用）
     * @param requestId The game request ID
     */
    function settleBattle(uint256 requestId) external {
        GameResult storage game = games[requestId];
        require(game.player == msg.sender, "Not your game");
        require(game.state == GameState.Resolved, "Game not resolved or already settled");
        require(game.seed != 0, "Seed not available");
        require(game.payout == 0, "Already settled");

        // 现在才计算战斗结果
        (
            bool playerWon,
            uint256 playerFinalHp,
            uint256 enemyFinalHp
        ) = _resolveBattle(game.seed);

        game.playerWon = playerWon;
        game.playerFinalHp = playerFinalHp;
        game.enemyFinalHp = enemyFinalHp;

        // 计算并立即支付
        if (playerWon) {
            uint256 payout = (game.betAmount * 2 * (100 - HOUSE_EDGE)) / 100;
            game.payout = payout;
            game.state = GameState.Paid;
            totalPayouts += payout;

            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Transfer failed");

            emit GamePaid(requestId, msg.sender, payout);
        } else {
            game.state = GameState.Paid; // 输了也标记为已结算
        }
    }

    /**
     * @notice 查询 seed 是否已生成（供前端轮询）
     * @param requestId The game request ID
     */
    function isSeedReady(uint256 requestId) external view returns (bool) {
        return games[requestId].seed != 0;
    }

    /**
     * @notice Get game details
     * @param requestId The game request ID
     */
    function getGame(uint256 requestId) external view returns (GameResult memory) {
        return games[requestId];
    }

    /**
     * @notice Get player's game history
     * @param player The player address
     */
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }

    /**
     * @notice Withdraw contract balance (owner only)
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Get contract statistics
     */
    function getStats() external view returns (
        uint256 volume,
        uint256 payouts,
        uint256 balance,
        uint256 gameCount
    ) {
        return (totalVolume, totalPayouts, address(this).balance, totalGames);
    }

    // ─── Private Functions ─────────────────────────────────────────────────────

    /**
     * @dev Deterministic battle resolution matching frontend logic
     * @param seed The VRF-generated seed
     * @return playerWon Whether player won
     * @return playerHp Final player HP
     * @return enemyHp Final enemy HP
     */
    function _resolveBattle(uint256 seed) private pure returns (bool, uint256, uint256) {
        // Generate 10 cards (5 player + 5 enemy) deterministically
        uint256[] memory playerCards = new uint256[](TOTAL_ROUNDS);
        uint256[] memory enemyCards = new uint256[](TOTAL_ROUNDS);

        for (uint256 i = 0; i < TOTAL_ROUNDS; i++) {
            // Use seed + round index to generate card IDs
            uint256 playerCardId = _hashToCardId(seed, i * 2);
            uint256 enemyCardId = _hashToCardId(seed, i * 2 + 1);

            playerCards[i] = playerCardId;
            enemyCards[i] = enemyCardId;
        }

        // Simulate battle
        uint256 currentPlayerHp = MAX_HP;
        uint256 currentEnemyHp = MAX_HP;

        for (uint256 round = 0; round < TOTAL_ROUNDS; round++) {
            if (currentPlayerHp == 0 || currentEnemyHp == 0) break;

            uint256 pCardId = playerCards[round];
            uint256 eCardId = enemyCards[round];

            // Resolve round
            (uint256 pDmg, uint256 eDmg, uint256 pHeal, uint256 eHeal) = _resolveRound(pCardId, eCardId);

            // Apply effects
            if (currentEnemyHp > pDmg) {
                currentEnemyHp -= pDmg;
            } else {
                currentEnemyHp = 0;
            }

            if (currentPlayerHp > eDmg) {
                currentPlayerHp -= eDmg;
            } else {
                currentPlayerHp = 0;
            }

            // Apply healing
            currentPlayerHp = currentPlayerHp > MAX_HP - pHeal ? MAX_HP : currentPlayerHp + pHeal;
            currentEnemyHp = currentEnemyHp > MAX_HP - eHeal ? MAX_HP : currentEnemyHp + eHeal;
        }

        bool playerWon = currentPlayerHp > currentEnemyHp;
        return (playerWon, currentPlayerHp, currentEnemyHp);
    }

    /**
     * @dev Convert hash to card ID (0-77)
     */
    function _hashToCardId(uint256 seed, uint256 nonce) private pure returns (uint256) {
        uint256 hash = uint256(keccak256(abi.encodePacked(seed, nonce)));
        return hash % 78;
    }

    /**
     * @dev Resolve a single round of combat
     */
    function _resolveRound(uint256 pCardId, uint256 eCardId) private pure returns (uint256 pDmg, uint256 eDmg, uint256 pHeal, uint256 eHeal) {
        bool pIsMajor = pCardId < 22;
        bool eIsMajor = eCardId < 22;

        if (pIsMajor && eIsMajor) {
            // Both major - special clash resolution
            return _resolveMajorClash(pCardId, eCardId);
        } else if (pIsMajor) {
            // Player major vs enemy minor
            return _resolveMajorVsMinor(pCardId, eCardId, true);
        } else if (eIsMajor) {
            // Enemy major vs player minor
            // _resolveMajorVsMinor already handles perspective via majorIsPlayer flag
            return _resolveMajorVsMinor(eCardId, pCardId, false);
        } else {
            // Both minor - standard combat
            return _resolveMinorVsMinor(pCardId, eCardId);
        }
    }

    /**
     * @dev Resolve major arcana clash
     */
    function _resolveMajorClash(uint256 pCardId, uint256 eCardId) private pure returns (uint256 pDmg, uint256 eDmg, uint256 pHeal, uint256 eHeal) {
        // Simplified: random damage between 5-15 for each
        uint256 hash = uint256(keccak256(abi.encodePacked(pCardId, eCardId)));
        pDmg = 5 + (hash % 11); // 5-15
        eDmg = 5 + ((hash >> 8) % 11); // 5-15
        return (pDmg, eDmg, 0, 0);
    }

    /**
     * @dev Resolve major vs minor combat
     */
    function _resolveMajorVsMinor(uint256 majorId, uint256 minorId, bool majorIsPlayer) private pure returns (uint256 pDmg, uint256 eDmg, uint256 pHeal, uint256 eHeal) {
        // Get major arcana effect (simplified mapping)
        uint256 effectType = _getMajorEffect(majorId);

        if (effectType == 0) { // Damage
            uint256 damage = _getMajorValue(majorId);
            if (majorIsPlayer) {
                pDmg = damage;
            } else {
                eDmg = damage;
            }
        } else if (effectType == 1) { // Heal
            uint256 heal = _getMajorValue(majorId);
            if (majorIsPlayer) {
                pHeal = heal;
            } else {
                eHeal = heal;
            }
        }
        // Add minor card retaliation (reduced)
        uint256 minorValue = _getMinorValue(minorId);
        uint256 retaliation = minorValue / 2;
        if (majorIsPlayer) {
            eDmg = retaliation;
        } else {
            pDmg = retaliation;
        }

        return (pDmg, eDmg, pHeal, eHeal);
    }

    /**
     * @dev Resolve minor vs minor combat
     */
    function _resolveMinorVsMinor(uint256 pCardId, uint256 eCardId) private pure returns (uint256 pDmg, uint256 eDmg, uint256 pHeal, uint256 eHeal) {
        uint256 pValue = _getMinorValue(pCardId);
        uint256 eValue = _getMinorValue(eCardId);
        Suit pSuit = _getMinorSuit(pCardId);
        Suit eSuit = _getMinorSuit(eCardId);

        // Element counter
        bool pCounters = _doesCounter(pSuit, eSuit);
        bool eCounters = _doesCounter(eSuit, pSuit);

        if (pCounters) pValue += COUNTER_BONUS;
        if (eCounters) eValue += COUNTER_BONUS;

        // Calculate damage
        if (pValue > eValue) {
            uint256 diff = pValue - eValue;
            pDmg = diff + 2;
            eDmg = 1;
        } else if (eValue > pValue) {
            uint256 diff = eValue - pValue;
            eDmg = diff + 2;
            pDmg = 1;
        } else {
            pDmg = 2;
            eDmg = 2;
        }

        return (pDmg, eDmg, 0, 0);
    }

    /**
     * @dev Get minor arcana value (1-14)
     */
    function _getMinorValue(uint256 cardId) private pure returns (uint256) {
        require(cardId >= 22 && cardId < 78, "Not minor arcana");
        return ((cardId - 22) % 14) + 1;
    }

    /**
     * @dev Get minor arcana suit
     */
    function _getMinorSuit(uint256 cardId) private pure returns (Suit) {
        require(cardId >= 22 && cardId < 78, "Not minor arcana");
        return Suit((cardId - 22) / 14);
    }

    /**
     * @dev Check if suit counters another
     */
    function _doesCounter(Suit attacker, Suit defender) private pure returns (bool) {
        if (attacker == Suit.Wands && defender == Suit.Pentacles) return true;
        if (attacker == Suit.Pentacles && defender == Suit.Swords) return true;
        if (attacker == Suit.Swords && defender == Suit.Cups) return true;
        if (attacker == Suit.Cups && defender == Suit.Wands) return true;
        return false;
    }

    /**
     * @dev Get major arcana effect type (simplified)
     */
    function _getMajorEffect(uint256 cardId) private pure returns (uint256) {
        require(cardId < 22, "Not major arcana");
        // Simplified: alternate between damage and heal
        return cardId % 2;
    }

    /**
     * @dev Get major arcana value (simplified)
     */
    function _getMajorValue(uint256 cardId) private pure returns (uint256) {
        require(cardId < 22, "Not major arcana");
        // Return values between 5-20
        return 5 + (cardId * 3) % 16;
    }

    // ─── Fallback ─────────────────────────────────────────────────────────────

    receive() external payable {}
}