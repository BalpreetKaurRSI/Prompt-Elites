from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from models.schemas import RequirementTextInput, RequirementResponse
from database.models import create_requirement, get_requirement, list_requirements
from services.parser import parse_file
from services.preprocessor import preprocess
from services.s3_service import upload_file

router = APIRouter()


@router.post("/requirements", response_model=RequirementResponse)
async def ingest_requirement(input_data: RequirementTextInput):
    """Ingest a raw text requirement."""
    cleaned = preprocess(input_data.raw_text)
    item = create_requirement(raw_text=cleaned)
    return RequirementResponse(**item)


@router.post("/requirements/upload", response_model=RequirementResponse)
async def ingest_file(file: UploadFile = File(...)):
    """Ingest a requirement from an uploaded file (.txt, .docx, .pdf)."""
    allowed_extensions = {".txt", ".docx", ".pdf"}
    filename = file.filename or "unknown.txt"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(allowed_extensions)}",
        )

    file_bytes = await file.read()
    text = parse_file(file_bytes, filename)
    cleaned = preprocess(text)

    item = create_requirement(raw_text=cleaned, source_file=filename)

    await upload_file(file_bytes, filename, item["requirement_id"])

    return RequirementResponse(**item)


@router.get("/requirements", response_model=list[RequirementResponse])
async def get_all_requirements():
    """List all ingested requirements."""
    items = list_requirements()
    return [RequirementResponse(**item) for item in items]


@router.get("/requirements/{requirement_id}", response_model=RequirementResponse)
async def get_single_requirement(requirement_id: str):
    """Get a single requirement by ID."""
    item = get_requirement(requirement_id)
    if not item:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return RequirementResponse(**item)
