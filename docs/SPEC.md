# SPEC — First Tx (working name)

**One-liner:** A safe, hands-on Solana devnet learning app that helps crypto beginners practice wallet transactions, understand what they are signing, and recognize risky recipients before using real money.

**Track:** Consumer Apps

---

## Problem

People who are curious about crypto often hesitate before their first transaction because the process is unfamiliar and transactions can be difficult to reverse:

- Sending SOL to the wrong or look-alike address
- Signing a transaction without understanding what it does
- Not knowing what a fee, signature, or confirmation means

Videos and quizzes can explain these concepts, but they do not let a learner practice the actual wallet connection, signing, submission, and confirmation flow.

First Tx provides guided practice on Solana devnet, where users can make real test-network transactions without spending real money. It also uses simulated exercises when an onchain transaction is unnecessary.

## Who has it

**Primary user:** A crypto-curious beginner, such as a college student or young adult, who has heard of crypto and wants to understand how to make a transaction safely.

**Not our user:** People who are committed skeptics and do not want to use crypto. First Tx is not intended to persuade people to invest.

## Core product idea

> **Practice safely, verify what happened, and learn from mistakes.**

The app guides users through wallet and transaction concepts. For lessons involving an actual transaction, the app checks the transaction recorded on Solana devnet against the lesson's expected outcome.

The blockchain records the transaction and makes it independently inspectable. The app's verifier interprets that transaction and decides whether it meets the lesson requirements. The chain itself does not grade the user's understanding.

### Demo moment: the scam-trap lesson

The user is asked to send devnet SOL to a known recipient. The lesson presents a look-alike address that differs from the expected address. The user must compare the recipient against a trusted reference and choose the correct destination before signing.

If the user selects the wrong recipient, the app explains the difference and shows the resulting devnet transaction, if one was submitted. The user can retry with replenished devnet funds or return to the lesson.

The lesson teaches that similar-looking addresses can be different addresses and that users should verify the recipient before signing. Matching only the first and last few characters is not presented as a sufficient safety check.

## What lives onchain vs. offchain

| Onchain (Solana devnet) | Offchain |
|---|---|
| User's devnet wallet and SOL balance | Lesson content and expected transaction details |
| Actual lesson transactions | Progress, XP, streaks, and attempt history |
| Transaction records used as evidence for transaction-based lessons | Verifier service that reads RPC data and returns pass/fail |
| Optional completion-proof memo transaction (stretch) | UI, explanations, safety checklist, and mistake-replay experience |

**Rule:** Use the chain when the lesson requires a real wallet action or independently inspectable transaction evidence. Keep lesson content, progress, XP, and other app features offchain unless there is a clear reason to put them onchain.

## Learning outcomes

By the end of the MVP, a learner should be able to:

- Identify the wallet address and network they are using
- Explain that SOL is used to pay transaction fees on Solana
- Review the recipient and amount before signing
- Distinguish a submitted transaction from a confirmed, successful transaction
- Recognize that a transaction can succeed while still sending funds to the wrong recipient
- Understand that devnet practice does not guarantee safety when using mainnet

## Demo scope (3 lessons)

### 1. Connect and understand

Connect Phantom on devnet. Explain wallet addresses, devnet SOL, transaction fees, and network selection.

**Pass:** The app confirms the connected wallet and reads its devnet balance from Solana. If the wallet is on the wrong network or has no devnet SOL, show clear setup guidance.

### 2. Your first send

Send 0.1 devnet SOL to a known recipient. Before signing, display the network, recipient, amount, and estimated fee.

**Pass:** The verifier confirms that the exact submitted transaction succeeded and matches the lesson's expected sender, recipient, and amount.

### 3. Scam trap

Show a look-alike recipient and ask the learner to identify the correct address using a trusted reference. Explain why a visually similar address is not necessarily the same address.

**Pass:** The user selects the correct recipient and completes the expected devnet transaction. If they submit to the wrong recipient, explain the mistake and allow a retry.

## Verification design

The frontend should capture the transaction signature returned by the wallet after submission and send it to the backend with the lesson attempt identifier.

The backend verifier should check:

1. The transaction can be retrieved from the devnet RPC.
2. The transaction succeeded (not merely that it was submitted).
3. The expected wallet is the fee payer or required signer, as appropriate for the lesson.
4. The recipient and transferred amount match the lesson's expected values.
5. The transaction is associated with the current lesson attempt.
6. The transaction is at the required confirmation level before passing the lesson.

Do not grade a lesson solely by searching the wallet's entire transaction history. Handle RPC indexing or confirmation delays with a pending state and retryable verification. Avoid treating a timeout as a failed transaction.

For the MVP, progress can be tied to the connected wallet address and stored offchain. Explain that switching wallets may change the displayed progress unless the user has an account system.

## Safety and recovery

- Clearly label the app and wallet connection as **devnet only**.
- Check and display the selected network before each transaction.
- Never ask for a seed phrase or private key.
- Show the recipient, amount, network, and estimated fee before the wallet opens for signing.
- Provide a way to retry a lesson after a mistake.
- Explain how to obtain devnet SOL and what to do if a faucet or RPC service is temporarily unavailable.
- Show distinct states for submitted, pending confirmation, confirmed success, and failed transactions.
- Do not automatically move users to mainnet. Mainnet education is outside the MVP.

## Practice mode and real practice mode

**Practice mode:** Simulated wallet and transaction exercises for concepts that do not require an actual transaction. Users can make mistakes without needing devnet SOL.

**Real practice mode:** Actual wallet interactions and devnet transactions for lessons where practicing the signing and submission flow is important.

This separation reduces onboarding friction while preserving the app's blockchain-specific value.

## How we measure whether it works

For the hackathon demo, track:

- Lesson start and completion rates
- Common mistakes in the scam-trap lesson
- Successful retries after an incorrect choice
- Whether learners can identify the correct recipient in a short post-lesson check

These metrics help distinguish "users completed a transaction" from "users learned to make safer decisions."

## Stack

- **Frontend:** React or plain JavaScript, Phantom wallet adapter, and Solana web3.js on devnet
- **Backend:** Python (FastAPI) verifier that calls Solana devnet JSON-RPC
- **RPC methods:** Use the submitted transaction signature with `getTransaction`; use `getSignaturesForAddress` only when needed for discovery or recovery, not as the sole basis for grading
- **No smart contract required for the MVP:** Native SOL transfers are enough to demonstrate actual wallet practice and transaction verification

## Limitations

- Devnet SOL has no real monetary value, so practice does not fully reproduce the emotional pressure or consequences of mainnet use.
- Devnet RPC and faucet services can be delayed, rate-limited, or temporarily unavailable.
- A successful transaction does not prove that a user understands the concept; use a short comprehension check alongside transaction verification.
- The app's verifier is application logic. The transaction is independently inspectable onchain, but the app's pass/fail decision is not automatically a blockchain consensus decision.

## Out of scope (for this week)

- NFT badges and token rewards
- Swaps, DeFi, and complex program interactions
- Accounts and login
- Mobile app
- Mainnet transactions or a "graduate to mainnet" flow
- Smart contracts for lesson progress
- Full phishing simulation beyond the controlled look-alike-recipient exercise

## What judges will ask (have answers ready)

- **Why use blockchain?** The core practice lessons involve actual wallet interactions and transactions that can be independently inspected on Solana devnet. A simulator alone cannot verify a real devnet transaction.
- **Why not use mainnet with $1?** Devnet allows practice without real financial loss. It is a safer learning environment, though it does not reproduce all mainnet risks.
- **What is actually onchain?** The user's devnet transactions. Lesson content and progress remain offchain.
- **Does the chain grade the lesson?** No. The chain records the transaction; our verifier checks whether it matches the lesson's expected outcome.
- **How do you prevent false passes?** Verify the exact transaction signature, success status, signer, recipient, amount, and lesson attempt.
- **How do you know users learn?** Track lesson errors and retries, then use a brief post-lesson comprehension check.
- **What's next?** More controlled lessons about transaction review and wallet safety. Mainnet use is not part of the MVP.
