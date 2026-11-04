from . import signature_store
from .base58 import is_pubkey, is_signature
from .config import REQUIRED_COMMITMENT
from .models import Check, VerifyRequest, VerifyResponse
from .solana_rpc import RpcUnavailable, get_transaction

LAMPORTS_PER_SOL = 1_000_000_000


def _sol(lamports: int) -> str:
    whole, frac = divmod(lamports, LAMPORTS_PER_SOL)
    frac_str = f"{frac:09d}".rstrip("0")
    return f"{whole}.{frac_str} SOL" if frac_str else f"{whole} SOL"


def _pending(reason: str) -> VerifyResponse:
    return VerifyResponse(status="pending", reason=reason)


def _fail(reason: str, checks: list[Check] | None = None) -> VerifyResponse:
    return VerifyResponse(status="fail", reason=reason, checks=checks or [])


def _short(address: str) -> str:
    return f"{address[:4]}…{address[-4:]}"


def _build_checks(
    req: VerifyRequest, lesson: dict, payer: str | None, shown: dict | None, succeeded: bool
) -> list[Check]:
    """The per-field results the lesson screens show as a checklist."""
    expected_recipient = lesson["expectedRecipient"]
    label = lesson.get("trustedReferenceLabel")
    source = shown["source"] if shown else None
    destination = shown["destination"] if shown else None
    lamports = shown["lamports"] if shown else 0

    if destination is None:
        to_value = "—"
    elif label and destination != expected_recipient:
        # The short form of a look-alike matches the real one, so it can't be the value shown here.
        to_value = f"NOT {label}"
    else:
        to_value = _short(destination)

    return [
        Check(label="Transaction found on devnet", value=_short(req.signature), ok=True),
        Check(
            label="From your wallet",
            value=_short(source) if source else "—",
            ok=payer == req.wallet and source == req.wallet,
        ),
        Check(
            label=f"Sent to {label}'s wallet" if label else "To the lesson wallet",
            value=to_value,
            ok=destination == expected_recipient,
        ),
        Check(label="Amount", value=_sol(lamports), ok=lamports == lesson["expectedLamports"]),
        Check(label="Status", value="confirmed" if succeeded else "failed", ok=succeeded),
    ]


def _fee_payer(tx: dict) -> str | None:
    """First account key is always the fee payer. jsonParsed gives objects, json gives strings."""
    keys = tx.get("transaction", {}).get("message", {}).get("accountKeys") or []
    if not keys:
        return None
    first = keys[0]
    return first.get("pubkey") if isinstance(first, dict) else first


def _system_transfers(tx: dict) -> list[dict]:
    """Top-level System Program transfers as {source, destination, lamports}."""
    instructions = tx.get("transaction", {}).get("message", {}).get("instructions") or []
    transfers = []
    for ix in instructions:
        parsed = ix.get("parsed")
        if ix.get("program") == "system" and isinstance(parsed, dict) and parsed.get("type") == "transfer":
            info = parsed.get("info", {})
            transfers.append(
                {
                    "source": info.get("source"),
                    "destination": info.get("destination"),
                    "lamports": int(info.get("lamports", 0)),
                }
            )
    return transfers


async def verify(req: VerifyRequest, lesson: dict) -> VerifyResponse:
    """Grade one lesson attempt from its exact transaction signature.

    Checks (see docs/SPEC.md, "Verification design" and docs/API.md):
      1. Transaction can be fetched from devnet by signature
      2. It reached REQUIRED_COMMITMENT (getTransaction only returns it once it has)
      3. It succeeded (meta.err is None), not merely submitted
      4. `req.wallet` is the fee payer
      5. A system transfer from the wallet sends expectedLamports to expectedRecipient
         (lesson 3: sending to lookalikeRecipient fails with a scam-trap reason)
      6. Signature was not already used to pass a different lesson

    Never grades by scanning wallet history. Timeouts and "not found yet" are `pending`.
    """
    expected_recipient = lesson.get("expectedRecipient", "")
    expected_lamports = lesson.get("expectedLamports")
    if not is_pubkey(expected_recipient) or not isinstance(expected_lamports, int):
        # Config bug on our side, not the learner's fault.
        return _fail(f"Lesson {lesson['id']} isn't configured yet (missing recipient or amount).")

    # Cheap input checks first: a malformed signature would otherwise look like an RPC error
    # and stay "pending" forever.
    if not is_pubkey(req.wallet):
        return _fail("That wallet address isn't a valid Solana address.")
    if not is_signature(req.signature):
        return _fail("That transaction signature isn't valid. Send the signature returned by Phantom.")

    # Check 6 (early): a signature that already passed another lesson can't pass this one.
    used_for = signature_store.lesson_for_signature(req.signature)
    if used_for is not None and used_for != lesson["id"]:
        return _fail("This transaction was already used to complete a different lesson. Send a new one.")

    # Checks 1 & 2
    try:
        tx = await get_transaction(req.signature, REQUIRED_COMMITMENT)
    except RpcUnavailable:
        return _pending("Devnet RPC is slow or unavailable. Retry in a few seconds.")
    if tx is None:
        return _pending("Transaction not confirmed yet. Retry in a few seconds.")

    meta = tx.get("meta") or {}
    succeeded = meta.get("err") is None
    payer = _fee_payer(tx)
    all_transfers = _system_transfers(tx)
    transfers = [t for t in all_transfers if t["source"] == req.wallet]

    lookalike = lesson.get("lookalikeRecipient")
    to_lookalike = [t for t in transfers if lookalike and t["destination"] == lookalike]
    to_expected = [t for t in transfers if t["destination"] == expected_recipient]
    exact = [t for t in to_expected if t["lamports"] == expected_lamports]

    # The transfer the checklist describes: the one that decides the outcome below.
    candidates = to_lookalike or exact or to_expected or transfers or all_transfers
    checks = _build_checks(req, lesson, payer, candidates[0] if candidates else None, succeeded)

    # Check 3
    if not succeeded:
        return _fail("The transaction was submitted but failed on chain, so no SOL moved. Try again.", checks)

    # Check 4
    if payer != req.wallet:
        return _fail("This transaction wasn't sent from your connected wallet.", checks)

    # Check 5
    if not transfers:
        return _fail("This transaction doesn't contain a SOL transfer from your wallet.", checks)

    if to_lookalike:
        label = lesson.get("trustedReferenceLabel", "the trusted recipient")
        return _fail(
            f"Scam trap! You sent {_sol(to_lookalike[0]['lamports'])} to {lookalike}, "
            f"but {label}'s real address is {expected_recipient}. They share the same start and end, "
            "but they are different addresses, and on mainnet that SOL would be gone. "
            "Always compare the full address against a trusted source before signing.",
            checks,
        )

    if not to_expected:
        return _fail(
            f"The SOL went to {transfers[0]['destination']}, not the lesson's recipient "
            f"{expected_recipient}. Check the recipient before signing.",
            checks,
        )

    if not exact:
        return _fail(
            f"You sent {_sol(to_expected[0]['lamports'])} but this lesson asks for exactly "
            f"{_sol(expected_lamports)}. Check the amount before signing.",
            checks,
        )

    signature_store.record_pass(req.signature, lesson["id"])
    return VerifyResponse(
        status="pass",
        reason=f"Confirmed on devnet: you sent {_sol(expected_lamports)} to the right address.",
        checks=checks,
    )
