import { createSolanaRpc, devnet, createKeyPairSignerFromBytes, generateKeyPairSigner, getBase58Codec, } from "@solana/kit"; import { readFile, writeFile } from "node:fs/promises";
const WALLET_FILE = "wallet.json";
const RPC_URL = "https://api.devnet.solana.com";

function createRpcClient() {
    return createSolanaRpc(devnet(RPC_URL));
}

async function readWalletFile() {
    const data = await readFile(WALLET_FILE, "utf-8");
    return JSON.parse(data);
}

///secretKeyBytes: Uint8Array
async function writeWalletFile(secretKeyBytes) {
    await writeFile(
        WALLET_FILE,
        JSON.stringify({ secretKey: Array.from(secretKeyBytes) })
    )
}

///exportKeypairBytes(wallet: KeyPairSigner<string>): Promise<Uint8Array>
async function exportKeyPairBytes(wallet) {

    const pkcs8Buffer = await crypto.subtle.exportKey("pkcs8", wallet.keyPair.privateKey);
    const privateKeyBytes = new Uint8Array(
        pkcs8Buffer.slice(-32)
    );

    const publicKeyBytes = new Uint8Array(
        await crypto.subtle.exportKey("raw", wallet.keyPair.publicKey)
    );

    const keyPairBytes = new Uint8Array(64);
    keyPairBytes.set(privateKeyBytes, 0);
    keyPairBytes.set(publicKeyBytes, 32);

    return keyPairBytes;
}

async function createWallet() {
    const wallet = await generateKeyPairSigner({ extractable: true });
    const keyPairBytes = await exportKeyPairBytes(wallet);

    await writeWalletFile(keyPairBytes);

    console.log("Created new wallet : ", wallet.address);
    return wallet;
}

async function loadWallet() {
    const data = await readWalletFile();

    const secretBytes = new Uint8Array(data.secretKey);

    const wallet = await createKeyPairSignerFromBytes(secretBytes);

    console.log("Loaded existing wallet: ", wallet.address);
    return wallet;
}

async function loadOrCreateWallet() {
    try {
        return await loadWallet();
    } catch {
        return await createWallet();
    }
}

async function getBalanceInSol(rpc, address) {
    const { value } = await rpc.getBalance(address).send();
    return Number(value) / 1_000_000_000;
}

async function main() {
    const rpc = createRpcClient();
    const wallet = await loadOrCreateWallet();

    const balance = await getBalanceInSol(rpc, wallet.address);

    console.log(`Address: ${wallet.address}`);
    console.log(`Balance: ${balance} SOL`);

    if (balance === 0) {
        console.log("No SOL found. Airdrop from faucet:");
        console.log("https://faucet.solana.com/");
        console.log(wallet.address);
    }
}

await main();