# First Tx

A beginner-friendly app that teaches people to make their first crypto transaction safely, using Solana **devnet** test money.

**Track:** Consumer Apps · **Chain:** Solana devnet · **Pitch:** Wed Nov 4

## Lessons

1. **Connect and understand:** connect Phantom on devnet, see your address and balance.
2. **Your first send:** review network, recipient, amount, and fee, then send 0.1 devnet SOL.
3. **Scam trap:** spot a look-alike address and send to the correct one. *This is the demo. Protect it above everything else.*

A small FastAPI verifier checks each real devnet transaction by signature.

## Repo layout

```
first-tx/
├── shared/lessons.json   # Contract: lesson ids, recipients, amounts, look-alike address
├── docs/
│   ├── API.md            # Contract: POST /verify request/response
│   ├── SPEC.md           # Product spec
│   └── PLAN.md           # Build plan, work split, timeline
├── frontend/             # Person A: React + Vite + Phantom + @solana/web3.js
└── backend/              # Person B: FastAPI verifier
```

`shared/lessons.json` and `docs/API.md` are the hand-off agreement. **Change them only together, in one commit, and tell the other person.**

## Quickstart

Prereqs: Node 20+, Python 3.11+, the [Phantom](https://phantom.app) browser extension.

**Backend** (http://localhost:8000):

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

**Frontend** (http://localhost:5173):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Devnet setup

1. In Phantom: Settings → Developer Settings → turn on **Testnet Mode** and choose **Solana Devnet**.
2. Get free devnet SOL from https://faucet.solana.com (paste your Phantom address).
3. Fill in the `REPLACE_ME_*` addresses in `shared/lessons.json`.

## Safety rules

- Devnet only. The app never touches mainnet.
- Never ask for, store, or commit a seed phrase or private key. Keypair files are git-ignored; keep them that way.
