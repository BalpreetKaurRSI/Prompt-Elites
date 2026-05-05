from fastapi import APIRouter, HTTPException

from database.models import get_requirement, save_artifact, get_artifact
from services.ai_service import detect_ambiguities

router = APIRouter()


@router.post("/requirements/{requirement_id}/ambiguity")
async def analyze_ambiguity(requirement_id: str):
    """Detect ambiguities in a requirement."""
    requirement = get_requirement(requirement_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    raw_text = requirement["raw_text"]

    try:
        result = await detect_ambiguities(raw_text)
        save_artifact(requirement_id, "ambiguity", result)
        return {"requirement_id": requirement_id, "artifact_type": "ambiguity", "content": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ambiguity detection failed: {str(e)}")


@router.get("/requirements/{requirement_id}/ambiguity")
async def get_ambiguity_results(requirement_id: str):
    """Retrieve ambiguity analysis for a requirement."""
    artifact = get_artifact(requirement_id, "ambiguity")
    if not artifact:
        raise HTTPException(status_code=404, detail="Ambiguity analysis not yet generated")
    return {"requirement_id": requirement_id, "content": artifact["content"]}
