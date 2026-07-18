# D: Drive Storage Architecture

## Why D:\VirtualTryOn\

The platform is designed for store deployments where C: is a small/expensive SSD
and D: is a larger HDD or secondary drive. All large data lives on D:.

## Directory Structure

```
D:\VirtualTryOn\
├── models\         # AI model weights (~2GB for OOTDiffusion)
├── caches\         # Hugging Face cache, web build cache
├── assets\         # Product garment photos
│   ├── originals\  # Full resolution
│   └── thumbnails\ # 300x375 cropped
├── uploads\        # User selfies (auto-deleted after expiry)
├── results\        # AI-generated try-on results (auto-deleted after expiry)
├── temp\           # Processing workspace
├── logs\           # Backend logs (rotated)
├── database\       # SQLite files
│   └── backups\    # Nightly backups
└── docker_data\    # Docker volumes
```

## Auto-Creation

The backend creates all directories on startup via `init_directories()`.

## Cleanup Policy

| Directory | Retention | Trigger |
|-----------|-----------|---------|
| uploads | 24 hours | Background task runs every hour |
| results | 24 hours | Background task runs every hour |
| temp | Deleted after processing | Inline after job completes |
| logs | 7 days | Rotating file handler |
| backups | 30 days | Cron task (future) |

## Storage Abstraction

All file operations go through `LocalFileSystemStorage` (in `services/api/app/storage/provider.py`).
This can be swapped for S3/GCS without changing any other code.

## Path Security

- All storage paths are validated against path traversal attacks
- Paths are normalized and must not escape `DATA_ROOT`
- Uploaded files are renamed to UUIDs to prevent name collision

## Performance

- D: drive access is typically 80-160 MB/s for HDD
- For production with high throughput, upgrade to SSD on D: or use S3
- Thumbnails cached in-memory by the API layer
