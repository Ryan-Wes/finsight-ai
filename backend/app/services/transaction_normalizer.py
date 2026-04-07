import re
import unicodedata


def normalize_description(description: str) -> str:
    normalized = unicodedata.normalize("NFKD", description)
    normalized = normalized.encode("ascii", "ignore").decode("utf-8")
    normalized = normalized.lower().strip()

    normalized = re.sub(r"\s+", " ", normalized)
    normalized = re.sub(r"[^\w\s\*.-]", "", normalized)

    return normalized