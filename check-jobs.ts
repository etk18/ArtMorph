import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Check the specific job from the logs
    const job = await prisma.generationJob.findUnique({
        where: { id: "1e0c6b36-48e3-4e26-bb6e-7a923cf0b6fc" }
    });

    if (job) {
        console.log(`Job ${job.id}: ${job.status}`);
        console.log(`Created: ${job.createdAt}, Started: ${job.startedAt}, Completed: ${job.completedAt}`);
        console.log(`Error: ${job.errorMessage}`);
    } else {
        console.log("Job 1e0c... not found");
    }

    // Also check top 1 most recent generic
    const recent = await prisma.generationJob.findFirst({
        orderBy: { createdAt: "desc" }
    });
    if (recent && recent.id !== "1e0c6b36-48e3-4e26-bb6e-7a923cf0b6fc") {
        console.log(`Latest Job ${recent.id}: ${recent.status}`);
        console.log(`Error: ${recent.errorMessage}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
