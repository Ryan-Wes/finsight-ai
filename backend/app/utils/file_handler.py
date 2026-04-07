from hashlib import sha256
from pathlib import Path
from uuid import uuid4


BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"


def ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def generate_file_hash(file_bytes: bytes) -> str:
    return sha256(file_bytes).hexdigest()


def build_safe_filename(original_filename: str) -> str:
    extension = Path(original_filename).suffix
    return f"{uuid4().hex}{extension}"


def save_uploaded_file(file_bytes: bytes, original_filename: str) -> str:
    ensure_upload_dir()

    safe_filename = build_safe_filename(original_filename)
    file_path = UPLOAD_DIR / safe_filename
    file_path.write_bytes(file_bytes)

    return safe_filename


def get_uploaded_file_path(saved_filename: str) -> Path:
    return UPLOAD_DIR / saved_filename