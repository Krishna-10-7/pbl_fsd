import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspaces.js";
import documentRoutes from "./routes/documents.js";
import taskRoutes from "./routes/tasks.js";
import chatRoutes from "./routes/chat.js";
import { authRequired } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { config } from "./config.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "collabspace-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", authRequired, workspaceRoutes);
app.use("/api/documents", authRequired, documentRoutes);
app.use("/api/tasks", authRequired, taskRoutes);
app.use("/api/chat", authRequired, chatRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
