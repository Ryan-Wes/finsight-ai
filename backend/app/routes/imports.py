from fastapi import APIRouter, HTTPException
from app.services.import_service import (
    list_imports,
    list_transactions_by_import,
)

router = APIRouter(tags=["imports"])


@router.get("/imports")
def get_imports():
    return list_imports()


@router.get("/imports/{import_id}/transactions")
def get_import_transactions(import_id: int):
    transactions = list_transactions_by_import(import_id)

    if not transactions:
        raise HTTPException(status_code=404, detail="Import not found or empty")

    return transactions

