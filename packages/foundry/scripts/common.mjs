import * as fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PACKAGE_DIR = path.resolve(__dirname, "..");
export const REPO_DIR = path.resolve(PACKAGE_DIR, "../..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(PACKAGE_DIR, ".env"));
loadEnvFile(path.join(REPO_DIR, ".env"));

export const DEFAULT_ALCHEMY_API_KEY = "cR4WnXePioePZ5fFrnSiR";
export const DEFAULT_ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const alchemyApiKey = process.env.ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY;

export const NETWORKS = {
  localhost: {
    chainId: 31337,
    rpcUrl: process.env.LOCALHOST_RPC_URL || "http://127.0.0.1:8545",
  },
  mainnet: {
    chainId: 1,
    rpcUrl: "https://mainnet.rpc.buidlguidl.com",
    verifierUrl: "https://api.etherscan.io/api",
  },
  sepolia: {
    chainId: 11155111,
    rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
    verifierUrl: "https://api-sepolia.etherscan.io/api",
  },
  arbitrum: {
    chainId: 42161,
    rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  },
  arbitrumSepolia: {
    chainId: 421614,
    rpcUrl: `https://arb-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
  },
  optimism: {
    chainId: 10,
    rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  },
  optimismSepolia: {
    chainId: 11155420,
    rpcUrl: `https://opt-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
  },
  polygon: {
    chainId: 137,
    rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  },
  polygonAmoy: {
    chainId: 80002,
    rpcUrl: `https://polygon-amoy.g.alchemy.com/v2/${alchemyApiKey}`,
  },
  polygonZkEvm: {
    chainId: 1101,
    rpcUrl: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  },
  polygonZkEvmCardona: {
    chainId: 2442,
    rpcUrl: `https://polygonzkevm-cardona.g.alchemy.com/v2/${alchemyApiKey}`,
  },
  gnosis: {
    chainId: 100,
    rpcUrl: "https://rpc.gnosischain.com",
  },
  chiado: {
    chainId: 10200,
    rpcUrl: "https://rpc.chiadochain.net",
  },
  base: {
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    verifierUrl: "https://api.basescan.org/api",
  },
  baseSepolia: {
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || process.env.RPC_URL || "https://sepolia.base.org",
    verifierUrl: "https://api-sepolia.basescan.org/api",
  },
  scrollSepolia: {
    chainId: 534351,
    rpcUrl: "https://sepolia-rpc.scroll.io",
  },
  scroll: {
    chainId: 534352,
    rpcUrl: "https://rpc.scroll.io",
  },
  celo: {
    chainId: 42220,
    rpcUrl: "https://forno.celo.org",
  },
  celoSepolia: {
    chainId: 11142220,
    rpcUrl: "https://forno.celo-sepolia.celo-testnet.org/",
  },
};

export function parseArgs(argv) {
  const options = { _: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        options[arg.slice(2)] = true;
      } else {
        options[arg.slice(2)] = next;
        i += 1;
      }
      continue;
    }

    options._.push(arg);
  }

  return options;
}

export function getNetworkConfig(networkName = "localhost") {
  const config = NETWORKS[networkName];
  if (!config) {
    const available = Object.keys(NETWORKS).join(", ");
    throw new Error(`Unknown network "${networkName}". Available networks: ${available}`);
  }
  return { name: networkName, ...config };
}

export async function resolvePrivateKey(networkName) {
  const [{ Wallet }, { default: password }] = await Promise.all([import("ethers"), import("@inquirer/password")]);

  if (networkName === "localhost") {
    return process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY || DEFAULT_ANVIL_PRIVATE_KEY;
  }

  const directPrivateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (directPrivateKey) {
    return directPrivateKey;
  }

  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;
  if (!encryptedKey) {
    throw new Error("No deployer key found. Run `yarn generate` or `yarn account:import` first.");
  }

  const pass = await password({ message: "Enter password to decrypt private key:" });
  try {
    const wallet = await Wallet.fromEncryptedJson(encryptedKey, pass);
    return wallet.privateKey;
  } catch {
    throw new Error("Failed to decrypt private key. Wrong password?");
  }
}

export async function decryptConfiguredWallet() {
  const [{ Wallet }, { default: password }] = await Promise.all([import("ethers"), import("@inquirer/password")]);
  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;
  if (!encryptedKey) {
    throw new Error("You don't have a deployer account. Run `yarn generate` or `yarn account:import` first");
  }

  const pass = await password({ message: "Enter your password to decrypt the private key:" });
  try {
    return await Wallet.fromEncryptedJson(encryptedKey, pass);
  } catch {
    throw new Error("Failed to decrypt private key. Wrong password?");
  }
}

export function spawnCommand(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: PACKAGE_DIR,
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
      shell: process.platform === "win32",
    });

    child.on("exit", code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? 1}`));
    });

    child.on("error", reject);
  });
}
