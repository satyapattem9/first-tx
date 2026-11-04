from typing import Literal

from pydantic import BaseModel

# Contract agreed in docs/API.md. Change it there first, then here and in frontend/src/lib/verify.js.


class VerifyRequest(BaseModel):
    lessonId: str
    wallet: str
    signature: str


class Check(BaseModel):
    label: str
    value: str
    ok: bool


class VerifyResponse(BaseModel):
    status: Literal["pass", "fail", "pending"]
    reason: str
    checks: list[Check] = []
