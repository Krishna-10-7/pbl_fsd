import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "collabspace-dev-secret",
  postgresUrl:
    process.env.DATABASE_URL ||
    "postgresql://collabspace:collabspace@localhost:5432/collabspace",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
