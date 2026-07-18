# Development Guide

## Prerequisites

- Node.js 18+
- Python 3.11+
- D:\VirtualTryOn\ directory created automatically on first run

## Quick Start

### 1. Backend

```bash
cd services/api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
# API at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd apps/web
npm install
npm run dev
# App at http://localhost:3000
```

### 3. Admin Dashboard

```bash
cd apps/admin
npm install
npm run dev
# Admin at http://localhost:3001 (password: admin)
```

## Environment Variables

Copy `.env.example` to `.env` in each app directory:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_ROOT` | `D:\VirtualTryOn` | Root directory for all data |
| `DATABASE_URL` | `sqlite:///./data.db` | Database connection string |
| `HUGGINGFACE_TOKEN` | (empty) | Token for Hugging Face API |
| `HF_SPACE_ID` | (empty) | Hugging Face Space for AI inference |
| `AI_ENGINE` | `mock` | `mock`, `huggingface`, or `auto` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API URL |

## Testing

### Backend tests

```bash
cd services/api
pytest tests/ -v
```

### Frontend tests

```bash
cd apps/web
npm test
```

## Building for Production

### Frontend

```bash
cd apps/web
npm run build
npm run start
```

### Backend

```bash
cd services/api
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Docker

```bash
cd infrastructure/docker
docker-compose up -d
```

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import `apps/web` in Vercel dashboard
3. Set `NEXT_PUBLIC_API_URL` to deployed backend URL
4. Deploy

### Backend → Hugging Face Space

1. Create Docker Space on Hugging Face
2. Push `services/api` as Space
3. Set `HF_SPACE_ID` in frontend env

### AI Model → Hugging Face Space (ZeroGPU)

1. Fork OOTDiffusion Space
2. Enable ZeroGPU hardware
3. Set `HUGGINGFACE_TOKEN` in API backend env
4. Configure `HF_SPACE_ID` to point to your Space

## Smart Mirror Mode

Access `/mirror` for full-screen kiosk/mirror mode. Features:
- 60-second idle timeout returning to attract screen
- Optimized for touch input
- Mirrored camera preview
- Large touch targets
