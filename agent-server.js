/**
 * Agent Server - Financial Tracker LLM Gateway
 * Runs on port 3001
 */

const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { GeminiProvider } = require("./llm-provider");
const { toolDeclarations, executeTool } = require("./tools");

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
    // If .env doesn't exist, we fallback to environment variables
    console.log("[Env] No .env file found, using system environment variables");
  }
}

function getLocalISOString() {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
  const offsetMinutes = (new Date()).getTimezoneOffset();
  const sign = offsetMinutes > 0 ? "-" : "+";
  const absOffset = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const minutes = String(absOffset % 60).padStart(2, "0");
  return `${localISOTime}${sign}${hours}:${minutes}`;
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Body must be valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: "GEMINI_API_KEY environment variable is not set. Please create a .env file." });
    return;
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const provider = new GeminiProvider(apiKey, modelName);

  // Connection Test Endpoint
  if (req.method === "GET" && (url.pathname === "/test" || url.pathname === "/")) {
    try {
      console.log(`[Agent Server] Running connectivity test to LLM...`);
      const result = await provider.generate({
        messages: [{ role: "user", content: "Hello, please respond with a short hello message to confirm our connection." }],
        systemInstruction: "Keep the response extremely short, one sentence max."
      });
      sendJson(res, 200, {
        success: true,
        connection: "ok",
        message: result.text.trim()
      });
      return;
    } catch (error) {
      console.error("[Agent Server] Connection test failed:", error);
      sendJson(res, 500, { success: false, connection: "failed", error: error.message });
      return;
    }
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed. Use POST or GET /test." });
    return;
  }

  // AI Transaction Parsing Endpoint
  if (url.pathname === "/api/parse" || url.pathname === "/parse") {
    try {
      const body = await readBody(req);
      const userMessage = body.message || body.text;

      if (!userMessage || typeof userMessage !== "string") {
        sendJson(res, 400, { error: "Please provide a 'message' or 'text' string in the request body." });
        return;
      }

      const localTime = getLocalISOString();
      const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const provider = new GeminiProvider(apiKey, modelName);

      // Exclude database write tools - only use tag reference and date calculators
      const parserTools = toolDeclarations.filter(t => t.name === "getTags" || t.name === "calculateDate");

      const systemInstruction = `You are a financial transaction parser.
Your task is to parse the user's natural language input, categorize it as income or expense, resolve categories and relative date offsets, and return the details in a structured JSON object.

Current Date and Time is: ${localTime}.

Guidelines:
1. ALWAYS call 'getTags' in parallel at the start to fetch existing categories.
2. If the user mentions a relative time (e.g. 'one hour ago', 'yesterday'), use 'calculateDate' tool with base date 'currentDate' (value: ${localTime}) and the offset expression. If no time is specified, use today's date (${localTime.slice(0, 10)}).
3. Select the most plausible tags from the retrieved tags list. If none fit, feel free to generate a new tag.
4. Once you have all the transaction details (type, amount, date, tags, description, account), construct a final response.
5. The final response MUST be a valid JSON object matching the schema below. Do NOT wrap it in markdown code blocks.
   Required JSON Schema:
   {
     "type": "expense" or "income",
     "amount": number (e.g. 5.29),
     "date": "YYYY-MM-DD",
     "tags": ["tag1", "tag2", ...],
     "description": "string",
     "account": "string"
   }`;

      console.log(`[Agent Parser] Processing message: "${userMessage}"`);
      console.log(`[Agent Parser] Reference Time: ${localTime}`);

      const history = [
        { role: "user", content: userMessage }
      ];

      let turns = 0;
      const maxTurns = 5;
      const steps = [];
      let finalAnswer = "";

      while (turns < maxTurns) {
        turns++;
        console.log(`[Agent Parser] Calling Gemini API (Turn ${turns})...`);

        const result = await provider.generate({
          messages: history,
          systemInstruction,
          tools: parserTools
        });

        const assistantMessage = {
          role: "assistant",
          content: result.text || null,
          parts: result.rawParts
        };
        if (result.functionCalls && result.functionCalls.length > 0) {
          assistantMessage.functionCalls = result.functionCalls;
        }
        history.push(assistantMessage);

        if (result.functionCalls && result.functionCalls.length > 0) {
          console.log(`[Agent Parser] Executing function calls:`, result.functionCalls.map(c => c.name));
          steps.push({
            turn: turns,
            calls: result.functionCalls
          });

          const functionResponses = [];
          for (const call of result.functionCalls) {
            const outcome = await executeTool(call.name, call.args);
            functionResponses.push({
              name: call.name,
              response: outcome
            });
          }

          history.push({
            role: "tool",
            functionResponses
          });
        } else {
          finalAnswer = result.text;
          break;
        }
      }

      console.log(`[Agent Parser] Final raw response: "${finalAnswer}"`);

      let cleanText = finalAnswer.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }

      const transaction = JSON.parse(cleanText);
      sendJson(res, 200, {
        success: true,
        transaction,
        steps: steps.map(s => ({
          turn: s.turn,
          calls: s.calls
        }))
      });

    } catch (error) {
      console.error("[Agent Parser] Error parsing request:", error);
      sendJson(res, 500, { error: error.message || "Parsing failed." });
    }
    return;
  }

  try {
    const body = await readBody(req);
    const userMessage = body.message || body.text;

    if (!userMessage || typeof userMessage !== "string") {
      sendJson(res, 400, { error: "Please provide a 'message' or 'text' string in the request body." });
      return;
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const provider = new GeminiProvider(apiKey, modelName);

    const localTime = getLocalISOString();
    
    // Low-token instructions restricting agent behavior
    const systemInstruction = `You are a financial transaction registrar.
Your task is to parse the user's natural language input, categorize it as income or expense, and call the corresponding creation API.

Current Date and Time is: ${localTime}.

Guidelines:
1. ALWAYS call 'getTags' in parallel at the start to fetch existing categories.
2. If the user mentions a relative time (e.g. 'one hour ago', 'yesterday', 'NOW minus 30 minutes'), use 'calculateDate' tool with base date 'currentDate' (value: ${localTime}) and the offset expression. For direct dates, use them. If no time is specified, use today's date (${localTime.slice(0, 10)}).
3. Select the most plausible tags from the retrieved tags list (e.g. 'food', 'personal', 'groceries'). If none fit, feel free to generate a new tag.
4. Call 'createExpense' or 'createIncome' to save the transaction:
   - For 'createExpense': set 'verified' to false.
   - For 'createIncome': standard payload.
   - Convert verbal quantities (e.g. 'five twenty nine') to numbers (e.g. 5.29).
5. After creating, return a concise, one-sentence summary of the created transaction.

Keep conversation very brief and focused solely on executing the necessary tool calls.`;

    console.log(`[Agent Server] Processing message: "${userMessage}"`);
    console.log(`[Agent Server] Reference Time: ${localTime}`);

    const history = [
      { role: "user", content: userMessage }
    ];

    let turns = 0;
    const maxTurns = 5;
    const steps = [];
    let createdRecord = null;
    let finalAnswer = "";

    while (turns < maxTurns) {
      turns++;
      console.log(`[Agent Server] Calling Gemini API (Turn ${turns})...`);

      const result = await provider.generate({
        messages: history,
        systemInstruction,
        tools: toolDeclarations
      });

      // Append assistant's thoughts/calls to history
      const assistantMessage = {
        role: "assistant",
        content: result.text || null,
        parts: result.rawParts
      };
      if (result.functionCalls && result.functionCalls.length > 0) {
        assistantMessage.functionCalls = result.functionCalls;
      }
      history.push(assistantMessage);

      // Check if we need to call any functions
      if (result.functionCalls && result.functionCalls.length > 0) {
        console.log(`[Agent Server] Executing function calls:`, result.functionCalls.map(c => c.name));
        steps.push({
          turn: turns,
          calls: result.functionCalls
        });

        const functionResponses = [];
        for (const call of result.functionCalls) {
          const outcome = await executeTool(call.name, call.args);
          
          // Capture created record if this was a write operation
          if (outcome.success && outcome.record) {
            createdRecord = outcome.record;
          }

          functionResponses.push({
            name: call.name,
            response: outcome
          });
        }

        // Append execution outputs to history
        history.push({
          role: "tool",
          functionResponses
        });
      } else {
        // No function calls: the model has finished
        finalAnswer = result.text;
        break;
      }
    }

    if (turns >= maxTurns) {
      console.warn(`[Agent Server] Maximum turn limit (${maxTurns}) reached.`);
    }

    sendJson(res, 200, {
      success: true,
      message: finalAnswer.trim() || "Transaction processed.",
      record: createdRecord,
      steps: steps.map(s => ({
        turn: s.turn,
        calls: s.calls
      }))
    });

  } catch (error) {
    console.error("[Agent Server] Error processing request:", error);
    sendJson(res, 500, { error: error.message || "An unexpected error occurred." });
  }
}

// Start Server
loadEnv().then(() => {
  const PORT = Number(process.env.PORT || 3001);
  http.createServer(handleRequest).listen(PORT, () => {
    console.log(`LLM Agent service running at http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to stop.`);
  });
});
