import { createSolanaRpc, devnet, address } from "@solana/kit";

const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

const addressInput = document.getElementById("addressInput");
const fetchBtn = document.getElementById("fetchBtn");
const resultsDiv = document.getElementById("results");
const errorDiv = document.getElementById("error");
const loadingDiv = document.getElementById("loading");

fetchBtn.addEventListener("click", async () => {
  const input = addressInput.value.trim();

  // Basic validation
  if (!input) {
    errorDiv.textContent = "Please enter a valid address.";
    return;
  }

  errorDiv.textContent = "";
  resultsDiv.innerHTML = "";
  loadingDiv.textContent = "Fetching...";
  fetchBtn.disabled = true;

  try {
    const targetAddress = address(input);

    // Balance
    const { value: balanceInLamports } = await rpc
      .getBalance(targetAddress)
      .send();

    const balanceInSol = Number(balanceInLamports) / 1_000_000_000;

    // Transactions
    const signatures = await rpc
      .getSignaturesForAddress(targetAddress, { limit: 5 })
      .send();

    let html = `<div class="balance">${balanceInSol.toFixed(4)} SOL</div>`;
    html += `<h3>Recent transactions</h3>`;

    if (signatures.length === 0) {
      html += `<p>No transactions found.</p>`;
    }

    for (const tx of signatures) {
      const time = tx.blockTime
        ? new Date(Number(tx.blockTime) * 1000).toLocaleString()
        : "unknown";

      const statusClass = tx.err ? "status failed" : "status";
      const statusText = tx.err ? "Failed" : "Success";

      const explorerUrl = `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`;

      html += `
        <div class="tx">
          <div><strong>Signature:</strong> 
            <a href="${explorerUrl}" target="_blank">
              ${tx.signature}
            </a>
          </div>
          <div><strong>Slot:</strong> ${tx.slot}</div>
          <div><strong>Time:</strong> ${time}</div>
          <div><strong>Status:</strong> 
            <span class="${statusClass}">${statusText}</span>
          </div>
        </div>
      `;
    }

    resultsDiv.innerHTML = html;
  } catch (err) {
    errorDiv.textContent = `Error: ${err.message}`;
  } finally {
    loadingDiv.textContent = "";
    fetchBtn.disabled = false;
  }
});