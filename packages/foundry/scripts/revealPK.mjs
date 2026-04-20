import { decryptConfiguredWallet } from "./common.mjs";

async function main() {
  console.log("This will reveal your private key on the console.\n");

  try {
    const wallet = await decryptConfiguredWallet();
    console.log("\nPrivate key:", wallet.privateKey);
  } catch (error) {
    console.log(error.message);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
