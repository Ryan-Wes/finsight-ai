import csv
import re
from io import StringIO

from app.services.hash_service import generate_transaction_hash
from app.services.transaction_normalizer import normalize_description


def extract_installment_info(description: str) -> tuple[int | None, int | None]:
    match = re.search(r"parcela\s+(\d+)/(\d+)", description, re.IGNORECASE)

    if not match:
        return None, None

    current = int(match.group(1))
    total = int(match.group(2))
    return current, total


def detect_transaction_type(description: str) -> str:
    lowered_description = description.lower()

    if lowered_description.startswith("iof de"):
        return "iof"

    return "purchase"


def parse_credit_card_csv(file_bytes: bytes, due_date: str | None = None) -> list[dict]:
    decoded_content = file_bytes.decode("utf-8-sig")
    csv_reader = csv.DictReader(StringIO(decoded_content))

    transactions = []

    for row_index, row in enumerate(csv_reader):
        transaction_date = row["date"].strip()
        raw_description = row["title"].strip()
        amount = float(row["amount"])

        signed_amount = -amount
        installment_current, installment_total = extract_installment_info(raw_description)
        transaction_type = detect_transaction_type(raw_description)
        normalized_description = normalize_description(raw_description)

        competency_month = due_date[:7] if due_date else transaction_date[:7]

        transaction_hash = generate_transaction_hash(
            transaction_date=transaction_date,
            raw_description=raw_description,
            amount=signed_amount,
            source_type="credit_card",
            row_index=row_index,
        )

        transaction = {
            "transaction_date": transaction_date,
            "competency_month": competency_month,
            "raw_description": raw_description,
            "normalized_description": normalized_description,
            "amount": signed_amount,
            "absolute_amount": amount,
            "direction": "out",
            "transaction_type": transaction_type,
            "category": None,
            "source_name": "nubank",
            "source_type": "credit_card",
            "file_format": "csv",
            "is_ignored_in_spending": 0,
            "is_internal_transfer": 0,
            "installment_current": installment_current,
            "installment_total": installment_total,
            "transaction_hash": transaction_hash,
        }

        transactions.append(transaction)

    return transactions