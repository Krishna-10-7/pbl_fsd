import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { pg, redis } from "../db.js";

function parseAuthToken(socket) {
  const authHeader = socket.handshake.auth?.token || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  return token || null;
}

export function setupCollaboration(io) {
  io.use((socket, next) => {
    try {
      const token = parseAuthToken(socket);
      if (!token) {
        return next(new Error("Missing token"));
      }

      const user = jwt.verify(token, config.jwtSecret);
      socket.data.user = user;
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("workspace:join", ({ workspaceId }) => {
      socket.join(`workspace:${workspaceId}`);
      io.to(`workspace:${workspaceId}`).emit("presence:update", {
        userId: socket.data.user.id,
        status: "online",
      });
    });

    socket.on("document:join", async ({ documentId }) => {
      socket.join(`document:${documentId}`);
      const cached = await redis.get(`document:${documentId}:content`);
      if (cached) {
        socket.emit("document:sync", { documentId, content: cached });
      }
    });

    socket.on("document:patch", async ({ documentId, content }) => {
      await pg.query(
        `UPDATE documents SET content = $2, updated_at = NOW() WHERE id = $1`,
        [documentId, content],
      );

      await pg.query(
        `INSERT INTO document_versions(document_id, content, edited_by)
         VALUES($1, $2, $3)`,
        [documentId, content, socket.data.user.id],
      );

      await redis.set(`document:${documentId}:content`, content, { EX: 3600 });

      socket.to(`document:${documentId}`).emit("document:patch", {
        documentId,
        content,
        editorId: socket.data.user.id,
      });
    });

    socket.on("chat:send", async ({ workspaceId, message }) => {
      const result = await pg.query(
        `INSERT INTO chat_messages(workspace_id, user_id, message)
         VALUES($1, $2, $3)
         RETURNING id, workspace_id, user_id, message, created_at`,
        [workspaceId, socket.data.user.id, message],
      );

      io.to(`workspace:${workspaceId}`).emit("chat:new", result.rows[0]);
    });

    socket.on("disconnect", () => {
      socket.emit("presence:update", {
        userId: socket.data.user.id,
        status: "offline",
      });
    });
  });
}
