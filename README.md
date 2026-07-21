# Financial Tracker Prototype

A local prototype for tracking expenses and income with JSON-file persistence, plus a new LLM natural-language gateway.

## 🚀 Run the Services

### 1. Start the Financial Tracker (Port 3000)

Runs the REST API and the web UI dashboard.

```powershell
.\start.ps1
```

Then open:
```text
http://localhost:3000
```

### 2. Start the LLM Agent Gateway (Port 3001)

Before running, set your Gemini API key (see [Configuration](#-configuration) below).

```powershell
.\start-agent.ps1
```

---

## 🛠 Configuration

Create a file named `.env` in the root directory. This file will hold the settings for the LLM agent:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_actual_api_key_here

# LLM model choice (Defaults to the lightweight gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash

# Base URL of the Financial Tracker REST service
TRACKER_API_URL=http://localhost:3000

# Port for the LLM Gateway service
PORT=3001
```

### 🪙 Token Optimization & Cost Controls
To prevent high token consumption and keep within free tier limits:
1. **Lightweight Model**: The gateway is hardcoded/configured to use `gemini-2.5-flash`. Its job is to generate tool-use schemas, not write elaborate prose.
2. **Output Token Hard-cap**: The `maxOutputTokens` is capped at `300` in `llm-provider.js`.
3. **Low Temperature**: Set `temperature: 0` for deterministic function calls and no conversational drift.
4. **Structured System Instruction**: Instructs the model to only invoke tools and output a single-sentence response upon completion.

---

## 🔌 API Endpoints

All endpoints can be found and executed in [API tests.http](file:///c:/Users/santi/OneDrive/Documents/AI%20Workshops/API%20tests.http).

### Tracker Service (Port 3000)
- `GET /api/expenses` - List all expenses
- `POST /api/expenses` - Create a new expense
- `PATCH /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense
- `GET /api/incomes` - List all incomes
- `POST /api/incomes` - Create a new income
- `PATCH /api/incomes/:id` - Update an income
- `DELETE /api/incomes/:id` - Delete an income
- `GET /api/reports` - Fetch money analytics/charts data
- `GET /api/tags` - List tags with expense/income statistics

### LLM Agent Gateway (Port 3001)
- `POST /` - Accepts natural language input via `{ "message": "..." }` and records transactions.

#### Example payload:
```json
{
  "message": "one hour ago I bought a Chocorramo for five twenty nine"
}
```
The gateway will:
1. Fetch existing tags to select the most relevant match (e.g. `food`).
2. Run `calculateDate` to compute "NOW minus 1 hour".
3. Record the transaction using `createExpense(amount: 5.29, date: "YYYY-MM-DD", tags: ["food"], description: "Chocorramo", account: "Cash", verified: false)`.
4. Respond with success status and details.

---

## 🔄 Interchangeability (Other LLM Providers)

The system is designed with an interchangeable LLM client:
1. **Provider-Agnostic Message History**: The core agent loop uses a clean message layout containing roles (`user`, `assistant`, `tool`) and standard payloads.
2. **Provider Adapters**: Under [llm-provider.js](file:///c:/Users/santi/OneDrive/Documents/AI%20Workshops/llm-provider.js), you can write and instantiate another adapter (e.g. `OpenAIProvider`, `AnthropicProvider`) following the same `generate` method interface, mapping our clean messages to their respective API structure.

---

## 📈 Future Improvements (Production Readiness)

1. **Structured Outputs**: Use Gemini's JSON schema mode (`responseMimeType: "application/json"`) to ensure error-free structured responses from the LLM.
2. **Session Persistence**: Keep conversation history in a database (like Redis) keyed by session IDs to support ongoing interactive chats instead of stateless single-requests.
3. **Advanced Natural Date Parsing**: Integrate library-based relative date parsers (e.g. `chrono-node`) in `tools.js` to back up and support complex edge-case language (e.g. "third Friday of last month").
4. **Tag Clustering & Similarity**: Use a text-embeddings LLM service to do semantic matches between the user's input and existing tags (e.g. matching "subway ride" automatically to "transportation").
