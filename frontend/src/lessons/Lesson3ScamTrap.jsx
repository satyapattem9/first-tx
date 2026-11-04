// Lesson 3: the look-alike address. The chain decides if you paid Maya or a scammer.
import { useState } from "react";
import { connectPhantom } from "../lib/phantom";
import {
  connection, buildTransfer, signAndSend, waitForConfirmation, lamportsToSol, shortAddress,
} from "../lib/solana";
import Insight from "../components/Insight.jsx";

// Same first 4 and last 4 characters. Nobody holds keys to either address,
// so devnet SOL sent here is gone for good. That's the lesson.
const MAYA = "4H7f3hSj5KghN3UfU7purQNMtsRArQFtXW3keEZNh66f";
const SCAMMER = "4H7fER5jq6eHq4vnGab95XiyjvenVZ6pcB2CAXfYh66f";
const AMOUNT = 100_000_000; // 0.1 SOL

// Shows an address with the middle highlighted
function Addr({ value, tone }) {
  return (
    <code className="addr">
      {value.slice(0, 4)}
      <span className={`addr-mid ${tone}`}>{value.slice(4, -4)}</span>
      {value.slice(-4)}
    </code>
  );
}

async function checkPayment(signature) {
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
    { label: "Amount", value: `${lamportsToSol(info.lamports || 0)} SOL`, ok: info.lamports === AMOUNT },
    { label: "Status", value: tx?.meta?.err ? "failed" : "confirmed", ok: !!tx && tx.meta?.err === null },
    { label: "Sent to Maya's wallet", value: info.destination === MAYA ? shortAddress(MAYA) : "NOT Maya", ok: info.destination === MAYA },
  ];
  return { passed: checks.every((c) => c.ok), checks, to: info.destination };
}

export default function Lesson3ScamTrap({ lesson, onComplete, onLearn, onReceipt }) {
  const [step, setStep] = useState("ask"); // ask | compare | sending | done
  const [signature, setSignature] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function send(to) {
    setError("");
    try {
      setStep("sending");
      const from = await connectPhantom();
      const tx = await buildTransfer(from, to, AMOUNT);
      const sig = await signAndSend(tx); // Phantom shows 4H7f…h66f either way
      setSignature(sig);
      await waitForConfirmation(sig);
      const r = await checkPayment(sig);
      setResult(r);
      onReceipt({
        title: r.passed ? "Lesson 3 · Paid Maya" : "Lesson 3 · Look-alike",
        signature: sig,
        ok: r.passed,
        verdict: r.passed ? "Verified" : "Wrong wallet",
      });
      if (r.passed) onComplete();
      onLearn(["Address poisoning"]);
      setStep("done");
    } catch (e) {
      setError(e.message);
      setStep("ask");
    }
  }

  function reset() {
    setStep("ask"); setResult(null); setSignature(null); setError("");
  }

  return (
    <section>
      <h2>{lesson.title}</h2>

      <div className="chat-bubble">
        <div className="chat-name">Maya</div>
        <p>thx for covering lunch! send 0.1 SOL here:</p>
        <code className="addr">{MAYA}</code>
      </div>

      {step === "ask" && (
        <>
          <p>You pasted her address into the send form. It shows:</p>
          <div className="big-address"><code>{shortAddress(SCAMMER)}</code></div>
          <div className="button-row">
            <button onClick={() => send(SCAMMER)}>Looks right, send it</button>
            <button className="secondary" onClick={() => setStep("compare")}>Compare the full address first</button>
          </div>
        </>
      )}

      {step === "compare" && (
        <>
          <div className="info-box">
            <div className="compare-row"><span>Maya's message</span><Addr value={MAYA} tone="good" /></div>
            <div className="compare-row"><span>Your clipboard</span><Addr value={SCAMMER} tone="bad" /></div>
          </div>
          <p>Your clipboard was swapped. Only the first 4 and last 4 characters match, and that's all most wallets show you.</p>
          <button onClick={() => send(MAYA)}>Send to Maya's real address</button>
        </>
      )}

      {step === "sending" && <p className="status-line">Approve in Phantom… then confirming on devnet and checking the chain…</p>}

      {step === "done" && result && (
        <>
          <div className={result.passed ? "result-box pass" : "result-box fail"}>
            <div className="result-title">{result.passed ? "You paid Maya. Verified onchain!" : "You just paid a scammer."}</div>
            {result.checks.map((c) => (
              <div key={c.label} className="check-row">
                <span>{c.ok ? "✅" : "❌"} {c.label}</span>
                <code>{c.value}</code>
              </div>
            ))}

            {!result.passed && (
              <div className="compare-block">
                <div className="compare-row"><span>You sent to</span><Addr value={result.to || SCAMMER} tone="bad" /></div>
                <div className="compare-row"><span>Maya's real address</span><Addr value={MAYA} tone="good" /></div>
                <ol className="tips">
                  <li>Check the middle of the address, not just the ends.</li>
                  <li>Save people you pay often in your wallet's address book.</li>
                  <li>Send a tiny test amount before a big one.</li>
                </ol>
              </div>
            )}

            <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer">
              View it on the devnet explorer
            </a>
          </div>

          {result.passed ? (
            <Insight
              title="You checked before you signed"
              why="the network won't stop a payment to the wrong address. A few seconds of checking is your only protection."
              words={["Address poisoning"]}
            >
              <p>You compared the whole address, caught the swap, and sent to Maya. The chain confirms the money went where you meant it to.</p>
              <p>This trick is called <b>address poisoning</b>. Real scammers use it on mainnet with real money.</p>
            </Insight>
          ) : (
            <Insight
              warn
              title="The network did exactly what you signed"
              why="on mainnet this money is gone. Checking the full address is your job, not the network's."
              words={["Address poisoning"]}
            >
              <p>Nothing broke. Solana doesn't know who you <i>meant</i> to pay, only the address you approved.</p>
              <p>Scammers make addresses that start and end like real ones, because most wallets only show those 8 characters. This is called <b>address poisoning</b>.</p>
            </Insight>
          )}

          <div className="button-row">
            <button className={result.passed ? "secondary" : ""} onClick={reset}>
              {result.passed ? "Replay the lesson" : "Try again"}
            </button>
          </div>
        </>
      )}

      {error && <p className="error-line">{error}</p>}
    </section>
  );
}