import { DEFAULT_ALCHEMY_API_KEY, spawnCommand } from "./common.mjs";

async function main() {
  const alchemyApiKey = process.env.ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY;
  const forkUrl =
    process.env.MAINNET_FORK_RPC_URL ||
    process.env.MAINNET_RPC_URL ||
    `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;

  await spawnCommand("anvil", ["--host", "0.0.0.0", "--port", "8545", "--chain-id", "31337", "--fork-url", forkUrl]);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
