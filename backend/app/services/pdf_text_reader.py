from pathlib import Path

import fitz


def extract_text_from_pdf(file_path: str) -> str:
    pdf_path = Path(file_path)
    document = fitz.open(pdf_path)

    full_text = []

    for page in document:
        full_text.append(page.get_text())

    document.close()
    return "\n".join(full_text)