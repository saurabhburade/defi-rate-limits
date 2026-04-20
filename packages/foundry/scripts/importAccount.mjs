import { Wallet } from "ethers";
import { parse, stringify } from "envfile";
import * as fs from "fs";
import password from "@inquirer/password";
import path from "path";
import { PACKAGE_DIR } from "./common.mjs";

const envFilePath = path.join(PACKAGE_DIR, ".env");

async function getValidatedPassword() {
  while (true) {
    const pass = await password({ message: "Enter a password to encrypt your private key:" });
    const confirmation = await password({ message: "Confirm password:" });

    if (pass === confirmation) {
      return pass;
    }
    console.log("Passwords don't match. Please try again.");
  }
}

async function getWalletFromPrivateKey() {
  while (true) {
    const privateKey = await password({ message: "Paste your private key:" });
    try {
      return new Wallet(privateKey);
    } catch {
      console.log("Invalid private key format. Please try again.");
    }
  }
}

async function setNewEnvConfig(existingEnvConfig = {}) {
  console.log("Importing wallet\n");

  const wallet = await getWalletFromPrivateKey();
  const pass = await getValidatedPassword();
  const encryptedJson = await wallet.encrypt(pass);

  const newEnvConfig = {
    ...existingEnvConfig,
    DEPLOYER_PRIVATE_KEY_ENCRYPTED: encryptedJson,
  };

  fs.writeFileSync(envFilePath, stringify(newEnvConfig));
  console.log("\nEncrypted private key saved to packages/foundry/.env");
  console.log("Imported wallet address:", wallet.address, "\n");
  console.log("Remember your password. You'll need it to decrypt the private key.");
}

async function main() {
  if (!fs.existsSync(envFilePath)) {
    await setNewEnvConfig();
    return;
  }

  const existingEnvConfig = parse(fs.readFileSync(envFilePath).toString());
  if (existingEnvConfig.DEPLOYER_PRIVATE_KEY_ENCRYPTED) {
    console.log("You already have a deployer account. Check the packages/foundry/.env file");
    return;
  }

  await setNewEnvConfig(existingEnvConfig);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
