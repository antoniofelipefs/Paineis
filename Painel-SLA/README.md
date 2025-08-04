# SLA Monitoring Dashboard

## Overview

The SLA Monitoring Dashboard is a real-time web application designed to track support tickets and their Service Level Agreements (SLAs). It helps support teams monitor ticket deadlines and prioritize work based on SLA status.

## Key Features

- **Real-time SLA Monitoring**: Track tickets with visual indicators for at-risk and expired SLAs
- **Filtering Options**: Filter tickets by status (All, At Risk, Expired, In Progress, Paused)
- **Project Filtering**: Toggle visibility of tickets from different projects/teams
- **Dark/Light Mode**: Toggle between display modes for different environments
- **Sound Alerts**: Configurable audio alerts when tickets enter "at risk" status
- **Summary Statistics**: At-a-glance view of ticket counts by status
- **Automatic Updates**: Data refreshes every 30 seconds

## Technology Stack

This project is built with:

- Vite
- TypeScript
- React
- Shadcn-UI components
- Tailwind CSS
- React Router
- React Query

## Project Structure

- `src/App.tsx` - Root component with routing configuration
- `src/pages/Index.tsx` - Main dashboard page
- `src/components/dashboard/` - Dashboard-specific components:
  - `ticket-dashboard.tsx` - Main dashboard component
  - `ticket-card.tsx` - Individual ticket display component
  - `config-dialog.tsx` - User configuration modal
  - `api-types.ts` - Type definitions and API configuration
- `public/data/tickets.json` - Fallback data source when API is unavailable

## Data Sources

The dashboard uses:

1. Primary: Azure Logic App API endpoint (configurable in `api-types.ts`)
2. Fallback: Local JSON data file (`public/data/tickets.json`)

## User Configuration

User settings are stored in `localStorage` and include:

- Dark/light mode preference
- Project visibility filters
- Sound alert preferences

## Development Commands

**Install Dependencies**

```shell
pnpm i
```

**Start Development Server**

```shell
pnpm run dev
```

**Build for Production**

```shell
pnpm run build
```

**Preview Production Build**

```shell
pnpm run preview
```
