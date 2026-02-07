import { Client } from "@gradio/client";
import { env } from "../config/env";
import { AppError } from "../middleware/error-handler";

export type HfImageToImageParams = {
  model: string;
  provider?: string;
  inputImage: Buffer;
  prompt?: string;
  negativePrompt?: string;
  numInferenceSteps?: number;
  guidanceScale?: number;
  strength?: number;
  imageGuidanceScale?: number;
  seed?: number;
  controlImage?: Buffer;
  controlnetConditioningScale?: number;
  controlGuidanceStart?: number;
  controlGuidanceEnd?: number;
};

export type HfImageResult = {
  image: Buffer;
  contentType: string;
};

const DEFAULT_SPACE = "black-forest-labs/FLUX.1-Kontext-Dev";

/**
 * Generate a style-transferred image using a free HuggingFace Gradio Space.
 * Uses FLUX.1 Kontext [dev] on ZeroGPU — free, high-quality image editing.
 */
export const runImageToImage = async (params: HfImageToImageParams): Promise<HfImageResult> => {
  if (!env.hfApiToken) {
    throw new AppError("HF_API_TOKEN is not configured", 500);
  }

  const spaceId = env.hfDefaultSpace;
  const prompt = params.prompt || "Transform this image into an artistic style";
  const guidanceScale = params.guidanceScale ?? 2.5;
  const steps = params.numInferenceSteps ?? 28;
  const seed = params.seed ?? 0;

  try {
    console.log(`[HF] Image-to-image via Space: ${spaceId}`);
    console.log(`[HF] Prompt: ${prompt.substring(0, 120)}...`);
    console.log(`[HF] Input image size: ${params.inputImage.length} bytes`);
    console.log(`[HF] Guidance: ${guidanceScale}, Steps: ${steps}`);

    // Convert input image Buffer to base64 data URL for the Gradio API
    const mimeType = detectMimeType(params.inputImage);
    const base64 = params.inputImage.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Connect to the Space
    const client = await Client.connect(spaceId, {
      token: env.hfApiToken as `hf_${string}`
    });

    // Call the /infer endpoint
    // Parameters: input_image, prompt, seed, randomize_seed, guidance_scale, steps
    const result = await client.predict("/infer", {
      input_image: { url: dataUrl, meta: { _type: "gradio.FileData" } },
      prompt,
      seed,
      randomize_seed: seed === 0,
      guidance_scale: guidanceScale,
      steps
    });

    const data = result.data as Array<{ url?: string; path?: string } | number>;
    const imageData = data[0] as { url?: string; path?: string };

    if (!imageData?.url) {
      throw new AppError("No image returned from the Space", 502);
    }

    console.log(`[HF] Space returned image URL, downloading...`);

    // Download the generated image from the Space's returned URL
    const imgResponse = await fetch(imageData.url, {
      signal: AbortSignal.timeout(30000)
    });
    if (!imgResponse.ok) {
      throw new AppError("Failed to download generated image from Space", 502);
    }

    const contentType = imgResponse.headers.get("content-type") || "image/png";
    const arrayBuffer = await imgResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    console.log(`[HF] Generation successful, output size: ${imageBuffer.length} bytes, type: ${contentType}`);

    return {
      image: imageBuffer,
      contentType
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Gradio client may throw non-Error objects — extract whatever info we can
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    } else if (error && typeof error === "object") {
      message = (error as any).message || (error as any).detail || JSON.stringify(error);
    }
    console.error(`[HF] Inference error:`, error);
    console.error(`[HF] Error type: ${typeof error}, constructor: ${error?.constructor?.name}`);

    if (message.includes("TimeoutError") || message.includes("abort")) {
      throw new AppError("Generation timed out. The Space may be busy — please retry.", 504);
    }
    if (message.includes("queue") || message.includes("Queue")) {
      throw new AppError("The Space is busy. Please try again in a moment.", 503);
    }
    if (message.includes("license") || message.includes("gated") || message.includes("accept")) {
      throw new AppError(
        "You need to accept the FLUX.1 [dev] license on HuggingFace first: https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev",
        403
      );
    }

    throw new AppError(`Hugging Face inference failed: ${message}`, 502);
  }
};

/** Detect MIME type from the first bytes of a Buffer */
const detectMimeType = (buf: Buffer): string => {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0x52 && buf[1] === 0x49) return "image/webp";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
  return "image/png";
};
