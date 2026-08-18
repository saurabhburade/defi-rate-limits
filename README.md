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
- Frontend contract configuration: manually maintained in `web/configs/abis.ts` and `web/configs/contracts.ts`

This repository no longer uses Hardhat.

## Repo Layout

- `contracts/src/`: rate limiter contracts
- `contracts/script/`: Forge deployment scripts
- `contracts/test/`: Forge tests
- `contracts/deployments/`: synced deployment manifests
- `web/`: frontend app

## Local Development

Requirements:

- Node `>= 20.18.3`
- pnpm 9
- Foundry / Anvil

Run these in separate terminals:

```bash
pnpm chain
pnpm start
```

Then open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
pnpm compile
pnpm test
pnpm lint
pnpm format
pnpm web:build
pnpm web:check-types
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

Historical deployment manifests are stored in:

- `contracts/deployments/<network>/`

Frontend ABIs and addresses are maintained manually in:

- `web/configs/abis.ts`
- `web/configs/contracts.ts`

The repository retains a native Forge deployment script at `contracts/script/Deploy.s.sol`. Run deployment and verification directly with the Foundry CLI when needed; automated account, deployment-manifest, and explorer-verification helpers are intentionally not included.

## Environment

Foundry reads contract tooling variables from `contracts/.env`. Next.js variables belong in `web/.env.local`.

Common variables:

```bash
ALCHEMY_API_KEY=...
BASE_SEPOLIA_RPC_URL=...
PRIVATE_KEY=0x...
ETHERSCAN_V2_API_KEY=...
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
```

## Current Readiness

What is in place:

- Foundry-only contract workflow
- Anvil-only local workflow
- Synced frontend ABI/address wiring
- Forge test coverage for both limiter models
- NatSpec and audit-readiness documentation on contracts
- A native Forge deployment script and historical deployment manifests

What still depends on runtime credentials or external execution:

- live explorer verification
- fresh deploy-and-verify smoke runs on testnets

## Notes

- The block explorer and faucet are local Anvil features, not public-network features.
- `pnpm web:check-types` runs `next typegen` first, so it works from a clean checkout.
- If you change contracts, update the manually maintained frontend ABIs and addresses.
