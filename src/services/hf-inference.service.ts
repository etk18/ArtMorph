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

/**
 * Resolve the direct URL for a HuggingFace Space.
 * ZeroGPU spaces have a separate host from the standard HF domain.
 */
const resolveSpaceHost = async (spaceId: string, token: string): Promise<string> => {
  const res = await fetch(`https://huggingface.co/api/spaces/${spaceId}/host`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new AppError(`Failed to resolve Space host for ${spaceId}: ${res.status}`, 502);
  }
  const { host } = await res.json() as { host: string };
  return host;
};

/**
 * Generate a style-transferred image using a HuggingFace Gradio Space.
 * Uses direct REST API calls instead of @gradio/client for reliability with ZeroGPU.
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

    // 1. Resolve the Space host
    const host = await resolveSpaceHost(spaceId, env.hfApiToken);
    console.log(`[HF] Space host: ${host}`);

    // 2. Convert input image to base64 data URL (no upload needed)
    const mimeType = detectMimeType(params.inputImage);
    const base64 = params.inputImage.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // 3. Call the /infer endpoint via Gradio REST API (queue-based)
    //    Note: This Space uses api_prefix "/gradio_api"
    const callRes = await fetch(`${host}/gradio_api/call/infer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.hfApiToken}`
      },
      body: JSON.stringify({
        data: [
          { url: dataUrl, meta: { _type: "gradio.FileData" } },
          prompt,
          seed,
          seed === 0, // randomize_seed
          guidanceScale,
          steps
        ]
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!callRes.ok) {
      const errText = await callRes.text().catch(() => "");
      throw new AppError(`Space /call/infer failed: ${callRes.status} ${errText}`, 502);
    }

    const { event_id } = await callRes.json() as { event_id: string };
    console.log(`[HF] Queued job: ${event_id}`);

    // 4. Poll the event stream for the result
    const resultData = await pollForResult(host, event_id, env.hfApiToken);
    console.log(`[HF] Got result data`);

    // 5. Extract the image URL from the result
    const imageInfo = resultData[0] as { url?: string; path?: string } | undefined;
    if (!imageInfo?.url) {
      console.error(`[HF] Unexpected result format:`, JSON.stringify(resultData).substring(0, 500));
      throw new AppError("No image returned from the Space", 502);
    }

    // 6. Download the generated image
    console.log(`[HF] Downloading result image...`);
    const imgResponse = await fetch(imageInfo.url, {
      headers: { Authorization: `Bearer ${env.hfApiToken}` },
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
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[HF] Inference error:`, error);

    if (message.includes("TimeoutError") || message.includes("abort") || message.includes("timed out")) {
      throw new AppError("Generation timed out. The Space may be busy — please retry.", 504);
    }
    if (message.includes("queue") || message.includes("Queue") || message.includes("exceeded")) {
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

// ─── Replicate Fallback ─────────────────────────────────────────────────────────

const REPLICATE_MODEL = "black-forest-labs/flux-kontext-dev";

/**
 * Fallback: generate via Replicate API when HuggingFace quota is exhausted.
 */
const runViaReplicate = async (params: HfImageToImageParams): Promise<HfImageResult> => {
  const token = env.replicateApiToken;
  if (!token) {
    throw new AppError("Replicate API token is not configured and HuggingFace quota is exhausted", 502);
  }

  const prompt = params.prompt || "Transform this image into an artistic style";
  const guidanceScale = params.guidanceScale ?? 2.5;
  const steps = params.numInferenceSteps ?? 28;

  const mimeType = detectMimeType(params.inputImage);
  const base64 = params.inputImage.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  console.log(`[Replicate] Starting generation, prompt: ${prompt.substring(0, 120)}...`);

  // 1. Create prediction
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait"  // Replicate will hold the connection until done (up to 60s)
    },
    body: JSON.stringify({
      model: REPLICATE_MODEL,
      input: {
        image: dataUrl,
        prompt,
        guidance_scale: guidanceScale,
        steps
      }
    }),
    signal: AbortSignal.timeout(180000)
  });

  if (!createRes.ok) {
    const errBody = await createRes.text().catch(() => "");
    throw new AppError(`Replicate API error: ${createRes.status} ${errBody}`, 502);
  }

  let prediction = await createRes.json() as {
    id: string;
    status: string;
    output: unknown;
    error: string | null;
    urls?: { get?: string };
  };

  // 2. If not completed yet (Prefer: wait timed out), poll
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
    console.log(`[Replicate] Status: ${prediction.status}, polling...`);
    await new Promise(r => setTimeout(r, 2000));

    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000)
    });
    if (!pollRes.ok) {
      throw new AppError(`Replicate poll failed: ${pollRes.status}`, 502);
    }
    prediction = await pollRes.json() as typeof prediction;
  }

  if (prediction.status === "failed") {
    throw new AppError(`Replicate generation failed: ${prediction.error || "unknown"}`, 502);
  }

  if (prediction.status === "canceled") {
    throw new AppError("Replicate generation was canceled", 502);
  }

  // 3. Download the output image
  // Output can be a string URL or an array of string URLs
  const output = prediction.output;
  const imageUrl = typeof output === "string"
    ? output
    : Array.isArray(output)
      ? (output[0] as string)
      : null;

  if (!imageUrl) {
    console.error("[Replicate] Unexpected output:", JSON.stringify(output).substring(0, 500));
    throw new AppError("No image returned from Replicate", 502);
  }

  console.log(`[Replicate] Downloading result...`);
  const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
  if (!imgRes.ok) {
    throw new AppError("Failed to download image from Replicate", 502);
  }

  const contentType = imgRes.headers.get("content-type") || "image/webp";
  const arrayBuffer = await imgRes.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  console.log(`[Replicate] Generation successful, output size: ${imageBuffer.length} bytes`);

  return { image: imageBuffer, contentType };
};

/**
 * Main entry point: tries Replicate first (primary), falls back to HuggingFace.
 */
export const runImageToImageWithFallback = async (params: HfImageToImageParams): Promise<HfImageResult> => {
  // Primary: Replicate
  if (env.replicateApiToken) {
    try {
      console.log(`[Fallback] Using Replicate as primary provider`);
      return await runViaReplicate(params);
    } catch (error) {
      const message = error instanceof AppError ? error.message : String(error);
      console.error(`[Replicate] Primary failed: ${message}`);
      console.log(`[Fallback] Falling back to HuggingFace...`);
    }
  }

  // Fallback: HuggingFace
  return await runImageToImage(params);
};

/**
 * Poll the Gradio SSE event stream for the generation result.
 * ZeroGPU spaces queue jobs and stream progress via Server-Sent Events.
 */
const pollForResult = async (
  host: string,
  eventId: string,
  token: string,
  timeoutMs = 180000
): Promise<unknown[]> => {
  const url = `${host}/gradio_api/call/infer/${eventId}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });

    if (!res.ok) {
      throw new AppError(`Event stream failed: ${res.status}`, 502);
    }

    const text = await res.text();
    // Parse the SSE text: look for "event: complete" followed by "data: ..."
    const lines = text.split("\n");
    let lastData: string | null = null;
    let isError = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "event: error") {
        isError = true;
      }
      if (line === "event: complete") {
        isError = false;
      }
      if (line.startsWith("data: ")) {
        lastData = line.substring(6);
        if (isError) {
          throw new AppError(`Space returned error: ${lastData}`, 502);
        }
      }
    }

    if (!lastData) {
      throw new AppError("No data received from Space event stream", 502);
    }

    const parsed = JSON.parse(lastData);
    return Array.isArray(parsed) ? parsed : [parsed];
  } finally {
    clearTimeout(timer);
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
