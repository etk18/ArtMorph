import { GenerationStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/error-handler";
import { generateImage } from "../services/generation.service";

export const processGenerationJob = async (jobId: string): Promise<void> => {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    include: {
      styleConfig: true,
      inputImage: true,
      generatedImages: { select: { id: true } }
    }
  });

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.status === GenerationStatus.COMPLETED) {
    return;
  }

  if (job.status !== GenerationStatus.QUEUED) {
    return;
  }

  if (job.generatedImages.length > 0) {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: GenerationStatus.COMPLETED,
        completedAt: new Date()
      }
    });

    await prisma.generationHistory.create({
      data: {
        jobId: job.id,
        userId: job.userId,
        status: GenerationStatus.COMPLETED,
        message: "Output already generated"
      }
    });

    return;
  }

  const claim = await prisma.generationJob.updateMany({
    where: { id: job.id, status: GenerationStatus.QUEUED },
    data: {
      status: GenerationStatus.PROCESSING,
      startedAt: new Date(),
      errorMessage: null
    }
  });

  if (claim.count === 0) {
    return;
  }

  await prisma.generationHistory.create({
    data: {
      jobId: job.id,
      userId: job.userId,
      status: GenerationStatus.PROCESSING,
      message: "Job started"
    }
  });

  try {
    if (!job.styleConfig) {
      throw new AppError("Style configuration missing", 400);
    }

    if (!job.inputImage) {
      throw new AppError("Input image missing", 400);
    }

    const output = await generateImage({
      userId: job.userId,
      jobId: job.id,
      styleConfig: job.styleConfig,
      inputImageId: job.inputImage.id,
      inputImageBucket: job.inputImage.storageBucket,
      inputImagePath: job.inputImage.storagePath,
      seed: undefined,
      userPrompt: job.prompt
    });

    await prisma.$transaction([
      prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: GenerationStatus.COMPLETED,
          completedAt: new Date()
        }
      }),
      prisma.generationHistory.create({
        data: {
          jobId: job.id,
          userId: job.userId,
          status: GenerationStatus.COMPLETED,
          message: JSON.stringify({
            outputUrl: output.url,
            storageBucket: output.storageBucket,
            storagePath: output.storagePath,
            contentType: output.contentType
          })
        }
      })
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await prisma.$transaction([
      prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: GenerationStatus.FAILED,
          completedAt: new Date(),
          errorMessage: message
        }
      }),
      prisma.generationHistory.create({
        data: {
          jobId: job.id,
          userId: job.userId,
          status: GenerationStatus.FAILED,
          message
        }
      })
    ]);

    throw error;
  }
};
