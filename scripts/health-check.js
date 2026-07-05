#!/usr/bin/env node
/**
 * Pings all configured RPC endpoints and reports latency.
 * Exits 0 if at least one is healthy, 1 otherwise.
 *
 * Usage: npm run health:rpc
 */
const { ethers } = require("ethers");

const endpoints = [
  process.env.RPC_URL,
  process.env.CAMP_RPC_URL,
  process.env.LOCAL_RPC_URL,
  "https://ethereum-rpc.publicnode.com",
  "https://cloudflare-eth.com",
].filter(Boolean);

(async () => {
  let anyHealthy = false;
  for (const url of endpoints) {
    const provider = new ethers.JsonRpcProvider(url);
    const t0 = Date.now();
    try {
      const bn = await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
      ]);
      const ms = Date.now() - t0;
      console.log(`✅ ${url}  block=${bn}  latency=${ms}ms`);
      anyHealthy = true;
    } catch (err) {
      console.log(`❌ ${url}  error=${err.message}`);
    }
  }
  process.exit(anyHealthy ? 0 : 1);
})();
