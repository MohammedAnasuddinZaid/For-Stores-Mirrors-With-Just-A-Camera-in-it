# Try-On Flow

## State Machine

```
                    ┌─────────────┐
                    │   Ready      │
                    └──────┬──────┘
                           │ Start Camera
                           ↓
                    ┌─────────────┐
                    │  Capturing   │ ←── Live camera feed (mirrored)
                    └──────┬──────┘
                           │ Capture Photo
                           ↓
                    ┌─────────────┐
                    │  Captured    │ ←── Preview with Retake/Try On
                    └──────┬──────┘
                           │ Try On Now
                           ↓
                    ┌─────────────┐
                    │  Uploading   │ ←── Create session, upload image
                    └──────┬──────┘
                           │ Success
                           ↓
                    ┌─────────────┐
                    │  Processing  │ ←── Poll job status (1.5s interval)
                    │              │     Shows 4 animated stages
                    └──────┬──────┘
                     ┌─────┴─────┐
                     ↓           ↓
                 SUCCEEDED    FAILED
                     ↓           ↓
               ┌─────────┐  ┌─────────┐
               │ Result   │  │ Error   │
               └─────────┘  └─────────┘
```

## API Integration

1. `POST /api/v1/sessions` → Create session → get `session.id`
2. `POST /api/v1/sessions/{id}/person-images` → Upload captured photo → get `personImage.id`
3. `POST /api/v1/sessions/{id}/try-ons` → Start job → get `job.id` (status: QUEUED)
4. `GET /api/v1/try-ons/{jobId}` → Poll until status changes from QUEUED/PROCESSING to SUCCEEDED/FAILED
5. `GET /api/v1/try-ons/{jobId}/result` → Fetch result image URL

## Processing Stage Animation

4 sequential stages rendered during processing:
1. Preparing your image (QUEUED)
2. Analyzing photo (PROCESSING, early)
3. Applying garment (PROCESSING, mid)
4. Finalizing result (PROCESSING, late)

Each stage shows a checkmark when complete, a spinner when active, and gray for pending.

## Error Handling

- Camera permission denied → Error screen with retry
- Upload failure → Error screen with retry
- Job failure → Error message from backend displayed
- Timeout (60s) → Error screen with retry
- Network errors → Error screen with retry
