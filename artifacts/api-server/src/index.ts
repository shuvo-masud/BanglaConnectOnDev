import "dotenv/config";

import app from "./app";
import { logger } from "./lib/logger";

console.log("ENV PORT =", process.env.PORT);
console.log("DATABASE_URL =", process.env.DATABASE_URL);

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
