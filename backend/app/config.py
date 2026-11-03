import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")]
REQUIRED_COMMITMENT = os.getenv("REQUIRED_COMMITMENT", "confirmed")
if REQUIRED_COMMITMENT not in ("confirmed", "finalized"):
    # getTransaction only supports these two; "processed" would silently break verification.
    raise ValueError(f"REQUIRED_COMMITMENT must be 'confirmed' or 'finalized', got {REQUIRED_COMMITMENT!r}")

BACKEND_DIR = Path(__file__).resolve().parents[1]

# Single source of truth shared with the frontend.
LESSONS_PATH = BACKEND_DIR.parent / "shared" / "lessons.json"

# Offchain record of which lesson each passing signature was used for.
SIGNATURE_STORE_PATH = Path(os.getenv("SIGNATURE_STORE_PATH", BACKEND_DIR / "data" / "used_signatures.json"))
