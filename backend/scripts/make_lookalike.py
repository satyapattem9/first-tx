"""Generate a look-alike address for the scam-trap lesson.

Keeps the first and last KEEP characters of the real address and swaps a few middle
characters for visually similar ones, so "check the first and last 4" is NOT enough
to tell them apart. The result is a valid 32-byte Solana address with no known private
key: SOL sent to it on devnet is unrecoverable, which is the point of the lesson.

Usage (from backend/):  python -m scripts.make_lookalike <real-address>
"""

import sys

from app.base58 import ALPHABET, b58decode, is_pubkey

KEEP = 6
# Pairs that are easy to confuse at a glance (all valid base58 characters).
CONFUSABLE = {
    "a": "o", "o": "a", "b": "h", "h": "b", "m": "n", "n": "m", "u": "v", "v": "u",
    "S": "5", "5": "S", "Z": "2", "2": "Z", "B": "8", "8": "B", "G": "6", "6": "G",
    "q": "g", "g": "q", "W": "V", "V": "W", "e": "c", "c": "e", "k": "x", "x": "k",
}


def make_lookalike(real: str, changes: int = 3) -> str:
    if not is_pubkey(real):
        raise ValueError(f"not a valid address: {real}")
    chars = list(real)
    middle = range(KEEP, len(chars) - KEEP)
    swappable = [i for i in middle if chars[i] in CONFUSABLE]
    # Spread the swaps across the middle so the change isn't in one obvious clump.
    picks = swappable[:: max(1, len(swappable) // changes)][:changes]
    for i in picks:
        chars[i] = CONFUSABLE[chars[i]]
    candidate = "".join(chars)
    if candidate == real or not is_pubkey(candidate):
        raise RuntimeError("could not build a valid look-alike; try a different address")
    assert all(c in ALPHABET for c in candidate) and len(b58decode(candidate)) == 32
    return candidate


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    real = sys.argv[1]
    fake = make_lookalike(real)
    print(f"real:      {real}")
    print(f"lookalike: {fake}")
