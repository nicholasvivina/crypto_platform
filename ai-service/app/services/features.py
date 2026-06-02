import numpy as np
from typing import List, Dict

def compute_rsi(prices: List[float], period: int = 14) -> float:
    if len(prices) < period + 1:
        return 50.0
    deltas = np.diff(prices[-period-1:])
    gains = deltas[deltas > 0].mean() if (deltas > 0).any() else 0
    losses = -deltas[deltas < 0].mean() if (deltas < 0).any() else 0
    if losses == 0:
        return 100.0
    rs = gains / losses
    return round(100 - (100 / (1 + rs)), 2)

def compute_macd(prices: List[float]) -> Dict[str, float]:
    if len(prices) < 26:
        return {"macd": 0, "signal": 0, "histogram": 0}
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
    return {"macd": round(macd_line[-1], 4), "signal": round(signal[-1], 4), "histogram": round(hist, 4)}

def compute_bollinger(prices: List[float], period: int = 20) -> Dict[str, float]:
    if len(prices) < period:
        p = prices[-1]
        return {"upper": p * 1.02, "middle": p, "lower": p * 0.98}
    window = prices[-period:]
    mean = np.mean(window)
    std = np.std(window)
    return {"upper": round(mean + 2*std, 4), "middle": round(mean, 4), "lower": round(mean - 2*std, 4)}

def extract_features(prices: List[float]) -> Dict:
    return {
        "rsi": compute_rsi(prices),
        "macd": compute_macd(prices),
        "bollinger": compute_bollinger(prices),
        "price_change_24h": round((prices[-1] - prices[-24]) / prices[-24] * 100, 4) if len(prices) >= 24 else 0,
        "volatility": round(float(np.std(prices[-20:]) / np.mean(prices[-20:])), 6) if len(prices) >= 20 else 0,
    }
