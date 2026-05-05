# CollabSpace - Real-Time Collaborative Workspace

A modern web application for real-time document editing, task management, and team communication. Built with Next.js, FastAPI, and SQLite.
## ✨ Features

- **User Authentication**: Secure registration and login with JWT tokens
## 🎯 Current Status

**70% Functional** - All core features working with beautiful UI and smooth interactions.
## 🚀 Quick Start

### Prerequisites
### Installation & Running

#### 1. Clone and Setup Backend
```bash
# Navigate to project
cd c:\Users\hp\Desktop\pbl
#### 2. Setup Frontend (New Terminal)

```bash
# From project root
#### 3. Test the Application

1. Open `http://localhost:3000` in your browser
## 📁 Project Structure

```
## 🔌 API Endpoints

### Authentication
### Workspaces

### Documents
### Tasks

### Chat
## 🎨 Technology Stack

**Frontend:**
**Backend:**

**DevOps:**
## 🔐 Security

## 📊 Database Schema
## 💡 Usage Examples

### Creating a Workspace
### Editing Documents

### Managing Tasks
### Sending Messages

## 🛠️ Development
### Adding Features

### Running Tests
## 🚢 Deployment

### Local Docker (WIP)
## 📝 Environment Variables

### Frontend (.env.local)
### Backend (.env)

## 🐛 Troubleshooting
## 📞 Support

## 📄 License
## 👥 Contributors

---
**Last Updated**: May 5, 2026
**Version**: 1.0-beta
**Status**: Core features functional and tested
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
