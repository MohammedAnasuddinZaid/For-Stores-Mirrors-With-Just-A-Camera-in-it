# Customer Experience

## User Journey

### 1. Landing Page (`/`)
- Fashion-forward hero with gradient background
- "No app download required" badge
- Browse Collection CTA (primary), Mirror Mode (secondary)
- How It Works section (3-step explainer)
- Featured Products grid (up to 8 published products)
- Clean footer with navigation

### 2. Product Catalog (`/products`)
- Search bar (name, brand, SKU)
- Category filter dropdown
- Status filter dropdown
- Product count indicator
- Responsive product grid (2 cols mobile, 3 tablet, 4 desktop)
- Product cards with: image, category·brand, name, price, try-on badge, status badge
- Hover zoom effect on images
- Pagination for large collections
- Empty/error/loading states handled

### 3. Product Detail (`/products/[id]`)
- Large 4:5 aspect ratio product image
- Category & brand breadcrumb
- Product name (h1), price, currency
- Status badge + try-on availability badge
- SKU display
- Description section
- "Try It On" CTA (only if `try_on_enabled` AND `PUBLISHED`)
- Back to Products link

### 4. Try-On Flow (`/try-on/[productId]`)
- Product preview (left) + interactive panel (right)
- States: ready → capturing → captured → uploading → processing → result → error

**Ready state:**
- Camera icon + "Ready to Try On" heading
- "Start Camera" button

**Capturing state:**
- Live mirrored camera feed with capture button
- "Camera Active" badge indicator

**Captured state:**
- Photo preview with Retake / Try On Now buttons

**Processing state (animated):**
- 4-stage animated stepper
  1. "Preparing your image"
  2. "Analyzing photo"
  3. "Applying garment"
  4. "Finalizing result"
- Real-time job status indicator (QUEUED, PROCESSING)
- 60s timeout safeguard

**Result state:**
- Before/after toggle button
- "Try Another" / "New Photo" actions

**Error state:**
- Error message with retry

### 5. Mirror/Kiosk Mode (`/mirror`)
- Full-screen dark theme designed for store displays
- 60-second idle timeout resets to idle screen
- Touch/click to start camera
- Live camera feed with vision analysis feedback
- Capture → quick try-on → result flow
- Touch any area to reset idle timer
