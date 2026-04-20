import * as fs from "fs";
import path from "path";
import { AbiCoder } from "ethers";
import { fileURLToPath } from "url";
import { getNetworkConfig, parseArgs, spawnCommand } from "./common.mjs";

const DEPLOYMENTS_DIR = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "deployments"));

function readDeployment(networkName, contractName) {
  const filePath = path.join(DEPLOYMENTS_DIR, networkName, `${contractName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Deployment file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getConstructorArgsHex(abi, args = []) {
  const constructorAbi = abi.find(entry => entry.type === "constructor");
  if (!constructorAbi?.inputs?.length) {
    return undefined;
  }

  const types = constructorAbi.inputs.map(input => input.type);
  return AbiCoder.defaultAbiCoder().encode(types, args);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const networkName = args.network || "baseSepolia";
  const network = getNetworkConfig(networkName);

  if (!network.verifierUrl) {
    throw new Error(`Verification is not configured for network "${networkName}"`);
  }

  if (!process.env.ETHERSCAN_V2_API_KEY) {
    throw new Error("ETHERSCAN_V2_API_KEY is required for verification");
  }

  console.log(`Verifying deployed contracts on ${networkName} (${network.chainId})`);
  for (const contractName of ["BucketedRateLimiter", "TokenBucketRateLimiter"]) {
    const deployment = readDeployment(networkName, contractName);
    const constructorArgs = getConstructorArgsHex(deployment.abi, deployment.args);
    console.log(`- ${contractName} at ${deployment.address}`);

    const forgeArgs = [
      "verify-contract",
      deployment.address,
      `contracts/${contractName}.sol:${contractName}`,
      "--chain-id",
      String(network.chainId),
      "--verifier-url",
      network.verifierUrl,
      "--etherscan-api-key",
      process.env.ETHERSCAN_V2_API_KEY,
      "--watch",
    ];

    if (constructorArgs) {
      forgeArgs.push("--constructor-args", constructorArgs);
    }

    await spawnCommand("forge", forgeArgs);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
