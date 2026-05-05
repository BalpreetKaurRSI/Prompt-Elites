import os
import uuid
from datetime import datetime, timezone

from .dynamodb import get_dynamodb_resource


def _requirements_table():
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(os.getenv("DYNAMODB_REQUIREMENTS_TABLE", "requirements"))


def _artifacts_table():
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(os.getenv("DYNAMODB_ARTIFACTS_TABLE", "artifacts"))


def create_requirement(raw_text: str, source_file: str | None = None) -> dict:
    table = _requirements_table()
    item = {
        "requirement_id": str(uuid.uuid4()),
        "raw_text": raw_text,
        "source_file": source_file or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
    }
    table.put_item(Item=item)
    return item


def get_requirement(requirement_id: str) -> dict | None:
    table = _requirements_table()
    response = table.get_item(Key={"requirement_id": requirement_id})
    return response.get("Item")


def update_requirement_status(requirement_id: str, status: str):
    table = _requirements_table()
    table.update_item(
        Key={"requirement_id": requirement_id},
        UpdateExpression="SET #s = :status",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":status": status},
    )


def list_requirements() -> list[dict]:
    table = _requirements_table()
    response = table.scan()
    items = response.get("Items", [])
    return sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)


def save_artifact(requirement_id: str, artifact_type: str, content: dict):
    table = _artifacts_table()
    import json
    item = {
        "requirement_id": requirement_id,
        "artifact_type": artifact_type,
        "content": json.dumps(content),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    table.put_item(Item=item)
    return item


def get_artifacts(requirement_id: str) -> list[dict]:
    table = _artifacts_table()
    import json
    response = table.query(
        KeyConditionExpression="requirement_id = :rid",
        ExpressionAttributeValues={":rid": requirement_id},
    )
    items = response.get("Items", [])
    for item in items:
        if "content" in item and isinstance(item["content"], str):
            item["content"] = json.loads(item["content"])
    return items


def get_artifact(requirement_id: str, artifact_type: str) -> dict | None:
    table = _artifacts_table()
    import json
    response = table.get_item(
        Key={"requirement_id": requirement_id, "artifact_type": artifact_type}
    )
    item = response.get("Item")
    if item and "content" in item and isinstance(item["content"], str):
        item["content"] = json.loads(item["content"])
    return item
