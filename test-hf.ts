import { runImageToImage } from "./src/services/hf-inference.service";
import { env } from "./src/config/env";
import * as fs from "fs";

const testGeneration = async () => {
    console.log("Testing HuggingFace Integration...");
    console.log("Token starts with:", env.hfApiToken ? env.hfApiToken.substring(0, 7) : "NONE");
    console.log("Default model:", env.hfDefaultModel);

    // Create a simple test image (small PNG)
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGNzYAAIoaB/5IEZwYAAAAAElFTkSuQmCC";
    const testImageBuffer = Buffer.from(testImageBase64, "base64");

    try {
        console.log("\nTesting runImageToImage with SDXL model...");
        const result = await runImageToImage({
            model: env.hfDefaultModel,
            inputImage: testImageBuffer,
            prompt: "a beautiful sunset over the ocean, oil painting style, masterpiece",
            negativePrompt: "ugly, blurry, low quality",
            numInferenceSteps: 20,
            guidanceScale: 7.5,
            width: 1024,
            height: 1024
        });

        console.log("SUCCESS! Generated image:");
        console.log("- Content-Type:", result.contentType);
        console.log("- Size:", result.image.length, "bytes");
        
        // Save the result
        fs.writeFileSync("test-output.png", result.image);
        console.log("- Saved to: test-output.png");
    } catch (err) {
        console.error("Error:", err);
    }
};

testGeneration();
