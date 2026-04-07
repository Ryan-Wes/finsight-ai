from pathlib import Path

from app.services.parsers.credit_card_csv_parser import parse_credit_card_csv


file_path = Path("arquivos") / "Nubank_2026-04-08.csv"

with open(file_path, "rb") as file:
    file_bytes = file.read()

transactions = parse_credit_card_csv(file_bytes)

for transaction in transactions[:10]:
    print(transaction)