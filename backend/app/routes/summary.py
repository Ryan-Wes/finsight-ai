from typing import Optional

from fastapi import APIRouter, Query, Depends

from app.services.consolidation_service import consolidate_transactions
from app.services.transaction_service import get_transactions_summary
from app.services import consolidation_service

from app.services.consolidation_service import get_daily_trend_summary
from app.services.auth_service import get_current_user_id

router = APIRouter(tags=["summary"])


@router.get("/summary")
def get_summary():
    return get_transactions_summary()


@router.get("/summary/consolidated")
def get_consolidated_summary(
    user_id: str = Depends(get_current_user_id),
    month: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
):
    return consolidate_transactions(
        user_id=user_id,
        month=month,
        year=year,
        transaction_type=type,
        source=source,
    )

@router.get("/summary/by-category")
def get_summary_by_category(
    user_id: str = Depends(get_current_user_id),
    month: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
):
    data = consolidation_service.get_by_category_summary(
        user_id=user_id,
        month=month,
        transaction_type=type,
        source=source,
    )
    return {"by_category": data}

@router.get("/summary/monthly-trend")
def get_monthly_trend(
    user_id: str = Depends(get_current_user_id),
    type: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
):
    data = consolidation_service.get_monthly_trend_summary(
        user_id=user_id,
        transaction_type=type,
        source=source,
    )
    return {"monthly_trend": data}


@router.get("/daily-trend")
def get_daily_trend(
    month: str,
    user_id: str = Depends(get_current_user_id),
):
    from app.services.transaction_service import list_transactions

    transactions_data = list_transactions(
        user_id=user_id,
        month=month,
        limit=100000,
        offset=0,
    )

    data = get_daily_trend_summary(
        transactions=transactions_data["items"],
        month=month,
    )

    return {"daily_trend": data}