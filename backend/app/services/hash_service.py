from hashlib import sha256


def generate_transaction_hash(
    transaction_date: str,
    raw_description: str,
    amount: float,
    source_type: str,
    row_index: int | None = None,
) -> str:
    base_parts = [transaction_date, raw_description, str(amount), source_type]

    if row_index is not None:
        base_parts.append(str(row_index))

    base_string = "|".join(base_parts)
    return sha256(base_string.encode("utf-8")).hexdigest()