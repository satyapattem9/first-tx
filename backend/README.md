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
pytest
```

## Layout

| File | What it does |
|---|---|
| `app/main.py` | Routes: `GET /health`, `GET /lessons`, `POST /verify` |
| `app/verifier.py` | The grading checks. **Most of Monday's work happens here.** |
| `app/solana_rpc.py` | `getTransaction` JSON-RPC call |
| `app/lessons.py` | Loads `../shared/lessons.json` |
| `app/models.py` | Request/response shapes (must match `docs/API.md`) |
