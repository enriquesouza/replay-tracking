# Makefile — shortcut aliases for the replay-tracking toolchain.
# See README.md for full documentation.

.PHONY: help install compile test test-contracts lint format audit run node-hardhat node-anvil deploy-local deploy-prod clean

help:
	@echo "Available targets:"
	@echo "  install         npm install"
	@echo "  compile         npx hardhat compile"
	@echo "  test            vitest run (Fastify endpoint tests)"
	@echo "  test-contracts  npx hardhat test (mocha contract tests)"
	@echo "  lint            solhint + eslint"
	@echo "  format          prettier --write"
	@echo "  audit           npm audit --audit-level=moderate"
	@echo "  run             node index.js"
	@echo "  node-hardhat    npx hardhat node"
	@echo "  node-anvil      anvil"
	@echo "  deploy-local    node scripts/deploy-contract-local.js"
	@echo "  deploy-prod     node scripts/deploy-contract-prod.js"
	@echo "  clean           rm -rf node_modules artifacts cache out"

install:
	npm install

compile:
	npx hardhat compile

test:
	npm test

test-contracts:
	npm run test:contracts

lint:
	npm run lint

format:
	npm run format

audit:
	npm run audit

run:
	node index.js

node-hardhat:
	npx hardhat node

node-anvil:
	anvil

deploy-local:
	node scripts/deploy-contract-local.js

deploy-prod:
	node scripts/deploy-contract-prod.js

clean:
	rm -rf node_modules artifacts cache out coverage typechain-types
