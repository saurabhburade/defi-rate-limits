import { parseArgs, getNetworkConfig, resolvePrivateKey, spawnCommand } from "./common.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const networkName = args.network || "localhost";
  const network = getNetworkConfig(networkName);
  const privateKey = await resolvePrivateKey(networkName);

  const forgeArgs = [
    "script",
    "script/Deploy.s.sol:DeployScript",
    "--rpc-url",
    network.rpcUrl,
    "--broadcast",
    "--private-key",
    privateKey,
  ];

  if (args["skip-simulation"]) {
    forgeArgs.push("--skip-simulation");
  }

  await spawnCommand("forge", forgeArgs);
  await spawnCommand("node", ["scripts/syncDeployments.mjs", "--network", network.name, "--chain-id", String(network.chainId)]);
  await spawnCommand("node", ["scripts/generateTsAbis.mjs"]);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
