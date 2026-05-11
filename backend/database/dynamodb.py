import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'sdlc.db')


def get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def create_tables():
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS requirements (
            requirement_id TEXT PRIMARY KEY,
            raw_text TEXT NOT NULL,
            source_file TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            status TEXT DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS artifacts (
            requirement_id TEXT NOT NULL,
            artifact_type TEXT NOT NULL,
            content TEXT NOT NULL,
            generated_at TEXT NOT NULL,
            PRIMARY KEY (requirement_id, artifact_type),
            FOREIGN KEY (requirement_id) REFERENCES requirements(requirement_id)
        );
    """)
    conn.commit()
    conn.close()
