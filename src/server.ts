import { startJobWorker, stopJobWorker } from "./workers/job-runner";
import { env } from "./config/env";
import app from "./app";

const server = app.listen(env.port, () => {
  console.log(`ArtMorph API listening on port ${env.port} (${env.nodeEnv})`);
  console.log(`[Config] HF token: ${env.hfApiToken ? "set" : "NOT SET"}`);
  console.log(`[Config] Replicate token: ${env.replicateApiToken ? "set" : "NOT SET"}`);
  console.log(`[Config] Primary provider: ${env.replicateApiToken ? "Replicate" : "HuggingFace"}`);
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
