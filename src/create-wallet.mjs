import { address, generateKeyPairSigner, createSolanaRpc, devnet } from "@solana/kit";

const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));
async function create_wallet() {
    const wallet = await generateKeyPairSigner();
    console.log("Your new wallet address:", wallet.address);
}

async function view_balance() {
    const wallet_address = "2Erwf5QzbXwnBVcCoK7HUEN4jXEGmWmf7wL5CC62kdb6";
    const { value: balance } = await rpc.getBalance(address(wallet_address)).send();
    //const { value: balance } = await rpc.getBalance(wallet.address).send();
    const balanceInSol = Number(balance) / 1_000_000_000;

    console.log(`Balance of wallet address ${wallet_address}: ${balanceInSol} SOL`);
}

//create_wallet()
view_balance();