# Virtual Try-On Platform - AGENTS.md

## Project Overview
A zero-cost, browser-based AI virtual try-on platform for smart mirrors, web, and kiosk deployment.

## Core Principles
- **Zero Software Cost** - All tools and services must be free/open source
- **Local-First** - AI models run on local hardware where possible
- **Browser-First** - Camera processing in-browser via MediaPipe  
- **Modular** - Clear separation of frontend, backend, AI inference
- **Replaceable** - AI engine, storage, and queue are abstracted
- **D: Drive Optimized** - All large data stored on D:\VirtualTryOn\

## Architecture
- Frontend: Next.js 15 + TypeScript + Tailwind CSS (Vercel-deployable)
- Backend: Python FastAPI + Pydantic + SQLAlchemy
- AI: OOTDiffusion/CatVTON via Hugging Face Spaces (free tier)
- AR: MediaPipe + Three.js (fully client-side, zero cost)
- Database: SQLite local / PostgreSQL for production
- Storage: Local filesystem (D: drive) / S3-compatible later

## Key Decisions
1. Vercel Hobby (free) for frontend hosting
2. Hugging Face Spaces ZeroGPU (free) for AI inference
3. MediaPipe Tasks for browser face/pose detection
4. Three.js for 3D AR overlay rendering
5. D:\VirtualTryOn\ for all AI models, caches, and data

## Workflow
1. User opens app → camera permission
2. MediaPipe detects face/body (browser-side, zero cost)
3. User captures photo → sent to Hugging Face Space
4. AI model generates try-on result → returned to user
5. Result displayed with option to try another garment

## Commercial Note
OOTDiffusion/IDM-VTON are CC BY-NC-SA (non-commercial).
For commercial store deployment, license separately or use commercially-licensed alternative.
