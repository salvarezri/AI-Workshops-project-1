/**
 * Interchangeable LLM Provider Module
 */

class GeminiProvider {
  /**
   * @param {string} apiKey
   * @param {string} model
   */
  constructor(apiKey, model = "gemini-2.5-flash") {
    if (!apiKey) {
      throw new Error("Gemini API key is required.");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Generates completion with support for tool calling.
   * @param {object} options
   * @param {Array} options.messages - Unified provider-agnostic message history
   * @param {string} [options.systemInstruction] - System instructions
   * @param {Array} [options.tools] - OpenAPI-style tools declarations
   * @returns {Promise<{text: string, functionCalls: Array}>}
   */
  async generate({ messages, systemInstruction, tools }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    // Map provider-agnostic history to Gemini REST format
    const contents = messages.map(msg => {
      if (msg.role === "user") {
        return {
          role: "user",
          parts: [{ text: msg.content }]
        };
      } else if (msg.role === "assistant") {
        const parts = [];
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        if (msg.functionCalls && msg.functionCalls.length > 0) {
          for (const fn of msg.functionCalls) {
            parts.push({
              functionCall: {
                name: fn.name,
                args: fn.args
              }
            });
          }
        }
        if (msg.thoughtSignature) {
          parts.push({
            thought_signature: msg.thoughtSignature
          });
        }
        return {
          role: "model",
          parts
        };
      } else if (msg.role === "tool") {
        return {
          role: "function", // Gemini API role for function execution results
          parts: msg.functionResponses.map(res => ({
            functionResponse: {
              name: res.name,
              response: typeof res.response === "object" ? res.response : { result: res.response }
            }
          }))
        };
      }
      throw new Error(`Unsupported message role: ${msg.role}`);
    });

    const payload = {
      contents,
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 300 // Constrain outputs to save tokens
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    if (tools && tools.length > 0) {
      // Wrap tools inside standard Gemini format
      payload.tools = [{
        functionDeclarations: tools
      }];
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const functionCalls = [];
    let text = "";

    let thoughtSignature = null;
    for (const part of parts) {
      if (part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args
        });
      } else if (part.text) {
        text += part.text;
      } else if (part.thought_signature) {
        thoughtSignature = part.thought_signature;
      }
    }

    return { text, functionCalls, thoughtSignature };
  }
}

module.exports = { GeminiProvider };
