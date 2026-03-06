# Signal CRM - B2B Lead Management

A modern, highly usable B2B CRM focused on lead management with exceptional UX.

## Features

- **Dashboard**: Performance metrics and recent activity tracking
- **Leads Table**: Highly scannable, information-dense lead management interface
- **Filtering & Sorting**: Quick access to relevant lead data
- **Modern UI**: Clean, professional design optimized for B2B workflows
- **Real UX States**: Loading, empty, no results, and error states with clear guidance

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Dashboard
│   ├── leads/             # Leads management
│   ├── analytics/         # Analytics (placeholder)
│   └── settings/          # Settings (placeholder)
├── components/            # React components
│   ├── crm-layout.tsx    # Main CRM layout with sidebar
│   ├── leads-table.tsx   # Leads table component
│   └── stat-card.tsx     # Dashboard stat cards
└── lib/                   # Utilities and data
    ├── types.ts          # TypeScript types
    └── mock-data.ts      # Mock lead data (15 items)
```

## Features Overview

### Dashboard
- Key performance metrics
- Pipeline value tracking
- Recent activity feed
- Quick navigation to leads

### Leads Table
- Dense but readable layout
- Visual hierarchy for easy scanning
- Status badges with clear color coding
- Priority indicators
- Interactive sorting
- Status-based filtering
- Contact information readily available
- Deal value prominence

## Design Philosophy

This CRM prioritizes:
- **Scannability**: Important information stands out
- **Hierarchy**: Visual weight on what matters most
- **Density**: Efficient use of space for B2B users
- **Clarity**: Minimal visual noise
- **Usability**: Real-world B2B workflows

## Visual Identity

A modern, energetic visual stance built for action-oriented B2B teams:
- **Coral Orange** accent (`#FF5716`) - distinctive, confident, not generic blue
- **Slate** grayscale - stronger contrast than standard gray
- **Bold typography** - clear hierarchy with confident font weights
- **Vibrant status colors** - easily scannable at a glance
- **Responsive interactions** - subtle shadows and smooth transitions

See `VISUAL_STANCE.md` for detailed design decisions and guidelines.

## UX States

Real-world application states that guide users through edge cases:
- **Loading**: Skeleton loaders that prevent blank screens
- **Empty**: Welcoming first-time experience with clear CTAs  
- **No Results**: Helpful feedback when filters return nothing
- **Error**: Honest communication with one-click retry

Each state clearly explains what's happening and what to do next. Use the "Demo States" dropdown on Dashboard and Leads pages to preview all states.

See `UX_STATES.md` for detailed rationale and implementation.
