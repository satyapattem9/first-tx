// Lesson 3: the look-alike address. The verifier decides if you paid Maya or a scammer.
import { useState } from "react";
import { connectPhantom } from "../lib/phantom";
import { buildTransfer, signAndSend, waitForConfirmation, shortAddress } from "../lib/solana";
import { verifyUntilSettled } from "../lib/verify";
import Insight from "../components/Insight.jsx";

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

export default function Lesson3ScamTrap({ lesson, onComplete, onLearn, onReceipt }) {
  // Same first 4 and last 4 characters. Nobody holds keys to either address,
  // so devnet SOL sent here is gone for good. That's the lesson.
  const MAYA = lesson.expectedRecipient;
  const SCAMMER = lesson.lookalikeRecipient;
  const AMOUNT = lesson.expectedLamports;

  const [step, setStep] = useState("ask"); // ask | compare | sending | checking | unverified | done
  const [signature, setSignature] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState(""); // why the result isn't in yet
  const [error, setError] = useState("");

  // Asks the verifier about a sent transaction. Never re-sends it.
  async function runVerify(sig, from) {
    setStep("checking");
    let r;
    try {
      r = await verifyUntilSettled({ lessonId: lesson.id, wallet: from, signature: sig });
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
    onReceipt({
      title: passed ? "Lesson 3 · Paid Maya" : "Lesson 3 · Look-alike",
      signature: sig,
      ok: passed,
      verdict: passed ? "Verified" : "Wrong wallet",
    });
    if (passed) onComplete();
    onLearn(["Address poisoning"]);
    setStep("done");
  }

  async function send(to) {
    setError("");
    try {
      setStep("sending");
      const from = await connectPhantom();
      setWallet(from);
      const tx = await buildTransfer(from, to, AMOUNT);
      const sig = await signAndSend(tx); // Phantom shows 4H7f…h66f either way
      setSignature(sig);
      await waitForConfirmation(sig);
      await runVerify(sig, from);
    } catch (e) {
      setError(e.message);
      setStep("ask");
    }
  }

  function reset() {
    setStep("ask"); setResult(null); setSignature(null); setError(""); setNotice("");
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

      {step === "sending" && <p className="status-line">Approve in Phantom… then confirming on devnet…</p>}
      {step === "checking" && <p className="status-line">Checking the chain…</p>}
      {step === "unverified" && (
        <>
          <p className="status-line">{notice} Your SOL was sent, so don't send it again.</p>
          <button onClick={() => runVerify(signature, wallet)}>Check again</button>
        </>
      )}

      {step === "done" && result && (
        <>
          <div className={result.passed ? "result-box pass" : "result-box fail"}>
            <div className="result-title">{result.passed ? "You paid Maya. Verified onchain!" : "You just paid a scammer."}</div>
            <p className="result-reason">{result.reason}</p>
            {result.checks.map((c) => (
              <div key={c.label} className="check-row">
                <span>{c.ok ? "✅" : "❌"} {c.label}</span>
                <code>{c.value}</code>
              </div>
            ))}

            {!result.passed && (
              <div className="compare-block">
                <div className="compare-row"><span>You sent to</span><Addr value={SCAMMER} tone="bad" /></div>
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