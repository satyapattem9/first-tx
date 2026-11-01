# Frontend: lessons (Person A)

React + Vite app. Talks to Phantom through `window.phantom.solana` and to devnet through `@solana/web3.js`.

## Run

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. The backend must be running on :8000 for lessons 2 and 3 to verify.

## Layout

| File | What it does |
|---|---|
| `src/App.jsx` | Wallet state + which lesson is showing |
| `src/lib/phantom.js` | Detect / connect / disconnect Phantom |
| `src/lib/solana.js` | Devnet connection, balance, build transfer, fee estimate, sign + send |
| `src/lib/verify.js` | `POST /verify` client with pending-retry (must match `docs/API.md`) |
| `src/lib/lessons.js` | Loads `../shared/lessons.json` |
| `src/components/ReviewPanel.jsx` | "Review before you sign": network, recipient, amount, fee |
| `src/components/TxStatus.jsx` | submitted → pending → confirmed / failed states |
| `src/lessons/Lesson1Connect.jsx` | Sun night |
| `src/lessons/Lesson2FirstSend.jsx` | Mon |
| `src/lessons/Lesson3ScamTrap.jsx` | Tue. **The demo.** |

## Why we sign with Phantom but send ourselves

`signAndSend` in `src/lib/solana.js` asks Phantom only to *sign*, then submits through our own devnet connection. The transaction can only land on devnet, even if the learner's Phantom is still set to mainnet.
