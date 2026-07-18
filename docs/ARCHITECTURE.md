# Virtual Try-On Platform — Architecture

## Overview

A zero-cost, browser-based AI virtual try-on platform designed for smart mirrors, web, and kiosk deployment. All tools and services are free/open source.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Customer)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Next.js 15 Frontend                        │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────────────┐  │  │
│  │  │ Camera  │  │ MediaPipe│  │  Three.js AR        │  │  │
│  │  │ Capture │→ │ Face/Body│  │  (glasses/hats)     │  │  │
│  │  └─────────┘  │ Detection│  └─────────────────────┘  │  │
│  │               └──────────┘                           │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │         API Client (fetch)                      │ │  │
│  │  └──────────────────┬──────────────────────────────┘ │  │
│  └─────────────────────┼─────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│              FastAPI Backend (Python 3.11)                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ REST API │  │  SQLAlchemy  │  │   TryOnEngine Router │  │
│  │ (v1)     │→ │  + SQLite    │  │  ┌────────────────┐  │  │
│  └──────────┘  └──────────────┘  │  │ MockEngine     │  │  │
│                                  │  │ (development)  │  │  │
│  ┌──────────────────────────┐   │  ├────────────────┤  │  │
│  │ LocalFileSystemStorage   │   │  │ HFEngine       │  │  │
│  │ (D:\VirtualTryOn\)       │   │  │ (production)   │  │  │
│  └──────────────────────────┘   │  └────────────────┘  │  │
│                                 └──────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│              Hugging Face Space (ZeroGPU)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  OOTDiffusion / CatVTON / IDM-VTON Model             │   │
│  │  (Free inference, cold start ~20s)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User opens app** → camera permission requested
2. **MediaPipe** detects face/body landmarks (browser-side, zero server cost)
3. **User captures photo** → vision check (brightness, blur, person detection)
4. **AR try-on** (glasses/hats): Three.js overlays on face landmarks — instant, no server call
5. **Garment try-on**: photo sent to FastAPI → queued → sent to Hugging Face Space for OOTDiffusion inference → result stored → returned to user
6. **Admin**: separate dashboard for product management, job monitoring, system health

## Directory Layout

```
apps/
├── web/          # Next.js customer-facing app (Vercel)
├── admin/        # Next.js admin dashboard (Vercel)
services/
├── api/          # Python FastAPI backend
infrastructure/
├── docker/       # Docker Compose + Dockerfiles
├── database/     # SQL migrations
├── scripts/      # Startup and deployment scripts
docs/             # Architecture, deployment, API docs
```

## Storage (D:\VirtualTryOn\)

```
D:\VirtualTryOn\
├── models\          # AI model files (future: on-device inference)
├── caches\          # Application caches
├── assets\          # Garment product images
├── uploads\         # User captured photos
├── results\         # Try-on result images
├── temp\            # Processing temp files
├── logs\            # Backend logs
├── database\        # SQLite database files
├── backups\         # Database backups
└── docker_data\     # Docker volumes
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Vercel Hobby (free) | Frontend hosting with automatic HTTPS, CDN, preview deployments |
| Hugging Face ZeroGPU | Free GPU inference for AI model (cold start penalty accepted) |
| MediaPipe Tasks | Full face/body detection in-browser, zero server cost |
| Three.js | Client-side 3D for glasses/hats AR try-on |
| SQLite dev / PostgreSQL prod | Simple local setup, easy migration path |
| Mock engine | Development without GPU or HF Space dependency |
| D: drive | Keeps C: (small SSD) free; all large data on storage drive |

## Replaceable Components

- **AI Engine**: MockTryOnEngine → HuggingFaceTryOnEngine → custom ONNX
- **Storage**: LocalFileSystemStorage → S3/GCS/Wasabi
- **Database**: SQLite → PostgreSQL → any SQLAlchemy-supported DB
- **Queue**: In-process → Celery/Redis → external worker
