# Deployment Guide

## Architecture

```
Frontend (Vercel Free)              Backend (Render Free)
┌──────────────────────┐           ┌──────────────────────┐
│ apps/web             │  HTTP     │ services/api         │
│ Customer App         │───────→   │ FastAPI + SQLAlchemy │
│ *.vercel.app         │           │ *.onrender.com       │
├──────────────────────┤           ├──────────────────────┤
│ AR Products (static) │           │ AI: Hugging Face     │
│ /assets/products/    │           │ Spaces (free tier)   │
└──────────────────────┘           └──────────────────────┘
```

### Client-Side Processing

The try-on system uses **client-side processing** for accessories:
- **Face detection** via MediaPipe FaceLandmarker (loaded from CDN)
- **Product compositing** via Canvas 2D (in-browser, zero server cost)
- **Product catalog** served as static JSON from `/assets/products/`
- **Product images** served as static assets from `/assets/products/`

This means:
- Eyewear/hats try-on works **without any backend** (instant, smooth)
- The backend is only needed for **AI-powered clothing try-on** (shirts/pants)
- No API calls needed for accessory try-on = zero latency

---

## Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Virtual Try-On Platform with face-aware AR"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/For-Stores-Mirrors-With-Just-A-Camera-in-it.git
git push -u origin main
```

---

## Step 2: Deploy Frontend to Vercel

### Customer App (`apps/web`)

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. **Root Directory**: `apps/web`
4. **Framework**: Next.js (auto-detected)
5. **Build Command**: `npm run build` (leave default)
6. **Environment Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api/v1` | Yes for clothing try-on |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Yes |
| `NEXT_PUBLIC_APP_ENV` | `production` | Yes |
| `NEXT_PUBLIC_APP_MODE` | `standard` | Optional, default |

**Note**: For accessory try-on (eyewear/hats), the backend URL is **not required**. Face detection and glasses rendering happen entirely in the browser. The API URL is only needed for AI-powered clothing try-on.

7. Click **Deploy**
8. Note your URL, e.g. `https://your-app.vercel.app`

### Verify Frontend Works Standalone

After deployment, test:
- Landing page loads
- Navigate to `/products`
- Click "Try It On" on any product
- Take a photo or upload one (camera or file upload)
- Face detection runs automatically
- Select "Eyewear" category
- Select SPECS27_52
- Glasses should appear on the face

If the backend is not running, product images will show placeholders but the try-on flow (face detection + glasses rendering) works independently via static assets in `/assets/products/catalog.json`.

---

## Step 3: Deploy Backend to Render

### Local Development First

```bash
# Backend setup
cd services/api
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt

# Run with mock engine
python -m app.main

# Create .env file from example
copy ..\..\.env.example .env
```

### Production Deployment on Render

**Option A: Render Blueprint (auto-detect)**

1. Push `render.yaml` (included in repo) to GitHub
2. Go to https://dashboard.render.com/blueprints
3. Connect repo → Render auto-detects `render.yaml`
4. Click **Apply** → backend deploys automatically

**Option B: Manual Web Service**

1. Go to https://dashboard.render.com/new/web
2. Connect your GitHub repo
3. **Name**: `virtual-try-on-api`
4. **Root Directory**: `services/api`
5. **Runtime**: Python 3
6. **Build Command**: `pip install -r requirements.txt`
7. **Start Command**: `python -m app.main`
8. **Plan**: Free

**Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATA_ROOT` | `/var/data/virtual-try-on` |
| `DATABASE_URL` | `sqlite+aiosqlite:////var/data/virtual-try-on/db.sqlite3` |
| `AI_ENGINE` | `mock` (use `huggingface` + `HF_TOKEN` for real AI) |
| `CORS_ORIGINS` | `https://your-web-app.vercel.app,https://your-admin.vercel.app` |

9. Click **Create Web Service**
10. Note your URL, e.g. `https://virtual-try-on-api.onrender.com`

---

## Step 4: Post-Deployment Configuration

### Update CORS

Go to Render Dashboard → Environment → add your Vercel app URLs to `CORS_ORIGINS`:
```
CORS_ORIGINS=https://your-app.vercel.app,https://your-admin.vercel.app
```

### Update Frontend Environment

Go to Vercel → Project Settings → Environment Variables:
- Update `NEXT_PUBLIC_API_URL` with your Render backend URL
- Redeploy the frontend

### Verify Full Stack

Visit your Vercel app:
1. Landing page loads with styling
2. Products load from backend
3. Try-on flow works:
   - Take/upload photo
   - Face detected
   - Product selector appears
   - Select SPECS27_52
   - Glasses appear on face

---

## Local Development Setup

### Prerequisites
- Node.js 18+ 
- Python 3.11+
- Camera (for camera mode)

### One-Time Setup

```bash
# 1. Install root dependencies
npm install

# 2. Install frontend dependencies
cd apps/web
npm install

# 3. Install backend dependencies
cd services/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 4. Create .env
copy .env.example .env

# 5. Run both
# Terminal 1: Backend
cd services/api
python -m app.main

# Terminal 2: Frontend
cd apps/web
npm run dev
```

### What Works Locally Without Backend

The frontend (`apps/web`) can run independently for the try-on flow:
- Face detection (MediaPipe in-browser)
- Glasses/eyewear rendering (Canvas 2D compositing)
- Product catalog (static JSON in `/public/assets/products/`)
- Product images (static assets)

Backend is only needed for:
- Product CRUD (admin dashboard)
- AI clothing try-on (shirts/pants)
- Session management

---

## Environment Variables Reference

### Frontend (`apps/web/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API URL |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Self URL for CORS |
| `NEXT_PUBLIC_APP_ENV` | `development` | `development` or `production` |
| `NEXT_PUBLIC_APP_MODE` | `standard` | `standard`, `kiosk`, or `smart-mirror` |

### Backend (`services/api/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATA_ROOT` | `D:\VirtualTryOn` | Root data directory |
| `DATABASE_URL` | `sqlite:///./data/app.db` | Database connection |
| `AI_ENGINE` | `mock` | `mock` or `huggingface` |
| `HUGGINGFACE_SPACE` | - | Hugging Face Space ID |
| `HUGGINGFACE_TOKEN` | - | HF API token |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No face detected | Ensure good lighting. Face must be visible and front-facing. Try uploading instead of camera. |
| Glasses not aligned | Product fit profile may need calibration. Adjust `widthMultiplier` and `verticalOffset` in `catalog.json`. |
| Camera access denied | Check browser permissions. HTTPS required for camera on some browsers. |
| MediaPipe model fails to load | Internet connection required for first load (model cached after). Check CDN accessibility. |
| 500 on `/api/products` | Backend not running or unreachable. Check Render logs. Verify `CORS_ORIGINS`. |
| CORS errors in console | Add your frontend URL to Render's `CORS_ORIGINS` env var. |
| Images not found | Render free tier uses ephemeral storage. Uploads lost on restart. Configure S3 for production. |
| AVIF images not displaying | Older browsers may not support AVIF. Convert to WebP as fallback. |
| Product selector blank | Check that `/assets/products/catalog.json` is being served correctly. |

---

## Adding New Products to the Try-On Catalog

1. Add product image to `apps/web/public/assets/products/<category>/`
2. Edit `apps/web/public/assets/products/catalog.json`
3. Add product entry with fit profile
4. For glasses, calibrate `widthMultiplier` and `verticalOffset`
5. Commit and redeploy

### Calibration Tips

- **widthMultiplier**: Start at 2.3 for glasses. Higher = wider relative to IPD.
- **verticalOffset**: Start at 0.02. Positive moves glasses down. Adjust in 0.005 increments.
- **imageContentBounds**: Crop transparent padding from the product image for accurate sizing.
