// Lesson 2: send 0.1 SOL, then the verifier grades the real transaction.
import { useState } from "react";
import { connectPhantom } from "../lib/phantom";
import {
  buildTransfer, estimateFeeLamports, signAndSend,
  waitForConfirmation, lamportsToSol, shortAddress,
} from "../lib/solana";
import { verifyUntilSettled } from "../lib/verify";
import Insight from "../components/Insight.jsx";

export default function Lesson2FirstSend({ lesson, onComplete, onLearn, onReceipt }) {
  const LESSON_WALLET = lesson.expectedRecipient;
  const AMOUNT = lesson.expectedLamports;

  const [address, setAddress] = useState(null);
  const [fee, setFee] = useState(null);
  const [step, setStep] = useState("start"); // start | review | signing | confirming | checking | unverified | done
  const [signature, setSignature] = useState(null);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState(""); // why the result isn't in yet
  const [error, setError] = useState("");

  // Asks the verifier about a sent transaction. Never re-sends it.
  async function runVerify(sig, addr) {
    setStep("checking");
    let r;
    try {
      r = await verifyUntilSettled({ lessonId: lesson.id, wallet: addr, signature: sig });
    } catch (e) {
      r = { status: "pending", reason: e.message };
    }
    if (r.status === "pending") {
      setNotice(r.reason);
      setStep("unverified");
      return;
    }
    const passed = r.status === "pass";
    setResult({ passed, reason: r.reason, checks: r.checks });
    onReceipt({ title: "Lesson 2 · First send", signature: sig, ok: passed, verdict: passed ? "Verified" : "Check failed" });
    if (passed) {
      onComplete();
      onLearn(["Signature", "Network fee", "Finality"]);
    }
    setStep("done");
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
      await runVerify(sig, address);
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
      {step === "unverified" && (
        <>
          <p className="status-line">{notice} Your SOL was sent, so don't send it again.</p>
          <button onClick={() => runVerify(signature, address)}>Check again</button>
        </>
      )}

      {result && (
        <div className={result.passed ? "result-box pass" : "result-box fail"}>
          <div className="result-title">{result.passed ? "Verified onchain!" : "The chain says something's off"}</div>
          <p className="result-reason">{result.reason}</p>
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