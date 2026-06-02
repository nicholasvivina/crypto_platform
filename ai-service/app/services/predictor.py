import random
import math
from typing import Dict
from app.services.features import extract_features

# Placeholder prices for demo — in production, fetch from MongoDB time-series
DEMO_PRICES = {
    "BTCUSDT": [43000 + math.sin(i * 0.3) * 1500 + random.uniform(-200, 200) for i in range(200)],
    "ETHUSDT": [2280 + math.sin(i * 0.4) * 120 + random.uniform(-30, 30) for i in range(200)],
    "BNBUSDT": [310 + math.sin(i * 0.2) * 20 + random.uniform(-5, 5) for i in range(200)],
    "SOLUSDT": [98 + math.sin(i * 0.5) * 10 + random.uniform(-2, 2) for i in range(200)],
    "ADAUSDT": [0.58 + math.sin(i * 0.3) * 0.05 + random.uniform(-0.01, 0.01) for i in range(200)],
    "XRPUSDT": [0.62 + math.sin(i * 0.4) * 0.06 + random.uniform(-0.01, 0.01) for i in range(200)],
    "DOTUSDT": [7.5 + math.sin(i * 0.3) * 0.8 + random.uniform(-0.2, 0.2) for i in range(200)],
    "MATICUSDT": [0.88 + math.sin(i * 0.4) * 0.1 + random.uniform(-0.02, 0.02) for i in range(200)],
}

async def get_prediction(pair: str, timeframe: str = "1h") -> Dict:
    prices = DEMO_PRICES.get(pair, [100.0] * 200)
    features = extract_features(prices)
    current_price = prices[-1]

    # Simple rule-based signal (replace with real LSTM/XGBoost in production)
    rsi = features["rsi"]
    macd_hist = features["macd"]["histogram"]
    price_change = features["price_change_24h"]

    score = 0
    if rsi < 35: score += 2
    elif rsi > 65: score -= 2
    if macd_hist > 0: score += 1
    else: score -= 1
    if price_change > 1: score += 1
    elif price_change < -1: score -= 1

    if score >= 2:
        direction = "bullish"
        confidence = min(95, 55 + score * 8 + random.uniform(-5, 5))
        predicted_price = current_price * (1 + random.uniform(0.005, 0.03))
    elif score <= -2:
        direction = "bearish"
        confidence = min(95, 55 + abs(score) * 8 + random.uniform(-5, 5))
        predicted_price = current_price * (1 - random.uniform(0.005, 0.03))
    else:
        direction = "neutral"
        confidence = 45 + random.uniform(0, 15)
        predicted_price = current_price * (1 + random.uniform(-0.01, 0.01))

    return {
        "pair": pair,
        "timeframe": timeframe,
        "direction": direction,
        "confidence": round(confidence, 1),
        "currentPrice": round(current_price, 6),
        "predictedPrice": round(predicted_price, 6),
        "modelVersion": "1.0.0",
        "features": features,
    }
