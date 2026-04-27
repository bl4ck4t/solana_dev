import { createSolanaRpc, devnet, address } from "@solana/kit";

const WALLET_ADDRESS = "2Erwf5QzbXwnBVcCoK7HUEN4jXEGmWmf7wL5CC62kdb6";

async function getBalance(walletAddress) {
  try {
    const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));
    const targetAddress = address(walletAddress);

    const { value: lamports } = await rpc.getBalance(targetAddress).send();

    return {
      address: targetAddress,
      lamports,
      sol: Number(lamports) / 1_000_000_000,
    };
  } catch (error) {
    throw new Error(`Failed to fetch balance: ${error.message}`);
  }
}

async function main() {
  try {
    const { address, lamports, sol } = await getBalance(WALLET_ADDRESS);

    console.log(`Wallet: ${address}`);
    console.log(`Lamports: ${lamports}`);
    console.log(`SOL:      ${sol}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

main();