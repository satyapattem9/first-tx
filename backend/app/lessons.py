import json
from functools import lru_cache

from .config import LESSONS_PATH


@lru_cache
def load_lessons() -> dict[str, dict]:
    """Return lessons from shared/lessons.json keyed by lesson id."""
    data = json.loads(LESSONS_PATH.read_text(encoding="utf-8"))
    return {lesson["id"]: lesson for lesson in data["lessons"]}


def get_lesson(lesson_id: str) -> dict | None:
    return load_lessons().get(lesson_id)
