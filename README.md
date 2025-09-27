# Legendary Dollop Monorepo

This repository contains a Vue 3 single-page application and an Express backend API managed through npm workspaces.

## Structure

```
apps/
  backend/   # Express API server
  frontend/  # Vue 3 web application (Vite)
```

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the backend and frontend applications:

   ```bash
   npm run dev
   ```

The frontend expects the backend to run on `http://localhost:4000`.

## Available Scripts

- `build: npm run build -w backend && npm run build -w frontend`
- `dev: concurrently -k -n backend,frontend -c auto \"npm run dev -w backend\" \"npm run dev -w frontend\"`
- `lint": npm run lint --workspaces --if-present`
- `start": npm run start -w backend`

## API Overview

- `GET /api/health` – Returns service status and uptime information.
- `GET /api/todos` – Returns a list of example todos consumed by the Vue application.

## APP Overview

The frontend uses a Pinia store and an Axios-based API client to communicate with the backend.
