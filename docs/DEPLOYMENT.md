# Deployment

## Pre-flight checklist

- [ ] `.env` is set (use `.env.example` as a template)
- [ ] `DEPLOYER_PRIVATE_KEY` is funded with enough ETH for gas
- [ ] The chosen chain's RPC is reachable: `npm run health:rpc`
- [ ] `CONTRACT_ADDRESS` is empty (we're about to deploy) or set to a known-good address
- [ ] All tests pass: `npm run test:contracts`

## Deploy to local

```bash
# Terminal 1
npm run node:anvil

# Terminal 2
npm run deploy:anvil
# → prints the deployed address
```

## Deploy to Camp Network testnet

```bash
export CAMP_RPC_URL=https://rpc.camp-network-testnet.gelato.digital
export DEPLOYER_PRIVATE_KEY=0x...
npm run balance:check
npm run deploy:prod
```

## Deploy + verify in one step

```bash
export ETHERSCAN_API_KEY=...
export DEPLOYER_PRIVATE_KEY=0x...
npm run deploy:verify
```

## Wiring the API

After deploying, set `CONTRACT_ADDRESS` in `.env` and restart the API:

```bash
echo "CONTRACT_ADDRESS=0xDEPLOYED_ADDRESS" >> .env
npm start
```

## Production hardening

1. **Use a multi-sig for the deployer wallet.** Gnosis Safe is recommended.
2. **Use a managed RPC** (Alchemy, Infura, QuickNode) instead of a public endpoint.
3. **Run behind HTTPS** (Caddy, nginx, or a managed LB).
4. **Set `TRUST_PROXY=true`** so `X-Forwarded-For` is honored.
5. **Pin CORS origins**: `CORS_ALLOWED_ORIGINS=https://app.example.com`.
6. **Set `NODE_ENV=production`** so the dev-mode auth bypass is disabled.
7. **Rotate `X_API_KEY` and `JWT_SECRET` regularly.**
8. **Subscribe to GitHub Dependabot for security alerts.**

## Docker

```bash
docker build -t replay-tracking .
docker run -p 3000:3000 --env-file .env replay-tracking
```
