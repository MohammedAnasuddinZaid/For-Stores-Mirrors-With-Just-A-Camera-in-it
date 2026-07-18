# Design System

## Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `brand-50` | `#eef2ff` | Background tints |
| `brand-100` | `#e0e7ff` | Badge backgrounds |
| `brand-200` | `#c7d2fe` | Selection color |
| `brand-400` | `#818cf8` | Focus rings |
| `brand-500` | `#6366f1` | Interactive states |
| `brand-600` | `#4f46e5` | Primary buttons, links |
| `brand-700` | `#4338ca` | Hover states |
| `brand-900` | `#312e81` | High contrast text |

## Surface Colors

- `surface`: `#ffffff` — Card/container backgrounds
- `surface-secondary`: `#f8fafc` — Page backgrounds
- `surface-tertiary`: `#f1f5f9` — Subtle backgrounds

## Text Colors

- `text-primary`: `#0f172a` — Headings, body text
- `text-secondary`: `#475569` — Supporting text
- `text-tertiary`: `#94a3b8` — Placeholders, metadata

## Semantic Colors

- `success`: `#10b981` — Published, succeeded
- `warning`: `#f59e0b` — Processing, warnings
- `error`: `#ef4444` — Failed, errors
- `info`: `#3b82f6` — Informational badges

## Border Radius

- `xs`: 4px — Small elements
- `sm`: 6px — Inputs
- `md`: 10px — Cards
- `lg`: 14px — Buttons
- `xl`: 20px — Modals, sections
- `2xl`: 28px — Hero sections

## Shadows

- `xs`: 0 1px 2px rgba(15,23,42,0.04)
- `sm`: 0 1px 3px rgba(15,23,42,0.06)
- `md`: 0 4px 12px rgba(15,23,42,0.08)
- `lg`: 0 12px 40px rgba(15,23,42,0.12)
- `xl`: 0 24px 60px rgba(15,23,42,0.16)

## Typography

- Font stack: System fonts (Tailwind default)
- Headings: `font-bold tracking-tight`
- Body: `text-sm` (14px) or `text-base` (16px)
- Small: `text-xs` (12px) for metadata, timestamps

## Component Patterns

### Buttons
- `primary` — Solid brand color, main CTAs
- `secondary` — Gray, secondary actions
- `ghost` — Minimal, tertiary actions
- `danger` — Red, destructive actions
- `outline` — Bordered, alternate CTAs

### Cards
- Consistent `rounded-xl border border-gray-100`
- Hover state: `shadow-md border-gray-200`
- Content padding: `p-3` (tight) to `p-6` (spacious)

### Badges
- `rounded-full` with light background + matching text
- Semantic variants: success/warning/error/info/brand

### Inputs
- `rounded-xl` with `border-gray-200`
- Focus: `ring-2 ring-brand-400 border-brand-400`
- Labels above, errors below
