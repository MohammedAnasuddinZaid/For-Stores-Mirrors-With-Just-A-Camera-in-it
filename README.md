# Virtual Try-On Platform

A zero-cost, browser-based AI virtual try-on platform for smart mirrors, web, and kiosk deployment. Uses **client-side face detection** (MediaPipe) for instant eyewear/accessory try-on and a **Python FastAPI backend** for AI-powered clothing try-on.

## Features

- **Face-Aware Eyewear Try-On**: Glasses/sunglasses automatically positioned on your face using 478-point face landmarks
- **Instant Product Switching**: Switch products without re-uploading your photo
- **Camera & Upload**: Use your camera or upload a photo
- **Smart Mirror Mode**: Full-screen kiosk mode with idle timeout
- **Client-Side Processing**: Face detection and accessory rendering happen entirely in-browser
- **Extensible Catalog**: Add new products via JSON configuration
- **AI Clothing Try-On**: Backend support for OOTDiffusion integration (shirts/pants)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+

### One-Time Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/For-Stores-Mirrors-With-Just-A-Camera-in-it.git
cd For-Stores-Mirrors-With-Just-A-Camera-in-it

# Frontend
cd apps/web
npm install
npm run dev

# In another terminal - Backend
cd services/api
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m app.main
```

Open http://localhost:3000

## Architecture

```
Frontend (Next.js 15 + TypeScript + Tailwind)
├── Face Detection     → MediaPipe FaceLandmarker (in-browser)
├── AR Rendering       → Canvas 2D compositing
├── Product Catalog    → Static JSON + images in /public/assets/products/
└── Camera/Upload      → getUserMedia + File API

Backend (Python FastAPI + SQLAlchemy)
├── Product CRUD       → REST API with SQLite/PostgreSQL
├── Try-On Jobs        → Queue-based AI inference
├── Mock Engine        → PIL-based compositing (dev)
└── Hugging Face       → OOTDiffusion integration (production)
```

## Adding Products

1. Add image to `apps/web/public/assets/products/<category>/`
2. Edit `apps/web/public/assets/products/catalog.json`
3. Set `fitProfile.widthMultiplier` and `verticalOffset` for calibration
4. Commit and redeploy

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for full deployment guide.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Computer Vision**: MediaPipe FaceLandmarker (in-browser)
- **Rendering**: Canvas 2D API
- **Backend**: Python FastAPI, SQLAlchemy, Pydantic
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **AI**: OOTDiffusion via Hugging Face Spaces
