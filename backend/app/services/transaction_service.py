from sqlite3 import IntegrityError

from app.database import get_connection


def save_transactions(import_id: int, transactions: list[dict]) -> dict:
    inserted_count = 0
    skipped_count = 0
    skipped_transactions = []

    with get_connection() as connection:
        cursor = connection.cursor()

        for transaction in transactions:
            try:
                cursor.execute(
                    """
                    INSERT INTO transactions (
                        import_id,
                        transaction_date,
                        competency_month,
                        raw_description,
                        normalized_description,
                        amount,
                        absolute_amount,
                        direction,
                        transaction_type,
                        category,
                        source_name,
                        source_type,
                        file_format,
                        is_ignored_in_spending,
                        is_internal_transfer,
                        installment_current,
                        installment_total,
                        transaction_hash
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        import_id,
                        transaction["transaction_date"],
                        transaction["competency_month"],
                        transaction["raw_description"],
                        transaction["normalized_description"],
                        transaction["amount"],
                        transaction["absolute_amount"],
                        transaction["direction"],
                        transaction["transaction_type"],
                        transaction["category"],
                        transaction["source_name"],
                        transaction["source_type"],
                        transaction["file_format"],
                        transaction["is_ignored_in_spending"],
                        transaction["is_internal_transfer"],
                        transaction["installment_current"],
                        transaction["installment_total"],
                        transaction["transaction_hash"],
                    ),
                )
                inserted_count += 1
            except IntegrityError:
                skipped_count += 1
                skipped_transactions.append(
                    {
                        "transaction_date": transaction["transaction_date"],
                        "raw_description": transaction["raw_description"],
                        "amount": transaction["amount"],
                        "transaction_hash": transaction["transaction_hash"],
                    }
                )

        connection.commit()

    return {
        "inserted_count": inserted_count,
        "skipped_count": skipped_count,
        "skipped_transactions": skipped_transactions,
    }