# Runbook

## Common incidents

### "API returns 503 contract_not_configured"

`CONTRACT_ADDRESS` is not set in the environment. Either set it or restart the
service after a deploy.

```bash
echo "CONTRACT_ADDRESS=0x..." >> .env
npm start
```

### "All endpoints return 401 Unauthorized in production"

The `X-Api-Key` header is missing or wrong. Verify:

```bash
grep '^X_API_KEY=' .env
curl -H "X-Api-Key: $X_API_KEY" http://localhost:3000/health
```

### "Hardhat test runs out of gas"

Default block gas limit is 30M. For tests that push past that, raise it via
the network config:

```js
// hardhat.config.js
networks: {
  hardhat: { hardfork: "osaka", blockGasLimit: 60_000_000 }
}
```

### "Anvil is already running on 8545"

```bash
lsof -i :8545
# or
pkill -f anvil
pkill -f "hardhat node"
```

### "Forge build complains about libusb"

This is a benign warning from `foundryup`. Hardware-wallet integration requires
`brew install libusb`. Not needed for normal dev.

### "Deployer wallet has no ETH"

```bash
npm run balance:check
# Fund the wallet printed in the output, then:
npm run deploy:prod
```

## Restarting services

```bash
# API
pkill -f "node index.js" || true
npm start

# Local node
pkill -f anvil || true
npm run node:anvil

# Or hardhat
pkill -f "hardhat node" || true
npm run node:hardhat
```

## Verification

After any change, run the full local CI:

```bash
bash scripts/check-all.sh
```
