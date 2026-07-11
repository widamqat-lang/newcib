import app from "./app";
import { logger } from "./lib/logger";
import { setupRealtime } from "./lib/realtime";
import { initializeDatabase } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    // Initialize database and run automatic migrations
    await initializeDatabase();
    
    const server = app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });

    setupRealtime(server);
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

start();
