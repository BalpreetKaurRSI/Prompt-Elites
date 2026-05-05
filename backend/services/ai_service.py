import os
import json
from openai import OpenAI


def _get_client() -> OpenAI:
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


STRUCTURED_OUTPUT_PROMPT = """You are an expert requirements analyst for software development teams.
Given the following raw requirement, produce a structured JSON object with:
1. "summary": A concise 2-3 sentence summary of the requirement.
2. "tasks": An array of development tasks, each with:
   - "title": Short task title
   - "description": Detailed description of what needs to be done
   - "effort": Estimated effort (e.g., "Small", "Medium", "Large", "XL")
   - "priority": Priority level ("High", "Medium", "Low")
3. "acceptance_criteria": An array of clear, testable acceptance criteria strings.

Respond ONLY with valid JSON. No markdown, no explanation."""

TEST_CASES_PROMPT = """You are a QA engineer who writes comprehensive test scenarios.
Given the following requirement, generate test cases in Given/When/Then format.
Return a JSON object with a "test_cases" array where each item has:
- "title": Short descriptive test name
- "given": The precondition/context
- "when": The action taken
- "then": The expected outcome

Include both happy path and edge case scenarios.
Respond ONLY with valid JSON. No markdown, no explanation."""

AMBIGUITY_PROMPT = """You are a requirements analyst specialized in identifying unclear, ambiguous, or incomplete requirements.
Given the following requirement text, identify any:
- Vague or undefined terms
- Missing details or assumptions
- Contradictory statements
- Unmeasurable criteria
- Implicit dependencies

Return a JSON object with an "ambiguities" array where each item has:
- "text": The specific ambiguous phrase or sentence from the requirement
- "issue": Why this is ambiguous or problematic
- "suggestion": A concrete suggestion to clarify or improve it

If the requirement is perfectly clear, return {"ambiguities": []}.
Respond ONLY with valid JSON. No markdown, no explanation."""


async def generate_structured_output(text: str) -> dict:
    client = _get_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": STRUCTURED_OUTPUT_PROMPT},
            {"role": "user", "content": text},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


async def generate_test_cases(text: str) -> dict:
    client = _get_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": TEST_CASES_PROMPT},
            {"role": "user", "content": text},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


async def detect_ambiguities(text: str) -> dict:
    client = _get_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": AMBIGUITY_PROMPT},
            {"role": "user", "content": text},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
