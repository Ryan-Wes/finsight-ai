import re

from app.services.hash_service import generate_transaction_hash
from app.services.transaction_normalizer import normalize_description


MONTH_MAP = {
    "JAN": "01",
    "FEV": "02",
    "MAR": "03",
    "ABR": "04",
    "MAI": "05",
    "JUN": "06",
    "JUL": "07",
    "AGO": "08",
    "SET": "09",
    "OUT": "10",
    "NOV": "11",
    "DEZ": "12",
}


def parse_ptbr_date(date_str: str, year: str) -> str:
    day, month_abbr = date_str.strip().upper().split()
    month = MONTH_MAP[month_abbr]
    return f"{year}-{month}-{day.zfill(2)}"


def extract_installment_info(description: str) -> tuple[int | None, int | None]:
    match = re.search(r"parcela\s+(\d+)/(\d+)", description, re.IGNORECASE)

    if not match:
        return None, None

    return int(match.group(1)), int(match.group(2))


def detect_transaction_type(description: str) -> str:
    lowered = description.lower()

    if lowered.startswith("iof de"):
        return "iof"

    if lowered.startswith("pagamento em"):
        return "credit_card_payment"

    return "purchase"


def extract_statement_metadata(pdf_text: str) -> dict:
    due_date_match = re.search(
        r"Data de vencimento:\s*(\d{2})\s+([A-ZÇ]{3})\s+(\d{4})",
        pdf_text,
        re.IGNORECASE,
    )

    period_match = re.search(
        r"Período vigente:\s*(\d{2})\s+([A-ZÇ]{3})\s+a\s+(\d{2})\s+([A-ZÇ]{3})",
        pdf_text,
        re.IGNORECASE,
    )

    total_match = re.search(
        r"Esta é a sua fatura de\s+[a-zç]+,\s+no valor de\s+R\$\s*([\d\.,]+)",
        pdf_text,
        re.IGNORECASE,
    )

    if not due_date_match:
        return {
            "statement_period_start": None,
            "statement_period_end": None,
            "due_date": None,
            "total_amount": None,
        }

    due_day, due_month_abbr, due_year = due_date_match.groups()
    due_date = parse_ptbr_date(f"{due_day} {due_month_abbr}", due_year)

    statement_period_start = None
    statement_period_end = None

    if period_match:
        start_day, start_month_abbr, end_day, end_month_abbr = period_match.groups()

        statement_period_start = parse_ptbr_date(
            f"{start_day} {start_month_abbr}",
            due_year,
        )

        statement_period_end = parse_ptbr_date(
            f"{end_day} {end_month_abbr}",
            due_year,
        )

    total_amount = None
    if total_match:
        total_amount = float(total_match.group(1).replace(".", "").replace(",", "."))

    return {
        "statement_period_start": statement_period_start,
        "statement_period_end": statement_period_end,
        "due_date": due_date,
        "total_amount": total_amount,
    }


def clean_description(raw_description: str) -> str:
    description = re.sub(r"^••••\s*\d{4}\s*", "", raw_description).strip()
    description = re.sub(r"\s+", " ", description).strip()
    return description


def should_ignore_line(line: str) -> bool:
    normalized = normalize_description(line)

    ignored_patterns = [
        r"^wesley ryan lopes da rocha$",
        r"^fatura \d{2} [a-z]{3} \d{4} emissao e envio \d{2} [a-z]{3} \d{4}$",
        r"^\d+ de \d+$",
        r"^transacoes de \d{2} [a-z]{3} a \d{2} [a-z]{3}$",
        r"^wesley r l rocha r\$\s*[\d\.,]+$",
        r"^pagamentos -?r\$\s*[\d\.,-−]+$",
        r"^em cumprimento a regulacao do banco central",
        r"^como assegurado pela resolucao cmn",
    ]

    return any(re.match(pattern, normalized, re.IGNORECASE) for pattern in ignored_patterns)


def extract_transaction_section_lines(pdf_text: str) -> list[str]:
    raw_lines = [line.strip() for line in pdf_text.splitlines() if line.strip()]

    section_lines = []
    inside_transactions_section = False
    saw_transactions_header = False
    skip_next_total_line = False

    for line in raw_lines:
        normalized = normalize_description(line)

        # cabeçalho pode vir quebrado: "TRANSAÇÕES" em uma linha
        if normalized == "transacoes":
            saw_transactions_header = True
            continue

        # e "DE 01 MAR A 01 ABR" em outra
        if saw_transactions_header and re.match(r"^de \d{2} [a-z]{3} a \d{2} [a-z]{3}$", normalized):
            inside_transactions_section = True
            saw_transactions_header = False
            continue

        # fallback: caso venha tudo em uma linha só
        if "transacoes de" in normalized:
            inside_transactions_section = True
            continue

        if not inside_transactions_section:
            continue

        # para quando chegar na seção de pagamentos
        if normalized == "pagamentos":
            break

        # ignora o nome do titular que aparece logo abaixo do cabeçalho
        if normalized == "wesley r l rocha":
            skip_next_total_line = True
            continue

        # ignora o total da fatura que aparece logo abaixo do nome
        if skip_next_total_line and re.match(r"^r\$\s*[\d\.,]+$", normalized):
            skip_next_total_line = False
            continue

        section_lines.append(line)

    return section_lines


def parse_credit_card_pdf(pdf_text: str) -> list[dict]:
    metadata = extract_statement_metadata(pdf_text)
    due_date = metadata["due_date"]
    due_year = due_date[:4] if due_date else None
    competency_month = due_date[:7] if due_date else None

    if not due_year:
        return []

    lines = extract_transaction_section_lines(pdf_text)
    if not lines:
        return []

    transactions = []
    row_index = 0
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # cada transação começa com uma data tipo "01 MAR"
        if re.match(r"^\d{2}\s+[A-ZÇ]{3}$", line, re.IGNORECASE):
            raw_date = line
            i += 1

            description_parts = []

            # linha do cartão mascarado: "•••• 8982"
            if i < len(lines) and re.match(r"^••••\s*\d{4}$", lines[i].strip()):
                description_parts.append(lines[i].strip())
                i += 1

            amount = None

            # junta descrição até encontrar a linha do valor
            while i < len(lines):
                current_line = lines[i].strip()

                if re.match(r"^R\$\s*[-−]?[\d\.,]+$", current_line):
                    amount_str = current_line.replace("R$", "").strip().replace("−", "-")
                    amount = float(amount_str.replace(".", "").replace(",", "."))
                    i += 1
                    break

                # se por algum motivo outra data começar antes do valor, aborta esse bloco
                if re.match(r"^\d{2}\s+[A-ZÇ]{3}$", current_line, re.IGNORECASE):
                    break

                description_parts.append(current_line)
                i += 1

            if amount is None:
                continue

            raw_description = clean_description(" ".join(description_parts))
            if not raw_description:
                continue

            transaction_date = parse_ptbr_date(raw_date, due_year)
            transaction_type = detect_transaction_type(raw_description)

            signed_amount = -abs(amount)
            direction = "out"
            is_ignored_in_spending = 0

            if transaction_type == "credit_card_payment":
                is_ignored_in_spending = 1

            installment_current, installment_total = extract_installment_info(raw_description)
            normalized_description = normalize_description(raw_description)

            transaction_hash = generate_transaction_hash(
                transaction_date=transaction_date,
                raw_description=raw_description,
                amount=signed_amount,
                source_type="credit_card",
                row_index=row_index,
            )

            transactions.append(
                {
                    "transaction_date": transaction_date,
                    "competency_month": competency_month if competency_month else transaction_date[:7],
                    "raw_description": raw_description,
                    "normalized_description": normalized_description,
                    "amount": signed_amount,
                    "absolute_amount": abs(amount),
                    "direction": direction,
                    "transaction_type": transaction_type,
                    "category": None,
                    "source_name": "nubank",
                    "source_type": "credit_card",
                    "file_format": "pdf",
                    "is_ignored_in_spending": is_ignored_in_spending,
                    "is_internal_transfer": 0,
                    "installment_current": installment_current,
                    "installment_total": installment_total,
                    "transaction_hash": transaction_hash,
                    "ai_merchant_suggestion": None,
                    "ai_category_suggestion": None,
                    "ai_confidence": None,
                }
            )

            row_index += 1
            continue

        i += 1

    return transactions