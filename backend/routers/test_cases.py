from fastapi import APIRouter, HTTPException

from database.models import get_requirement, save_artifact, get_artifact
from services.ai_service import generate_test_cases

router = APIRouter()


@router.post("/requirements/{requirement_id}/test-cases")
async def create_test_cases(requirement_id: str):
    """Generate test cases for a requirement."""
    requirement = get_requirement(requirement_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    raw_text = requirement["raw_text"]

    try:
        result = await generate_test_cases(raw_text)
        save_artifact(requirement_id, "test_cases", result)
        return {"requirement_id": requirement_id, "artifact_type": "test_cases", "content": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test case generation failed: {str(e)}")


@router.get("/requirements/{requirement_id}/test-cases")
async def get_test_cases(requirement_id: str):
    """Retrieve generated test cases for a requirement."""
    artifact = get_artifact(requirement_id, "test_cases")
    if not artifact:
        raise HTTPException(status_code=404, detail="Test cases not yet generated")
    return {"requirement_id": requirement_id, "content": artifact["content"]}
