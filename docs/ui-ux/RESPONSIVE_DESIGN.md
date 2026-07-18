# Responsive Design

## Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, stacked |
| Tablet | 640px - 1023px | 2-3 column grids |
| Desktop | 1024px+ | Full layout with sidebar |

## Customer App

### Landing Page
- Mobile: stacked hero, single-column features, 2-col product grid
- Desktop: wide hero text, side-by-side features, 4-col product grid

### Product Catalog
- Mobile: full-width search + filter stack, 2-col product grid
- Tablet: inline search + dropdowns, 3-col grid
- Desktop: wider layout (container-wide), 4-col grid with pagination

### Product Detail
- Mobile: image stacked above info
- Desktop: 2-column split (image left, info right)

### Try-On Flow
- Mobile: product preview stacked above try-on panel
- Desktop: side-by-side (product left, try-on right)

### Mirror Mode
- Always full-screen, minimum controls
- Large tap targets (60px+ recommended)
- Font sizes scale up for readability from distance

## Admin App

### Navigation
- Mobile: sticky top header with scrollable tab bar
- Desktop: fixed left sidebar with icon+label nav items

### Product Table
- Mobile: hide Category, Brand, Try-On columns
- Tablet: hide Brand, Try-On columns
- Desktop: all columns visible

### Product Grid
- Mobile: 2 columns
- Tablet: 3 columns
- Desktop: 4 columns

### Add Product Wizard
- Mobile: full-width fields, stacked layout
- Desktop: max-w-2xl centered, inline grid for grouped fields

### Dashboard
- Mobile: 2x2 + 1 stat cards
- Desktop: 5 stat cards in a row

## General Rules

- All images use `aspect-ratio` CSS for consistent sizing (4:5 for products)
- Touch targets minimum 44px (WCAG recommendation)
- No horizontal overflow on any viewport
- Smooth transitions: `duration-200` to `duration-500`
- Focus states visible on all interactive elements
- Empty/error/loading states centered with max-width constraint
