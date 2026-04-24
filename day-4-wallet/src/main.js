import { createSolanaRpc, devnet, address } from "@solana/kit";
import { getWallets } from "@wallet-standard/app";

const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

const walletListDiv = document.getElementById("wallet-list");
const connectedDiv = document.getElementById("connected");
const statusDiv = document.getElementById("status");
const errorDiv = document.getElementById("error");

let connectedWallet = null;

function isSolanaWallet(wallet) {
  return wallet.chains?.some((chain) => chain.startsWith("solana:"));
}

function renderWalletList(wallets) {
  const solanaWallets = wallets.filter(isSolanaWallet);

  if (solanaWallets.length === 0) {
    walletListDiv.innerHTML = `
      <div class="no-wallets"> 
        No Solana wallets found.<br> 
        Install <a href="https://phantom.app" target="_blank">Phantom</a> or another Solana wallet to continue. 
      </div>`;
    statusDiv.textContent = "";
    return;
  }

  statusDiv.textContent = `Found ${solanaWallets.length} wallet(s):`;
  walletListDiv.innerHTML = "";

  for (const wallet of solanaWallets) {
    const btn = document.createElement("button");
    btn.className = "wallet-btn";
    const icon = wallet.icon;
    // Fixed: Template literals and proper HTML tags
    btn.innerHTML = icon
      ? `<img src="${icon}" alt="" style="width:20px; vertical-align:middle;"/> ${wallet.name}`
      : wallet.name;
    btn.addEventListener("click", () => connectWallet(wallet));
    walletListDiv.appendChild(btn);
  }
}

async function connectWallet(wallet) {
  errorDiv.textContent = "";
  const connectFeature = wallet.features["standard:connect"];
  if (!connectFeature) {
    errorDiv.textContent = "This wallet doesn't support connecting.";
    return;
  }

  try {
    statusDiv.textContent = "Requesting connection…";
    const { accounts } = await connectFeature.connect();

    if (accounts.length === 0) {
      errorDiv.textContent = "No accounts returned. Did you reject the request?";
      statusDiv.textContent = "";
      return;
    }

    connectedWallet = wallet;
    const account = accounts[0];
    const walletAddress = account.address;

    const { value: balanceInLamports } = await rpc.getBalance(address(walletAddress)).send();
    const balanceInSol = (Number(balanceInLamports) / 1_000_000_000).toFixed(9);

    walletListDiv.style.display = "none";
    statusDiv.textContent = "";
    connectedDiv.style.display = "block";
    
    // Fixed: Proper template literals
    connectedDiv.innerHTML = `
      <h3>Connected to ${wallet.name}</h3>
      <div class="address">${walletAddress}</div>
      <div class="balance">${balanceInSol} SOL</div>
      <button class="disconnect-btn" id="disconnectBtn">Disconnect</button>`;

    document
      .getElementById("disconnectBtn")
      .addEventListener("click", () => disconnectWallet(wallet));
  } catch (err) {
    errorDiv.textContent = `Connection failed: ${err.message}`;
    statusDiv.textContent = "";
  }
}

async function disconnectWallet(wallet) {
  const disconnectFeature = wallet.features["standard:disconnect"];
  if (disconnectFeature) {
    await disconnectFeature.disconnect();
  }
  connectedWallet = null;
  connectedDiv.style.display = "none";
  walletListDiv.style.display = "block";
  statusDiv.textContent = "Disconnected. Choose a wallet to reconnect:";
}

// Initialize Wallet Standard
const { get, on } = getWallets();
renderWalletList(get());

on("register", () => {
  if (!connectedWallet) {
    renderWalletList(get());
  }
});