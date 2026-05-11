import json
import uuid
from datetime import datetime, timezone

from .dynamodb import get_connection


def create_requirement(raw_text: str, source_file: str | None = None) -> dict:
    conn = get_connection()
    item = {
        "requirement_id": str(uuid.uuid4()),
        "raw_text": raw_text,
        "source_file": source_file or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
    }
    conn.execute(
        "INSERT INTO requirements (requirement_id, raw_text, source_file, created_at, status) VALUES (?, ?, ?, ?, ?)",
        (item["requirement_id"], item["raw_text"], item["source_file"], item["created_at"], item["status"]),
    )
    conn.commit()
    conn.close()
    return item


def get_requirement(requirement_id: str) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM requirements WHERE requirement_id = ?", (requirement_id,)
    ).fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def update_requirement_status(requirement_id: str, status: str):
    conn = get_connection()
    conn.execute(
        "UPDATE requirements SET status = ? WHERE requirement_id = ?",
        (status, requirement_id),
    )
    conn.commit()
    conn.close()


def list_requirements() -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM requirements ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def save_artifact(requirement_id: str, artifact_type: str, content: dict) -> dict:
    conn = get_connection()
    generated_at = datetime.now(timezone.utc).isoformat()
    content_json = json.dumps(content)
    conn.execute(
        """INSERT OR REPLACE INTO artifacts (requirement_id, artifact_type, content, generated_at)
           VALUES (?, ?, ?, ?)""",
        (requirement_id, artifact_type, content_json, generated_at),
    )
    conn.commit()
    conn.close()
    return {
        "requirement_id": requirement_id,
        "artifact_type": artifact_type,
        "content": content,
        "generated_at": generated_at,
    }


def get_artifacts(requirement_id: str) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM artifacts WHERE requirement_id = ?", (requirement_id,)
    ).fetchall()
    conn.close()
    items = []
    for row in rows:
        item = dict(row)
        item["content"] = json.loads(item["content"])
        items.append(item)
    return items


def get_artifact(requirement_id: str, artifact_type: str) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM artifacts WHERE requirement_id = ? AND artifact_type = ?",
        (requirement_id, artifact_type),
    ).fetchone()
    conn.close()
    if row:
        item = dict(row)
        item["content"] = json.loads(item["content"])
        return item
    return None
