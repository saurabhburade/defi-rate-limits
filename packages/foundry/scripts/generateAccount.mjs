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

async function setNewEnvConfig(existingEnvConfig = {}) {
  console.log("Generating new wallet\n");
  const randomWallet = Wallet.createRandom();

  const pass = await getValidatedPassword();
  const encryptedJson = await randomWallet.encrypt(pass);

  const newEnvConfig = {
    ...existingEnvConfig,
    DEPLOYER_PRIVATE_KEY_ENCRYPTED: encryptedJson,
  };

  fs.writeFileSync(envFilePath, stringify(newEnvConfig));
  console.log("\nEncrypted private key saved to packages/foundry/.env");
  console.log("Generated wallet address:", randomWallet.address, "\n");
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
