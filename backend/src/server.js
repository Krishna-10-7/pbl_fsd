import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { config } from "./config.js";
import { connectDatastores } from "./db.js";
import { setupCollaboration } from "./socket/collaboration.js";

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
  },
});

setupCollaboration(io);

async function start() {
  await connectDatastores();

  httpServer.listen(config.port, () => {
    console.log(`CollabSpace backend running on port ${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
