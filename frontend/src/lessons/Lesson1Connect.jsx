// Sun night (Person A). Pass: wallet connected on devnet and new SOL received.
import { useState } from "react";
import { connectPhantom } from "../lib/phantom";
import { getBalanceLamports, lamportsToSol, shortAddress } from "../lib/solana";

const getBalanceSol = async (a) => lamportsToSol(await getBalanceLamports(a));

export default function Lesson1Connect({ lesson }) {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [startBalance, setStartBalance] = useState(null); // balance at connect
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setError("");
    try {
      const addr = await connectPhantom();
      const b = await getBalanceSol(addr);
      setAddress(addr);
      setBalance(b);
      setStartBalance(b);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCheck() {
    setError("");
    try {
      const b = await getBalanceSol(address);
      setBalance(b);
      const received = b > startBalance; // pass only if new SOL arrived
      setPassed(received);
      if (!received) setError("No new SOL yet. Request from the faucet, wait a few seconds, then check again.");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section>
      <h2>{lesson.title}</h2>

      {!address ? (
        <button onClick={handleConnect}>Connect Phantom (devnet)</button>
      ) : (
        <>
          <p>Wallet: <code>{shortAddress(address)}</code></p>
          <button onClick={() => navigator.clipboard.writeText(address)}>Copy my address</button>
          <p>Your public address is like an email address for money: safe to share. Never share your seed phrase.</p>

          <p>Balance: <strong>{balance?.toFixed(3)} SOL</strong> (devnet)</p>
          <p>
            Receive your first SOL: paste your address at{" "}
            <a href="https://faucet.solana.com" target="_blank" rel="noreferrer">faucet.solana.com</a>.
          </p>

          <button onClick={handleCheck}>Check my work</button>
          {passed && (
            <p style={{ color: "green" }}>
              Received {(balance - startBalance).toFixed(3)} SOL! The chain shows {balance.toFixed(3)} SOL in your wallet.
            </p>
          )}
        </>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </section>
  );
}