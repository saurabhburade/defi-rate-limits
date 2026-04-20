import { JsonRpcProvider, formatEther } from "ethers";
import QRCode from "qrcode";
import { NETWORKS, decryptConfiguredWallet } from "./common.mjs";

async function main() {
  let wallet;
  try {
    wallet = await decryptConfiguredWallet();
  } catch (error) {
    console.log(error.message);
    return;
  }

  const address = wallet.address;
  console.log(await QRCode.toString(address, { type: "terminal", small: true }));
  console.log("Public address:", address, "\n");

  for (const [networkName, network] of Object.entries(NETWORKS)) {
    try {
      const provider = new JsonRpcProvider(network.rpcUrl);
      await provider._detectNetwork();
      const balance = await provider.getBalance(address);
      console.log(`-- ${networkName} --`);
      console.log("   balance:", formatEther(balance));
      console.log("   nonce:", await provider.getTransactionCount(address));
    } catch {
      console.log(`Can't connect to network ${networkName}`);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
