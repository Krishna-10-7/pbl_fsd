# CollabSpace — Real-Time Collaborative Workspace

### A Unified Platform for Document Editing, Project Management & Team Communication

---

## 1. Introduction

**CollabSpace** is a full-stack real-time collaborative workspace that consolidates document editing, Kanban-based task management, and team communication into a single platform. It solves the core problem of **tool fragmentation** — where teams juggle between Google Docs, Trello, Slack, and other apps — by providing one unified, self-hosted workspace.

> **Key Principle:** One workspace. One login. Complete collaboration.

---

## 2. Problem Statement

Modern teams face critical challenges with fragmented collaboration tools:

| Problem | Impact |
|---|---|
| Multiple apps for docs, tasks, chat | Constant context switching |
| Complex access management | Security vulnerabilities |
| High subscription costs | Budget strain for small teams |
| Poor integration between tools | Information silos |

```mermaid
graph LR
    A["📄 Google Docs"] --> E["😫 Context Switching"]
    B["📋 Trello"] --> E
    C["💬 Slack"] --> E
    D["📁 Notion"] --> E
    E --> F["🔻 Reduced Productivity"]
    E --> G["🔻 Data Inconsistency"]
    E --> H["🔻 Security Gaps"]
```

---

## 3. Proposed Solution

CollabSpace provides an **all-in-one collaborative workspace** with these core modules:

```mermaid
graph TB
    subgraph CollabSpace["CollabSpace Platform"]
        AUTH["🔐 Authentication<br/>JWT + SHA-256"]
        WS["🏢 Workspace<br/>Management"]
        DOC["📄 Document<br/>Editor"]
        TASK["📋 Kanban<br/>Task Board"]
        CHAT["💬 Team<br/>Chat"]
    end

    USER["👤 User"] --> AUTH
    AUTH --> WS
    WS --> DOC
    WS --> TASK
    WS --> CHAT

    style CollabSpace fill:#f9f0f5,stroke:#c72f81,stroke-width:2px
    style AUTH fill:#fff,stroke:#c72f81
    style WS fill:#fff,stroke:#c72f81
    style DOC fill:#fff,stroke:#2167c9
    style TASK fill:#fff,stroke:#e67e22
    style CHAT fill:#fff,stroke:#1aab6b
```

### Feature Summary

| Module | Capabilities | Status |
|---|---|---|
| **Authentication** | Register, Login, JWT tokens, Session persistence | ✅ Complete |
| **Workspaces** | Create, Select, Delete, Multi-workspace support | ✅ Complete |
| **Documents** | Create, Edit, Auto-save (2s debounce), Delete | ✅ Complete |
| **Task Board** | Kanban (To Do / In Progress / Done), Status transitions, Delete | ✅ Complete |
| **Team Chat** | Real-time messaging, User name resolution, Auto-scroll | ✅ Complete |

---

## 4. System Architecture

### 4.1 High-Level Architecture

```mermaid
graph TB
    subgraph Client["Frontend — Next.js 16"]
        UI["React UI<br/>App Router"]
        STATE["Client State<br/>useState/useEffect"]
        API_LAYER["API Layer<br/>fetch + JWT"]
    end

    subgraph Server["Backend — FastAPI"]
        ROUTES["REST API Routes"]
        AUTH_MW["JWT Auth Middleware"]
        DB_LAYER["SQLite Database Layer"]
    end

    subgraph Database["Persistence"]
        SQLITE[("SQLite<br/>collabspace.db")]
    end

    UI --> STATE
    STATE --> API_LAYER
    API_LAYER -->|"HTTP/JSON"| ROUTES
    ROUTES --> AUTH_MW
    AUTH_MW --> DB_LAYER
    DB_LAYER --> SQLITE

    style Client fill:#eef3ff,stroke:#2167c9,stroke-width:2px
    style Server fill:#e8f9ef,stroke:#1aab6b,stroke-width:2px
    style Database fill:#fff4e6,stroke:#e67e22,stroke-width:2px
```

### 4.2 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16 (React 19) | Server-side rendering, App Router |
| **Styling** | Vanilla CSS | Custom design system, no framework overhead |
| **Typography** | Inter + JetBrains Mono | Modern UI & code fonts via Google Fonts |
| **Backend** | FastAPI (Python) | High-performance async REST API |
| **Database** | SQLite | Zero-config, file-based persistence |
| **Auth** | JWT (PyJWT) + SHA-256 | Stateless token authentication |
| **Container** | Docker Compose | Multi-service orchestration |

---

## 5. Database Schema

```mermaid
erDiagram
    USERS {
        TEXT id PK
        TEXT name
        TEXT email UK
        TEXT password_hash
        TEXT role
        TEXT created_at
    }

    WORKSPACES {
        TEXT id PK
        TEXT name
        TEXT description
        TEXT owner_id FK
        TEXT created_at
    }

    DOCUMENTS {
        TEXT id PK
        TEXT workspace_id FK
        TEXT title
        TEXT content
        TEXT created_by FK
        TEXT updated_at
    }

    TASKS {
        TEXT id PK
        TEXT workspace_id FK
        TEXT title
        TEXT status
        TEXT assignee_id FK
        TEXT created_at
    }

    CHAT_MESSAGES {
        TEXT id PK
        TEXT workspace_id FK
        TEXT user_id FK
        TEXT message
        TEXT created_at
    }

    USERS ||--o{ WORKSPACES : "owns"
    USERS ||--o{ DOCUMENTS : "creates"
    USERS ||--o{ TASKS : "assigned to"
    USERS ||--o{ CHAT_MESSAGES : "sends"
    WORKSPACES ||--o{ DOCUMENTS : "contains"
    WORKSPACES ||--o{ TASKS : "contains"
    WORKSPACES ||--o{ CHAT_MESSAGES : "contains"
```

---

## 6. API Endpoints

### 6.1 Route Map

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Login & get JWT | ❌ |
| `GET` | `/api/me` | Current user profile | ✅ |
| `POST` | `/api/users/names` | Batch user name lookup | ✅ |
| `GET` | `/api/workspaces` | List user's workspaces | ✅ |
| `POST` | `/api/workspaces` | Create workspace | ✅ |
| `DELETE` | `/api/workspaces/:id` | Delete workspace | ✅ |
| `GET` | `/api/documents/:wsId` | List workspace documents | ✅ |
| `POST` | `/api/documents` | Create document | ✅ |
| `PATCH` | `/api/documents/item/:id` | Update document content | ✅ |
| `DELETE` | `/api/documents/item/:id` | Delete document | ✅ |
| `GET` | `/api/tasks/:wsId` | List workspace tasks | ✅ |
| `POST` | `/api/tasks` | Create task | ✅ |
| `PATCH` | `/api/tasks/:id` | Update task status | ✅ |
| `DELETE` | `/api/tasks/:id` | Delete task | ✅ |
| `GET` | `/api/chat/:wsId` | Get chat messages | ✅ |
| `POST` | `/api/chat` | Send chat message | ✅ |

### 6.2 Request Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Next.js Frontend
    participant API as FastAPI Backend
    participant DB as SQLite

    User->>Frontend: Registers / Logs In
    Frontend->>API: POST /api/auth/register
    API->>DB: Insert user record
    DB-->>API: Success
    API-->>Frontend: JWT Token + User data
    Frontend->>Frontend: Store in localStorage

    User->>Frontend: Creates Workspace
    Frontend->>API: POST /api/workspaces (+ JWT)
    API->>API: Validate JWT
    API->>DB: Insert workspace
    DB-->>API: Workspace object
    API-->>Frontend: Workspace JSON

    User->>Frontend: Edits Document
    Frontend->>Frontend: Debounce 2s
    Frontend->>API: PATCH /api/documents/item/:id
    API->>DB: Update content
    API-->>Frontend: Updated document
```

---

## 7. Frontend Architecture

### 7.1 Page-Based Navigation

The frontend uses a **single-page app** with client-side navigation between four dedicated views:

```mermaid
graph LR
    subgraph Sidebar["Navigation Sidebar"]
        N1["◉ Overview"]
        N2["📄 Documents"]
        N3["📋 Tasks"]
        N4["💬 Chat"]
    end

    N1 --> P1["Dashboard Page<br/>Hero + Stats + Recent Activity"]
    N2 --> P2["Documents Page<br/>File Sidebar + Code Editor"]
    N3 --> P3["Tasks Page<br/>Kanban Board (3 columns)"]
    N4 --> P4["Chat Page<br/>Message Feed + Input Bar"]

    style P1 fill:#f0e8ff,stroke:#7c3aed
    style P2 fill:#edf2ff,stroke:#2167c9
    style P3 fill:#fff4e6,stroke:#e67e22
    style P4 fill:#e3f5ec,stroke:#1aab6b
```

### 7.2 UI Design System

The UI follows a **clean, light theme** inspired by modern dashboard design:

| Token | Value | Usage |
|---|---|---|
| Background | `#f2f4f8` | Page background |
| Card | `#ffffff` | All content cards |
| Accent | `#c72f81` | Buttons, active states, links |
| Text | `#20232a` | Primary text |
| Muted | `#8b96a8` | Secondary text |
| Radius | `14px` | Card corners |
| Font | Inter | UI typography |
| Code Font | JetBrains Mono | Document editor |

### 7.3 Component Tree

```mermaid
graph TD
    ROOT["RootLayout<br/>(layout.tsx)"]
    ROOT --> HOME["Home Page<br/>(page.tsx / use client)"]

    HOME --> AUTH{"Authenticated?"}
    AUTH -->|No| AUTH_CARD["AuthCard<br/>Login / Register Form"]
    AUTH -->|Yes| DASH["Dashboard Shell"]

    DASH --> SIDEBAR["Sidebar<br/>Nav + User Avatar"]
    DASH --> MAIN["Main Content"]

    MAIN --> HEADER["Page Header<br/>Title + Workspace Form"]
    MAIN --> TABS["Workspace Tabs"]
    MAIN --> ROUTER{"activeNav"}

    ROUTER -->|overview| OV["OverviewPage<br/>Hero + Stats + Recent"]
    ROUTER -->|documents| DOC["DocumentsPage<br/>Sidebar + Editor"]
    ROUTER -->|tasks| TASK["TasksPage<br/>Add Form + KanbanBoard"]
    ROUTER -->|chat| CHAT_P["ChatPage<br/>MessageFeed + InputBar"]

    TASK --> KC1["KanbanColumn<br/>(To Do)"]
    TASK --> KC2["KanbanColumn<br/>(In Progress)"]
    TASK --> KC3["KanbanColumn<br/>(Done)"]
    KC1 --> TC["TaskCard"]
    KC2 --> TC
    KC3 --> TC
```

---

## 8. Key Features In Detail

### 8.1 Authentication System
- JWT-based stateless authentication with 7-day expiry
- SHA-256 password hashing
- Persistent sessions via `localStorage`
- Hydration-safe loading (server/client mismatch prevention)

### 8.2 Document Editor
- Multi-document sidebar with quick switching
- Auto-save with **2-second debounce** — no manual save needed
- Visual save indicator (Idle → Saving → Saved)
- JetBrains Mono monospace font for code-like editing
- Create and delete documents per workspace

### 8.3 Kanban Task Board
- **Three-column layout**: To Do (violet) → In Progress (orange) → Done (green)
- Color-coded column headers with count badges
- Inline status dropdown for drag-free transitions
- Task creation form with quick-add
- Delete button per task

### 8.4 Team Chat
- Workspace-scoped messaging
- User name resolution via batch API
- Chat bubble styling (self vs. others)
- Auto-scroll to latest message
- Timestamp display for each message

---

## 9. Project Structure

```
CollabSpace/
├── fastapi_backend/           # Python Backend
│   ├── main.py                # All API routes + DB init
│   ├── collabspace.db         # SQLite database (auto-created)
│   └── requirements.txt       # Python dependencies
│
├── nextjs-frontend/           # React Frontend
│   ├── src/app/
│   │   ├── layout.tsx         # Root layout + fonts
│   │   ├── page.tsx           # Main SPA (~970 lines)
│   │   └── globals.css        # Complete design system
│   ├── package.json
│   └── postcss.config.mjs
│
├── docker-compose.yml         # Container orchestration
├── discribtion.md             # Project description
└── presentation.md            # This file
```

---

## 10. How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd fastapi_backend
pip install fastapi uvicorn pyjwt
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd nextjs-frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### Docker (Production)
```bash
docker-compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

---

## 11. Data Flow Diagram (DFD)

### Level 0 — Context Diagram

```mermaid
graph LR
    USER(["👤 User"]) -->|"Register / Login<br/>Create / Edit / Delete"| SYSTEM["CollabSpace<br/>System"]
    SYSTEM -->|"Auth Tokens<br/>Documents / Tasks / Messages"| USER
    SYSTEM <-->|"Read / Write"| DB[("SQLite<br/>Database")]

    style SYSTEM fill:#f7eaf2,stroke:#c72f81,stroke-width:2px
```

### Level 1 — Functional Decomposition

```mermaid
graph TB
    USER(["👤 User"])

    USER -->|"Credentials"| AUTH["1.0 Authentication<br/>Register / Login"]
    AUTH -->|"JWT Token"| USER

    USER -->|"Workspace Data"| WS["2.0 Workspace<br/>Management"]
    WS -->|"Workspace List"| USER

    USER -->|"Document Content"| DOC["3.0 Document<br/>Management"]
    DOC -->|"Saved Documents"| USER

    USER -->|"Task Info"| TASK["4.0 Task<br/>Management"]
    TASK -->|"Task Board"| USER

    USER -->|"Chat Messages"| CHAT["5.0 Chat<br/>System"]
    CHAT -->|"Message Feed"| USER

    AUTH <--> DB[("SQLite DB")]
    WS <--> DB
    DOC <--> DB
    TASK <--> DB
    CHAT <--> DB

    style AUTH fill:#f0e8ff,stroke:#7c3aed
    style WS fill:#eef3ff,stroke:#2167c9
    style DOC fill:#edf2ff,stroke:#2167c9
    style TASK fill:#fff4e6,stroke:#e67e22
    style CHAT fill:#e3f5ec,stroke:#1aab6b
```

---

## 12. Current Status

```mermaid
pie title Feature Completion
    "Authentication" : 100
    "Workspace CRUD" : 100
    "Document Editor" : 100
    "Task Board" : 100
    "Team Chat" : 100
    "UI/UX Design" : 90
    "WebSocket Real-time" : 15
    "Whiteboard" : 0
```

### What's Done (v1.0)

| # | Feature | Status |
|---|---|---|
| 1 | User Registration & Login | ✅ |
| 2 | JWT Authentication & Session | ✅ |
| 3 | Workspace CRUD + multi-workspace | ✅ |
| 4 | Document Create / Edit / Delete | ✅ |
| 5 | Auto-save with debounce | ✅ |
| 6 | Kanban Board (3 columns) | ✅ |
| 7 | Task status transitions | ✅ |
| 8 | Team Chat messaging | ✅ |
| 9 | User name resolution | ✅ |
| 10 | Toast notifications | ✅ |
| 11 | Responsive design | ✅ |
| 12 | Page-based navigation | ✅ |
| 13 | Clean light theme UI | ✅ |
| 14 | Docker deployment config | ✅ |

---

## 13. Future Scope & Roadmap

### Phase 2 — Real-Time Enhancement

```mermaid
timeline
    title CollabSpace Development Roadmap
    section Phase 1 — Foundation (Current ✅)
        Auth + Workspaces : Complete
        Document CRUD : Complete
        Kanban Board : Complete
        Team Chat : Complete
    section Phase 2 — Real-Time
        WebSocket Integration : Planned
        Live Cursor Tracking : Planned
        Presence Indicators : Planned
    section Phase 3 — Intelligence
        AI Document Summary : Planned
        Smart Task Suggestions : Planned
        Search Across Workspace : Planned
    section Phase 4 — Scale
        Mobile App (React Native) : Planned
        Video/Audio Calls : Planned
        Third-Party Integrations : Planned
```

### Detailed Future Plans

| Priority | Feature | Description | Technology |
|---|---|---|---|
| 🔴 High | **WebSocket Real-Time Sync** | Live collaborative editing, presence indicators, typing status | Socket.IO / WebSockets |
| 🔴 High | **CRDT / OT Conflict Resolution** | Multiple users editing the same document simultaneously | Yjs / Automerge |
| 🟡 Medium | **File Attachments** | Upload images, PDFs, and files to documents and chat | S3 / MinIO |
| 🟡 Medium | **Whiteboard Module** | Collaborative drawing canvas with shapes and sticky notes | Canvas API / Excalidraw |
| 🟡 Medium | **AI Features** | Document summarization, auto-tagging, smart suggestions | OpenAI API / LLM |
| 🟡 Medium | **Search** | Full-text search across documents, tasks, and messages | SQLite FTS5 |
| 🟢 Low | **Mobile App** | Native iOS/Android app for on-the-go collaboration | React Native / Flutter |
| 🟢 Low | **Video/Audio Calls** | Built-in video conferencing within workspaces | WebRTC |
| 🟢 Low | **Third-Party Integrations** | GitHub, Google Drive, Calendar sync | REST APIs / OAuth |
| 🟢 Low | **Advanced Analytics** | Workspace activity dashboards, productivity insights | Chart.js / D3.js |
| 🟢 Low | **Multi-Factor Auth** | TOTP-based 2FA for enhanced security | pyotp |

---

## 14. Advantages

| # | Advantage | Details |
|---|---|---|
| 1 | **Unified Platform** | Eliminates switching between Docs, Trello, Slack |
| 2 | **Zero Infrastructure** | SQLite = no database server setup required |
| 3 | **Self-Hosted** | Full data ownership, no vendor lock-in |
| 4 | **Fast Setup** | `pip install` + `npm install` → running in 30 seconds |
| 5 | **Modern UI** | Clean light theme, responsive design, smooth animations |
| 6 | **Secure** | JWT auth, hashed passwords, token expiry |
| 7 | **Extensible** | Modular architecture, easy to add new features |
| 8 | **Cost-Effective** | 100% open-source, no subscriptions |

---

## 15. Limitations

| # | Limitation | Mitigation Plan |
|---|---|---|
| 1 | No real-time multi-user sync (polling-based) | WebSocket integration in Phase 2 |
| 2 | SQLite not suitable for high concurrency | Migrate to PostgreSQL for production |
| 3 | No offline support | Service Workers + IndexedDB |
| 4 | No file upload capability | S3/MinIO integration |
| 5 | No whiteboard module yet | Canvas-based editor planned |
| 6 | Single-server deployment | Kubernetes/Docker Swarm scaling |

---

## 16. Conclusion

CollabSpace successfully delivers a **functional, unified collaboration platform** that integrates document editing, project management via Kanban boards, and team communication into a single web application. The project demonstrates practical implementation of:

- **Full-stack development** with FastAPI (Python) and Next.js (React)
- **RESTful API design** with 17 endpoints covering all CRUD operations
- **JWT-based authentication** with secure password hashing
- **Modern UI/UX** with a clean, responsive design system
- **Modular architecture** ready for real-time enhancements

The platform stands as a strong academic project with real-world applicability, and its architecture is designed to support future enhancements including real-time collaboration, AI features, and mobile applications.

---

> **CollabSpace** — *Where teams collaborate, create, and communicate — all in one place.*
