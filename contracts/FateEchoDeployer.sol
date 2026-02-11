// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FateEcho.sol";

/**
 * @title FateEcho Deployment Helper
 * @notice Helper contract for deploying FateEcho with correct VRF v2.5 parameters
 * @dev 仅供参考，建议直接在 Remix 部署 FateEcho.sol
 */
contract FateEchoDeployer {
    // Sepolia Testnet VRF v2.5 Configuration
    address constant VRF_COORDINATOR = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
    bytes32 constant KEY_HASH = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 constant CALLBACK_GAS_LIMIT = 100000; // 降低到 100k，只存储 seed

    /**
     * @notice Deploy a new FateEcho contract
     * @param subscriptionId Your Chainlink VRF subscription ID (uint256)
     */
    function deployFateEcho(uint256 subscriptionId) external returns (address) {
        FateEcho fateEcho = new FateEcho(
            VRF_COORDINATOR,
            subscriptionId,
            KEY_HASH,
            CALLBACK_GAS_LIMIT
        );

        return address(fateEcho);
    }
}