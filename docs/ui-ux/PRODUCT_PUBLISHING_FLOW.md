# Product Publishing Flow

## Status Lifecycle

```
DRAFT ──→ PROCESSING ──→ READY ──→ PUBLISHED
  ↑                        │           │
  └────────────────────────┘           │
       (edit and re-process)           │
                                        ↓
                                     ARCHIVED
```

Status transitions:
- `DRAFT` — Initial state, not visible to customers
- `PROCESSING` — Images being processed for try-on model
- `READY` — Processing complete, ready for review
- `PUBLISHED` — Visible in customer catalog, try-on enabled
- `ARCHIVED` — Hidden from catalog, preserved in database
- `FAILED` — Processing error, needs attention

## Admin Publishing Workflow

1. **Create** → Fill product info form → Upload images → Review → Save as Draft or Publish
2. **Edit** → Modify any field → Status may need to reset to DRAFT for reprocessing
3. **Publish** → Set status to PUBLISHED → Appears in customer catalog
4. **Unpublish** → Set status to DRAFT → Hidden from customers
5. **Archive** → Set status to ARCHIVED → Removed from active views

## Customer Visibility

- Product appears in `/products` catalog only when `status === 'PUBLISHED'`
- "Try It On" button appears on detail page only when `status === 'PUBLISHED' AND try_on_enabled === true`
- Non-published products show status badge (e.g., "Draft", "Processing")

## API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Create | POST | `/api/v1/products` |
| Update | PUT | `/api/v1/products/{id}` |
| Delete | DELETE | `/api/v1/products/{id}` |
| Upload image | POST | `/api/v1/products/{id}/images` |
| List | GET | `/api/v1/products?page=&limit=&search=&category=&status=` |
| Get | GET | `/api/v1/products/{id}` |
