"""FastAPI app for the requirements-breakdown service."""

from __future__ import annotations

import io
from contextlib import asynccontextmanager
from typing import List

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from anthropic_client import aclose as close_anthropic_client, generate_breakdown, generate_test_cases
from database import close_db, save_breakdown, list_history, get_history, update_breakdown, delete_history
from schemas import (
    APIError, Breakdown, BreakdownRequest, BreakdownWithHistory,
    HistoryDetail, HistoryEntry, TestSuiteRequest, TestSuiteResponse,
)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class UploadResponse(BaseModel):
    extracted_text: str


def _extract_text(filename: str, content: bytes) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext in ("txt", "csv"):
        return content.decode("utf-8", errors="replace")

    if ext == "pdf":
        from PyPDF2 import PdfReader

        reader = PdfReader(io.BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages).strip()

    if ext == "docx":
        from docx import Document

        doc = Document(io.BytesIO(content))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())

    raise ValueError(f"Unsupported file type: .{ext}")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    await close_anthropic_client()
    await close_db()


app = FastAPI(
    title="Requirements Planner API",
    description=(
        "Takes BA requirements and returns a structured breakdown of "
        "Stories and Tasks to help an Agile team plan work."
    ),
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok", "service": "requirements-planner"}


@app.post(
    "/api/upload",
    response_model=UploadResponse,
    responses={400: {"model": APIError}},
    tags=["upload"],
)
async def upload_documents(files: List[UploadFile] = File(...)) -> UploadResponse:
    texts: list[str] = []
    for f in files:
        if not f.filename:
            continue
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
        if f".{ext}" not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: .{ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            )
        content = await f.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File {f.filename} exceeds 10 MB limit.",
            )
        try:
            extracted = _extract_text(f.filename, content)
            if extracted.strip():
                texts.append(f"--- {f.filename} ---\n{extracted}")
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to extract text from {f.filename}: {exc}",
            )

    return UploadResponse(extracted_text="\n\n".join(texts))


@app.post(
    "/api/breakdown",
    response_model=BreakdownWithHistory,
    responses={400: {"model": APIError}, 502: {"model": APIError}},
    tags=["breakdown"],
)
async def breakdown(req: BreakdownRequest) -> BreakdownWithHistory:
    try:
        result = await generate_breakdown(
            project_name=req.project_name,
            requirements=req.requirements,
            extra_context=req.extra_context,
            jira_links=req.jira_links,
            document_text=req.document_text,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}")

    history_id = await save_breakdown(result.model_dump())
    return BreakdownWithHistory(**result.model_dump(), history_id=history_id)


# ---- Test-case generation ----

@app.post(
    "/api/test-cases",
    response_model=TestSuiteResponse,
    responses={502: {"model": APIError}},
    tags=["test-cases"],
)
async def test_cases(req: TestSuiteRequest) -> TestSuiteResponse:
    try:
        return await generate_test_cases(req.breakdown.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}")


# ---- History CRUD ----

@app.get(
    "/api/history",
    response_model=List[HistoryEntry],
    tags=["history"],
)
async def get_history_list() -> List[HistoryEntry]:
    rows = await list_history()
    return [HistoryEntry(**r) for r in rows]


@app.get(
    "/api/history/{history_id}",
    response_model=HistoryDetail,
    responses={404: {"model": APIError}},
    tags=["history"],
)
async def get_history_detail(history_id: int) -> HistoryDetail:
    record = await get_history(history_id)
    if record is None:
        raise HTTPException(status_code=404, detail="History record not found.")
    return HistoryDetail(**record)


@app.put(
    "/api/history/{history_id}",
    response_model=HistoryDetail,
    responses={404: {"model": APIError}},
    tags=["history"],
)
async def update_history_record(history_id: int, body: Breakdown) -> HistoryDetail:
    updated = await update_breakdown(history_id, body.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="History record not found.")
    record = await get_history(history_id)
    return HistoryDetail(**record)  # type: ignore[arg-type]


@app.delete(
    "/api/history/{history_id}",
    responses={404: {"model": APIError}},
    tags=["history"],
)
async def delete_history_record(history_id: int) -> dict:
    deleted = await delete_history(history_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="History record not found.")
    return {"ok": True}
