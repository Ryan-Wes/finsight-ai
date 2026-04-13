from app.services.transaction_normalizer import normalize_description


CATEGORY_RULES = {
    "mercado": [
        "zaffari",
        "carrefour",
        "big",
        "nacional",
        "atacadao",
        "assai",
        "guanabara",
        "condor",
        "mercado livre",
        "pao de acucar",
        "supermercado",
    ],
    "alimentacao": [
        "ifood",
        "aiqfome",
        "restaurante",
        "lancheria",
        "lanche",
        "hamburguer",
        "pizza",
        "sushi",
        "cafeteria",
        "padaria",
        "burger king",
        "mcdonald",
        "subway",
    ],
    "transporte": [
        "uber",
        "99",
        "taxi",
        "cabify",
        "onibus",
        "metro",
        "passagem",
    ],
    "carro": [
        "posto",
        "ipiranga",
        "shell",
        "petrobras",
        "combustivel",
        "gasolina",
        "etanol",
        "estacionamento",
        "lavacar",
        "mecanica",
        "oficina",
        "detran",
        "pedagio",
    ],
    "roupas": [
        "renner",
        "cea",
        "riachuelo",
        "hering",
        "nike",
        "adidas",
        "netshoes",
        "centauro",
        "zara",
        "shein",
        "textil",
        "moda",
        "loja",
        "boutique",
    ],
    "saude": [
        "farmacia",
        "droga",
        "drogaria",
        "panvel",
        "sao joao",
        "consulta",
        "clinica",
        "hospital",
        "exame",
        "odonto",
        "gym",
        "gympass",
        "wellhub",
    ],
    "casa": [
        "leroy",
        "tumelero",
        "cassol",
        "madeira",
        "magazine luiza",
        "casas bahia",
        "movel",
        "eletro",
    ],
    "assinaturas": [
        "spotify",
        "netflix",
        "amazon prime",
        "prime video",
        "youtube",
        "google one",
        "icloud",
        "hbo",
        "disney",
        "deezer",
        "tecnologia",
        "software",
        "servico",
        "serviços",
        "trivvo",
    ],
    "lazer": [
        "cinema",
        "ingresso",
        "teatro",
        "show",
        "steam",
        "playstation",
        "xbox",
        "epic games",
    ],
    "compras": [
    "mercadolivre",
    "mercado livre",
    "shopee",
    "amazon",
    "amazonmktplc",
    "aliexpress",
    "alipay",
    "temu",
    "magalu",
    "americanas",
],
}


def categorize_transaction(raw_description: str, transaction_type: str) -> str:
    normalized_description = normalize_description(raw_description)

    if transaction_type in {
        "investment_application",
        "investment_redemption",
    }:
        return "investimentos"

    if transaction_type in {
        "credit_card_bill_payment",
        "transfer_in",
        "transfer_out",
        "pix_in",
        "pix_out",
        "refund",
        "bill_payment",
    }:
        return "movimentacoes"

    for category, keywords in CATEGORY_RULES.items():
        if any(keyword in normalized_description for keyword in keywords):
            return category

    if transaction_type in {"purchase", "bank_transaction"}:
        return "outros"

    return "movimentacoes"