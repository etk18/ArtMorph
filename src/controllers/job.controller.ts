import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../middleware/error-handler";
import {
  createJob,
  deleteJobForUser,
  getJobForUser,
  listJobHistory,
  listUserJobs,
  retryJob
} from "../services/job.service";
import { requireString, validateUuid } from "../utils/validation";

export const createGenerationJob = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const inputImageId = validateUuid(req.body.inputImageId, "inputImageId");
  const styleConfigId = validateUuid(req.body.styleConfigId, "styleConfigId");
  const prompt = req.body.prompt ? requireString(req.body.prompt, "prompt") : undefined;

  const job = await createJob({
    userId: req.user.id,
    inputImageId,
    styleConfigId,
    prompt
  });

  res.status(201).json({
    status: "ok",
    job
  });
});

export const getUserJobs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const jobs = await listUserJobs(req.user.id);

  res.status(200).json({
    status: "ok",
    jobs
  });
});

export const getGenerationJob = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const jobId = validateUuid(req.params.id, "jobId");
  const job = await getJobForUser(jobId, req.user.id);

  res.status(200).json({
    status: "ok",
    job
  });
});

export const getGenerationJobHistory = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const jobId = validateUuid(req.params.id, "jobId");
    await getJobForUser(jobId, req.user.id);
    const history = await listJobHistory(jobId, req.user.id);

    res.status(200).json({
      status: "ok",
      history
    });
  }
);

export const retryGenerationJob = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const jobId = validateUuid(req.params.id, "jobId");
    const job = await retryJob(jobId, req.user.id);

    res.status(200).json({
      status: "ok",
      job
    });
  }
);

export const deleteGenerationJob = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const jobId = validateUuid(req.params.id, "jobId");
    await deleteJobForUser(jobId, req.user.id);

    res.status(200).json({
      status: "ok"
    });
  }
);
