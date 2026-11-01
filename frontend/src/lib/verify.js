// Client for POST /verify. Contract lives in docs/API.md; change it there first.

// TODO(Person A, Tue): POST { lessonId, wallet, signature } → { status, reason }
export async function verifyLesson({ lessonId, wallet, signature }) {}

// TODO(Person A, Tue): retry while status is "pending" (never show pending as a failure)
export async function verifyUntilSettled(args) {}
