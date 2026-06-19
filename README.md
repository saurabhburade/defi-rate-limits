# DeFi Rate Limit

Foundry + Anvil project for comparing two onchain rate-limiting models:

- `BucketedRateLimiter`: strict rolling one-hour cap using six 10-minute buckets
- `TokenBucketRateLimiter`: burst-cap model with continuous per-second refill

The frontend includes:

- a comparison page at `/`
- a contract playground at `/playground`

## Stack

- Smart contracts: Foundry
- Local chain: Anvil
- Frontend: Next.js App Router + Wagmi + Viem + RainbowKit
- Deploy artifact sync: Foundry deployments -> `packages/nextjs/contracts/deployedContracts.ts`

This repository no longer uses Hardhat.

## Repo Layout

- `packages/foundry/contracts/`: rate limiter contracts
- `packages/foundry/script/`: Forge deployment scripts
- `packages/foundry/scripts/`: deploy, verify, account, and artifact-sync helpers
- `packages/foundry/test/`: Forge tests
- `packages/foundry/deployments/`: synced deployment manifests
- `packages/nextjs/`: frontend app

## Local Development

Requirements:

- Node `>= 20.18.3`
- Yarn
- Foundry / Anvil

Run these in separate terminals:

```bash
yarn chain
yarn deploy
yarn start
```

Then open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
yarn compile
yarn test
yarn lint
yarn format
yarn next:build
yarn next:check-types
```

## Contracts

### `BucketedRateLimiter`

- Fixed policy: `1 hour = 6 buckets x 10 minutes`
- Keeps bounded storage by rotating six slots
- Rejects borrows that exceed the live rolling-window remainder

Key reads:

- `windowUsage()`
- `remainingCapacity()`
- `recentBuckets()`
- `previewBorrow(uint256)`

### `TokenBucketRateLimiter`

- Maintains a burst ceiling with continuous refill
- `capacity` is the last stored sample
- `lastUpdate` is a Unix timestamp in seconds
- live availability is computed from `capacity + elapsed * refillRate`, capped by `maxCapacity`

Key reads:

- `availableCapacity()`
- `secondsUntilAvailable(uint256)`
- `secondsUntilFull()`
- `previewBorrow(uint256)`

## Deployments

Deployment manifests currently exist for:

- `sepolia`
- `baseSepolia`

Contracts are synced into:

- `packages/foundry/deployments/<network>/`
- `packages/nextjs/contracts/deployedContracts.ts`

Deploy to a configured network:

```bash
yarn deploy --network sepolia
yarn deploy --network baseSepolia
```

Verify deployed contracts:

```bash
yarn verify --network sepolia
yarn verify --network baseSepolia
```

`ETHERSCAN_V2_API_KEY` is required for verification.

## Environment

This repo reads env from the root `.env` and `packages/foundry/.env`.

Common variables:

```bash
ALCHEMY_API_KEY=...
BASE_SEPOLIA_RPC_URL=...
DEPLOYER_PRIVATE_KEY=0x...
# or DEPLOYER_PRIVATE_KEY_ENCRYPTED=...
ETHERSCAN_V2_API_KEY=...
NEXT_PUBLIC_ALCHEMY_API_KEY=...
NEXT_PUBLIC_SEPOLIA_RPC_URL=...
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
```

Account helpers:

```bash
yarn generate
yarn account
yarn account:import
yarn account:reveal-pk
```

## Current Readiness

What is in place:

- Foundry-only contract workflow
- Anvil-only local workflow
- Synced frontend ABI/address wiring
- Forge test coverage for both limiter models
- NatSpec and audit-readiness documentation on contracts
- Verification scripts for `sepolia`, `base`, and `baseSepolia`

What still depends on runtime credentials or external execution:

- live explorer verification
- fresh deploy-and-verify smoke runs on testnets

## Notes

- The block explorer and faucet are local Anvil features, not public-network features.
- `yarn next:check-types` now runs `next typegen` first, so it works from a clean checkout.
- If you change contracts, rerun `yarn deploy` to regenerate frontend deployment metadata.
