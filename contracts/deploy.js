/**
 * Fate's Echo - Quick Deployment Script (VRF v2.5)
 *
 * Copy and paste this into Remix console to deploy quickly
 */

// Sepolia VRF v2.5 Configuration
const VRF_COORDINATOR = "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B";
const KEY_HASH = "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
const CALLBACK_GAS_LIMIT = 100000; // 只需要 100k，因为回调只存储 seed

// Replace with your actual subscription ID (uint256)
const YOUR_SUBSCRIPTION_ID = "92203804540253177398615463812268143329720836751227537635235006783480287060039"; // ⚠️ CHANGE THIS!

// Deployment function
async function deployFateEcho() {
  try {
    console.log("🚀 Deploying Fate's Echo to Sepolia...");

    // Get the contract factory
    const FateEcho = await ethers.getContractFactory("FateEcho");

    // Deploy with VRF parameters
    const fateEcho = await FateEcho.deploy(
      VRF_COORDINATOR,
      YOUR_SUBSCRIPTION_ID,
      KEY_HASH,
      CALLBACK_GAS_LIMIT
    );

    console.log("⏳ Waiting for deployment...");
    await fateEcho.deployed();

    console.log("✅ Fate's Echo deployed successfully!");
    console.log("📍 Contract Address:", fateEcho.address);
    console.log("🔗 Sepolia Explorer:", `https://sepolia.etherscan.io/address/${fateEcho.address}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const owner = await fateEcho.owner();
    console.log("👑 Owner:", owner);

    const stats = await fateEcho.getStats();
    console.log("📊 Initial Stats:", {
      volume: ethers.utils.formatEther(stats.volume),
      payouts: ethers.utils.formatEther(stats.payouts),
      balance: ethers.utils.formatEther(stats.balance)
    });

    return fateEcho.address;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Run deployment
deployFateEcho()
  .then(address => {
    console.log("\n🎉 Deployment complete! Contract address:", address);
    console.log("📋 Next steps:");
    console.log("1. Fund your VRF subscription with LINK tokens");
    console.log("2. Copy the contract address to your frontend config");
    console.log("3. Test a game with a small bet");
  })
  .catch(console.error);