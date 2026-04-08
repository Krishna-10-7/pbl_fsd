import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import "./App.css";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Workspace = {
  id: string;
  name: string;
  description: string;
};

type DocumentItem = {
  id: string;
  title: string;
  content: string;
};

type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
};

type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("collabspace_token") || "");
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [editorContent, setEditorContent] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [errorText, setErrorText] = useState("");

  const selectedDocument = useMemo(
    () => documents.find((item) => item.id === selectedDocumentId) || null,
    [documents, selectedDocumentId],
  );

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(payload.error || "Request failed");
    }

    return response.json() as Promise<T>;
  }

  async function loadWorkspaceData(workspaceId: string) {
    const [docs, allTasks, messages] = await Promise.all([
      api<DocumentItem[]>(`/documents/${workspaceId}`),
      api<Task[]>(`/tasks/${workspaceId}`),
      api<ChatMessage[]>(`/chat/${workspaceId}`),
    ]);

    setDocuments(docs);
    setTasks(allTasks);
    setChat(messages);

    if (docs.length > 0) {
      setSelectedDocumentId(docs[0].id);
      setEditorContent(docs[0].content);
    } else {
      setSelectedDocumentId("");
      setEditorContent("");
    }
  }

  async function handleAuthSubmit(formData: FormData) {
    setErrorText("");
    try {
      const payload = {
        name: formData.get("name")?.toString() || "",
        email: formData.get("email")?.toString() || "",
        password: formData.get("password")?.toString() || "",
      };

      const path = authMode === "register" ? "/auth/register" : "/auth/login";
      const data = await api<{ token: string; user: User }>(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("collabspace_token", data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Authentication failed");
    }
  }

  async function createWorkspace(formData: FormData) {
    const name = formData.get("workspaceName")?.toString() || "";
    if (!name.trim()) {
      return;
    }

    const created = await api<Workspace>("/workspaces", {
      method: "POST",
      body: JSON.stringify({ name, description: "CollabSpace project workspace" }),
    });

    setWorkspaces((prev) => [created, ...prev]);
    setSelectedWorkspace(created);
  }

  async function createDocument() {
    if (!selectedWorkspace) {
      return;
    }

    const created = await api<DocumentItem>("/documents", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: selectedWorkspace.id,
        title: `Document ${documents.length + 1}`,
        content: "",
      }),
    });

    setDocuments((prev) => [created, ...prev]);
    setSelectedDocumentId(created.id);
    setEditorContent(created.content);
  }

  async function saveDocument() {
    if (!selectedDocumentId) {
      return;
    }

    const updated = await api<DocumentItem>(`/documents/item/${selectedDocumentId}`, {
      method: "PATCH",
      body: JSON.stringify({ content: editorContent }),
    });

    setDocuments((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, content: updated.content } : item)),
    );
  }

  async function createTask(formData: FormData) {
    if (!selectedWorkspace) {
      return;
    }

    const title = formData.get("taskTitle")?.toString() || "";
    if (!title.trim()) {
      return;
    }

    const created = await api<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: selectedWorkspace.id,
        title,
        status: "todo",
      }),
    });

    setTasks((prev) => [created, ...prev]);
  }

  async function moveTask(taskId: string, status: Task["status"]) {
    const updated = await api<Task>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    setTasks((prev) => prev.map((item) => (item.id === taskId ? updated : item)));
  }

  function sendChatMessage(formData: FormData) {
    if (!selectedWorkspace || !socket) {
      return;
    }

    const message = formData.get("chatMessage")?.toString() || "";
    if (!message.trim()) {
      return;
    }

    socket.emit("chat:send", {
      workspaceId: selectedWorkspace.id,
      message,
    });
  }

  useEffect(() => {
    if (!token) {
      setWorkspaces([]);
      setSelectedWorkspace(null);
      return;
    }

    api<Workspace[]>("/workspaces")
      .then((data) => {
        setWorkspaces(data);
        if (data.length > 0) {
          setSelectedWorkspace(data[0]);
        }
      })
      .catch((error) => setErrorText(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
    });

    newSocket.on("chat:new", (message: ChatMessage) => {
      setChat((prev) => [...prev, message]);
    });

    newSocket.on("document:patch", (patch: { documentId: string; content: string }) => {
      setDocuments((prev) =>
        prev.map((item) => (item.id === patch.documentId ? { ...item, content: patch.content } : item)),
      );

      if (patch.documentId === selectedDocumentId) {
        setEditorContent(patch.content);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token, selectedDocumentId]);

  useEffect(() => {
    if (!selectedWorkspace || !socket) {
      return;
    }

    loadWorkspaceData(selectedWorkspace.id).catch((error) => setErrorText(error.message));
    socket.emit("workspace:join", { workspaceId: selectedWorkspace.id });
  }, [selectedWorkspace, socket]);

  useEffect(() => {
    if (!selectedDocument || !socket) {
      return;
    }

    setEditorContent(selectedDocument.content);
    socket.emit("document:join", { documentId: selectedDocument.id });
  }, [selectedDocument, socket]);

  function logout() {
    localStorage.removeItem("collabspace_token");
    setToken("");
    setUser(null);
    setErrorText("");
  }

  if (!token) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>CollabSpace</h1>
          <p>Unified real-time workspace for documents, boards, tasks, and chat.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleAuthSubmit(new FormData(event.currentTarget));
            }}
          >
            {authMode === "register" && <input name="name" placeholder="Full name" required />}
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">{authMode === "register" ? "Create account" : "Sign in"}</button>
          </form>
          <button className="ghost" onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}>
            {authMode === "register" ? "Already have an account? Sign in" : "Need an account? Register"}
          </button>
          {errorText && <p className="error">{errorText}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header>
        <div>
          <h1>CollabSpace</h1>
          <p>Realtime collaboration hub for distributed teams</p>
        </div>
        <div className="header-actions">
          <span>{user?.name}</span>
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section className="workspace-strip">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createWorkspace(new FormData(event.currentTarget)).finally(() => event.currentTarget.reset());
          }}
        >
          <input name="workspaceName" placeholder="Create workspace" />
          <button type="submit">Add</button>
        </form>
        <div className="workspace-list">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              className={workspace.id === selectedWorkspace?.id ? "active" : ""}
              onClick={() => setSelectedWorkspace(workspace)}
            >
              {workspace.name}
            </button>
          ))}
        </div>
      </section>

      <section className="grid-layout">
        <article className="panel docs-panel">
          <div className="panel-title-row">
            <h2>Documents</h2>
            <button onClick={createDocument}>New</button>
          </div>
          <div className="document-body">
            <aside>
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  className={doc.id === selectedDocumentId ? "active" : ""}
                  onClick={() => setSelectedDocumentId(doc.id)}
                >
                  {doc.title}
                </button>
              ))}
            </aside>
            <div className="editor-area">
              <textarea
                value={editorContent}
                onChange={(event) => {
                  const nextContent = event.target.value;
                  setEditorContent(nextContent);
                  if (selectedDocumentId && socket) {
                    socket.emit("document:patch", {
                      documentId: selectedDocumentId,
                      content: nextContent,
                    });
                  }
                }}
                placeholder="Start collaborating on your document..."
              />
              <button onClick={saveDocument}>Save version</button>
            </div>
          </div>
        </article>

        <article className="panel tasks-panel">
          <div className="panel-title-row">
            <h2>Project Board</h2>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createTask(new FormData(event.currentTarget)).finally(() => event.currentTarget.reset());
            }}
          >
            <input name="taskTitle" placeholder="Add task" />
            <button type="submit">Create</button>
          </form>
          <ul>
            {tasks.map((task) => (
              <li key={task.id}>
                <span>{task.title}</span>
                <select value={task.status} onChange={(event) => moveTask(task.id, event.target.value as Task["status"])}>
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel chat-panel">
          <div className="panel-title-row">
            <h2>Team Chat</h2>
          </div>
          <ul className="chat-log">
            {chat.map((message) => (
              <li key={message.id}>
                <strong>{message.user_id.slice(0, 8)}</strong>
                <p>{message.message}</p>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendChatMessage(new FormData(event.currentTarget));
              event.currentTarget.reset();
            }}
          >
            <input name="chatMessage" placeholder="Type a message" />
            <button type="submit">Send</button>
          </form>
        </article>
      </section>

      {errorText && <p className="error">{errorText}</p>}
    </main>
  );
}

export default App;
