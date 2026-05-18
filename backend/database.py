"""SQLite persistence layer for breakdown history."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import aiosqlite

DB_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DB_DIR, "history.db")

_db: Optional[aiosqlite.Connection] = None


async def get_db() -> aiosqlite.Connection:
    global _db
    if _db is None:
        os.makedirs(DB_DIR, exist_ok=True)
        _db = await aiosqlite.connect(DB_PATH)
        _db.row_factory = aiosqlite.Row
        await _db.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                project_name  TEXT    NOT NULL,
                summary       TEXT    NOT NULL,
                breakdown_json TEXT   NOT NULL,
                created_at    TEXT    NOT NULL,
                updated_at    TEXT    NOT NULL
            )
        """)
        await _db.commit()
    return _db


async def close_db() -> None:
    global _db
    if _db is not None:
        await _db.close()
        _db = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def save_breakdown(breakdown_dict: Dict[str, Any]) -> int:
    db = await get_db()
    now = _now_iso()
    cursor = await db.execute(
        """
        INSERT INTO history (project_name, summary, breakdown_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            breakdown_dict["project_name"],
            breakdown_dict["summary"],
            json.dumps(breakdown_dict),
            now,
            now,
        ),
    )
    await db.commit()
    return cursor.lastrowid  # type: ignore[return-value]


async def list_history() -> List[Dict[str, Any]]:
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, project_name, summary, breakdown_json, created_at, updated_at "
        "FROM history ORDER BY updated_at DESC"
    )
    rows = await cursor.fetchall()
    result = []
    for row in rows:
        bd = json.loads(row["breakdown_json"])
        result.append({
            "id": row["id"],
            "project_name": row["project_name"],
            "summary": row["summary"],
            "story_count": len(bd.get("stories", [])),
            "task_count": len(bd.get("tasks", [])),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        })
    return result


async def get_history(history_id: int) -> Optional[Dict[str, Any]]:
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, breakdown_json, created_at, updated_at FROM history WHERE id = ?",
        (history_id,),
    )
    row = await cursor.fetchone()
    if row is None:
        return None
    return {
        "id": row["id"],
        "breakdown": json.loads(row["breakdown_json"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


async def update_breakdown(history_id: int, breakdown_dict: Dict[str, Any]) -> bool:
    db = await get_db()
    cursor = await db.execute(
        """
        UPDATE history
        SET project_name = ?, summary = ?, breakdown_json = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            breakdown_dict["project_name"],
            breakdown_dict["summary"],
            json.dumps(breakdown_dict),
            _now_iso(),
            history_id,
        ),
    )
    await db.commit()
    return cursor.rowcount > 0


async def delete_history(history_id: int) -> bool:
    db = await get_db()
    cursor = await db.execute("DELETE FROM history WHERE id = ?", (history_id,))
    await db.commit()
    return cursor.rowcount > 0
