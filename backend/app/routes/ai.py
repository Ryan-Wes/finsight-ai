from fastapi import APIRouter, Body
from app.services.ai_service import suggest_category

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/suggest-category")
def suggest_category_route(payload: dict = Body(...)):
    description = payload.get("description", "")

    if not description:
        return {
            "success": False,
            "message": "Descrição é obrigatória"
        }

    result = suggest_category(description)

    return {
        "success": True,
        "result": result
    }