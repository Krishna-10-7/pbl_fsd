import { Router } from "express";
import { z } from "zod";
import { pg } from "../db.js";

const router = Router();

const createWorkspaceSchema = z.object({
  name: z.string().min(3),
  description: z.string().default(""),
});

router.get("/", async (req, res, next) => {
  try {
    const result = await pg.query(
      `SELECT w.id, w.name, w.description, w.created_at
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id],
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const input = createWorkspaceSchema.parse(req.body);
    const workspaceResult = await pg.query(
      `INSERT INTO workspaces(name, description, owner_id)
       VALUES($1, $2, $3)
       RETURNING *`,
      [input.name, input.description, req.user.id],
    );

    const workspace = workspaceResult.rows[0];

    await pg.query(
      `INSERT INTO workspace_members(workspace_id, user_id, role)
       VALUES($1, $2, 'admin')`,
      [workspace.id, req.user.id],
    );

    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
});

export default router;
