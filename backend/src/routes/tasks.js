import { Router } from "express";
import { z } from "zod";
import { pg } from "../db.js";

const router = Router();

const taskSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(2),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  assigneeId: z.string().uuid().nullable().optional(),
});

router.get("/:workspaceId", async (req, res, next) => {
  try {
    const result = await pg.query(
      `SELECT id, workspace_id, title, status, assignee_id, created_at
       FROM tasks
       WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [req.params.workspaceId],
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const input = taskSchema.parse(req.body);

    const result = await pg.query(
      `INSERT INTO tasks(workspace_id, title, status, assignee_id, created_by)
       VALUES($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.workspaceId, input.title, input.status, input.assigneeId || null, req.user.id],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/:taskId", async (req, res, next) => {
  try {
    const patchSchema = z.object({
      status: z.enum(["todo", "in_progress", "done"]).optional(),
      assigneeId: z.string().uuid().nullable().optional(),
    });

    const input = patchSchema.parse(req.body);

    const result = await pg.query(
      `UPDATE tasks
       SET status = COALESCE($2, status),
           assignee_id = COALESCE($3, assignee_id)
       WHERE id = $1
       RETURNING *`,
      [req.params.taskId, input.status ?? null, input.assigneeId ?? null],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

export default router;
