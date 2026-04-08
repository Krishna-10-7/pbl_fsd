import { Router } from "express";
import { z } from "zod";
import { pg, redis } from "../db.js";

const router = Router();

const createDocumentSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(2),
  content: z.string().default(""),
});

const updateDocumentSchema = z.object({
  title: z.string().min(2).optional(),
  content: z.string().optional(),
});

router.get("/:workspaceId", async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const result = await pg.query(
      `SELECT d.id, d.workspace_id, d.title, d.content, d.updated_at
       FROM documents d
       WHERE d.workspace_id = $1
       ORDER BY d.updated_at DESC`,
      [workspaceId],
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const input = createDocumentSchema.parse(req.body);

    const result = await pg.query(
      `INSERT INTO documents(workspace_id, title, content, created_by)
       VALUES($1, $2, $3, $4)
       RETURNING *`,
      [input.workspaceId, input.title, input.content, req.user.id],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/item/:documentId", async (req, res, next) => {
  try {
    const input = updateDocumentSchema.parse(req.body);
    const { documentId } = req.params;

    const existing = await pg.query(
      "SELECT id, content FROM documents WHERE id = $1",
      [documentId],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const title = input.title ?? null;
    const content = input.content ?? existing.rows[0].content;

    const updated = await pg.query(
      `UPDATE documents
       SET title = COALESCE($2, title),
           content = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [documentId, title, content],
    );

    await pg.query(
      `INSERT INTO document_versions(document_id, content, edited_by)
       VALUES($1, $2, $3)`,
      [documentId, content, req.user.id],
    );

    await redis.set(`document:${documentId}:content`, content, {
      EX: 3600,
    });

    return res.json(updated.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.get("/item/:documentId/versions", async (req, res, next) => {
  try {
    const result = await pg.query(
      `SELECT id, document_id, content, edited_by, created_at
       FROM document_versions
       WHERE document_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.params.documentId],
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
