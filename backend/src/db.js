import { Pool } from "pg";
import { createClient } from "redis";
import { config } from "./config.js";

export const pg = new Pool({ connectionString: config.postgresUrl });

export const redis = createClient({
  url: config.redisUrl,
});

redis.on("error", (error) => {
  console.error("Redis client error:", error.message);
});

export async function connectDatastores() {
  await pg.query("SELECT 1");
  await redis.connect();
}
