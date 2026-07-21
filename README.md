# Financial Tracker Prototype

A local prototype for tracking expenses and income with JSON-file persistence, an LLM natural-language gateway (port 3001), and a native Speech-to-Text audio service (port 3002).

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

Performs NLP processing and multi-turn tool calling. Make sure your API key is set (see [Configuration](#-configuration)).

```powershell
.\start-agent.ps1
```

### 3. Start the Speech-to-Text Service (Port 3002)

Transcribes voice recordings and manages direct voice transactions using Gemini's native audio model.

```powershell
.\start-speech.ps1
```

---

## 🛠 Configuration

Create a file named `.env` in the root directory:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_actual_api_key_here

# LLM model choice (Defaults to the lightweight gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash

# Base URL of the Financial Tracker REST service
TRACKER_API_URL=http://localhost:3000

# Ports configurations
PORT=3001
SPEECH_PORT=3002
```

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
- `GET /api/reports` - Fetch money analytics/charts data
- `GET /api/tags` - List tags with statistics

### LLM Agent Gateway (Port 3001)
- `POST /` - Runs full agent loop and creates the transaction.
- `POST /api/parse` - Parses a natural language sentence and returns a structured JSON object representing the transaction without writing to the database directly.

### Speech to Text Service (Port 3002)
- `POST /api/transcribe` - Accepts a raw audio file (e.g. `audio/webm` or `audio/wav`) in the request body, transcribes it, and returns the transcript text in the response body.
- `POST /api/voice-transaction` - Accepts a raw audio file, transcribes it, and automatically forwards the transcript to port 3001 to run the agent loop and record the transaction.

---

## 🎙️ UI Voice Features

On the dashboard (`http://localhost:3000`), a new **AI Assistant** panel is available:
1. **Add with Natural Language**: Type a sentence like `"Yesterday I spent fifty dollars on food using my credit card"` and press **Send to AI**. The system calls port 3001 to parse it to a clean JSON object, then creates the record in the local database.
2. **Speech-to-Text Recording**: Click the 🎙️ mic button to start recording from your microphone. Click the red 🟥 stop button to finish. The raw webm audio is sent to port 3002 for transcription, and the text area is automatically updated with the transcribed words.
