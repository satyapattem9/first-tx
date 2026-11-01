from fastapi.testclient import TestClient

from app import verifier
from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"ok": True}


def test_lessons_load_from_shared_file():
    ids = [lesson["id"] for lesson in client.get("/lessons").json()]
    assert ids == ["lesson-1-connect", "lesson-2-first-send", "lesson-3-scam-trap"]


def test_unknown_lesson_is_404():
    resp = client.post("/verify", json={"lessonId": "nope", "wallet": "w", "signature": "s"})
    assert resp.status_code == 404


def test_tx_not_found_is_pending_not_fail(monkeypatch):
    async def not_indexed_yet(signature, commitment):
        return None

    monkeypatch.setattr(verifier, "get_transaction", not_indexed_yet)
    resp = client.post(
        "/verify", json={"lessonId": "lesson-2-first-send", "wallet": "w", "signature": "s"}
    )
    assert resp.json()["status"] == "pending"
