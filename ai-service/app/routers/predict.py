from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.predictor import get_prediction
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class PredictRequest(BaseModel):
    timeframe: str = "1h"

SUPPORTED = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","ADAUSDT","XRPUSDT","DOTUSDT","MATICUSDT"]

@router.post("/{pair}")
async def predict(pair: str, req: PredictRequest):
    pair = pair.upper()
    if pair not in SUPPORTED:
        raise HTTPException(status_code=400, detail=f"Unsupported pair: {pair}")
    try:
        result = await get_prediction(pair, req.timeframe)
        return result
    except Exception as e:
        logger.error(f"Prediction failed for {pair}: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")
