import re


def clean_text(text: str) -> str:
    """Remove excess whitespace and normalize line breaks."""
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    lines = [line.strip() for line in text.split('\n')]
    return '\n'.join(lines).strip()


def truncate_text(text: str, max_chars: int = 15000) -> str:
    """Truncate text to stay within token limits for the AI model."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n\n[Text truncated due to length...]"


def preprocess(text: str) -> str:
    text = clean_text(text)
    text = truncate_text(text)
    return text
