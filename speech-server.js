/**
 * Speech to Text Service - Port 3002
 * Native Node.js HTTP Server using Google Gemini Multimodal Audio Input
 */

const http = require("http");
const fs = require("fs/promises");
const path = require("path");

// Custom lightweight dotenv parser
async function loadEnv() {
  try {
    const envPath = path.join(__dirname, ".env");
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index !== -1) {
        const key = trimmed.slice(0, index).trim();
        const val = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = val;
      }
    }
    console.log("[Env] Loaded environment variables from .env");
  } catch (err) {
    console.log("[Env] No .env file found, using system environment variables");
  }
}

// Read raw body buffer
async function readRawBodyBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

async function transcribeAudio(audioBuffer, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const base64Data = audioBuffer.toString("base64");

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Transcribe this audio clip verbatim into text. Do not summarize, do not add greetings or extra text, just output the exact words transcribed."
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 200
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini transcription error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty transcription response.");
  }

  return text.trim();
}

async function handleRequest(req, res) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed. Use POST." });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/transcribe" || url.pathname === "/transcribe") {
    try {
      const mimeType = req.headers["content-type"] || "audio/webm";
      console.log(`[Speech Server] Transcribing audio with Content-Type: ${mimeType}`);
      
      const buffer = await readRawBodyBuffer(req);
      if (!buffer || buffer.length === 0) {
        sendJson(res, 400, { error: "Request body is empty. Please upload an audio file." });
        return;
      }

      console.log(`[Speech Server] Received ${buffer.length} bytes of audio. Calling Gemini STT...`);
      const transcript = await transcribeAudio(buffer, mimeType);
      console.log(`[Speech Server] Transcribed text: "${transcript}"`);

      sendJson(res, 200, { success: true, text: transcript });
    } catch (error) {
      console.error("[Speech Server] Error transcribing:", error);
      sendJson(res, 500, { error: error.message || "Transcription failed." });
    }
    return;
  }

  if (url.pathname === "/api/voice-transaction" || url.pathname === "/voice-transaction") {
    try {
      const mimeType = req.headers["content-type"] || "audio/webm";
      console.log(`[Speech Server] Voice transaction request. Content-Type: ${mimeType}`);

      const buffer = await readRawBodyBuffer(req);
      if (!buffer || buffer.length === 0) {
        sendJson(res, 400, { error: "Request body is empty. Please upload an audio file." });
        return;
      }

      console.log(`[Speech Server] Received ${buffer.length} bytes of audio. Transcribing...`);
      const transcript = await transcribeAudio(buffer, mimeType);
      console.log(`[Speech Server] Voice transcript: "${transcript}". Sending to Agent Server (3001)...`);

      // Forward to Agent Server running on port 3001
      const agentPort = process.env.AGENT_PORT || "3001";
      const agentRes = await fetch(`http://localhost:${agentPort}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript })
      });

      if (!agentRes.ok) {
        const errText = await agentRes.text();
        throw new Error(`Agent server error (${agentRes.status}): ${errText}`);
      }

      const agentData = await agentRes.json();
      console.log("[Speech Server] Voice transaction created successfully!");
      
      sendJson(res, 200, {
        success: true,
        transcript,
        agentResponse: agentData
      });
    } catch (error) {
      console.error("[Speech Server] Error creating voice transaction:", error);
      sendJson(res, 500, { error: error.message || "Voice transaction failed." });
    }
    return;
  }

  sendJson(res, 404, { error: "Endpoint not found." });
}

// Start Server
loadEnv().then(() => {
  const PORT = Number(process.env.SPEECH_PORT || 3002);
  http.createServer(handleRequest).listen(PORT, () => {
    console.log(`Speech to Text service running at http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to stop.`);
  });
});
