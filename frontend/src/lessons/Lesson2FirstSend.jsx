// Lesson 2: send 0.1 SOL, then the chain grades it.
import { useState } from "react";
import { connectPhantom } from "../lib/phantom";
import {
  connection, buildTransfer, estimateFeeLamports, signAndSend,
  waitForConfirmation, lamportsToSol, shortAddress,
} from "../lib/solana";

const LESSON_WALLET = import.meta.env.VITE_LESSON2_WALLET;
const AMOUNT = 100_000_000; // 0.1 SOL in lamports

// Reads the real transaction from devnet and checks each field.
// Same shape as the backend /verify response, so it can be swapped later.
async function verifyOnChain(signature, from) {
  let tx = null;
  for (let i = 0; i < 5 && !tx; i++) {
    tx = await connection.getParsedTransaction(signature, {
      commitment: "confirmed", maxSupportedTransactionVersion: 0,
    });
    if (!tx) await new Promise((r) => setTimeout(r, 1000));
  }
  const ix = tx?.transaction.message.instructions.find(
    (i) => i.program === "system" && i.parsed?.type === "transfer"
  );
  const info = ix?.parsed?.info || {};
  const checks = [
    { label: "Transaction found on devnet", value: shortAddress(signature), ok: !!tx },
    { label: "From your wallet", value: info.source ? shortAddress(info.source) : "—", ok: info.source === from },
    { label: "To the lesson wallet", value: info.destination ? shortAddress(info.destination) : "—", ok: info.destination === LESSON_WALLET },
    { label: "Amount", value: `${lamportsToSol(info.lamports || 0)} SOL`, ok: info.lamports === AMOUNT },
    { label: "Status", value: tx?.meta?.err ? "failed" : "confirmed", ok: !!tx && tx.meta?.err === null },
  ];
  return { passed: checks.every((c) => c.ok), checks };
}

export default function Lesson2FirstSend({ lesson }) {
  const [address, setAddress] = useState(null);
  const [fee, setFee] = useState(null);
  const [step, setStep] = useState("start"); // start | review | signing | confirming | checking | done
  const [signature, setSignature] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  if (!LESSON_WALLET) {
    return <section><h2>{lesson.title}</h2><p style={{ color: "crimson" }}>Missing VITE_LESSON2_WALLET in frontend/.env (restart npm run dev after adding it).</p></section>;
  }

  async function handleReview() {
    setError("");
    try {
      const addr = await connectPhantom(); // no popup if already connected
      const tx = await buildTransfer(addr, LESSON_WALLET, AMOUNT);
      setFee(await estimateFeeLamports(tx));
      setAddress(addr);
      setStep("review");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSend() {
    setError("");
    try {
      setStep("signing");
      const tx = await buildTransfer(address, LESSON_WALLET, AMOUNT); // fresh blockhash
      const sig = await signAndSend(tx); // Phantom approve popup
      setSignature(sig);
      setStep("confirming");
      await waitForConfirmation(sig);
      setStep("checking");
      setResult(await verifyOnChain(sig, address));
      setStep("done");
    } catch (e) {
      setError(e.message);
      setStep("review");
    }
  }

  return (
    <section>
      <h2>{lesson.title}</h2>
      <p>Send 0.1 SOL to the lesson wallet. Once it confirms, nobody can reverse it.</p>

      {step === "start" && <button onClick={handleReview}>Review transaction</button>}

      {step !== "start" && (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, margin: "12px 0" }}>
          <p>From: <code>{address && shortAddress(address)}</code></p>
          <p>To: <code style={{ wordBreak: "break-all" }}>{LESSON_WALLET}</code></p>
          <p>Amount: <strong>0.1 SOL</strong></p>
          <p>Network fee: {fee !== null ? `${lamportsToSol(fee)} SOL` : "…"} (paid to the validators who confirm it)</p>
        </div>
      )}

      {step === "review" && <button onClick={handleSend}>Send with Phantom</button>}
      {step === "signing" && <p>Approve it in Phantom…</p>}
      {step === "confirming" && <p>Sent. Waiting for devnet to confirm…</p>}
      {step === "checking" && <p>Checking the chain…</p>}

      {result && (
        <div style={{ border: `2px solid ${result.passed ? "green" : "crimson"}`, borderRadius: 12, padding: 16, marginTop: 12 }}>
          <strong>{result.passed ? "Verified onchain!" : "The chain says something's off"}</strong>
          {result.checks.map((c) => (
            <p key={c.label}>{c.ok ? "✅" : "❌"} {c.label}: <code>{c.value}</code></p>
          ))}
          <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer">
            View it on the devnet explorer
          </a>
        </div>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </section>
  );
}