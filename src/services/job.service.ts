import { GenerationStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { supabaseAdmin } from "../config/supabase";
import { env } from "../config/env";
import { AppError } from "../middleware/error-handler";

export type CreateJobParams = {
  userId: string;
  inputImageId: string;
  styleConfigId: string;
  prompt?: string | null;
};

const ensureImageOwnership = async (userId: string, inputImageId: string) => {
  const image = await prisma.uploadedImage.findFirst({
    where: { id: inputImageId, userId }
  });
  if (!image) {
    throw new AppError("Input image not found", 404);
  }
  return image;
};

const ensureStyleConfig = async (styleConfigId: string) => {
  const style = await prisma.styleConfig.findFirst({
    where: { id: styleConfigId, isActive: true }
  });
  if (!style) {
    throw new AppError("Style configuration not found", 404);
  }
  return style;
};

const appendHistory = async (jobId: string, userId: string, status: GenerationStatus, message?: string) => {
  await prisma.generationHistory.create({
    data: {
      jobId,
      userId,
      status,
      message
    }
  });
};

export const checkGenerationLimit = async (userId: string) => {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { isDevMode: true, _count: { select: { generationJobs: true } } }
  });

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  const limit = env.freeGenerationLimit;
  const used = profile._count.generationJobs;
  const isDevMode = profile.isDevMode;

  return {
    isDevMode,
    limit,
    used,
    remaining: isDevMode ? Infinity : Math.max(0, limit - used),
    canGenerate: isDevMode || used < limit
  };
};

export const createJob = async ({
  userId,
  inputImageId,
  styleConfigId,
  prompt
}: CreateJobParams) => {
  // Enforce generation limit for free users
  const { canGenerate, isDevMode, remaining } = await checkGenerationLimit(userId);
  if (!canGenerate) {
    throw new AppError(
      `Free limit reached (${env.freeGenerationLimit} generations). Activate Developer Mode for unlimited access.`,
      403
    );
  }

  await ensureImageOwnership(userId, inputImageId);
  await ensureStyleConfig(styleConfigId);

  return prisma.$transaction(async (tx) => {
    const job = await tx.generationJob.create({
      data: {
        userId,
        inputImageId,
        styleConfigId,
        prompt: prompt ?? null,
        status: GenerationStatus.QUEUED,
        queuedAt: new Date()
      }
    });

    await tx.generationHistory.create({
      data: {
        jobId: job.id,
        userId,
        status: GenerationStatus.QUEUED,
        message: "Job queued"
      }
    });

    return job;
  });
};

export const getJobForUser = async (jobId: string, userId: string) => {
  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, userId },
    include: {
      generatedImages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  // Generate signed URL for completed job with output
  let outputUrl: string | null = null;
  if (job.status === GenerationStatus.COMPLETED && job.generatedImages.length > 0) {
    const output = job.generatedImages[0];
    const { data, error } = await supabaseAdmin.storage
      .from(output.storageBucket)
      .createSignedUrl(output.storagePath, env.generatedUrlTtlSeconds);
    
    if (!error && data?.signedUrl) {
      outputUrl = data.signedUrl;
    }
  }

  return {
    ...job,
    outputUrl,
    generatedImages: undefined // Don't expose raw storage paths
  };
};

export const listUserJobs = async (userId: string) => {
  const jobs = await prisma.generationJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      styleConfig: { select: { name: true, key: true } },
      generatedImages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  // Generate signed URLs for completed jobs
  const enriched = await Promise.all(
    jobs.map(async (job) => {
      let outputUrl: string | null = null;
      if (job.status === GenerationStatus.COMPLETED && job.generatedImages.length > 0) {
        const output = job.generatedImages[0];
        const { data, error } = await supabaseAdmin.storage
          .from(output.storageBucket)
          .createSignedUrl(output.storagePath, env.generatedUrlTtlSeconds);
        if (!error && data?.signedUrl) {
          outputUrl = data.signedUrl;
        }
      }
      return {
        id: job.id,
        status: job.status,
        prompt: job.prompt,
        styleName: job.styleConfig?.name ?? null,
        styleKey: job.styleConfig?.key ?? null,
        outputUrl,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      };
    })
  );

  return enriched;
};

export const listJobHistory = async (jobId: string, userId: string) => {
  return prisma.generationHistory.findMany({
    where: { jobId, userId },
    orderBy: { createdAt: "asc" }
  });
};

export const retryJob = async (jobId: string, userId: string) => {
  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, userId }
  });

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.status !== GenerationStatus.FAILED) {
    throw new AppError("Only failed jobs can be retried", 400);
  }

  if (job.retryCount >= job.maxRetries) {
    throw new AppError("Retry limit reached", 400);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.generationJob.update({
      where: { id: job.id },
      data: {
        status: GenerationStatus.QUEUED,
        retryCount: job.retryCount + 1,
        errorMessage: null,
        queuedAt: new Date(),
        startedAt: null,
        completedAt: null
      }
    });

    await tx.generationHistory.create({
      data: {
        jobId: updated.id,
        userId,
        status: GenerationStatus.QUEUED,
        message: "Retry requested"
      }
    });

    return updated;
  });
};

export const updateJobStatus = async (
  jobId: string,
  status: GenerationStatus,
  message?: string
) => {
  const updateData: Record<string, unknown> = {
    status
  };

  if (status === GenerationStatus.PROCESSING) {
    updateData.startedAt = new Date();
  }

  if (status === GenerationStatus.COMPLETED || status === GenerationStatus.FAILED) {
    updateData.completedAt = new Date();
  }

  const job = await prisma.generationJob.update({
    where: { id: jobId },
    data: updateData
  });

  await appendHistory(jobId, job.userId, status, message);

  return job;
};

export const deleteJobForUser = async (jobId: string, userId: string) => {
  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, userId },
    include: {
      generatedImages: true
    }
  });

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  // Delete generated images from storage
  for (const img of job.generatedImages) {
    await supabaseAdmin.storage
      .from(img.storageBucket)
      .remove([img.storagePath])
      .catch(() => {}); // best-effort cleanup
  }

  // Delete in correct order: history → generated images → job
  await prisma.$transaction([
    prisma.generationHistory.deleteMany({ where: { jobId } }),
    prisma.generatedImage.deleteMany({ where: { jobId } }),
    prisma.generationJob.delete({ where: { id: jobId } })
  ]);
};

export const getUserProfile = async (userId: string) => {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          generationJobs: true,
          uploadedImages: true,
          generatedImages: true
        }
      }
    }
  });

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  const limit = env.freeGenerationLimit;
  const used = profile._count.generationJobs;

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    age: profile.age,
    gender: profile.gender,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    isDevMode: profile.isDevMode,
    createdAt: profile.createdAt,
    stats: {
      totalJobs: used,
      totalUploads: profile._count.uploadedImages,
      totalGenerated: profile._count.generatedImages
    },
    generationLimit: {
      limit,
      used,
      remaining: profile.isDevMode ? -1 : Math.max(0, limit - used),
      isDevMode: profile.isDevMode
    }
  };
};

export const updateUserProfile = async (
  userId: string,
  data: {
    displayName?: string;
    age?: number | null;
    gender?: string | null;
    bio?: string | null;
  }
) => {
  const updateData: Record<string, unknown> = {};
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.age !== undefined) updateData.age = data.age;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.bio !== undefined) updateData.bio = data.bio;

  const profile = await prisma.userProfile.update({
    where: { id: userId },
    data: updateData
  });

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    age: profile.age,
    gender: profile.gender,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    createdAt: profile.createdAt
  };
};

export const toggleDevMode = async (userId: string, passkey: string, activate: boolean) => {
  // Activation requires the real passkey; deactivation is always allowed
  if (activate && passkey !== env.devPasskey) {
    throw new AppError("Invalid passkey", 403);
  }

  const profile = await prisma.userProfile.update({
    where: { id: userId },
    data: { isDevMode: activate }
  });

  return { isDevMode: profile.isDevMode };
};

export const deleteUserAccount = async (userId: string) => {
  // Delete all user data in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete generation history
    await tx.generationHistory.deleteMany({ where: { userId } });
    // Delete generated images
    await tx.generatedImage.deleteMany({ where: { userId } });
    // Delete generation jobs
    await tx.generationJob.deleteMany({ where: { userId } });
    // Delete uploaded images
    await tx.uploadedImage.deleteMany({ where: { userId } });
    // Delete user profile
    await tx.userProfile.delete({ where: { id: userId } });
  });

  // Clean up storage buckets
  try {
    const { data: uploads } = await supabaseAdmin.storage
      .from("uploaded_images")
      .list(userId);
    if (uploads?.length) {
      await supabaseAdmin.storage
        .from("uploaded_images")
        .remove(uploads.map((f) => `${userId}/${f.name}`));
    }
    const { data: generated } = await supabaseAdmin.storage
      .from("generated_images")
      .list(userId);
    if (generated?.length) {
      await supabaseAdmin.storage
        .from("generated_images")
        .remove(generated.map((f) => `${userId}/${f.name}`));
    }
  } catch {
    // Storage cleanup is best-effort
  }
};
