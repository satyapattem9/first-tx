// Lesson 3: the look-alike address. The chain decides if you paid Maya or a scammer.
import { useState } from "react";
import { connectPhantom } from "../lib/phantom";
import {
  connection, buildTransfer, signAndSend, waitForConfirmation, lamportsToSol, shortAddress,
} from "../lib/solana";

// Same first 4 and last 4 characters. Nobody holds keys to either address,
// so devnet SOL sent here is gone for good. That's the lesson.
const MAYA = "4H7f3hSj5KghN3UfU7purQNMtsRArQFtXW3keEZNh66f";
const SCAMMER = "4H7fER5jq6eHq4vnGab95XiyjvenVZ6pcB2CAXfYh66f";
const AMOUNT = 100_000_000; // 0.1 SOL

// Shows an address with the middle highlighted
function Addr({ value, color }) {
  return (
    <code style={{ wordBreak: "break-all" }}>
      {value.slice(0, 4)}
      <span style={{ color, fontWeight: 700, textDecoration: "underline" }}>{value.slice(4, -4)}</span>
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

export default function Lesson3ScamTrap({ lesson }) {
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
      setResult(await checkPayment(sig));
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

      <div style={{ background: "#f1f1f5", borderRadius: 12, padding: 12, maxWidth: 440 }}>
        <strong>Maya</strong>
        <p>thx for covering lunch! send 0.1 SOL here:</p>
        <code style={{ wordBreak: "break-all" }}>{MAYA}</code>
      </div>

      {step === "ask" && (
        <>
          <p>You pasted her address into the send form. It shows:</p>
          <p style={{ fontSize: 24 }}><code>{shortAddress(SCAMMER)}</code></p>
          <button onClick={() => send(SCAMMER)}>Looks right, send it</button>{" "}
          <button onClick={() => setStep("compare")}>Compare the full address first</button>
        </>
      )}

      {step === "compare" && (
        <>
          <p>Maya's message: <Addr value={MAYA} color="green" /></p>
          <p>Your clipboard: <Addr value={SCAMMER} color="crimson" /></p>
          <p>Your clipboard was swapped. Only the first 4 and last 4 characters match, and that's all most wallets show you.</p>
          <button onClick={() => send(MAYA)}>Send to Maya's real address</button>
        </>
      )}

      {step === "sending" && <p>Approve in Phantom… then confirming on devnet and checking the chain…</p>}

      {step === "done" && result && (
        <div style={{ border: `2px solid ${result.passed ? "green" : "crimson"}`, borderRadius: 12, padding: 16, marginTop: 12 }}>
          <strong>{result.passed ? "You paid Maya. Verified onchain!" : "You just paid a scammer."}</strong>
          {result.checks.map((c) => (
            <p key={c.label}>{c.ok ? "✅" : "❌"} {c.label}: <code>{c.value}</code></p>
          ))}

          {!result.passed && (
            <>
              <p>The transaction is confirmed and final. On mainnet, that money would be gone for good.</p>
              <p>You sent to: <Addr value={result.to || SCAMMER} color="crimson" /></p>
              <p>Maya's real address: <Addr value={MAYA} color="green" /></p>
              <ol>
                <li>Check the middle of the address, not just the ends.</li>
                <li>Save people you pay often in your wallet's address book.</li>
                <li>Send a tiny test amount before a big one.</li>
              </ol>
            </>
          )}

          <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer">
            View it on the devnet explorer
          </a>
          <div style={{ marginTop: 12 }}>
            {result.passed ? (
              <button onClick={reset}>Replay the lesson</button>
            ) : (
              <button onClick={reset}>Try again</button>
            )}
          </div>
        </div>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </section>
  );
}