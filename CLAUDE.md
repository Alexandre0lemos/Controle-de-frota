# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Develop: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Install dependencies: `npm install`

## Architecture & Structure
The project is a Fleet Management system built with **React**, **Vite**, and **Supabase**.

### Key Technical Stack
- **Frontend**: React + Vite
- **Backend/Database**: Supabase (PostgreSQL, Auth, RLS, Realtime)
- **Charts**: Recharts

### Core Logic & Data Flow
- **Business Rules (`src/lib/calc.js`)**: Contains the core logic for calculating oil changes, preventive maintenance, vehicle health, alerts, and costs.
- **Data Access (`src/lib/repo.js`)**: Acts as the repository layer for Supabase interactions, including mapping between `camelCase` (frontend) and `snake_case` (database).
- **Modular UI (`src/modules.jsx`)**: Uses a declarative approach to define CRUD modules. Adding a new feature module typically involves adding a single item to this configuration.
- **State Management (`src/context/`)**:
  - **Auth Context**: Handles user authentication, profiles, and permissions.
  - **Fleet Context**: Manages fleet data and leverages Supabase Realtime for live updates.
