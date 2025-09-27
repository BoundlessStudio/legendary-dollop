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

2. Start the backend API:

   ```bash
   npm run dev --workspace backend
   ```

3. In a separate terminal, start the frontend application:

   ```bash
   npm run dev --workspace frontend
   ```

The frontend expects the backend to run on `http://localhost:4000`.

## Available Scripts

- `npm run dev --workspace <app>` – Start an app in development mode.
- `npm run build --workspace <app>` – Build an app for production.
- `npm run lint --workspace <app>` – Run linting for the specified app (if configured).
- `npm run start --workspace backend` – Run the backend in production mode.

## Environment Variables

Copy `.env.example` in the relevant workspace to `.env` to customize configuration values. Defaults are provided for local development.

## API Overview

- `GET /api/health` – Returns service status and uptime information.
- `GET /api/todos` – Returns a list of example todos consumed by the Vue application.

The frontend uses a Pinia store and an Axios-based API client to communicate with the backend.
