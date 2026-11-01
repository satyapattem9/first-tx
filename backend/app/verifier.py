from .config import REQUIRED_COMMITMENT
from .models import VerifyRequest, VerifyResponse
from .solana_rpc import RpcUnavailable, get_transaction


async def verify(req: VerifyRequest, lesson: dict) -> VerifyResponse:
    """Grade one lesson attempt from its exact transaction signature.

    Checks (see docs/SPEC.md, "Verification design"):
      1. Transaction can be fetched from devnet by signature
      2. It succeeded (meta.err is None), not merely submitted
      3. It reached REQUIRED_COMMITMENT
      4. `req.wallet` is the fee payer / signer
      5. Recipient and lamports match the lesson
      6. Signature belongs to this lesson attempt (not reused from another lesson)

    Never grade by scanning wallet history. Timeouts and "not found yet" are `pending`.
    """
    try:
        tx = await get_transaction(req.signature, REQUIRED_COMMITMENT)
    except RpcUnavailable:
        return VerifyResponse(status="pending", reason="Devnet RPC is slow or unavailable. Retry in a few seconds.")

    if tx is None:
        return VerifyResponse(status="pending", reason="Transaction not confirmed yet. Retry in a few seconds.")

    # TODO(Person B, Mon): check 2 — tx["meta"]["err"] must be None
    # TODO(Person B, Mon): check 4 — tx["transaction"]["message"]["accountKeys"][0] is the fee payer
    # TODO(Person B, Mon): check 5 — find the system-program "transfer" instruction
    #   (instruction["parsed"]["info"]: source, destination, lamports) and compare with
    #   lesson["expectedRecipient"] / lesson["expectedLamports"]. For lesson 3, if destination ==
    #   lesson["lookalikeRecipient"], fail with a scam-trap specific reason.
    # TODO(Person B, Tue): check 6 — reject signatures already used for a different lesson
    return VerifyResponse(status="fail", reason="Verifier checks not implemented yet.")
