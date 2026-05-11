import os

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'uploads')


def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


async def upload_file(file_bytes: bytes, filename: str, requirement_id: str) -> str:
    folder = os.path.join(UPLOAD_DIR, requirement_id)
    _ensure_dir(folder)
    filepath = os.path.join(folder, filename)
    with open(filepath, 'wb') as f:
        f.write(file_bytes)
    return f"{requirement_id}/{filename}"


async def download_file(key: str) -> bytes:
    filepath = os.path.join(UPLOAD_DIR, key)
    with open(filepath, 'rb') as f:
        return f.read()
