import numpy as np
from typing import List, Dict

def compute_rsi(prices: List[float], period: int = 14) -> Dict:
    if len(prices) < period + 1:
        return {"value": 50.0, "explanation": "Insufficient data to calculate RSI."}
    deltas = np.diff(prices[-period-1:])
    gains = deltas[deltas > 0].mean() if (deltas > 0).any() else 0
    losses = -deltas[deltas < 0].mean() if (deltas < 0).any() else 0
    if losses == 0:
        rsi_val = 100.0
    else:
        rs = gains / losses
        rsi_val = round(100 - (100 / (1 + rs)), 2)
    
    if rsi_val < 30:
        explanation = f"RSI is at {rsi_val} (Oversold), suggesting a potential upward reversal/bounce."
    elif rsi_val > 70:
        explanation = f"RSI is at {rsi_val} (Overbought), suggesting the price is overextended and due for a pullback."
    else:
        explanation = f"RSI is at {rsi_val} (Neutral), showing a stable trend without overextended momentum."
    
    return {"value": rsi_val, "explanation": explanation}

def compute_macd(prices: List[float]) -> Dict:
    if len(prices) < 26:
        return {"macd": 0, "signal": 0, "histogram": 0, "explanation": "Insufficient data for MACD."}
    def ema(data, n):
        k = 2 / (n + 1)
        result = [data[0]]
        for p in data[1:]:
            result.append(p * k + result[-1] * (1 - k))
        return result
    ema12 = ema(prices, 12)
    ema26 = ema(prices, 26)
    macd_line = [e12 - e26 for e12, e26 in zip(ema12[13:], ema26)]
    signal = ema(macd_line, 9)
    hist = macd_line[-1] - signal[-1]
    
    if hist > 0:
        explanation = "MACD Histogram is positive and rising, signifying bullish momentum building up."
    else:
        explanation = "MACD Histogram is negative and falling, suggesting bearish momentum continues."
    
    return {
        "macd": round(macd_line[-1], 6),
        "signal": round(signal[-1], 6),
        "histogram": round(hist, 6),
        "explanation": explanation
    }

def compute_bollinger(prices: List[float], period: int = 20) -> Dict:
    p = prices[-1]
    if len(prices) < period:
        return {"upper": p * 1.02, "middle": p, "lower": p * 0.98, "explanation": "Bollinger Bands calculated with limited data."}
    window = prices[-period:]
    mean = np.mean(window)
    std = np.std(window)
    upper = round(mean + 2*std, 6)
    lower = round(mean - 2*std, 6)
    
    if p >= upper * 0.99:
        explanation = "Price is hugging or exceeding the Upper Bollinger Band, indicating high price volatility and overextension."
    elif p <= lower * 1.01:
        explanation = "Price is touching the Lower Bollinger Band, suggesting support may hold for a technical bounce."
    else:
        explanation = "Price is trading within the middle range of the bands, indicating normal consolidation."
        
    return {"upper": upper, "middle": round(mean, 6), "lower": lower, "explanation": explanation}

def analyze_volume(volumes: List[float]) -> Dict:
    if len(volumes) < 20:
        return {"value": volumes[-1] if volumes else 0, "explanation": "Insufficient volume data."}
    recent_vol = volumes[-1]
    avg_vol = np.mean(volumes[-20:-1])
    ratio = recent_vol / avg_vol if avg_vol > 0 else 1.0
    
    if ratio > 1.5:
        explanation = f"Volume is high ({ratio:.1f}x of 20d avg), validating the strength of the current trend."
    else:
        explanation = f"Volume is average ({ratio:.1f}x of 20d avg), showing stable trading activity without panic."
        
    return {"value": round(recent_vol, 2), "explanation": explanation}

def extract_features(prices: List[float], volumes: List[float]) -> Dict:
    rsi_res = compute_rsi(prices)
    macd_res = compute_macd(prices)
    bb_res = compute_bollinger(prices)
    vol_res = analyze_volume(volumes)
    
    return {
        "rsi": rsi_res["value"],
        "rsi_explanation": rsi_res["explanation"],
        "macd": macd_res,
        "macd_explanation": macd_res["explanation"],
        "bollinger": bb_res,
        "bollinger_explanation": bb_res["explanation"],
        "volume": vol_res["value"],
        "volume_explanation": vol_res["explanation"],
        "price_change_24h": round((prices[-1] - prices[-24]) / prices[-24] * 100, 4) if len(prices) >= 24 else 0,
        "volatility": round(float(np.std(prices[-20:]) / np.mean(prices[-20:])), 6) if len(prices) >= 20 else 0,
    }
