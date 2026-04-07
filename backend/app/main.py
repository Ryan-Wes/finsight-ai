from fastapi import FastAPI

from app.database import create_tables
from app.routes.health import router as health_router
from app.routes.upload import router as upload_router
from app.routes import imports

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
