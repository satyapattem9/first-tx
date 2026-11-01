# First Tx: Build Plan

**Track:** Consumer Apps · **Chain:** Solana devnet · **Pitch:** Wed Nov 4 (3 min + 1 min Q&A)

## Overview

First Tx is a beginner-friendly app that teaches people to make their first crypto transaction safely, using Solana devnet's free test money. It has three lessons:

1. **Connect and understand:** connect a Phantom wallet on devnet and see your address and balance.
2. **Your first send:** send 0.1 devnet SOL after reviewing the network, recipient, amount, and fee.
3. **Scam trap:** spot a look-alike address and send to the correct one. This is the demo moment.

A small backend checks each real devnet transaction to confirm the learner sent the right amount to the right place.

## Work split

**Person A: frontend**
- Phantom wallet connection on devnet
- The three lesson screens
- Building and sending transactions
- The "review before you sign" panel
- The scam-trap screen, mistake explanation, and retry

**Person B: backend and content**
- FastAPI verifier (`/verify`)
- Lesson config (`lessons.json`)
- Devnet test wallets, recipient wallets, and the look-alike address
- Most of the slides

## Hand-off agreement (settle Sunday night)

Once these two things are fixed, we can build separately and connect them Tuesday.

**1. Shared `lessons.json`**: each lesson's ID, expected recipient, amount, and the look-alike address.

**2. One endpoint**

```
POST /verify
Request:  { "lessonId": "...", "wallet": "...", "signature": "..." }
Response: { "status": "pass" | "fail" | "pending", "reason": "..." }
```

`/verify` checks that the transaction:
- can be fetched from devnet by its signature
- succeeded and is confirmed (if it isn't confirmed yet, return `pending`, not `fail`)
- was sent by the expected wallet
- went to the expected recipient for the expected amount

## Timeline

| When | Person A (frontend) | Person B (backend) |
|---|---|---|
| **Sun night** | Set up the React app, get Phantom connecting on devnet, show wallet address and balance (Lesson 1) | Write `lessons.json`, create recipient wallets and the look-alike address, fund test wallets from the faucet |
| **Mon** | Build Lesson 2: review panel (network, recipient, amount, fee), send 0.1 SOL, show submitted → pending → confirmed states | Build `/verify`: fetch the transaction by signature, check success, sender, recipient, and amount; return `pending` if not yet confirmed |
| **Tue** | Build Lesson 3 (scam trap): choose between real and look-alike address, explain the mistake, add a retry button | Connect to A's app, test all three lessons end to end, draft the 4–6 slides |
| **Tue night (together)** | Run the full demo twice, fix what breaks, finalize slides | (same) |
| **Wed, before meeting** | Post names, track, repo link, and slides in #blockchain-dev | (same) |

## Slides (4–6)

1. The problem and who has it: crypto-curious beginners afraid of sending to the wrong address or signing something they don't understand
2. Our idea and why it needs a blockchain: real wallet practice with transactions anyone can inspect, using free test money
3. Demo (live): scam-trap lesson
4. How we built it: React + Phantom frontend, FastAPI verifier reading devnet
5. What we'd build next with a full week

## If we fall behind, cut these first

- Practice mode (simulated exercises)
- Metrics tracking
- Saved progress

None of them show up in a 3-minute demo. **Protect the scam-trap lesson above everything else.**
