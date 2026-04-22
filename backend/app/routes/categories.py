from fastapi import APIRouter, Body

from app.services.category_service import (
    create_category,
    create_subcategory,
    get_category_schema,
    update_category,
    update_subcategory,
)

router = APIRouter(tags=["categories"])


@router.get("/categories/schema")
def read_category_schema():
    return get_category_schema()

@router.post("/categories")
def create_category_route(payload: dict = Body(...)):
    return create_category(
        label=payload.get("label", ""),
        color=payload.get("color"),
    )

@router.patch("/categories/{category_key}")
def update_category_route(category_key: str, payload: dict = Body(...)):
    return update_category(
        category_key=category_key,
        label=payload.get("label", ""),
        color=payload.get("color"),
    )

@router.post("/categories/{category_key}/subcategories")
def create_subcategory_route(category_key: str, payload: dict = Body(...)):
    return create_subcategory(
        category_key=category_key,
        label=payload.get("label", ""),
    )

@router.patch("/categories/{category_key}/subcategories/{subcategory_key}")
def update_subcategory_route(
    category_key: str,
    subcategory_key: str,
    payload: dict = Body(...),
):
    return update_subcategory(
        category_key=category_key,
        subcategory_key=subcategory_key,
        label=payload.get("label", ""),
    )