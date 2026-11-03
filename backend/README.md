# Backend: verifier (Person B)

FastAPI service that grades transaction-based lessons by reading Solana devnet.

## Run

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs to try `/verify` by hand.

## Test

```bash
cd backend
pytest                      # offline: RPC is stubbed with realistic jsonParsed fixtures
LIVE_DEVNET=1 pytest -k live   # also hits real devnet (PowerShell: $env:LIVE_DEVNET="1"; pytest -k live)
```

Needs Python 3.10+ (tested on 3.14).

## Layout

| File | What it does |
|---|---|
| `app/main.py` | Routes: `GET /health`, `GET /lessons`, `POST /verify` |
| `app/verifier.py` | The grading checks (see `docs/API.md`) and the learner-facing reasons |
| `app/solana_rpc.py` | `getTransaction` JSON-RPC call (jsonParsed, supports legacy/v0/v1 txs) |
| `app/lessons.py` | Loads `../shared/lessons.json` |
| `app/models.py` | Request/response shapes (must match `docs/API.md`) |
| `app/base58.py` | Address/signature validation, stdlib only |
| `app/signature_store.py` | Remembers which lesson each passing signature was used for (`data/used_signatures.json`, gitignored). Delete that file to reset between demo runs. |
| `scripts/make_lookalike.py` | Builds the scam-trap look-alike from a real address |

## Devnet addresses

Configured in `shared/lessons.json`:

| Role | Address | Private key |
|---|---|---|
| Lesson 2 recipient | `5GQtgY1j5PpBNNrcZ5ZZ1TSyYnFMG3ZUW5aaJNMKEtWT` | `wallets/lesson2-recipient-keypair.json` (local only, gitignored) |
| Lesson 3 recipient ("First Tx Club Treasury") | `DGuoDXSZSkneoYsezemx2So5LQW5Zd2hCVAbjUzsYycs` | `wallets/lesson3-recipient-keypair.json` (local only) |
| Lesson 3 look-alike | `DGuoDX5ZSkneoYsczemx2SoSLQW5Zd2hCVAbjUzsYycs` | none, SOL sent here is gone (that's the lesson) |

The look-alike keeps the first 6 and last 6 characters and swaps 3 middle ones (`S→5`, `e→c`, `5→S`).

**Funding the learner wallet:** the devnet RPC airdrop is closed. Use https://faucet.solana.com (sign in with GitHub for higher limits) and paste the Phantom devnet address. Each full demo run needs about 0.2 SOL plus fees, or 0.3 if you show the look-alike mistake first.
