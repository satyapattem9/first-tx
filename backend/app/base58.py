"""Minimal base58 (Bitcoin alphabet, as used by Solana). Stdlib only."""

ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
_INDEX = {c: i for i, c in enumerate(ALPHABET)}


def b58decode(s: str) -> bytes:
    """Decode a base58 string. Raises ValueError on invalid characters."""
    num = 0
    for ch in s:
        if ch not in _INDEX:
            raise ValueError(f"invalid base58 character: {ch!r}")
        num = num * 58 + _INDEX[ch]
    body = num.to_bytes((num.bit_length() + 7) // 8, "big") if num else b""
    leading_zeros = len(s) - len(s.lstrip("1"))
    return b"\x00" * leading_zeros + body


def b58encode(data: bytes) -> str:
    num = int.from_bytes(data, "big")
    out = ""
    while num:
        num, rem = divmod(num, 58)
        out = ALPHABET[rem] + out
    leading_zeros = len(data) - len(data.lstrip(b"\x00"))
    return "1" * leading_zeros + out


def is_base58_of_length(s: str, n_bytes: int) -> bool:
    """True if `s` is valid base58 that decodes to exactly `n_bytes` bytes."""
    if not s:
        return False
    try:
        return len(b58decode(s)) == n_bytes
    except ValueError:
        return False


def is_pubkey(s: str) -> bool:
    return is_base58_of_length(s, 32)


def is_signature(s: str) -> bool:
    return is_base58_of_length(s, 64)
