"""Pydantic models for the requirements-breakdown API."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ---------- Work items ----------

class Story(BaseModel):
    id: str = Field(..., description="Stable id, e.g. STORY-1")
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    acceptance_criteria: List[str] = Field(default_factory=list)
    story_points: int = Field(
        3, ge=1, le=21,
        description="Fibonacci-ish estimate: 1, 2, 3, 5, 8, 13, 21.",
    )


class Task(BaseModel):
    id: str = Field(..., description="Stable id, e.g. TASK-1")
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    assignee_type: Literal["dev", "qa", "design", "devops"]
    parent_story_id: Optional[str] = None
    estimate_hours: float = Field(4.0, ge=0.25, le=80)


# ---------- API contract ----------

class BreakdownRequest(BaseModel):
    project_name: str = Field("Untitled project", description="Optional label.")
    requirements: str = Field(
        ...,
        min_length=20,
        description="Free-form requirements text from the BA.",
    )
    extra_context: Optional[str] = Field(
        None,
        description="Optional extra context: tech stack, constraints, prior work.",
    )
    jira_links: Optional[str] = Field(
        None,
        description="Jira URLs or issue keys pasted by the user for reference.",
    )
    document_text: Optional[str] = Field(
        None,
        description="Text extracted from uploaded documents (PDF, DOCX, TXT, CSV).",
    )


class AmbiguityWarning(BaseModel):
    area: str = Field(..., description="Which part of the requirement is ambiguous.")
    concern: str = Field(..., description="What is unclear or could be interpreted multiple ways.")
    suggestion: str = Field(..., description="How the user could clarify this.")


class Breakdown(BaseModel):
    project_name: str
    summary: str = Field(
        ...,
        description="One-paragraph summary of what's being built.",
    )
    stories: List[Story] = Field(default_factory=list)
    tasks: List[Task] = Field(default_factory=list)
    ambiguity_warnings: List[AmbiguityWarning] = Field(default_factory=list)


class BreakdownWithHistory(Breakdown):
    history_id: int = Field(..., description="ID of the saved history record.")


class HistoryEntry(BaseModel):
    id: int
    project_name: str
    summary: str
    story_count: int
    task_count: int
    created_at: str
    updated_at: str


class HistoryDetail(BaseModel):
    id: int
    breakdown: Breakdown
    created_at: str
    updated_at: str


# ---------- Test cases ----------

class TestStep(BaseModel):
    step_number: int = Field(..., ge=1)
    action: str = Field(..., min_length=1, description="What the tester does.")
    expected_result: str = Field(..., min_length=1, description="What should happen.")


class TestCase(BaseModel):
    id: str = Field(..., description="Stable id, e.g. TC-1")
    title: str = Field(..., min_length=1)
    preconditions: str = Field("", description="Setup required before executing.")
    priority: Literal["critical", "high", "medium", "low"]
    related_story_id: Optional[str] = Field(None, description="Parent story this covers.")
    steps: List[TestStep] = Field(..., min_items=1)


class TestSuiteRequest(BaseModel):
    breakdown: Breakdown


class TestSuiteResponse(BaseModel):
    test_cases: List[TestCase] = Field(default_factory=list)


class APIError(BaseModel):
    detail: str
