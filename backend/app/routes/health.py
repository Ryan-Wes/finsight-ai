from fastapi import APIRouter

from app.database import get_connection

router = APIRouter()


@router.get("/health")
def health_check():
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()

    return {
        "status": "ok",
        "database": "connected" if result[0] == 1 else "error"
    }