"""Async Anthropic Messages client that returns a structured Breakdown.

Uses Anthropic's tool-use feature to force JSON output that matches our
Pydantic schema, so we get reliable structured data without prompt-parsing
gymnastics.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional

import httpx
from dotenv import load_dotenv

from schemas import Breakdown, TestSuiteResponse

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_DEFAULT_MODEL", "claude-sonnet-4-5")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"

if not ANTHROPIC_API_KEY:
    raise RuntimeError("ANTHROPIC_API_KEY must be set in the environment (.env).")

_BREAKDOWN_TOOL: Dict[str, Any] = {
    "name": "output_breakdown",
    "description": (
        "Emit the structured breakdown of the BA requirement into stories "
        "and tasks, along with any ambiguity warnings. Always call this tool exactly once."
    ),
    "input_schema": {
        "type": "object",
        "required": ["project_name", "summary", "stories", "tasks", "ambiguity_warnings"],
        "properties": {
            "project_name": {"type": "string"},
            "summary": {
                "type": "string",
                "description": "One-paragraph summary of what's being built.",
            },
            "stories": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "required": [
                        "id", "title", "description",
                        "acceptance_criteria", "story_points",
                    ],
                    "properties": {
                        "id": {"type": "string", "description": "e.g. STORY-1"},
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                        "acceptance_criteria": {
                            "type": "array", "items": {"type": "string"},
                        },
                        "story_points": {
                            "type": "integer", "enum": [1, 2, 3, 5, 8, 13, 21],
                        },
                    },
                },
            },
            "tasks": {
                "type": "array",
                "minItems": 4,
                "items": {
                    "type": "object",
                    "required": [
                        "id", "title", "description",
                        "assignee_type", "estimate_hours",
                    ],
                    "properties": {
                        "id": {"type": "string", "description": "e.g. TASK-1"},
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                        "assignee_type": {
                            "type": "string",
                            "enum": ["dev", "qa", "design", "devops"],
                        },
                        "parent_story_id": {"type": "string"},
                        "estimate_hours": {"type": "number"},
                    },
                },
            },
            "ambiguity_warnings": {
                "type": "array",
                "description": (
                    "List of ambiguities, vague areas, or missing details found "
                    "in the requirement. Empty array if the requirement is clear."
                ),
                "items": {
                    "type": "object",
                    "required": ["area", "concern", "suggestion"],
                    "properties": {
                        "area": {
                            "type": "string",
                            "description": "Which part of the requirement is ambiguous.",
                        },
                        "concern": {
                            "type": "string",
                            "description": "What is unclear or could be interpreted multiple ways.",
                        },
                        "suggestion": {
                            "type": "string",
                            "description": "How the user could clarify or improve this part.",
                        },
                    },
                },
            },
        },
    },
}

_SYSTEM_PROMPT = """\
You are a senior product manager and tech lead translating business analyst
requirements into a structured backlog for an Agile team (developers, QAs,
designers, devops).

For the requirement you are given, produce ALL of the following:

1. SUMMARY — a single-paragraph description of what is being built.

2. AMBIGUITY WARNINGS — Critically analyse the requirement for:
   - Vague or undefined terms (e.g. "fast", "user-friendly", "secure" without
     measurable criteria).
   - Missing information (e.g. no mention of error handling, edge cases,
     performance targets, supported platforms, user roles, or data volumes).
   - Contradictions or conflicting statements.
   - Assumptions that could be interpreted in more than one way.
   - Scope gaps (e.g. mentions a feature but not how it interacts with
     existing systems).
   For each ambiguity found, provide: the AREA (which part of the requirement),
   the CONCERN (what exactly is unclear), and a SUGGESTION (how the user could
   clarify it). If the requirement is crystal clear, return an empty array.
   Be genuinely helpful — flag real issues, not trivial nitpicks.

3. STORIES (typically 3-8). Each story:
   - has a clear "As a … I want … so that …" or equivalent description,
   - lists 2-5 concrete acceptance criteria,
   - has a story_points estimate from {1, 2, 3, 5, 8, 13, 21}.

4. TASKS — REQUIRED, minimum 4 in total, typically 2-3 per story.
   Tasks break stories into concrete engineering / QA / design / devops work.
   - Each task has assignee_type ∈ {dev, qa, design, devops}.
   - Each task has an estimate_hours.
   - Tasks SHOULD reference parent_story_id linking back to a story.
   - Include a mix: most tasks are "dev", but include at least one QA task
     (test plan / automation / regression) and consider design/devops tasks
     when relevant (UI mockups, infrastructure, deployment, monitoring).

If the user provides Jira issue references or document content, use that
information to inform and enrich your breakdown. Incorporate relevant details
from those sources into the stories and tasks.

Be concrete and specific to the requirement. Avoid generic filler like
"write unit tests" or "do code review" — those apply to every project.
Each task should be obviously about THIS requirement.

Always call the `output_breakdown` tool exactly once — do not respond in plain
text. IDs should be STORY-1, STORY-2, TASK-1, … in stable order.
"""

_client: Optional[httpx.AsyncClient] = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(connect=10.0, read=120.0, write=30.0, pool=10.0),
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
        )
    return _client


async def aclose() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


async def generate_breakdown(
    project_name: str,
    requirements: str,
    extra_context: Optional[str] = None,
    jira_links: Optional[str] = None,
    document_text: Optional[str] = None,
) -> Breakdown:
    user_parts = [f"PROJECT: {project_name}", "", "REQUIREMENTS:", requirements]
    if document_text:
        user_parts += ["", "DOCUMENT CONTENT:", document_text]
    if jira_links:
        user_parts += ["", "JIRA REFERENCES:", jira_links]
    if extra_context:
        user_parts += ["", "ADDITIONAL CONTEXT:", extra_context]
    user_message = "\n".join(user_parts)

    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 4096,
        "system": _SYSTEM_PROMPT,
        "tools": [_BREAKDOWN_TOOL],
        "tool_choice": {"type": "tool", "name": "output_breakdown"},
        "messages": [{"role": "user", "content": user_message}],
    }

    client = _get_client()
    resp = await client.post(ANTHROPIC_API_URL, json=payload)
    if resp.status_code >= 400:
        raise RuntimeError(
            f"Anthropic API error {resp.status_code}: {resp.text}"
        )

    data = resp.json()
    tool_input: Optional[Dict[str, Any]] = None
    for block in data.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == "output_breakdown":
            tool_input = block.get("input")
            break

    if tool_input is None:
        text_blocks = [
            b.get("text", "") for b in data.get("content", []) if b.get("type") == "text"
        ]
        raise RuntimeError(
            "Anthropic did not return a tool_use block. "
            f"Raw text: {' '.join(text_blocks) or json.dumps(data)[:400]}"
        )

    return Breakdown(**tool_input)


# ---- Test-case generation ----

_TEST_CASE_TOOL: Dict[str, Any] = {
    "name": "output_test_cases",
    "description": (
        "Emit structured test cases for the given breakdown. "
        "Always call this tool exactly once."
    ),
    "input_schema": {
        "type": "object",
        "required": ["test_cases"],
        "properties": {
            "test_cases": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "required": [
                        "id", "title", "preconditions",
                        "priority", "related_story_id", "steps",
                    ],
                    "properties": {
                        "id": {"type": "string", "description": "e.g. TC-1"},
                        "title": {"type": "string"},
                        "preconditions": {
                            "type": "string",
                            "description": "Setup required before executing.",
                        },
                        "priority": {
                            "type": "string",
                            "enum": ["critical", "high", "medium", "low"],
                        },
                        "related_story_id": {
                            "type": ["string", "null"],
                            "description": "Story ID this test covers, or null.",
                        },
                        "steps": {
                            "type": "array",
                            "minItems": 1,
                            "items": {
                                "type": "object",
                                "required": ["step_number", "action", "expected_result"],
                                "properties": {
                                    "step_number": {"type": "integer", "minimum": 1},
                                    "action": {"type": "string"},
                                    "expected_result": {"type": "string"},
                                },
                            },
                        },
                    },
                },
            },
        },
    },
}

_TEST_CASE_SYSTEM_PROMPT = """\
You are a senior QA engineer generating test cases from a structured product
breakdown (stories + tasks + acceptance criteria).

Test case generation rules (strictly enforced):
- Favour depth over breadth: produce as FEW test cases as possible.
- Before creating a new test case, ask: can this scenario be a step inside an
  existing one? If yes, make it a step, not a new test case.
- Only create a separate test case when the precondition or actor is
  fundamentally different.
- Each test case must have a descriptive title, clear preconditions, a priority
  (critical / high / medium / low), and detailed numbered steps with expected
  results.
- Steps should be concrete and specific to THIS product, not generic.
- Cover the happy path first, then key negative / edge cases — but only as
  separate test cases when they truly require different setup.
- Reference the related story ID (e.g. STORY-1) for traceability.
- IDs should be TC-1, TC-2, … in stable order.

Always call the `output_test_cases` tool exactly once — do not respond in plain
text.
"""


async def generate_test_cases(breakdown_dict: Dict[str, Any]) -> TestSuiteResponse:
    stories_text = []
    for s in breakdown_dict.get("stories", []):
        ac = "\n".join(f"  - {c}" for c in s.get("acceptance_criteria", []))
        stories_text.append(
            f"{s['id']}: {s['title']}\n  {s['description']}\n"
            f"  Acceptance criteria:\n{ac}"
        )
    tasks_text = []
    for t in breakdown_dict.get("tasks", []):
        parent = f" (parent: {t['parent_story_id']})" if t.get("parent_story_id") else ""
        tasks_text.append(f"{t['id']}: {t['title']}{parent}\n  {t['description']}")

    user_message = (
        f"PROJECT: {breakdown_dict.get('project_name', 'Untitled')}\n\n"
        f"SUMMARY:\n{breakdown_dict.get('summary', '')}\n\n"
        f"STORIES:\n" + "\n\n".join(stories_text) + "\n\n"
        f"TASKS:\n" + "\n\n".join(tasks_text)
    )

    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 4096,
        "system": _TEST_CASE_SYSTEM_PROMPT,
        "tools": [_TEST_CASE_TOOL],
        "tool_choice": {"type": "tool", "name": "output_test_cases"},
        "messages": [{"role": "user", "content": user_message}],
    }

    client = _get_client()
    resp = await client.post(ANTHROPIC_API_URL, json=payload)
    if resp.status_code >= 400:
        raise RuntimeError(
            f"Anthropic API error {resp.status_code}: {resp.text}"
        )

    data = resp.json()
    tool_input: Optional[Dict[str, Any]] = None
    for block in data.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == "output_test_cases":
            tool_input = block.get("input")
            break

    if tool_input is None:
        text_blocks = [
            b.get("text", "") for b in data.get("content", []) if b.get("type") == "text"
        ]
        raise RuntimeError(
            "Anthropic did not return a tool_use block for test cases. "
            f"Raw text: {' '.join(text_blocks) or json.dumps(data)[:400]}"
        )

    return TestSuiteResponse(**tool_input)
