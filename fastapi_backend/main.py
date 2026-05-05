import hashlib
import asyncio
import json
import os
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional, Dict, Set, Any

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "collabspace.db"
JWT_SECRET = os.getenv("JWT_SECRET", "collabspace-fastapi-dev-secret")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALGORITHM = "HS256"
TOKEN_EXPIRY_DAYS = 7

app = FastAPI(title="CollabSpace FastAPI Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WorkspaceConnectionManager:
    def __init__(self) -> None:
        self.workspaces: Dict[str, Set[WebSocket]] = {}
        self.socket_workspace: Dict[int, str] = {}

    async def connect(self, workspace_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.workspaces.setdefault(workspace_id, set()).add(websocket)
        self.socket_workspace[id(websocket)] = workspace_id

    def disconnect(self, websocket: WebSocket) -> None:
        workspace_id = self.socket_workspace.pop(id(websocket), None)
        if not workspace_id:
            return
        sockets = self.workspaces.get(workspace_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self.workspaces.pop(workspace_id, None)

    async def broadcast(self, workspace_id: str, message: dict, exclude: WebSocket | None = None) -> None:
        sockets = list(self.workspaces.get(workspace_id, set()))
        for websocket in sockets:
            if exclude is not None and websocket is exclude:
                continue
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(websocket)


workspace_connections = WorkspaceConnectionManager()


def broadcast_workspace_event(workspace_id: str, event_type: str, payload: dict, exclude: WebSocket | None = None) -> None:
    asyncio.run(workspace_connections.broadcast(workspace_id, {"type": event_type, "workspaceId": workspace_id, "payload": payload}, exclude=exclude))


def get_workspace_membership(conn: sqlite3.Connection, workspace_id: str, user_id: str) -> Optional[sqlite3.Row]:
    return conn.execute(
        "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
        (workspace_id, user_id),
    ).fetchone()


def get_workspace_snapshot(conn: sqlite3.Connection, workspace_id: str) -> dict:
    documents = [dict(row) for row in conn.execute("SELECT id, workspace_id, title, content, updated_at FROM documents WHERE workspace_id = ? ORDER BY updated_at DESC", (workspace_id,)).fetchall()]
    tasks = [dict(row) for row in conn.execute("SELECT id, workspace_id, title, status, assignee_id, created_at FROM tasks WHERE workspace_id = ? ORDER BY created_at DESC", (workspace_id,)).fetchall()]
    chat = [dict(row) for row in conn.execute("SELECT id, workspace_id, user_id, message, created_at FROM chat_messages WHERE workspace_id = ? ORDER BY created_at ASC", (workspace_id,)).fetchall()]
    board_row = conn.execute("SELECT elements, app_state, files, updated_by, updated_at FROM board_state WHERE workspace_id = ?", (workspace_id,)).fetchone()
    board = {"elements": [], "appState": {}, "files": {}, "updatedBy": None, "updatedAt": None}
    if board_row:
        board = {
            "elements": json.loads(board_row["elements"]),
            "appState": json.loads(board_row["app_state"]),
            "files": json.loads(board_row["files"]),
            "updatedBy": board_row["updated_by"],
            "updatedAt": board_row["updated_at"],
        }
    return {"documents": documents, "tasks": tasks, "chat": chat, "board": board}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def issue_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS)
    return jwt.encode(data, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")

    token = authorization.replace("Bearer ", "", 1)
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


class RegisterInput(BaseModel):
    name: str = Field(min_length=2)
    email: str
    password: str = Field(min_length=6)


class LoginInput(BaseModel):
    email: str
    password: str = Field(min_length=6)


class WorkspaceInput(BaseModel):
    name: str = Field(min_length=3)
    description: str = ""


class DocumentInput(BaseModel):
    workspaceId: str
    title: str = Field(min_length=2)
    content: str = ""


class DocumentPatchInput(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class TaskInput(BaseModel):
    workspaceId: str
    title: str = Field(min_length=2)
    status: str = "todo"
    assigneeId: Optional[str] = None


class TaskPatchInput(BaseModel):
    status: Optional[str] = None
    assigneeId: Optional[str] = None


class ChatInput(BaseModel):
    workspaceId: str
    message: str = Field(min_length=1, max_length=5000)


class InviteMemberInput(BaseModel):
    email: Optional[str] = None


def init_db() -> None:
    conn = get_connection()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'member',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workspace_members (
          workspace_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'member',
          created_at TEXT NOT NULL,
          PRIMARY KEY (workspace_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_by TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS document_versions (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          content TEXT NOT NULL,
          edited_by TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          title TEXT NOT NULL,
          status TEXT NOT NULL,
          assignee_id TEXT,
          created_by TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workspace_invites (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          token TEXT NOT NULL UNIQUE,
          invitee_email TEXT,
          role TEXT NOT NULL DEFAULT 'member',
          created_by TEXT NOT NULL,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          accepted_by TEXT,
          accepted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS board_state (
          workspace_id TEXT PRIMARY KEY,
          elements TEXT NOT NULL,
          app_state TEXT NOT NULL,
          files TEXT NOT NULL,
          updated_by TEXT,
          updated_at TEXT NOT NULL
        );
        """
    )
    conn.commit()
    conn.close()


def normalize_workspace_roles() -> None:
    conn = get_connection()
    workspaces = conn.execute("SELECT id, owner_id FROM workspaces").fetchall()

    for workspace in workspaces:
        owner_row = conn.execute(
            "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
            (workspace["id"], workspace["owner_id"]),
        ).fetchone()

        if owner_row:
            conn.execute(
                "UPDATE workspace_members SET role = 'admin' WHERE workspace_id = ? AND user_id = ?",
                (workspace["id"], workspace["owner_id"]),
            )
        else:
            conn.execute(
                "INSERT INTO workspace_members(workspace_id, user_id, role, created_at) VALUES (?, ?, 'admin', ?)",
                (workspace["id"], workspace["owner_id"], utc_now()),
            )

        conn.execute(
            "UPDATE workspace_members SET role = 'member' WHERE workspace_id = ? AND user_id <> ?",
            (workspace["id"], workspace["owner_id"]),
        )

    conn.commit()
    conn.close()


def build_invite_url(token: str) -> str:
    return f"{FRONTEND_URL.rstrip('/')}/?invite={token}"


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    normalize_workspace_roles()


@app.get("/health")
def health() -> dict:
    return {"ok": True, "service": "collabspace-fastapi-backend"}


@app.websocket("/ws/{workspace_id}")
async def workspace_socket(websocket: WebSocket, workspace_id: str) -> None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        user = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        await websocket.close(code=1008)
        return

    conn = get_connection()
    membership = get_workspace_membership(conn, workspace_id, user["id"])
    if not membership:
        conn.close()
        await websocket.close(code=1008)
        return

    await workspace_connections.connect(workspace_id, websocket)
    snapshot = get_workspace_snapshot(conn, workspace_id)
    workspace = conn.execute("SELECT id, name, description, created_at FROM workspaces WHERE id = ?", (workspace_id,)).fetchone()
    conn.close()

    await websocket.send_json({
        "type": "workspace_snapshot",
        "workspaceId": workspace_id,
        "payload": {"workspace": dict(workspace) if workspace else None, **snapshot},
    })

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "ping":
                await websocket.send_json({"type": "pong", "workspaceId": workspace_id, "payload": {"ts": utc_now()}})
                continue

            if message_type == "board_change":
                conn = get_connection()
                conn.execute(
                    """INSERT OR REPLACE INTO board_state(workspace_id, elements, app_state, files, updated_by, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (
                        workspace_id,
                        json.dumps(data.get("elements", [])),
                        json.dumps(data.get("appState", {})),
                        json.dumps(data.get("files", {})),
                        user["id"],
                        utc_now(),
                    ),
                )
                conn.commit()
                conn.close()
                await workspace_connections.broadcast(
                    workspace_id,
                    {"type": "board_updated", "workspaceId": workspace_id, "payload": {"elements": data.get("elements", []), "appState": data.get("appState", {}), "files": data.get("files", {}), "updatedBy": user["id"]}},
                    exclude=websocket,
                )
            elif message_type == "workspace_refresh":
                conn = get_connection()
                snapshot = get_workspace_snapshot(conn, workspace_id)
                conn.close()
                await websocket.send_json({"type": "workspace_snapshot", "workspaceId": workspace_id, "payload": snapshot})
    except WebSocketDisconnect:
        workspace_connections.disconnect(websocket)


@app.post("/api/auth/register")
def register(input_data: RegisterInput) -> dict:
    conn = get_connection()
    user_id = str(uuid.uuid4())
    now = utc_now()
    email = input_data.email.lower()

    try:
        conn.execute(
            "INSERT INTO users(id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'member', ?)",
            (user_id, input_data.name, email, hash_password(input_data.password), now),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=409, detail="Email already exists")

    user = {"id": user_id, "name": input_data.name, "email": email, "role": "member"}
    token = issue_token(user)
    conn.close()
    return {"token": token, "user": user}


@app.post("/api/auth/login")
def login(input_data: LoginInput) -> dict:
    conn = get_connection()
    email = input_data.email.lower()

    row = conn.execute(
        "SELECT id, name, email, role, password_hash FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    conn.close()

    if not row or row["password_hash"] != hash_password(input_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = {"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"]}
    token = issue_token(user)
    return {"token": token, "user": user}


@app.get("/api/workspaces")
def list_workspaces(user: dict = Depends(decode_token)) -> list:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT w.id, w.name, w.description, w.created_at
        FROM workspace_members wm
        JOIN workspaces w ON w.id = wm.workspace_id
        WHERE wm.user_id = ?
        ORDER BY w.created_at DESC
        """,
        (user["id"],),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/workspaces")
def create_workspace(input_data: WorkspaceInput, user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    workspace_id = str(uuid.uuid4())
    now = utc_now()

    conn.execute(
        "INSERT INTO workspaces(id, name, description, owner_id, created_at) VALUES (?, ?, ?, ?, ?)",
        (workspace_id, input_data.name, input_data.description, user["id"], now),
    )
    conn.execute(
        "INSERT INTO workspace_members(workspace_id, user_id, role, created_at) VALUES (?, ?, 'admin', ?)",
        (workspace_id, user["id"], now),
    )
    conn.commit()

    row = conn.execute("SELECT id, name, description, created_at FROM workspaces WHERE id = ?", (workspace_id,)).fetchone()
    conn.close()
    return dict(row)


@app.get("/api/documents/{workspace_id}")
def list_documents(workspace_id: str, user: dict = Depends(decode_token)) -> list:
    conn = get_connection()
    membership = conn.execute(
        "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
        (workspace_id, user["id"]),
    ).fetchone()
    if not membership:
        conn.close()
        raise HTTPException(status_code=403, detail="Not a workspace member")

    rows = conn.execute(
        "SELECT id, workspace_id, title, content, updated_at FROM documents WHERE workspace_id = ? ORDER BY updated_at DESC",
        (workspace_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/documents")
def create_document(input_data: DocumentInput, user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    doc_id = str(uuid.uuid4())
    now = utc_now()

    conn.execute(
        "INSERT INTO documents(id, workspace_id, title, content, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (doc_id, input_data.workspaceId, input_data.title, input_data.content, user["id"], now, now),
    )
    conn.commit()

    row = conn.execute(
        "SELECT id, workspace_id, title, content, updated_at FROM documents WHERE id = ?",
        (doc_id,),
    ).fetchone()
    broadcast_workspace_event(input_data.workspaceId, "workspace_mutation", {"entity": "document", "action": "created", "document": dict(row)})
    conn.close()
    return dict(row)


@app.patch("/api/documents/item/{document_id}")
def update_document(document_id: str, input_data: DocumentPatchInput, user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    existing = conn.execute(
        "SELECT id, title, content FROM documents WHERE id = ?",
        (document_id,),
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    title = input_data.title if input_data.title is not None else existing["title"]
    content = input_data.content if input_data.content is not None else existing["content"]
    now = utc_now()

    conn.execute(
        "UPDATE documents SET title = ?, content = ?, updated_at = ? WHERE id = ?",
        (title, content, now, document_id),
    )
    conn.execute(
        "INSERT INTO document_versions(id, document_id, content, edited_by, created_at) VALUES (?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), document_id, content, user["id"], now),
    )
    conn.commit()

    row = conn.execute(
        "SELECT id, workspace_id, title, content, updated_at FROM documents WHERE id = ?",
        (document_id,),
    ).fetchone()
    broadcast_workspace_event(row["workspace_id"], "workspace_mutation", {"entity": "document", "action": "updated", "document": dict(row)})
    conn.close()
    return dict(row)


@app.get("/api/tasks/{workspace_id}")
def list_tasks(workspace_id: str, user: dict = Depends(decode_token)) -> list:
    conn = get_connection()
    membership = conn.execute(
        "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
        (workspace_id, user["id"]),
    ).fetchone()
    if not membership:
        conn.close()
        raise HTTPException(status_code=403, detail="Not a workspace member")

    rows = conn.execute(
        "SELECT id, workspace_id, title, status, assignee_id, created_at FROM tasks WHERE workspace_id = ? ORDER BY created_at DESC",
        (workspace_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/tasks")
def create_task(input_data: TaskInput, user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    task_id = str(uuid.uuid4())
    now = utc_now()

    conn.execute(
        "INSERT INTO tasks(id, workspace_id, title, status, assignee_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (task_id, input_data.workspaceId, input_data.title, input_data.status, input_data.assigneeId, user["id"], now),
    )
    conn.commit()

    row = conn.execute(
        "SELECT id, workspace_id, title, status, assignee_id, created_at FROM tasks WHERE id = ?",
        (task_id,),
    ).fetchone()
    broadcast_workspace_event(input_data.workspaceId, "workspace_mutation", {"entity": "task", "action": "created", "task": dict(row)})
    conn.close()
    return dict(row)


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: str, input_data: TaskPatchInput, _user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    existing = conn.execute(
        "SELECT id, status, assignee_id FROM tasks WHERE id = ?",
        (task_id,),
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    status = input_data.status if input_data.status is not None else existing["status"]
    assignee_id = input_data.assigneeId if input_data.assigneeId is not None else existing["assignee_id"]

    conn.execute(
        "UPDATE tasks SET status = ?, assignee_id = ? WHERE id = ?",
        (status, assignee_id, task_id),
    )
    conn.commit()

    row = conn.execute(
        "SELECT id, workspace_id, title, status, assignee_id, created_at FROM tasks WHERE id = ?",
        (task_id,),
    ).fetchone()
    broadcast_workspace_event(row["workspace_id"], "workspace_mutation", {"entity": "task", "action": "updated", "task": dict(row)})
    conn.close()
    return dict(row)


@app.get("/api/chat/{workspace_id}")
def list_chat(workspace_id: str, user: dict = Depends(decode_token)) -> list:
    conn = get_connection()
    membership = conn.execute(
        "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
        (workspace_id, user["id"]),
    ).fetchone()
    if not membership:
        conn.close()
        raise HTTPException(status_code=403, detail="Not a workspace member")

    rows = conn.execute(
        "SELECT id, workspace_id, user_id, message, created_at FROM chat_messages WHERE workspace_id = ? ORDER BY created_at ASC",
        (workspace_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/chat")
def create_chat(input_data: ChatInput, user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    msg_id = str(uuid.uuid4())
    now = utc_now()

    conn.execute(
        "INSERT INTO chat_messages(id, workspace_id, user_id, message, created_at) VALUES (?, ?, ?, ?, ?)",
        (msg_id, input_data.workspaceId, user["id"], input_data.message, now),
    )
    conn.commit()

    row = conn.execute(
        "SELECT id, workspace_id, user_id, message, created_at FROM chat_messages WHERE id = ?",
        (msg_id,),
    ).fetchone()
    broadcast_workspace_event(input_data.workspaceId, "workspace_mutation", {"entity": "chat", "action": "created", "message": dict(row)})
    conn.close()
    return dict(row)


@app.get("/api/me")
def get_profile(user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    row = conn.execute(
        "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
        (user["id"],),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)


class UserNamesInput(BaseModel):
    userIds: list[str]


@app.post("/api/users/names")
def get_user_names(input_data: UserNamesInput, _user: dict = Depends(decode_token)) -> dict:
    """Return a mapping of user_id -> name for the given user IDs."""
    if not input_data.userIds:
        return {}
    conn = get_connection()
    placeholders = ",".join("?" for _ in input_data.userIds)
    rows = conn.execute(
        f"SELECT id, name FROM users WHERE id IN ({placeholders})",
        input_data.userIds,
    ).fetchall()
    conn.close()
    return {row["id"]: row["name"] for row in rows}


@app.delete("/api/workspaces/{workspace_id}")
def delete_workspace(workspace_id: str, user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    row = conn.execute(
        "SELECT owner_id FROM workspaces WHERE id = ?", (workspace_id,)
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Workspace not found")
    if row["owner_id"] != user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Only workspace owner can delete")

    conn.execute("DELETE FROM chat_messages WHERE workspace_id = ?", (workspace_id,))
    conn.execute("DELETE FROM tasks WHERE workspace_id = ?", (workspace_id,))
    conn.execute("DELETE FROM documents WHERE workspace_id = ?", (workspace_id,))
    conn.execute("DELETE FROM workspace_members WHERE workspace_id = ?", (workspace_id,))
    conn.execute("DELETE FROM workspaces WHERE id = ?", (workspace_id,))
    conn.commit()
    broadcast_workspace_event(workspace_id, "workspace_deleted", {"workspaceId": workspace_id})
    conn.close()
    return {"ok": True}


@app.delete("/api/documents/item/{document_id}")
def delete_document(document_id: str, _user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    existing = conn.execute("SELECT id, workspace_id FROM documents WHERE id = ?", (document_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")
    conn.execute("DELETE FROM document_versions WHERE document_id = ?", (document_id,))
    conn.execute("DELETE FROM documents WHERE id = ?", (document_id,))
    conn.commit()
    broadcast_workspace_event(existing["workspace_id"], "workspace_mutation", {"entity": "document", "action": "deleted", "documentId": document_id})
    conn.close()
    return {"ok": True}


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, _user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    existing = conn.execute("SELECT id, workspace_id FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    broadcast_workspace_event(existing["workspace_id"], "workspace_mutation", {"entity": "task", "action": "deleted", "taskId": task_id})
    conn.close()
    return {"ok": True}


@app.get("/api/documents/{document_id}/versions")
def list_document_versions(document_id: str, user: dict = Depends(decode_token)) -> list:
    """Get all versions of a document with editor information."""
    conn = get_connection()
    
    # Verify user has access to the document's workspace
    doc = conn.execute(
        "SELECT workspace_id FROM documents WHERE id = ?",
        (document_id,),
    ).fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")
    
    membership = conn.execute(
        "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
        (doc["workspace_id"], user["id"]),
    ).fetchone()
    if not membership:
        conn.close()
        raise HTTPException(status_code=403, detail="Not a workspace member")
    
    rows = conn.execute(
        """SELECT dv.id, dv.document_id, dv.content, dv.edited_by, dv.created_at, u.name as editor_name
           FROM document_versions dv
           LEFT JOIN users u ON dv.edited_by = u.id
           WHERE dv.document_id = ?
           ORDER BY dv.created_at DESC""",
        (document_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/api/workspaces/{workspace_id}/members")
def list_workspace_members(workspace_id: str, user: dict = Depends(decode_token)) -> list:
    """Get all members of a workspace."""
    conn = get_connection()
    
    # Verify user is a member
    membership = conn.execute(
        "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
        (workspace_id, user["id"]),
    ).fetchone()
    if not membership:
        conn.close()
        raise HTTPException(status_code=403, detail="Not a workspace member")
    
    rows = conn.execute(
        """SELECT wm.user_id,
                  CASE WHEN wm.user_id = w.owner_id THEN 'admin' ELSE 'member' END AS role,
                  wm.created_at,
                  u.name,
                  u.email
           FROM workspace_members wm
           JOIN users u ON u.id = wm.user_id
           JOIN workspaces w ON w.id = wm.workspace_id
           WHERE wm.workspace_id = ?
           ORDER BY CASE WHEN wm.user_id = w.owner_id THEN 0 ELSE 1 END, wm.created_at ASC""",
        (workspace_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/workspaces/{workspace_id}/members/invite")
def invite_workspace_member(workspace_id: str, input_data: InviteMemberInput, user: dict = Depends(decode_token)) -> dict:
    """Invite a user to a workspace by email or generate a join link."""
    conn = get_connection()

    workspace = conn.execute(
        "SELECT id, name, owner_id FROM workspaces WHERE id = ?",
        (workspace_id,),
    ).fetchone()
    if not workspace:
        conn.close()
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Verify user is a workspace admin
    membership = conn.execute(
        "SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
        (workspace_id, user["id"]),
    ).fetchone()
    if not membership or membership["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Only workspace admins can invite members")

    normalized_email = (input_data.email or "").strip().lower()
    if normalized_email:
        existing_member = conn.execute(
            "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id IN (SELECT id FROM users WHERE email = ?)",
            (workspace_id, normalized_email),
        ).fetchone()
        if existing_member:
            conn.close()
            raise HTTPException(status_code=409, detail="User already a member")

        target_user = conn.execute(
            "SELECT id, name, email FROM users WHERE email = ?",
            (normalized_email,),
        ).fetchone()

        if target_user:
            now = utc_now()
            conn.execute(
                "INSERT INTO workspace_members(workspace_id, user_id, role, created_at) VALUES (?, ?, 'member', ?)",
                (workspace_id, target_user["id"], now),
            )
            conn.commit()
            row = conn.execute(
                """SELECT wm.user_id, wm.role, wm.created_at, u.name, u.email
                   FROM workspace_members wm
                   JOIN users u ON u.id = wm.user_id
                   WHERE wm.workspace_id = ? AND wm.user_id = ?""",
                (workspace_id, target_user["id"]),
            ).fetchone()
            conn.close()
            return {"mode": "member", "member": dict(row)}

    invite_id = str(uuid.uuid4())
    token = str(uuid.uuid4())
    now = utc_now()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS)).isoformat()
    conn.execute(
        """INSERT INTO workspace_invites(id, workspace_id, token, invitee_email, role, created_by, created_at, expires_at)
           VALUES (?, ?, ?, ?, 'member', ?, ?, ?)""",
        (invite_id, workspace_id, token, normalized_email or None, user["id"], now, expires_at),
    )
    conn.commit()
    conn.close()
    return {
        "mode": "invite",
        "token": token,
        "invite_url": build_invite_url(token),
        "workspace_id": workspace_id,
        "workspace_name": workspace["name"],
        "invitee_email": normalized_email or None,
        "expires_at": expires_at,
    }


@app.get("/api/invites/{token}")
def get_invite(token: str) -> dict:
    conn = get_connection()
    row = conn.execute(
        """SELECT wi.token, wi.invitee_email, wi.created_at, wi.expires_at, wi.role,
                  w.id AS workspace_id, w.name AS workspace_name, u.name AS inviter_name
           FROM workspace_invites wi
           JOIN workspaces w ON w.id = wi.workspace_id
           JOIN users u ON u.id = wi.created_by
           WHERE wi.token = ?""",
        (token,),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Invite not found")
    return dict(row)


@app.post("/api/invites/{token}/accept")
def accept_invite(token: str, user: dict = Depends(decode_token)) -> dict:
    conn = get_connection()
    invite = conn.execute(
        "SELECT * FROM workspace_invites WHERE token = ?",
        (token,),
    ).fetchone()
    if not invite:
        conn.close()
        raise HTTPException(status_code=404, detail="Invite not found")

    expires_at = datetime.fromisoformat(invite["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        conn.close()
        raise HTTPException(status_code=410, detail="Invite expired")

    if invite["invitee_email"] and invite["invitee_email"].lower() != user["email"].lower():
        conn.close()
        raise HTTPException(status_code=403, detail="This invite is for a different email address")

    existing_member = conn.execute(
        "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
        (invite["workspace_id"], user["id"]),
    ).fetchone()
    if not existing_member:
        conn.execute(
            "INSERT INTO workspace_members(workspace_id, user_id, role, created_at) VALUES (?, ?, 'member', ?)",
            (invite["workspace_id"], user["id"], utc_now()),
        )

    conn.execute(
        "UPDATE workspace_invites SET accepted_by = ?, accepted_at = ? WHERE token = ?",
        (user["id"], utc_now(), token),
    )
    conn.commit()

    workspace = conn.execute(
        "SELECT id, name, description, created_at FROM workspaces WHERE id = ?",
        (invite["workspace_id"],),
    ).fetchone()
    member = conn.execute(
        """SELECT wm.user_id, wm.role, wm.created_at, u.name, u.email
           FROM workspace_members wm
           JOIN users u ON u.id = wm.user_id
           WHERE wm.workspace_id = ? AND wm.user_id = ?""",
        (invite["workspace_id"], user["id"]),
    ).fetchone()
    conn.close()
    return {"workspace": dict(workspace), "member": dict(member)}


@app.get("/api/workspaces/{workspace_id}/board")
def get_board_state(workspace_id: str, user: dict = Depends(decode_token)) -> dict:
    """Get the current board state for a workspace."""
    conn = get_connection()
    
    # Verify user is a member
    membership = conn.execute(
        "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
        (workspace_id, user["id"]),
    ).fetchone()
    if not membership:
        conn.close()
        raise HTTPException(status_code=403, detail="Not a workspace member")
    
    row = conn.execute(
        "SELECT elements, app_state, files, updated_by, updated_at FROM board_state WHERE workspace_id = ?",
        (workspace_id,),
    ).fetchone()
    conn.close()
    
    if not row:
        return {"elements": [], "appState": {}, "files": {}, "updatedBy": None, "updatedAt": None}
    
    import json
    return {
        "elements": json.loads(row["elements"]),
        "appState": json.loads(row["app_state"]),
        "files": json.loads(row["files"]),
        "updatedBy": row["updated_by"],
        "updatedAt": row["updated_at"],
    }


