// Client for POST /verify. Contract lives in docs/API.md; change it there first.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const RETRY_MS = 2000;
const MAX_ATTEMPTS = 15; // about 30 seconds

// POST { lessonId, wallet, signature } → { status, reason, checks }
export async function verifyLesson({ lessonId, wallet, signature }) {
  const res = await fetch(`${API_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, wallet, signature }),
  });
  if (!res.ok) throw new Error(`The verifier rejected the request (${res.status}).`);
  return res.json();
}

// Retries while status is "pending". Still returns "pending" if time runs out, so the
// lesson can offer "Check again" instead of showing a failure.
export async function verifyUntilSettled(args) {
  let last = { status: "pending", reason: "Still waiting for devnet to confirm.", checks: [] };
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, RETRY_MS));
    try {
      last = await verifyLesson(args);
    } catch (e) {
      if (!(e instanceof TypeError)) throw e; // a real rejection, retrying won't help
      // fetch throws TypeError when the server can't be reached
      last = { status: "pending", reason: "Can't reach the verifier. Is the backend running on port 8000?", checks: [] };
    }
    if (last.status !== "pending") return last;
  }
  return last;
}
