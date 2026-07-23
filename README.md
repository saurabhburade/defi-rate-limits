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
- Frontend contract configuration: manually maintained in `packages/nextjs/configs/abis.ts` and `contracts.ts`

This repository no longer uses Hardhat.

## Repo Layout

- `packages/foundry/contracts/`: rate limiter contracts
- `packages/foundry/script/`: Forge deployment scripts
- `packages/foundry/scripts/`: deploy, verify, account, and deployment-manifest helpers
- `packages/foundry/test/`: Forge tests
- `packages/foundry/deployments/`: synced deployment manifests
- `packages/nextjs/`: frontend app

## Local Development

Requirements:

- Node `>= 20.18.3`
- pnpm 9
- Foundry / Anvil

Run these in separate terminals:

```bash
pnpm chain
pnpm run deploy
pnpm start
```

Then open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
pnpm compile
pnpm test
pnpm lint
pnpm format
pnpm next:build
pnpm next:check-types
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

Deployment manifests are synced into:

- `packages/foundry/deployments/<network>/`

Frontend ABIs and addresses are maintained manually in:

- `packages/nextjs/configs/abis.ts`
- `packages/nextjs/configs/contracts.ts`

Deploy to a configured network:

```bash
pnpm run deploy --network sepolia
pnpm run deploy --network baseSepolia
```

Verify deployed contracts:

```bash
pnpm verify --network sepolia
pnpm verify --network baseSepolia
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
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
```

Account helpers:

```bash
pnpm generate
pnpm account
pnpm account:import
pnpm account:reveal-pk
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
- `pnpm next:check-types` runs `next typegen` first, so it works from a clean checkout.
- If you change contracts, rerun `pnpm run deploy` to regenerate frontend deployment metadata.
