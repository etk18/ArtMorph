import { startJobWorker, stopJobWorker } from "./workers/job-runner";
import { env } from "./config/env";
import app from "./app";

const server = app.listen(env.port, () => {
  console.log(`ArtMorph API listening on port ${env.port} (${env.nodeEnv})`);
  startJobWorker();
});

const shutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down...`);
  stopJobWorker();
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
