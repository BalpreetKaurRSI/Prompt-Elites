from pydantic import BaseModel


class RequirementTextInput(BaseModel):
    raw_text: str


class RequirementResponse(BaseModel):
    requirement_id: str
    raw_text: str
    source_file: str
    created_at: str
    status: str


class TaskItem(BaseModel):
    title: str
    description: str
    effort: str
    priority: str


class StructuredOutput(BaseModel):
    summary: str
    tasks: list[TaskItem]
    acceptance_criteria: list[str]


class TestCase(BaseModel):
    title: str
    given: str
    when: str
    then: str


class TestCasesOutput(BaseModel):
    test_cases: list[TestCase]


class AmbiguityItem(BaseModel):
    text: str
    issue: str
    suggestion: str


class AmbiguityOutput(BaseModel):
    ambiguities: list[AmbiguityItem]


class GenerateRequest(BaseModel):
    requirement_id: str


class ArtifactResponse(BaseModel):
    requirement_id: str
    artifact_type: str
    content: dict
    generated_at: str
