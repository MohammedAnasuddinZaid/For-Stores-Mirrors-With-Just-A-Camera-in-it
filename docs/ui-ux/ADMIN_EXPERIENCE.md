# Admin Experience

## Layout

- Fixed sidebar (desktop) with 3 nav items: Dashboard, Products, Try-On Jobs
- Mobile: horizontal scrollable nav tabs below header
- Sticky header with page title and context actions
- Consistent container padding: `p-6 lg:p-8`

## Pages

### Dashboard (`/`)
- 5 stat cards: Total Products, Published, Draft, Processing, Failed
- Recent Products list (latest 5, linked to detail pages)
- 3 quick action cards: Add Product, Manage Products, Try-On Jobs
- API health indicator (green/red dot)

### Product List (`/products`)
- Search bar with debounced input
- Category filter dropdown
- Status filter dropdown
- View toggle: table (default) vs grid
- Table columns: Product (image+name), Category, Brand, Status, Try-On, Actions (Edit, Delete)
- Grid view: image cards with name, status badge, price
- Delete with confirmation dialog
- Pagination
- Empty/error/loading states

### Add Product (`/products/add`)
- 4-step stepper wizard
  - Step 1: Product info form (name, description, category, brand, SKU, price, status, try-on toggle)
  - Step 2: Image upload (click/browse, multiple files, preview grid, remove)
  - Step 3: Processing visualization (animated checklist)
  - Step 4: Review & Publish (summary card with all fields, images, Create/Publish button)
- Field validation per step
- Toast notifications for success/error
- Navigate between steps with Previous/Next

### Product Detail (`/products/[id]`)
- Image (left) + details (right) layout
- Info card: name, category, brand, price, SKU, try-on status, created date
- Description card
- Actions card: Publish/Unpublish, Archive, Edit
- Image details card with URLs
- Delete button with confirmation

### Edit Product (`/products/[id]/edit`)
- Pre-filled form with all fields
- Same fields as Add Product step 1
- Save + Cancel buttons
- Toast on success

### Try-On Jobs (`/try-on-jobs`)
- Status filter dropdown
- Job list (placeholder until backend supports listing)
- Retry Failed button
- Clean empty state with explanation
