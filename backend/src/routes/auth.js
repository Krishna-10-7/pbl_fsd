import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pg } from "../db.js";
import { config } from "../config.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 10);

    const result = await pg.query(
      `INSERT INTO users(name, email, password_hash, role)
       VALUES($1, $2, $3, 'member')
       RETURNING id, name, email, role`,
      [input.name, input.email.toLowerCase(), passwordHash],
    );

    const user = result.rows[0];
    const token = jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await pg.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [input.email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(input.password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: "7d" });
    return res.json({ token, user: tokenPayload });
  } catch (error) {
    return next(error);
  }
});

export default router;
