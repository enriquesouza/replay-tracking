#!/usr/bin/env node
/**
 * Pre-flight check: confirms the deployer wallet exists and has enough ETH
 * for a deploy. Exits 0 on success, 1 on failure.
 *
 * Usage: npm run balance:check
 */
require("dotenv").config();
const { ethers } = require("ethers");

(async () => {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("❌ DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(pk, provider);
  const balance = await provider.getBalance(wallet.address);
  const eth = ethers.formatEther(balance);
  const minEth = 0.01;

  console.log(`Wallet:   ${wallet.address}`);
  console.log(`Balance:  ${eth} ETH`);

  if (balance < ethers.parseEther(minEth.toString())) {
    console.error(`❌ Insufficient balance (need at least ${minEth} ETH for deploy + gas)`);
    process.exit(1);
  }
  console.log("✅ Balance check passed");
  process.exit(0);
})();
