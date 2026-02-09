# Visual Stance: Modern B2B CRM

## Overview
A confident, energetic visual system designed for fast-paced B2B sales teams. Moves away from generic blue towards a distinctive, action-oriented identity.

---

## Core Decisions

### 1. Primary Accent: Coral Orange
**Color**: `#FF5716` (coral-600) with full 50-900 scale

**Why Coral**:
- **Distinctive**: Not the generic blue every SaaS uses
- **Energetic**: Orange conveys action, urgency, and momentum
- **Confident**: Bold without being playful or unprofessional
- **High contrast**: Works well for accessibility
- **Psychology**: Associated with decisiveness and drive (perfect for sales)

**Usage**:
- Primary action buttons (Add Lead, View all)
- Active navigation states
- Hover states on links and interactive elements
- Company avatars (gradient)
- Icon backgrounds in stat cards

---

### 2. Strengthened Grayscale
**Palette**: Slate (not generic gray)

| Level | Color | Usage |
|-------|-------|-------|
| `slate-950` | `#020617` | Primary text, headlines, key data |
| `slate-800` | `#1E293B` | Status badge text |
| `slate-700` | `#334155` | Body text, secondary emphasis |
| `slate-600` | `#475569` | Supporting text, subtitles |
| `slate-500` | `#64748B` | Metadata, timestamps |
| `slate-400` | `#94A3B8` | Icons, placeholders |
| `slate-200` | `#E2E8F0` | Borders, dividers |
| `slate-100` | `#F1F5F9` | Backgrounds (filters, inactive states) |
| `slate-50` | `#F8FAFC` | Page background, hover states |

**Why Slate over Gray**:
- Subtle blue undertone feels more modern and tech-forward
- Better contrast ratios than standard gray
- Cooler temperature balances the warm coral accent
- More refined and professional appearance

---

### 3. Enhanced Typography
**Hierarchy Changes**:

| Element | Before | After | Why |
|---------|--------|-------|-----|
| Headlines | `font-semibold` | `font-bold` | Stronger hierarchy |
| Company names | `font-semibold` | `font-bold` | Primary information pops |
| Deal values | `font-semibold` | `font-bold` | Financial data emphasized |
| Contact names | `font-normal` | `font-medium` | Better contrast with metadata |
| Table headers | `font-medium` | `font-bold` | Clearer column definition |
| Filter buttons | `font-medium` | `font-bold` | More decisive, action-oriented |
| Status badges | `font-medium` | `font-bold` | Easier to scan at a glance |

**Text Rendering**:
- Added `antialiased` for smoother text on all displays
- Improved `-webkit-font-smoothing` and `-moz-osx-font-smoothing`

---

### 4. Status Color System
**More Vibrant, Less Pastel**:

| Status | Color Family | Visual Weight |
|--------|-------------|---------------|
| New | Slate 100/800 | Neutral, awaiting action |
| Contacted | Amber 100/900 | Warm, in progress |
| Qualified | Cyan 100/900 | Energetic, moving forward |
| Proposal | Indigo 100/900 | Serious, business stage |
| Negotiation | Violet 100/900 | Advanced, high stakes |
| Won | Emerald 100/900 | Success, celebration |
| Lost | Rose 100/900 | Closed, archived |

**Changes**:
- Moved from `50/700` shades to `100/900` for stronger contrast
- Added visible borders (`300-400` shades) for definition
- Eliminated washed-out pastels
- Each status is instantly recognizable

---

### 5. Interactive States
**More Responsive Feedback**:

| Element | Enhancement |
|---------|-------------|
| Buttons | `shadow-sm` → `shadow-md` on hover |
| Stat cards | Subtle `hover:shadow-md` for depth |
| Table rows | Faster `transition-colors` |
| Links | Added `underline` on hover for clarity |
| Filters | `ring-2` with offset for active state |
| Navigation | `shadow-sm` on active items |

---

## Implementation Details

### Color Tokens (Tailwind Config)
```typescript
coral: {
  50: '#FFF4ED',   // Lightest tint
  100: '#FFE6D5',
  200: '#FFC9AA',
  300: '#FFA574',
  400: '#FF7A3C',
  500: '#FF5716',  // Primary
  600: '#F03F0C',  // Actions
  700: '#C72F0C',  // Hover/pressed
  800: '#9E2812',
  900: '#7F2412',  // Darkest
}
```

### Font Weight Scale
- `font-bold` (700): Headlines, primary data, CTAs
- `font-semibold` (600): Secondary emphasis, navigation
- `font-medium` (500): Body text, supporting info
- `font-normal` (400): Minimal use (mostly removed)

---

## What This Solves

### ❌ Before: Generic CRM Feel
- Default blue (`#3B82F6`) like every other app
- Weak grayscale (50/100 shades everywhere)
- Timid typography (mostly semibold)
- Washed-out status badges
- Flat, lifeless interactions

### ✅ After: Distinctive Identity
- **Memorable**: Coral accent stands out in a sea of blue
- **Confident**: Bold typography conveys decisiveness
- **Energetic**: Stronger colors suggest momentum and action
- **Professional**: Not playful, but not corporate-stale either
- **Scannable**: High contrast makes information hierarchy obvious
- **Responsive**: Interactions feel snappier and more polished

---

## Scalability

This minimal stance provides a foundation for:

### Future Components
- **Forms**: Coral focus rings, slate borders
- **Modals**: Coral headers, slate body
- **Notifications**: Success (emerald), Warning (amber), Error (rose)
- **Charts**: Coral as primary data color, slate for axes

### Future Features
- **Dark mode**: Coral stays, slate inverts
- **Accessibility**: Already WCAG AA compliant (coral-600 on white = 4.5:1)
- **Theming**: Coral can be swapped for brand color, slate stays consistent
- **Mobile**: Color system scales to smaller screens

### Design System Growth
When ready to expand:
1. Add secondary accent (complementary to coral)
2. Define spacing scale (already implicit in current design)
3. Formalize elevation (shadows) system
4. Create component variants (outlined, ghost, etc.)

---

## Usage Guidelines

### Do ✓
- Use coral for primary actions only
- Use `font-bold` for data that needs to pop
- Maintain high contrast for readability
- Keep status colors consistent across views
- Use slate for neutral elements

### Don't ✗
- Don't use coral for every button (it loses impact)
- Don't mix generic gray with slate
- Don't use font weights below `font-medium` for key info
- Don't add more accent colors yet (one is enough)
- Don't revert to pastel status badges

---

## Inspiration & References

**Not copying, but informed by:**
- **Linear**: Bold typography, clear hierarchy
- **Notion**: Clean slate tones, subtle interactions
- **Figma**: Confident UI, strong contrast
- **Stripe**: Energetic accents, professional base

**Distinct difference:**
Our coral accent is warmer and more action-oriented than typical SaaS blues/purples, making this feel like a tool for doers, not observers.
