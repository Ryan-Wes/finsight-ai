from pathlib import Path


def detect_file_format(filename: str) -> str:
    extension = Path(filename).suffix.lower()

    if extension == ".pdf":
        return "pdf"
    if extension == ".ofx":
        return "ofx"
    if extension == ".csv":
        return "csv"

    return "unknown"


def detect_source_name(filename: str) -> str:
    lowered_name = filename.lower()

    if "nubank" in lowered_name:
        return "nubank"

    return "unknown"


def detect_source_type(filename: str) -> str:
    lowered_name = filename.lower()

    if "fatura" in lowered_name:
        return "credit_card"
    if "extrato" in lowered_name:
        return "bank_account"

    return "unknown"