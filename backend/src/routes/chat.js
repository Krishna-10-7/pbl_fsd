import { Router } from "express";
import { z } from "zod";
import { pg } from "../db.js";

const router = Router();

const messageSchema = z.object({
  workspaceId: z.string().uuid(),
  message: z.string().min(1).max(5000),
});

router.get("/:workspaceId", async (req, res, next) => {
  try {
    const result = await pg.query(
      `SELECT id, workspace_id, user_id, message, created_at
       FROM chat_messages
       WHERE workspace_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.params.workspaceId],
    );

    res.json(result.rows.reverse());
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const input = messageSchema.parse(req.body);

    const result = await pg.query(
      `INSERT INTO chat_messages(workspace_id, user_id, message)
       VALUES($1, $2, $3)
       RETURNING *`,
      [input.workspaceId, req.user.id, input.message],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
