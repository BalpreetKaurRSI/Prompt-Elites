from fastapi import APIRouter, HTTPException

from database.models import (
    get_requirement,
    save_artifact,
    get_artifacts,
    update_requirement_status,
)
from services.ai_service import generate_structured_output

router = APIRouter()


@router.post("/requirements/{requirement_id}/generate")
async def generate_artifacts(requirement_id: str):
    """Generate structured output (summary, tasks, acceptance criteria) for a requirement."""
    requirement = get_requirement(requirement_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    raw_text = requirement["raw_text"]
    update_requirement_status(requirement_id, "processing")

    try:
        result = await generate_structured_output(raw_text)
        save_artifact(requirement_id, "structured_output", result)
        update_requirement_status(requirement_id, "completed")
        return {"requirement_id": requirement_id, "artifact_type": "structured_output", "content": result}
    except Exception as e:
        update_requirement_status(requirement_id, "error")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.get("/requirements/{requirement_id}/artifacts")
async def get_all_artifacts(requirement_id: str):
    """Retrieve all generated artifacts for a requirement."""
    requirement = get_requirement(requirement_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    artifacts = get_artifacts(requirement_id)
    return {"requirement_id": requirement_id, "artifacts": artifacts}
