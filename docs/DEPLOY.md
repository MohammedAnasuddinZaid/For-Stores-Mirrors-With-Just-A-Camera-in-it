# Deployment Guide

## Architecture

```
Frontend (Vercel Free)              Backend (Render Free)
┌──────────────────────┐           ┌──────────────────────┐
│ apps/web             │  HTTP     │ services/api         │
│ Customer App         │───────→   │ FastAPI + SQLAlchemy │
│ *.vercel.app         │           │ *.onrender.com       │
├──────────────────────┤           ├──────────────────────┤
│ apps/admin           │           │ AI: Hugging Face     │
│ Admin Dashboard      │           │ Spaces (free tier)   │
│ *.vercel.app         │           └──────────────────────┘
└──────────────────────┘
```

---

## Deploy Backend to Render (First)

### Option A: Render Blueprint (auto-detect)

1. Push `render.yaml` (included in repo) to GitHub
2. Go to https://dashboard.render.com/blueprints
3. Connect repo → Render auto-detects `render.yaml`
4. Click **Apply** → backend deploys automatically

### Option B: Manual Web Service

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

## Deploy Frontend to Vercel

### Customer App (`apps/web`)

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. **Root Directory**: `apps/web`
4. **Framework**: Next.js (auto-detected)
5. **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_ENV` | `production` |

6. Click **Deploy**
7. Note your URL, e.g. `https://your-app.vercel.app`

### Admin Dashboard (`apps/admin`)

Repeat same steps with **Root Directory**: `apps/admin`

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://your-admin.vercel.app` |

---

## Post-Deployment

1. **Update CORS** on Render: add both frontend URLs to `CORS_ORIGINS`
2. **Update frontend env**: go back to Vercel → Settings → Environment Variables → update `NEXT_PUBLIC_API_URL` if needed → Redeploy
3. **Verify**: visit your frontend URL → landing page should load with full styling → products should load from backend

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No CSS / plain HTML | Clear browser cache (Ctrl+F5). Ensure `npm run dev` was restarted after `npm install @tailwindcss/postcss` |
| 500 on `/api/products` | Backend not running or unreachable. Check Render logs. Verify `CORS_ORIGINS` |
| CORS errors in console | Add your frontend URL to Render's `CORS_ORIGINS` env var |
| Images not found | Render free tier uses ephemeral storage. Uploads lost on restart. Configure S3 for production |
| Database resets on restart | SQLite file is ephemeral on Render. Use PostgreSQL for production |
