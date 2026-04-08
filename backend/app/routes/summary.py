from fastapi import APIRouter

from app.services.transaction_service import get_transactions_summary

router = APIRouter(tags=["summary"])


@router.get("/summary")
def get_summary():
    return get_transactions_summary()