import { randomUUID } from "crypto";
import { StyleConfig } from "@prisma/client";
import { prisma } from "../config/prisma";
import { supabaseAdmin } from "../config/supabase";
import { env } from "../config/env";
import { AppError } from "../middleware/error-handler";
import { composeNegativePrompt, composePrompt } from "../utils/prompt";
import { runImageToImage } from "./hf-inference.service";

export type GenerateImageParams = {
  userId: string;
  jobId?: string;
  styleConfig: StyleConfig;
  inputImageId?: string;
  inputImageBucket: string;
  inputImagePath: string;
  controlImageBucket?: string;
  controlImagePath?: string;
  seed?: number;
  userPrompt?: string | null;
  userNegativePrompt?: string | null;
};

const blobToBuffer = async (blob: Blob): Promise<Buffer> => {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const downloadFromStorage = async (bucket: string, pathName: string) => {
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(pathName);
  if (error || !data) {
    throw new AppError("Failed to download source image", 500);
  }
  return blobToBuffer(data);
};

const uploadGeneratedImage = async (
  userId: string,
  image: Buffer,
  contentType: string
) => {
  const ext = contentType.includes("webp")
    ? ".webp"
    : contentType.includes("jpeg")
      ? ".jpg"
      : ".png";
  const bucket = env.supabaseGeneratedBucket;
  const objectPath = `users/${userId}/generated/${randomUUID()}${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(objectPath, image, {
      contentType,
      upsert: false
    });

  if (uploadError) {
    throw new AppError("Failed to store generated image", 500);
  }

  const { data, error: signedError } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(objectPath, env.generatedUrlTtlSeconds);

  if (signedError || !data?.signedUrl) {
    throw new AppError("Failed to create generated image URL", 500);
  }

  return {
    bucket,
    path: objectPath,
    signedUrl: data.signedUrl
  };
};

const resolveModelId = (style: StyleConfig): string => {
  const params = (style.params as Record<string, unknown> | null) ?? {};
  const overrideModel = typeof params.hfModel === "string" ? params.hfModel : undefined;
  const controlnetModel =
    typeof params.controlnetModel === "string" ? params.controlnetModel : undefined;

  if (style.controlnetModule && controlnetModel) {
    return controlnetModel;
  }

  return overrideModel || style.baseModel || env.hfDefaultModel;
};

export const generateImage = async (params: GenerateImageParams) => {
  const inputImage = await downloadFromStorage(
    params.inputImageBucket,
    params.inputImagePath
  );

  const prompt = composePrompt(params.styleConfig, params.userPrompt);
  const negativePrompt = composeNegativePrompt(
    params.styleConfig,
    params.userNegativePrompt
  );

  const model = resolveModelId(params.styleConfig);
  const styleParams = (params.styleConfig.params as Record<string, unknown> | null) ?? {};
  const wantsControl = Boolean(
    params.styleConfig.controlnetModule ||
      styleParams.controlnetModel ||
      styleParams.controlnetConditioningScale
  );

  const controlImage = wantsControl
    ? params.controlImageBucket && params.controlImagePath
      ? await downloadFromStorage(params.controlImageBucket, params.controlImagePath)
      : inputImage
    : undefined;

  const result = await runImageToImage({
    model,
    provider: styleParams.provider as string | undefined,
    inputImage,
    controlImage,
    prompt,
    negativePrompt,
    guidanceScale: params.styleConfig.guidanceScale ?? (styleParams.guidanceScale as number | undefined),
    numInferenceSteps: styleParams.steps as number | undefined,
    strength: params.styleConfig.strength ?? (styleParams.strength as number | undefined),
    imageGuidanceScale: styleParams.imageGuidanceScale as number | undefined,
    seed: params.seed ?? (styleParams.seed as number | undefined),
    controlnetConditioningScale: wantsControl
      ? params.styleConfig.controlnetWeight ??
        (styleParams.controlnetConditioningScale as number | undefined)
      : undefined,
    controlGuidanceStart: wantsControl
      ? (styleParams.controlGuidanceStart as number | undefined)
      : undefined,
    controlGuidanceEnd: wantsControl
      ? (styleParams.controlGuidanceEnd as number | undefined)
      : undefined
  });

  const stored = await uploadGeneratedImage(params.userId, result.image, result.contentType);

  await prisma.generatedImage.create({
    data: {
      userId: params.userId,
      jobId: params.jobId,
      sourceImageId: params.inputImageId ?? null,
      storageBucket: stored.bucket,
      storagePath: stored.path
    }
  });

  return {
    url: stored.signedUrl,
    storageBucket: stored.bucket,
    storagePath: stored.path,
    contentType: result.contentType
  };
};
