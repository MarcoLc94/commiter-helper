from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.commits import router as commits_router
from routers.saved_reports import router as saved_reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from database import create_tables
        create_tables()
    except Exception as e:
        print(f"[DB] No se pudo conectar a la base de datos: {e}")
    yield


app = FastAPI(title="Commiter", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(commits_router, prefix="/api")
app.include_router(saved_reports_router, prefix="/api")
