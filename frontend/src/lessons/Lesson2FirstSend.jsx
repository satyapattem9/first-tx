// Lesson 2: send 0.1 SOL, then the chain grades it.
import { useState } from "react";
import { connectPhantom } from "../lib/phantom";
import {
  connection, buildTransfer, estimateFeeLamports, signAndSend,
  waitForConfirmation, lamportsToSol, shortAddress,
} from "../lib/solana";
import Insight from "../components/Insight.jsx";

const LESSON_WALLET = import.meta.env.VITE_LESSON2_WALLET;
const AMOUNT = 100_000_000; // 0.1 SOL in lamports

// Reads the real transaction from devnet and checks each field.
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

export default function Lesson2FirstSend({ lesson, onComplete, onLearn, onReceipt }) {
  const [address, setAddress] = useState(null);
  const [fee, setFee] = useState(null);
  const [step, setStep] = useState("start"); // start | review | signing | confirming | checking | done
  const [signature, setSignature] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  if (!LESSON_WALLET) {
    return (
      <section>
        <h2>{lesson.title}</h2>
        <p className="error-line">Missing VITE_LESSON2_WALLET in frontend/.env (restart npm run dev after adding it).</p>
      </section>
    );
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
      const r = await verifyOnChain(sig, address);
      setResult(r);
      onReceipt({ title: "Lesson 2 · First send", signature: sig, ok: r.passed, verdict: r.passed ? "Verified" : "Check failed" });
      if (r.passed) {
        onComplete();
        onLearn(["Signature", "Network fee", "Finality"]);
      }
      setStep("done");
    } catch (e) {
      setError(e.message);
      setStep("review");
    }
  }

  return (
    <section>
      <h2>{lesson.title}</h2>
      <p className="lesson-intro">Send 0.1 SOL to the lesson wallet. Once it confirms, nobody can reverse it.</p>

      {step === "start" && <button onClick={handleReview}>Review transaction</button>}

      {step !== "start" && (
        <div className="info-box">
          <div className="info-row"><span>From</span><code>{address && shortAddress(address)}</code></div>
          <div className="info-row"><span>To</span><code>{shortAddress(LESSON_WALLET)}</code></div>
          <div className="info-row"><span>Amount</span><strong>0.1 SOL</strong></div>
          <div className="info-row">
            <span>Network fee</span>
            <strong>{fee !== null ? `${lamportsToSol(fee)} SOL` : "…"}</strong>
          </div>
        </div>
      )}

      {step === "review" && <button onClick={handleSend}>Send with Phantom</button>}
      {step === "signing" && <p className="status-line">Approve it in Phantom…</p>}
      {step === "confirming" && <p className="status-line">Sent. Waiting for devnet to confirm…</p>}
      {step === "checking" && <p className="status-line">Checking the chain…</p>}

      {result && (
        <div className={result.passed ? "result-box pass" : "result-box fail"}>
          <div className="result-title">{result.passed ? "Verified onchain!" : "The chain says something's off"}</div>
          {result.checks.map((c) => (
            <div key={c.label} className="check-row">
              <span>{c.ok ? "✅" : "❌"} {c.label}</span>
              <code>{c.value}</code>
            </div>
          ))}
          <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer">
            View it on the devnet explorer
          </a>
        </div>
      )}

      {result?.passed && (
        <Insight
          title="You signed, the network confirmed, and it's permanent"
          why={'there\'s no bank to call and no "undo." Once it confirms, it\'s final.'}
          words={["Signature", "Network fee", "Finality"]}
        >
          <p>
            Phantom used your private key to <b>sign</b> the transfer. Validators checked it and added it to Solana in seconds.
            They kept a <b>{fee !== null ? lamportsToSol(fee) : "0.000005"} SOL fee</b> for the work.
          </p>
          <p>Signature <code>{shortAddress(signature)}</code> is the receipt. Anyone in the world can look it up, forever.</p>
        </Insight>
      )}

      {error && <p className="error-line">{error}</p>}
    </section>
  );
}