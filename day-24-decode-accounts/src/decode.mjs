import {
  createSolanaRpc,
  address,
  getBase64Encoder,
  getBase16Decoder,
  getBase58Decoder,
} from "@solana/kit";

import { getMintDecoder } from "@solana-program/token";

const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");

// Wrapped SOL mint address
const mintAddress = address("So11111111111111111111111111111111111111112");

const { value: accountInfo } = await rpc
  .getAccountInfo(mintAddress, { encoding: "base64" })
  .send();

// `data` arrives as a [base64String, "base64"] tuple. Convert the string back into the raw 82 bytes.
const dataBytes = getBase64Encoder().encode(accountInfo.data[0]);

console.log("Owner program:", accountInfo.owner);
console.log("Data length:", dataBytes.length, "bytes");
console.log("Raw data (hex):", getBase16Decoder().decode(dataBytes));

// The Mint decoder knows exactly how the Token Program structures mint accounts.
// This is the ergonomic path: one decoder call turns raw bytes into a structured object.
const mintDecoder = getMintDecoder();
const mint = mintDecoder.decode(dataBytes);

console.log("\n--- Decoded Mint Account ---");

console.log(
  "Mint Authority:",
  mint.mintAuthority.__option === "Some" ? mint.mintAuthority.value : "None"
);

console.log("Supply:", mint.supply.toString());
console.log("Decimals:", mint.decimals);
console.log("Is Initialized:", mint.isInitialized);

console.log(
  "Freeze Authority:",
  mint.freezeAuthority.__option === "Some" ? mint.freezeAuthority.value : "None"
);

console.log("\n--- Manual Byte-Level Decode ---");

// DataView lets you read multi-byte values from a Uint8Array.
// The Token Mint account stores u32 and u64 values, so reading one byte at a time
// is not enough.
const view = new DataView(
  dataBytes.buffer,
  dataBytes.byteOffset,
  dataBytes.byteLength
);

const base58Decoder = getBase58Decoder();

const hasMintAuthority = view.getUint32(0, true) === 1;
console.log("Has Mint Authority:", hasMintAuthority);

if (hasMintAuthority) {
  const authorityBytes = dataBytes.slice(4, 36);
  console.log("Mint Authority:", base58Decoder.decode(authorityBytes));
}

const supply = view.getBigUint64(36, true);
console.log("Supply (raw):", supply.toString());

const decimals = view.getUint8(44);
console.log("Decimals:", decimals);

console.log(
  "Human-readable supply:",
  Number(supply) / Math.pow(10, decimals)
);

const isInitialized = view.getUint8(45) === 1;
console.log("Is Initialized:", isInitialized);

const parsed = await rpc
  .getAccountInfo(mintAddress, { encoding: "jsonParsed" })
  .send();

console.log("\n--- RPC jsonParsed Result ---");

// The RPC parses known account types server-side.
// For an SPL Token mint account, the decoded fields live at:
// parsed.value.data.parsed
console.log(JSON.stringify(parsed.value.data.parsed, null, 2));