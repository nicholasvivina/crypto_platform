# CryptoNex — AI-Powered Cryptocurrency Trading Platform

A full-stack crypto trading platform with real-time market data, AI predictions, phone OTP auth, KYC, Razorpay/Stripe payments, and referral system.

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18 + Redux Toolkit + Tailwind CSS + Vite |
| Backend | Node.js + Express + GraphQL + Socket.io |
| Database | MongoDB Atlas + Redis |
| Queue | BullMQ |
| AI Service | Python FastAPI + NumPy/scikit-learn |
| DevOps | Docker + GitHub Actions + AWS EC2 + NGINX |

## Quick Start

### Prerequisites
- Node.js 20+, Python 3.11+, Docker, MongoDB Atlas account

### 1. Clone & configure
```bash
git clone <repo>
cp .env.example .env
# Fill in MONGO_URI, JWT secrets, MSG91, Razorpay, etc.
```

### 2. Run with Docker (recommended)
```bash
docker compose up
```

### 3. Run manually
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# AI Service
cd ai-service && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Seed database
```bash
cd scripts/db && node seed.js
# Creates: admin@cryptonex.com / Admin@1234!
#          trader@cryptonex.com / Trader@1234!
```

### 5. Create indexes
```bash
cd scripts/db && node indexes.js
```

## Project Structure
```
crypto-platform/
├── backend/          # Node.js API
├── frontend/         # React SPA
├── ai-service/       # Python ML service
├── nginx/            # Reverse proxy config
├── scripts/          # DB and deploy scripts
└── .github/          # CI/CD workflows
```

## Security Features
- Phone OTP via MSG91 (bcrypt-hashed, TTL-indexed)
- JWT access (15min) + refresh (7d) with rotation
- AES-256-GCM field encryption for sensitive data
- MongoDB operator injection prevention
- XSS sanitization on all inputs
- Rate limiting per IP + per user
- Immutable audit logs
- Withdrawal 24h time-lock + OTP confirm
- RBAC (user / admin / super_admin)
- Helmet security headers + HSTS

## Environment Variables
See `.env.example` for all required variables.

## Deployment
Tag a release to trigger production deploy:
```bash
git tag v1.0.0 && git push origin v1.0.0
```

## API
- REST: `http://localhost:5000/api/v1`
- Health: `GET /api/v1/health`
- Auth: `POST /api/v1/auth/register|login|verify-phone|refresh|logout`
- Market: `GET /api/v1/market/pairs|ticker/:pair|tickers`
- Orders: `POST /api/v1/orders` (KYC required)
- Wallets: `GET /api/v1/wallets`
- AI: `GET /api/v1/ai/predict/:pair|signals`
