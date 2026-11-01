import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")]
REQUIRED_COMMITMENT = os.getenv("REQUIRED_COMMITMENT", "confirmed")

# Single source of truth shared with the frontend.
LESSONS_PATH = Path(__file__).resolve().parents[2] / "shared" / "lessons.json"
