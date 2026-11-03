// Lesson 1: connect Phantom and receive devnet SOL.
import { useState } from "react";
import { connectPhantom } from "../lib/phantom";
import { getBalanceLamports, lamportsToSol, shortAddress } from "../lib/solana";
import Insight from "../components/Insight.jsx";

const getBalanceSol = async (a) => lamportsToSol(await getBalanceLamports(a));

export default function Lesson1Connect({ lesson, setWallet, onComplete, onLearn }) {
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
      setWallet(addr);
      setBalance(b);
      setStartBalance(b);
      onLearn(["Public address"]);
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
      if (received) {
        onComplete();
        onLearn(["Faucet"]);
      } else {
        setError("No new SOL yet. Request from the faucet, wait a few seconds, then check again.");
      }
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

          {!passed && (
            <Insight
              title="You shared your address, not your keys"
              why="an app can see your wallet, but it can't move a single SOL unless you approve it in Phantom."
              words={["Public address"]}
            >
              <p>Phantom gave this app your <b>public address</b> so it can read your balance. Your private key and seed phrase never left Phantom.</p>
            </Insight>
          )}

          {passed && (
            <Insight
              title="You received your first SOL"
              why="receiving needs nothing from you. Sending is the step that needs your approval, and that's Lesson 2."
              words={["Faucet"]}
            >
              <p>The <b>faucet</b> sent a transaction to your public address. Anyone can send to an address, which is why it's safe to share.</p>
              <p>Your balance doesn't live in Phantom or in this app. It lives on Solana, and both of them just read it from the chain.</p>
            </Insight>
          )}
        </>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </section>
  );
}