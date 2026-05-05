import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database.dynamodb import create_tables
from routers import ingest, generate, test_cases, ambiguity

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI(
    title="AI SDLC Platform",
    description="Transform raw requirements into structured development artifacts",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api", tags=["Ingestion"])
app.include_router(generate.router, prefix="/api", tags=["Generation"])
app.include_router(test_cases.router, prefix="/api", tags=["Test Cases"])
app.include_router(ambiguity.router, prefix="/api", tags=["Ambiguity"])


@app.on_event("startup")
async def startup():
    create_tables()


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "ai-sdlc-platform"}
