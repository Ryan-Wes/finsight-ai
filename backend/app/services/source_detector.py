def detect_source_type_from_text(text: str) -> str:
    lowered_text = text.lower()

    credit_card_signals = [
        "resumo da fatura",
        "data de vencimento",
        "limite total",
        "pagamento recebido",
        "transações de",
    ]

    bank_account_signals = [
        "saldo final do período",
        "total de entradas",
        "total de saídas",
        "movimentações",
        "transferência enviada pelo pix",
        "aplicação rdb",
        "resgate rdb",
    ]

    if any(signal in lowered_text for signal in credit_card_signals):
        return "credit_card"

    if any(signal in lowered_text for signal in bank_account_signals):
        return "bank_account"

    return "unknown"