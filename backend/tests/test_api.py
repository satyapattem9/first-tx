import os

import pytest
from fastapi.testclient import TestClient

from app import signature_store, verifier
from app.base58 import b58encode
from app.lessons import get_lesson
from app.main import app

client = TestClient(app)

WALLET = b58encode(bytes([7] * 32))
OTHER_WALLET = b58encode(bytes([9] * 32))
SIG = b58encode(bytes([1] * 64))
SIG2 = b58encode(bytes([2] * 64))

L2 = get_lesson("lesson-2-first-send")
L3 = get_lesson("lesson-3-scam-trap")


def make_tx(*, payer=WALLET, transfers=(), err=None):
    """Shape of getTransaction(encoding=jsonParsed) for a simple SOL transfer."""
    return {
        "meta": {"err": err, "fee": 5000},
        "transaction": {
            "message": {
                "accountKeys": [{"pubkey": payer, "signer": True, "writable": True}],
                "instructions": [
                    {
                        "program": "system",
                        "programId": "11111111111111111111111111111111",
                        "parsed": {
                            "type": "transfer",
                            "info": {"source": src, "destination": dst, "lamports": lamports},
                        },
                    }
                    for src, dst, lamports in transfers
                ],
            },
            "signatures": [SIG],
        },
    }


@pytest.fixture(autouse=True)
def isolated_store(tmp_path, monkeypatch):
    monkeypatch.setattr(signature_store, "SIGNATURE_STORE_PATH", tmp_path / "used.json")


def stub_rpc(monkeypatch, tx):
    async def fake(signature, commitment):
        return tx

    monkeypatch.setattr(verifier, "get_transaction", fake)


def post(lesson_id, wallet=WALLET, signature=SIG):
    return client.post("/verify", json={"lessonId": lesson_id, "wallet": wallet, "signature": signature})


# --- routes ---------------------------------------------------------------


def test_health():
    assert client.get("/health").json() == {"ok": True}


def test_lessons_load_from_shared_file():
    ids = [lesson["id"] for lesson in client.get("/lessons").json()]
    assert ids == ["lesson-1-connect", "lesson-2-first-send", "lesson-3-scam-trap"]


def test_lessons_have_real_addresses():
    from app.base58 import is_pubkey

    assert is_pubkey(L2["expectedRecipient"])
    assert is_pubkey(L3["expectedRecipient"])
    assert is_pubkey(L3["lookalikeRecipient"])
    assert L3["lookalikeRecipient"] != L3["expectedRecipient"]
    # Same start and end: the lesson is that checking only those isn't enough.
    assert L3["lookalikeRecipient"][:4] == L3["expectedRecipient"][:4]
    assert L3["lookalikeRecipient"][-4:] == L3["expectedRecipient"][-4:]


def test_unknown_lesson_is_404():
    assert post("nope").status_code == 404


def test_lesson_without_transaction_is_400():
    assert post("lesson-1-connect").status_code == 400


def test_malformed_body_is_422():
    assert client.post("/verify", json={"lessonId": "lesson-2-first-send"}).status_code == 422


# --- pending (never fail on slowness) ------------------------------------------


def test_tx_not_found_is_pending_not_fail(monkeypatch):
    stub_rpc(monkeypatch, None)
    assert post("lesson-2-first-send").json()["status"] == "pending"


def test_rpc_outage_is_pending_not_fail(monkeypatch):
    async def down(signature, commitment):
        raise verifier.RpcUnavailable("timeout")

    monkeypatch.setattr(verifier, "get_transaction", down)
    assert post("lesson-2-first-send").json()["status"] == "pending"


# --- input validation ------------------------------------------------------------


def test_garbage_signature_fails_instead_of_pending_forever():
    body = post("lesson-2-first-send", signature="not-a-signature").json()
    assert body["status"] == "fail"


def test_garbage_wallet_fails():
    assert post("lesson-2-first-send", wallet="0OIl").json()["status"] == "fail"


# --- lesson 2 ---------------------------------------------------------------------


def test_lesson2_pass(monkeypatch):
    stub_rpc(monkeypatch, make_tx(transfers=[(WALLET, L2["expectedRecipient"], L2["expectedLamports"])]))
    body = post("lesson-2-first-send").json()
    assert body["status"] == "pass", body


def test_failed_tx_fails(monkeypatch):
    tx = make_tx(
        transfers=[(WALLET, L2["expectedRecipient"], L2["expectedLamports"])],
        err={"InstructionError": [0, {"Custom": 1}]},
    )
    stub_rpc(monkeypatch, tx)
    body = post("lesson-2-first-send").json()
    assert body["status"] == "fail" and "failed on chain" in body["reason"]


def test_wrong_sender_fails(monkeypatch):
    stub_rpc(
        monkeypatch,
        make_tx(payer=OTHER_WALLET, transfers=[(OTHER_WALLET, L2["expectedRecipient"], L2["expectedLamports"])]),
    )
    body = post("lesson-2-first-send").json()
    assert body["status"] == "fail" and "connected wallet" in body["reason"]


def test_wrong_amount_fails(monkeypatch):
    stub_rpc(monkeypatch, make_tx(transfers=[(WALLET, L2["expectedRecipient"], 50_000_000)]))
    body = post("lesson-2-first-send").json()
    assert body["status"] == "fail" and "0.05 SOL" in body["reason"] and "0.1 SOL" in body["reason"]


def test_wrong_recipient_fails(monkeypatch):
    stub_rpc(monkeypatch, make_tx(transfers=[(WALLET, OTHER_WALLET, L2["expectedLamports"])]))
    body = post("lesson-2-first-send").json()
    assert body["status"] == "fail" and OTHER_WALLET in body["reason"]


def test_no_transfer_fails(monkeypatch):
    stub_rpc(monkeypatch, make_tx(transfers=[]))
    assert post("lesson-2-first-send").json()["status"] == "fail"


def test_amounts_shown_exactly():
    assert verifier._sol(100_000_000) == "0.1 SOL"
    assert verifier._sol(2_202_939) == "0.002202939 SOL"
    assert verifier._sol(3 * verifier.LAMPORTS_PER_SOL) == "3 SOL"


# --- lesson 3 (scam trap) -------------------------------------------------------


def test_lesson3_pass(monkeypatch):
    stub_rpc(monkeypatch, make_tx(transfers=[(WALLET, L3["expectedRecipient"], L3["expectedLamports"])]))
    assert post("lesson-3-scam-trap").json()["status"] == "pass"


def test_lesson3_lookalike_gets_scam_reason(monkeypatch):
    stub_rpc(monkeypatch, make_tx(transfers=[(WALLET, L3["lookalikeRecipient"], L3["expectedLamports"])]))
    body = post("lesson-3-scam-trap").json()
    assert body["status"] == "fail"
    assert "Scam trap" in body["reason"]
    assert L3["lookalikeRecipient"] in body["reason"] and L3["expectedRecipient"] in body["reason"]


def test_lookalike_checklist_flags_recipient_only(monkeypatch):
    stub_rpc(monkeypatch, make_tx(transfers=[(WALLET, L3["lookalikeRecipient"], L3["expectedLamports"])]))
    checks = {c["label"]: c for c in post("lesson-3-scam-trap").json()["checks"]}
    assert checks["Sent to Maya's wallet"]["ok"] is False
    assert checks["Sent to Maya's wallet"]["value"] == "NOT Maya"
    assert checks["Amount"]["ok"] is True
    assert checks["Status"]["ok"] is True


def test_pass_returns_all_green_checklist(monkeypatch):
    stub_rpc(monkeypatch, make_tx(transfers=[(WALLET, L2["expectedRecipient"], L2["expectedLamports"])]))
    checks = post("lesson-2-first-send").json()["checks"]
    assert len(checks) == 5 and all(c["ok"] for c in checks)


def test_pending_has_no_checklist(monkeypatch):
    stub_rpc(monkeypatch, None)
    assert post("lesson-2-first-send").json()["checks"] == []


# --- check 6: signature reuse ------------------------------------------------------


def test_signature_cannot_pass_two_lessons(monkeypatch):
    # One tx that (artificially) satisfies both lessons.
    tx = make_tx(
        transfers=[
            (WALLET, L2["expectedRecipient"], L2["expectedLamports"]),
            (WALLET, L3["expectedRecipient"], L3["expectedLamports"]),
        ]
    )
    stub_rpc(monkeypatch, tx)
    assert post("lesson-2-first-send").json()["status"] == "pass"
    body = post("lesson-3-scam-trap").json()
    assert body["status"] == "fail" and "different lesson" in body["reason"]


def test_same_lesson_can_reverify_same_signature(monkeypatch):
    stub_rpc(monkeypatch, make_tx(transfers=[(WALLET, L2["expectedRecipient"], L2["expectedLamports"])]))
    assert post("lesson-2-first-send").json()["status"] == "pass"
    assert post("lesson-2-first-send").json()["status"] == "pass"


# --- live devnet smoke test (opt-in) -----------------------------------------------


@pytest.mark.skipif(not os.getenv("LIVE_DEVNET"), reason="set LIVE_DEVNET=1 to hit real devnet")
def test_live_unknown_signature_is_pending():
    # A well-formed signature that doesn't exist: devnet returns null → pending.
    assert post("lesson-2-first-send", signature=SIG2).json()["status"] == "pending"
