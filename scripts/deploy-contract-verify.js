#!/usr/bin/env node
/**
 * Deploys the contract and immediately submits the source for verification
 * on Etherscan/Blockscout. Requires `ETHERSCAN_API_KEY` and `CONTRACT_ADDRESS`
 * (or the freshly-deployed address).
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... RPC_URL=https://... npm run deploy:verify
 */
require("dotenv").config();
const { ethers, run, network } = require("hardhat");

(async () => {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY is required");
  }
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const Factory = await ethers.getContractFactory("ReplayTrackingContractV3");
  const contract = await Factory.deploy(deployer.address);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`Deployed: ${address}`);

  console.log("Waiting for 5 block confirmations before verifying...");
  await contract.deploymentTransaction().wait(5);

  console.log("Submitting source for verification...");
  try {
    await run("verify:verify", {
      address,
      constructorArguments: [deployer.address],
    });
    console.log("✅ Verified");
  } catch (err) {
    if (err.message.includes("Already Verified")) {
      console.log("✅ Already verified");
    } else {
      console.error("❌ Verification failed:", err.message);
      process.exit(1);
    }
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
