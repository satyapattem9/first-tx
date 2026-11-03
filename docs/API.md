# Verifier API

Hand-off contract between the frontend (Person A) and backend (Person B).
If you change anything here, update `backend/app/models.py` and `frontend/src/lib/verify.js` in the same commit.

Base URL (local): `http://localhost:8000`

## `POST /verify`

Grade one transaction-based lesson attempt from its exact signature.

**Request**

```json
{ "lessonId": "lesson-2-first-send", "wallet": "<learner pubkey>", "signature": "<tx signature>" }
```

**Response** (200)

```json
{ "status": "pass" | "fail" | "pending", "reason": "Human-readable explanation shown to the learner" }
```

| status | Meaning | Frontend should |
|---|---|---|
| `pass` | Tx is confirmed, succeeded, signed by `wallet`, sent `expectedLamports` to `expectedRecipient` | Mark lesson complete |
| `fail` | Tx is final and wrong (failed, wrong sender, wrong recipient, wrong amount, look-alike address) | Show `reason`, offer retry |
| `pending` | Not confirmed yet, not indexed yet, or RPC timed out | Wait ~2s and call again. **Never show this as a failure.** |

**Checks, in order**

0. `wallet` is a valid address and `signature` is a valid 64-byte signature, otherwise `fail` (so a typo can't sit in `pending` forever)
1. Signature hasn't already been used to pass a *different* lesson (re-verifying the same lesson is fine, so polling is safe)
2. Tx can be fetched from devnet by `signature` (`getTransaction`) and has reached `REQUIRED_COMMITMENT` (default `confirmed`); if not, `pending`
3. Tx succeeded (`meta.err` is `null`)
4. `wallet` is the fee payer
5. A system-program transfer from `wallet` sends exactly `expectedLamports` to `expectedRecipient`
   - Lesson 3: destination == `lookalikeRecipient` → `fail` with a reason starting `"Scam trap!"` that shows both full addresses

`reason` is written for the learner; the frontend can show it as is.

**Errors**

| Code | When |
|---|---|
| 404 | Unknown `lessonId` |
| 400 | Lesson has no transaction (lesson 1) |
| 422 | Malformed request body |

## `GET /lessons`

Returns the lesson array from `shared/lessons.json`.

## `GET /health`

`{ "ok": true }`
