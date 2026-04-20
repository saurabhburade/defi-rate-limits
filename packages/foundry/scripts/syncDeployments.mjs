import * as fs from "fs";
import path from "path";
import { PACKAGE_DIR, parseArgs } from "./common.mjs";

const OUT_DIR = path.join(PACKAGE_DIR, "out");
const DEPLOYMENTS_DIR = path.join(PACKAGE_DIR, "deployments");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getArtifact(contractName) {
  const artifactPath = path.join(OUT_DIR, `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found for ${contractName} at ${artifactPath}`);
  }
  return readJson(artifactPath);
}

function normalizeReceipt(receipt) {
  if (!receipt) {
    return undefined;
  }

  const blockNumber =
    typeof receipt.blockNumber === "string"
      ? receipt.blockNumber.startsWith("0x")
        ? Number.parseInt(receipt.blockNumber, 16)
        : Number(receipt.blockNumber)
      : receipt.blockNumber;

  return {
    ...receipt,
    blockNumber,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const networkName = args.network;
  const chainId = args["chain-id"];

  if (!networkName || !chainId) {
    throw new Error("syncDeployments requires --network and --chain-id");
  }

  const broadcastPath = path.join(PACKAGE_DIR, "broadcast", "Deploy.s.sol", String(chainId), "run-latest.json");
  if (!fs.existsSync(broadcastPath)) {
    throw new Error(`Broadcast file not found at ${broadcastPath}`);
  }

  const broadcast = readJson(broadcastPath);
  const targetDir = path.join(DEPLOYMENTS_DIR, networkName);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, ".chainId"), `${chainId}\n`);

  const receiptsByHash = new Map(
    (broadcast.receipts || []).map(receipt => [String(receipt.transactionHash || "").toLowerCase(), normalizeReceipt(receipt)]),
  );

  for (const transaction of broadcast.transactions || []) {
    const transactionType = String(transaction.transactionType || "").toUpperCase();
    if (!transaction.contractName || !transaction.contractAddress || !transactionType.includes("CREATE")) {
      continue;
    }

    const artifact = getArtifact(transaction.contractName);
    const transactionHash = String(transaction.hash || transaction.transactionHash || "").toLowerCase();
    const receipt = receiptsByHash.get(transactionHash);

    const deployment = {
      address: transaction.contractAddress,
      abi: artifact.abi,
      args: transaction.arguments || [],
      bytecode: artifact.bytecode?.object || artifact.bytecode,
      contractName: transaction.contractName,
      deployedBytecode: artifact.deployedBytecode?.object || artifact.deployedBytecode,
      metadata: artifact.metadata,
      receipt,
      sourceName: artifact.ast?.absolutePath || `contracts/${transaction.contractName}.sol`,
      transactionHash: transaction.hash || transaction.transactionHash,
    };

    fs.writeFileSync(
      path.join(targetDir, `${transaction.contractName}.json`),
      `${JSON.stringify(deployment, null, 2)}\n`,
    );
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
