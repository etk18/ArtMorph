// Direct test of HF token without SDK abstraction
import dotenv from "dotenv";
dotenv.config();

const token = process.env.HF_API_TOKEN;
console.log("Token:", token ? `${token.substring(0, 10)}...` : "NOT SET");

async function test() {
    // Test 1: Simple whoami call
    console.log("\n--- Test 1: whoami ---");
    try {
        const res = await fetch("https://huggingface.co/api/whoami-v2", {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${await res.text()}`);
    } catch (e) {
        console.error("Error:", e);
    }

    // Test 2: Direct model inference call
    console.log("\n--- Test 2: Direct inference call ---");
    try {
        const res = await fetch(
            "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ inputs: "a cute cat" })
            }
        );
        console.log(`Status: ${res.status}`);
        const contentType = res.headers.get("content-type");
        console.log(`Content-Type: ${contentType}`);
        if (contentType?.includes("application/json")) {
            console.log(`Body: ${await res.text()}`);
        } else {
            console.log("Got image response (binary)");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
