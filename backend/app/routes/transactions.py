from fastapi import APIRouter

from app.services.transaction_service import list_transactions

router = APIRouter(tags=["transactions"])


@router.get("/transactions")
def get_transactions():
    return list_transactions()