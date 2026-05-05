"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ═══════════════════════════════════════
   SVG Icon Components
   ═══════════════════════════════════════ */

const Icons = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  document: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  tasks: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  chat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  close: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  send: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  save: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  folder: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  file: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  spinner: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  inbox: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  barChart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  arrowRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

/* ═══════════════════════════════════════
   Type Definitions
   ═══════════════════════════════════════ */

type User = { id: string; name: string; email: string; role: string };
type Workspace = { id: string; name: string; description: string; created_at: string };
type DocumentItem = { id: string; title: string; content: string; updated_at: string };
type DocumentVersion = { id: string; document_id: string; content: string; edited_by: string; created_at: string; editor_name: string };
type Task = { id: string; title: string; status: "todo" | "in_progress" | "done" };
type ChatMessage = { id: string; user_id: string; message: string; created_at: string };
type WorkspaceMember = { user_id: string; role: string; name: string; email: string; created_at: string };
type ToastMessage = { id: string; text: string; type: "success" | "error" | "info" };
type NavSection = "overview" | "documents" | "tasks" | "chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const NAV_ITEMS: { key: NavSection; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: Icons.overview },
  { key: "documents", label: "Docs", icon: Icons.document },
  { key: "tasks", label: "Tasks", icon: Icons.tasks },
  { key: "chat", label: "Chat", icon: Icons.chat },
];

/* ═══════════════════════════════════════
   Main Page
   ═══════════════════════════════════════ */

export default function Home() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authLoading, setAuthLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [activeNav, setActiveNav] = useState<NavSection>("overview");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([]);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedWorkspace = useMemo(() => workspaces.find((w) => w.id === selectedWorkspaceId) || null, [workspaces, selectedWorkspaceId]);
  const selectedDocument = useMemo(() => documents.find((d) => d.id === selectedDocumentId) || null, [documents, selectedDocumentId]);
  const todoTasks = useMemo(() => tasks.filter((t) => t.status === "todo"), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === "in_progress"), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);

  /* ── Toast ── */
  const showToast = useCallback((text: string, type: ToastMessage["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  /* ── API ── */
  const api = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "", ...(init?.headers || {}) },
      });
      if (!res.ok) { const p = await res.json().catch(() => ({})); throw new Error(p.detail || p.error || "Request failed"); }
      return res.json() as Promise<T>;
    },
    [token]
  );

  /* ── Data Loading ── */
  const loadWorkspaceData = useCallback(async (wsId: string) => {
    setLoading(true);
    try {
      const [docs, allTasks, msgs] = await Promise.all([
        api<DocumentItem[]>(`/documents/${wsId}`), api<Task[]>(`/tasks/${wsId}`), api<ChatMessage[]>(`/chat/${wsId}`),
      ]);
      setDocuments(docs); setTasks(allTasks); setChat(msgs);
      if (docs.length > 0) { setSelectedDocumentId(docs[0].id); setEditorContent(docs[0].content); } else { setSelectedDocumentId(""); setEditorContent(""); }
      const uids = [...new Set(msgs.map((m) => m.user_id))];
      if (uids.length > 0) { try { const n = await api<Record<string, string>>("/users/names", { method: "POST", body: JSON.stringify({ userIds: uids }) }); setUserNames((p) => ({ ...p, ...n })); } catch { /* silent */ } }
    } catch (e) { showToast(e instanceof Error ? e.message : "Failed to load data", "error"); } finally { setLoading(false); }
  }, [api, showToast]);

  const loadDocumentVersions = useCallback(async (docId: string) => {
    try {
      const versions = await api<DocumentVersion[]>(`/documents/${docId}/versions`);
      setDocumentVersions(versions);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to load versions", "error");
    }
  }, [api, showToast]);

  const loadWorkspaceMembers = useCallback(async (wsId: string) => {
    try {
      const members = await api<WorkspaceMember[]>(`/workspaces/${wsId}/members`);
      setWorkspaceMembers(members);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to load members", "error");
    }
  }, [api, showToast]);

  const refreshChat = useCallback(async () => {
    if (!selectedWorkspaceId || !token) return;
    try {
      setChatLoading(true);
      const msgs = await api<ChatMessage[]>(`/chat/${selectedWorkspaceId}`);
      setChat(msgs);
      const uids = [...new Set(msgs.map((m) => m.user_id))];
      if (uids.length > 0) {
        try {
          const n = await api<Record<string, string>>("/users/names", { method: "POST", body: JSON.stringify({ userIds: uids }) });
          setUserNames((p) => ({ ...p, ...n }));
        } catch { /* silent */ }
      }
    } catch { /* silent */ } finally {
      setChatLoading(false);
    }
  }, [api, selectedWorkspaceId, token]);

  /* ── Auth ── */
  async function handleAuth(fd: FormData) {
    setErrorText(""); setAuthLoading(true);
    try {
      const payload = { name: fd.get("name")?.toString() || "", email: fd.get("email")?.toString() || "", password: fd.get("password")?.toString() || "" };
      const data = await api<{ token: string; user: User }>(authMode === "register" ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify(payload) });
      localStorage.setItem("collabspace_token", data.token); localStorage.setItem("collabspace_user", JSON.stringify(data.user));
      setToken(data.token); setUser(data.user);
      showToast(`Welcome${authMode === "register" ? "" : " back"}, ${data.user.name}!`, "success");
    } catch (e) { setErrorText(e instanceof Error ? e.message : "Authentication failed"); } finally { setAuthLoading(false); }
  }

  /* ── Workspace ── */
  async function createWorkspace(fd: FormData) {
    const name = fd.get("workspaceName")?.toString() || ""; if (!name.trim()) return;
    try { const c = await api<Workspace>("/workspaces", { method: "POST", body: JSON.stringify({ name, description: "Collaborative workspace" }) }); setWorkspaces((p) => [c, ...p]); setSelectedWorkspaceId(c.id); showToast(`Workspace "${name}" created`, "success"); } catch (e) { showToast(e instanceof Error ? e.message : "Failed", "error"); }
  }
  async function deleteWorkspace(id: string) {
    try { await api(`/workspaces/${id}`, { method: "DELETE" }); setWorkspaces((p) => p.filter((w) => w.id !== id)); if (selectedWorkspaceId === id) { setSelectedWorkspaceId(""); setDocuments([]); setTasks([]); setChat([]); } showToast("Workspace deleted", "success"); } catch (e) { showToast(e instanceof Error ? e.message : "Failed", "error"); }
  }

  /* ── Documents ── */
  async function createDocument() {
    if (!selectedWorkspace) return;
    try { const c = await api<DocumentItem>("/documents", { method: "POST", body: JSON.stringify({ workspaceId: selectedWorkspace.id, title: `Document ${documents.length + 1}`, content: "" }) }); setDocuments((p) => [c, ...p]); setSelectedDocumentId(c.id); setEditorContent(c.content); showToast("Document created", "success"); } catch (e) { showToast(e instanceof Error ? e.message : "Failed", "error"); }
  }
  async function saveDocument() {
    if (!selectedDocumentId) return; setSaveStatus("saving");
    try { const u = await api<DocumentItem>(`/documents/item/${selectedDocumentId}`, { method: "PATCH", body: JSON.stringify({ content: editorContent }) }); setDocuments((p) => p.map((d) => (d.id === selectedDocumentId ? { ...d, content: u.content } : d))); setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); } catch (e) { showToast(e instanceof Error ? e.message : "Failed", "error"); setSaveStatus("idle"); }
  }
  async function deleteDocument(id: string) {
    try { await api(`/documents/item/${id}`, { method: "DELETE" }); setDocuments((p) => p.filter((d) => d.id !== id)); if (selectedDocumentId === id) { setSelectedDocumentId(""); setEditorContent(""); } showToast("Document deleted", "success"); } catch (e) { showToast(e instanceof Error ? e.message : "Failed", "error"); }
  }
  function handleEditorChange(v: string) {
    setEditorContent(v); setSaveStatus("idle");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (selectedDocumentId) { saveTimerRef.current = setTimeout(() => { setSaveStatus("saving"); api<DocumentItem>(`/documents/item/${selectedDocumentId}`, { method: "PATCH", body: JSON.stringify({ content: v }) }).then((u) => { setDocuments((p) => p.map((d) => (d.id === selectedDocumentId ? { ...d, content: u.content } : d))); setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); }).catch(() => setSaveStatus("idle")); }, 2000); }
  }

  /* ── Tasks ── */
  async function createTask(fd: FormData) {
    if (!selectedWorkspace) return; const title = fd.get("taskTitle")?.toString() || ""; if (!title.trim()) return;
    try { const c = await api<Task>("/tasks", { method: "POST", body: JSON.stringify({ workspaceId: selectedWorkspace.id, title, status: "todo" }) }); setTasks((p) => [c, ...p]); showToast("Task added", "success"); } catch (e) { showToast(e instanceof Error ? e.message : "Failed", "error"); }
  }
  async function updateTaskStatus(id: string, status: Task["status"]) {
    try { const u = await api<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setTasks((p) => p.map((t) => (t.id === id ? u : t))); } catch (e) { showToast(e instanceof Error ? e.message : "Failed", "error"); }
  }
  async function deleteTask(id: string) {
    try { await api(`/tasks/${id}`, { method: "DELETE" }); setTasks((p) => p.filter((t) => t.id !== id)); showToast("Task removed", "success"); } catch (e) { showToast(e instanceof Error ? e.message : "Failed", "error"); }
  }

  /* ── Chat ── */
  async function sendMessage(fd: FormData) {
    if (!selectedWorkspace) return; const msg = fd.get("chatMessage")?.toString() || ""; if (!msg.trim()) return;
    try { const c = await api<ChatMessage>("/chat", { method: "POST", body: JSON.stringify({ workspaceId: selectedWorkspace.id, message: msg }) }); setChat((p) => [...p, c]); if (user) setUserNames((p) => ({ ...p, [user.id]: user.name })); } catch (e) { showToast(e instanceof Error ? e.message : "Failed", "error"); }
  }

  function logout() {
    localStorage.removeItem("collabspace_token"); localStorage.removeItem("collabspace_user");
    setToken(""); setUser(null); setWorkspaces([]); setSelectedWorkspaceId(""); setDocuments([]); setTasks([]); setChat([]); setActiveNav("overview");
    showToast("Signed out", "info");
  }

  function formatTime(s: string) { try { return new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }); } catch { return ""; } }
  function getInitials(n: string) { return n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2); }

  /* ── Effects ── */
  useEffect(() => { setMounted(true); const t = localStorage.getItem("collabspace_token") || ""; const u = localStorage.getItem("collabspace_user"); setToken(t); if (u) try { setUser(JSON.parse(u)); } catch { /* */ } }, []);
  useEffect(() => { if (!token) return; api<Workspace[]>("/workspaces").then((items) => { setWorkspaces(items); if (items.length > 0) setSelectedWorkspaceId(items[0].id); }).catch((e) => { if (e.message.includes("Invalid") || e.message.includes("expired")) logout(); }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);
  useEffect(() => { if (selectedWorkspaceId && token) { loadWorkspaceData(selectedWorkspaceId); loadWorkspaceMembers(selectedWorkspaceId); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedWorkspaceId]);
  useEffect(() => { if (selectedDocument) setEditorContent(selectedDocument.content); if (selectedDocumentId) loadDocumentVersions(selectedDocumentId); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedDocument, selectedDocumentId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);
  
  // Chat polling - refresh every 3 seconds when viewing chat
  useEffect(() => {
    if (activeNav !== "chat" || !selectedWorkspaceId || !token) return;
    refreshChat();
    chatPollRef.current = setInterval(refreshChat, 3000);
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [activeNav, selectedWorkspaceId, token, refreshChat]);

  /* ── Render guards ── */
  if (!mounted) return <div style={{ minHeight: "100vh", background: "#f2f4f8" }} />;

  /* ═══════════ AUTH PAGE ═══════════ */
  if (!token) {
    return (
      <>
        <main className="auth-page" id="auth-page">
          <section className="auth-card">
            <div className="auth-logo">
              <Image src="/logo.png" alt="CollabSpace" width={36} height={36} className="auth-logo-img" />
              <h1>CollabSpace</h1>
            </div>
            <p className="subtitle">Real-time collaborative workspace for documents, tasks & team communication.</p>
            <form id="auth-form" onSubmit={(e) => { e.preventDefault(); handleAuth(new FormData(e.currentTarget)); }}>
              {authMode === "register" && (<div className="input-group"><label htmlFor="auth-name">Full Name</label><input id="auth-name" name="name" placeholder="Enter your name" required /></div>)}
              <div className="input-group"><label htmlFor="auth-email">Email</label><input id="auth-email" type="email" name="email" placeholder="you@example.com" required /></div>
              <div className="input-group"><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" name="password" placeholder="Min. 6 characters" required minLength={6} /></div>
              <button type="submit" className="btn-primary" disabled={authLoading}>{authLoading ? <span className="spinner spinner-sm" /> : authMode === "register" ? "Create Account" : "Sign In"}</button>
            </form>
            <button className="btn-ghost" onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setErrorText(""); }}>{authMode === "register" ? "Already have an account? Sign In" : "Need an account? Register"}</button>
            {errorText && <p className="error-text">{errorText}</p>}
          </section>
        </main>
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  /* ═══════════ DASHBOARD ═══════════ */
  return (
    <>
      <div className="dashboard-page" id="dashboard-page">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <Image src="/logo.png" alt="CollabSpace" width={32} height={32} />
          </div>
          <nav>
            {NAV_ITEMS.map((item) => (
              <button key={item.key} className={`nav-btn ${activeNav === item.key ? "active" : ""}`} onClick={() => setActiveNav(item.key)} title={item.label}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="user-avatar" title={user?.name}>{user ? getInitials(user.name) : "?"}</div>
            <button className="logout-btn" onClick={logout} title="Sign out">{Icons.logout}</button>
          </div>
        </aside>

        {/* Main */}
        <main className="main-content">
          <header className="page-header">
            <div className="header-left">
              <p className="header-greeting">{user?.name}</p>
              <h1 className="page-title">
                {activeNav === "overview" && "Your Dashboard"}
                {activeNav === "documents" && "Documents"}
                {activeNav === "tasks" && "Project Board"}
                {activeNav === "chat" && "Team Chat"}
              </h1>
            </div>
            <div className="header-right">
              <form className="create-workspace-form" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; createWorkspace(new FormData(f)).finally(() => f.reset()); }}>
                <input name="workspaceName" placeholder="New workspace..." required />
                <button type="submit" className="btn-sm"><span className="btn-icon">{Icons.plus}</span> Create</button>
              </form>
              {selectedWorkspaceId && <button className="btn-sm" onClick={() => setShowMemberPanel(!showMemberPanel)} style={{ marginLeft: "0.5rem" }}>👥 Members ({workspaceMembers.length})</button>}
            </div>
          </header>

          {workspaces.length > 0 && (
            <section className="workspace-tabs">
              {workspaces.map((ws) => (
                <div key={ws.id} className="ws-tab-wrap">
                  <button className={`ws-tab ${ws.id === selectedWorkspaceId ? "active" : ""}`} onClick={() => setSelectedWorkspaceId(ws.id)}>{ws.name}</button>
                  <button className="ws-delete-btn" title="Delete" onClick={() => deleteWorkspace(ws.id)}>{Icons.close}</button>
                </div>
              ))}
            </section>
          )}

          {showMemberPanel && selectedWorkspaceId && (
            <section className="members-panel" style={{ background: "#f3f4f6", padding: "1rem", marginBottom: "1rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>Workspace Members ({workspaceMembers.length})</h3>
                <button onClick={() => setShowMemberPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem" }}>×</button>
              </div>
              {workspaceMembers.length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>No members yet</p>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {workspaceMembers.map((m) => (
                    <div key={m.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "#fff", borderRadius: "0.375rem", border: "1px solid #e5e7eb" }}>
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{m.email}</div>
                      </div>
                      <div style={{ fontSize: "0.75rem", background: m.role === "admin" ? "#fca5a5" : "#bfdbfe", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontWeight: 500 }}>{m.role}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {!selectedWorkspace && (
            <div className="card" style={{ marginTop: "1.5rem" }}>
              <div className="empty-state"><div className="empty-icon">{Icons.folder}</div><p className="empty-title">No workspace selected</p><p>Create a workspace above to get started.</p></div>
            </div>
          )}

          {loading && <div style={{ textAlign: "center", padding: "3rem" }}><span className="spinner" /></div>}

          {/* ═══ OVERVIEW ═══ */}
          {selectedWorkspace && activeNav === "overview" && !loading && (
            <div className="page-view fade-in">
              <div className="hero-card">
                <div className="hero-content">
                  <h2>Getting started!</h2>
                  <p>CollabSpace centralizes document editing, project planning, and communication in one synchronized workspace. Use the sidebar to navigate.</p>
                  <div className="hero-stats">
                    <span className="hero-stat">{documents.length} documents</span>
                    <span className="hero-stat">{tasks.length} tasks</span>
                    <span className="hero-stat">{chat.length} messages</span>
                  </div>
                </div>
                <div className="hero-art"><div className="hero-art-inner">Real-time Collaboration</div></div>
              </div>

              <div className="stats-grid">
                <button className="stat-card" onClick={() => setActiveNav("documents")}><div className="stat-icon violet">{Icons.document}</div><div><div className="stat-value">{documents.length}</div><div className="stat-label">Documents</div></div></button>
                <button className="stat-card" onClick={() => setActiveNav("tasks")}><div className="stat-icon cyan">{Icons.tasks}</div><div><div className="stat-value">{tasks.length}</div><div className="stat-label">Tasks</div></div></button>
                <button className="stat-card" onClick={() => setActiveNav("tasks")}><div className="stat-icon amber">{Icons.clock}</div><div><div className="stat-value">{inProgressTasks.length}</div><div className="stat-label">In Progress</div></div></button>
                <button className="stat-card" onClick={() => setActiveNav("chat")}><div className="stat-icon emerald">{Icons.chat}</div><div><div className="stat-value">{chat.length}</div><div className="stat-label">Messages</div></div></button>
              </div>

              <div className="overview-grid">
                <div className="card">
                  <div className="card-header"><h3>Recent Documents</h3><button className="link-btn" onClick={() => setActiveNav("documents")}>View all {Icons.arrowRight}</button></div>
                  {documents.length === 0 ? <p className="muted-text">No documents yet.</p> : (
                    <div className="recent-list">
                      {documents.slice(0, 4).map((doc) => (
                        <div key={doc.id} className="recent-item" onClick={() => { setSelectedDocumentId(doc.id); setActiveNav("documents"); }}>
                          <span className="recent-icon">{Icons.file}</span>
                          <div><div className="recent-title">{doc.title}</div><div className="recent-sub">{doc.content.slice(0, 60) || "Empty document"}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card">
                  <div className="card-header"><h3>Messages</h3><button className="link-btn" onClick={() => setActiveNav("chat")}>View all {Icons.arrowRight}</button></div>
                  {chat.length === 0 ? <p className="muted-text">No messages yet.</p> : (
                    <div className="recent-list">
                      {chat.slice(-4).map((msg) => (
                        <div key={msg.id} className="recent-item">
                          <div className="mini-avatar">{getInitials(userNames[msg.user_id] || "U")}</div>
                          <div><div className="recent-title">{userNames[msg.user_id] || (msg.user_id === user?.id ? user.name : msg.user_id.slice(0, 8))}<span className="recent-time">{formatTime(msg.created_at)}</span></div><div className="recent-sub">{msg.message}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ DOCUMENTS ═══ */}
          {selectedWorkspace && activeNav === "documents" && !loading && (
            <div className="page-view fade-in">
              <div className="card full-height">
                <div className="card-header"><h3>Document Editor</h3><div style={{ display: "flex", gap: "0.5rem" }}><button className="btn-sm" onClick={() => setShowVersionPanel(!showVersionPanel)}>📋 Versions ({documentVersions.length})</button><button className="btn-sm" onClick={createDocument}><span className="btn-icon">{Icons.plus}</span> New Document</button></div></div>
                {documents.length === 0 ? (
                  <div className="empty-state large"><div className="empty-icon large">{Icons.edit}</div><p className="empty-title">No documents yet</p><p>Create your first document to start collaborating.</p><button className="btn-sm" onClick={createDocument} style={{ marginTop: "1rem" }}><span className="btn-icon">{Icons.plus}</span> Create Document</button></div>
                ) : (
                  <div className="doc-layout" style={{ position: "relative" }}>
                    {showVersionPanel && (
                      <aside className="doc-versions-panel" style={{ background: "#f9fafb", borderRight: "1px solid #e5e7eb", padding: "1rem", maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
                        <h4 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "0.875rem", fontWeight: 600 }}>Version History</h4>
                        {documentVersions.length === 0 ? (
                          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No versions yet</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {documentVersions.map((v) => (
                              <div key={v.id} style={{ fontSize: "0.75rem", padding: "0.5rem", background: "#fff", borderRadius: "0.375rem", border: "1px solid #e5e7eb" }}>
                                <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>📝 {v.editor_name || "Unknown"}</div>
                                <div style={{ color: "#6b7280", fontSize: "0.7rem" }}>{new Date(v.created_at).toLocaleString()}</div>
                                <button onClick={() => setEditorContent(v.content)} style={{ marginTop: "0.375rem", padding: "0.25rem 0.5rem", fontSize: "0.7rem", background: "#e5e7eb", border: "none", borderRadius: "0.25rem", cursor: "pointer" }}>Restore</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </aside>
                    )}
                    <aside className="doc-sidebar">
                      {documents.map((doc) => (
                        <div key={doc.id} className={`doc-item ${doc.id === selectedDocumentId ? "active" : ""}`} onClick={() => setSelectedDocumentId(doc.id)}>
                          <span className="doc-item-title">{doc.title}</span>
                          <button className="icon-btn-sm" title="Delete" onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}>{Icons.close}</button>
                        </div>
                      ))}
                    </aside>
                    <div className="editor-area">
                      <textarea id="document-editor" value={editorContent} onChange={(e) => handleEditorChange(e.target.value)} placeholder="Start writing your document..." />
                      <div className="editor-footer">
                        <span className={`save-indicator ${saveStatus}`}>
                          {saveStatus === "saving" && <>{Icons.spinner} Saving...</>}
                          {saveStatus === "saved" && <>{Icons.check} Saved</>}
                          {saveStatus === "idle" && "Auto-saves after 2s"}
                        </span>
                        <button className="btn-sm" onClick={saveDocument}><span className="btn-icon">{Icons.save}</span> Save Now</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ TASKS ═══ */}
          {selectedWorkspace && activeNav === "tasks" && !loading && (
            <div className="page-view fade-in">
              <div className="card">
                <div className="card-header">
                  <h3>Task Board</h3>
                  <div className="task-stats"><span className="task-stat todo">{todoTasks.length} to do</span><span className="task-stat progress">{inProgressTasks.length} in progress</span><span className="task-stat done">{doneTasks.length} done</span></div>
                </div>
                <form className="task-add-form" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; createTask(new FormData(f)).finally(() => f.reset()); }}>
                  <input name="taskTitle" placeholder="What needs to be done?" required />
                  <button type="submit" className="btn-sm"><span className="btn-icon">{Icons.plus}</span> Add Task</button>
                </form>
              </div>
              {tasks.length === 0 ? (
                <div className="card" style={{ marginTop: "0.85rem" }}><div className="empty-state large"><div className="empty-icon large">{Icons.tasks}</div><p className="empty-title">No tasks yet</p><p>Add your first task above to start tracking.</p></div></div>
              ) : (
                <div className="kanban-board">
                  <KanbanColumn title="To Do" status="todo" tasks={todoTasks} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
                  <KanbanColumn title="In Progress" status="in_progress" tasks={inProgressTasks} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
                  <KanbanColumn title="Done" status="done" tasks={doneTasks} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
                </div>
              )}
            </div>
          )}

          {/* ═══ CHAT ═══ */}
          {selectedWorkspace && activeNav === "chat" && !loading && (
            <div className="page-view fade-in">
              <div className="card chat-card">
                <div className="card-header"><h3>Team Chat</h3><span className="muted-text">{chat.length} messages {chatLoading && "• Syncing..."}</span></div>
                <div className="chat-area">
                  {chat.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">{Icons.inbox}</div><p className="empty-title">No messages yet</p><p>Send a message to start a conversation.</p></div>
                  ) : (
                    <div className="chat-scroll">
                      {chat.map((msg) => {
                        const isMe = msg.user_id === user?.id;
                        const name = userNames[msg.user_id] || (isMe ? user?.name : msg.user_id.slice(0, 8));
                        return (
                          <div key={msg.id} className={`chat-message ${isMe ? "self" : ""}`}>
                            <div className={`chat-avatar ${isMe ? "self" : ""}`}>{getInitials(name || "U")}</div>
                            <div className="chat-body">
                              <div className="chat-meta"><span className="chat-name">{name}</span><span className="chat-time">{formatTime(msg.created_at)}</span></div>
                              <p className="chat-text">{msg.message}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
                <form className="chat-input-bar" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; sendMessage(new FormData(f)).finally(() => f.reset()); }}>
                  <input name="chatMessage" placeholder="Type a message..." required autoComplete="off" />
                  <button type="submit" className="btn-send">{Icons.send} Send</button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}

/* ═══════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════ */

function KanbanColumn({ title, status, tasks, onStatusChange, onDelete }: { title: string; status: string; tasks: Task[]; onStatusChange: (id: string, s: Task["status"]) => void; onDelete: (id: string) => void }) {
  return (
    <div className={`kanban-column ${status}`}>
      <div className="kanban-col-header">
        <span className={`kanban-col-title ${status}`}>{title}</span>
        <span className={`kanban-count ${status}`}>{tasks.length}</span>
      </div>
      <div className="kanban-cards">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <div className="task-card-title">{task.title}</div>
            <div className="task-card-actions">
              <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value as Task["status"])}>
                <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option>
              </select>
              <button className="icon-btn-sm" style={{ opacity: 1 }} title="Delete" onClick={() => onDelete(task.id)}>{Icons.close}</button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <div className="kanban-empty">No tasks</div>}
      </div>
    </div>
  );
}

function ToastContainer({ toasts }: { toasts: ToastMessage[] }) {
  return <div className="toast-container">{toasts.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.text}</div>)}</div>;
}
