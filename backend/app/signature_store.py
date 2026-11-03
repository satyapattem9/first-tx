"""Remembers which lesson each passing signature was used for (check 6).

Stored offchain in a small JSON file so it survives a server restart during the demo.
Not a database: fine for one verifier process, not for multiple workers.
"""

import json
import threading
from pathlib import Path

from .config import SIGNATURE_STORE_PATH

_lock = threading.Lock()


def _read(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def lesson_for_signature(signature: str) -> str | None:
    with _lock:
        return _read(SIGNATURE_STORE_PATH).get(signature)


def record_pass(signature: str, lesson_id: str) -> None:
    with _lock:
        data = _read(SIGNATURE_STORE_PATH)
        data[signature] = lesson_id
        SIGNATURE_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        SIGNATURE_STORE_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
