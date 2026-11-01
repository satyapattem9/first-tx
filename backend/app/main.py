from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_ORIGINS
from .lessons import get_lesson, load_lessons
from .models import VerifyRequest, VerifyResponse
from .verifier import verify

app = FastAPI(title="First Tx verifier")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/lessons")
def lessons() -> list[dict]:
    return list(load_lessons().values())


@app.post("/verify", response_model=VerifyResponse)
async def verify_endpoint(req: VerifyRequest) -> VerifyResponse:
    lesson = get_lesson(req.lessonId)
    if lesson is None:
        raise HTTPException(status_code=404, detail=f"Unknown lesson: {req.lessonId}")
    if not lesson.get("requiresTransaction"):
        raise HTTPException(status_code=400, detail=f"{req.lessonId} has no transaction to verify")
    return await verify(req, lesson)
