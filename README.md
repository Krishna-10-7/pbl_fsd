# CollabSpace

CollabSpace is a real-time collaborative workspace that unifies document editing, project boards, and team chat in one platform.

## Features Implemented

- JWT-based authentication (register + login)
- Workspace management
- Real-time collaborative document editing with Socket.IO
- Document version tracking
- Task board module
- Team chat module
- PostgreSQL persistence with Redis cache support
- Docker-based local deployment

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + Socket.IO
- Database: PostgreSQL
- Cache/Realtime assist: Redis
- Deployment: Docker Compose

## Run Locally (Without Docker)

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 3. Databases

Start PostgreSQL and Redis locally, then use the schema file at `infra/postgres-init.sql`.

## Run with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/health

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET/POST /api/workspaces`
- `GET/POST/PATCH /api/documents`
- `GET/POST/PATCH /api/tasks`
- `GET/POST /api/chat`

## Socket Events

- `workspace:join`
- `document:join`
- `document:patch`
- `chat:send`
- Server events: `document:patch`, `chat:new`, `presence:update`
