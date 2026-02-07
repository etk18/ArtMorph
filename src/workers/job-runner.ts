import { GenerationStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { processGenerationJob } from "./job.worker";

const POLL_INTERVAL_MS = 2000;
let isRunning = false;

export const startJobWorker = () => {
    if (isRunning) return;
    console.log("[JobWorker] Starting background worker...");
    isRunning = true;
    runLoop();
};

const runLoop = async () => {
    while (isRunning) {
        try {
            // Find one queued job (FIFO)
            const job = await prisma.generationJob.findFirst({
                where: { status: GenerationStatus.QUEUED },
                orderBy: { createdAt: "asc" },
                select: { id: true }
            });

            if (job) {
                console.log(`[JobWorker] Processing job ${job.id}...`);
                await processGenerationJob(job.id);
                console.log(`[JobWorker] Job ${job.id} completed.`);
            } else {
                // Wait if queue is empty
                await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
            }
        } catch (error) {
            console.error("[JobWorker] Error in worker loop:", error);
            // Wait before retrying to avoid spamming logs on persistent errors
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }
    }
};

export const stopJobWorker = () => {
    console.log("[JobWorker] Stopping worker...");
    isRunning = false;
};
