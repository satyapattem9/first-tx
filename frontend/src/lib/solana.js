// Devnet connection and transaction helpers (@solana/web3.js).
import {
  Connection, PublicKey, SystemProgram, Transaction, clusterApiUrl, LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { getPhantom } from "./phantom";

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Read the devnet balance for an address
export async function getBalanceLamports(address) {
  return connection.getBalance(new PublicKey(address));
}

// Build an unsigned SystemProgram transfer
export async function buildTransfer(from, to, lamports) {
  const fromKey = new PublicKey(from);
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: fromKey, toPubkey: new PublicKey(to), lamports })
  );
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = fromKey;
  return tx;
}

// Estimated fee for the review panel
export async function estimateFeeLamports(tx) {
  const { value } = await connection.getFeeForMessage(tx.compileMessage());
  return value ?? 5000; // a simple transfer is 5000 lamports
}

// Phantom signs, we submit via our devnet connection; return signature
export async function signAndSend(tx) {
  const phantom = getPhantom();
  if (!phantom) throw new Error("Phantom isn't installed in this browser.");
  const signed = await phantom.signTransaction(tx); // opens the Phantom approve popup
  return connection.sendRawTransaction(signed.serialize());
}

// Wait until the tx is confirmed; throw if it failed
export async function waitForConfirmation(signature) {
  for (let i = 0; i < 30; i++) {
    const { value } = await connection.getSignatureStatuses([signature]);
    const status = value[0];
    if (status?.err) throw new Error("Transaction failed on chain: " + JSON.stringify(status.err));
    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
      return status;
    }
    await new Promise((r) => setTimeout(r, 1000)); // check once a second
  }
  throw new Error("Timed out waiting for confirmation. Check the explorer.");
}

// Small helpers for the UI
export function lamportsToSol(lamports) {
  return lamports / LAMPORTS_PER_SOL;
}

export function shortAddress(address) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}