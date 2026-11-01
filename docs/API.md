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

1. Tx can be fetched from devnet by `signature` (`getTransaction`)
2. Tx reached the required commitment (`REQUIRED_COMMITMENT`, default `confirmed`)
3. Tx succeeded (`meta.err` is `null`)
4. `wallet` is the fee payer / signer
5. A system-program transfer sends `expectedLamports` to `expectedRecipient`
   - Lesson 3: destination == `lookalikeRecipient` → `fail` with a scam-trap reason
6. Signature hasn't already been used for a different lesson

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
