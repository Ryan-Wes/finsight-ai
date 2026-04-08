from fastapi import FastAPI

from app.database import create_tables
from app.routes.health import router as health_router
from app.routes.upload import router as upload_router
from app.routes import imports
from app.routes.transactions import router as transactions_router
from app.routes.summary import router as summary_router

app = FastAPI(title="FinSight AI API")


@app.on_event("startup")
def on_startup() -> None:
    create_tables()


@app.get("/")
def read_root():
    return {"message": "FinSight AI API is running"}


app.include_router(health_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(imports.router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
app.include_router(summary_router, prefix="/api")