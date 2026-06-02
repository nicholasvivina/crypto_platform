from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.routers import predict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI service starting up")
    yield
    logger.info("AI service shutting down")

app = FastAPI(title="CryptoNex AI Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5000"], allow_methods=["POST", "GET"], allow_headers=["*"])

async def verify_secret(x_service_secret: str = Header(...)):
    if x_service_secret != settings.service_secret:
        raise HTTPException(status_code=403, detail="Invalid service secret")

app.include_router(predict.router, prefix="/predict", dependencies=[Depends(verify_secret)])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai"}
