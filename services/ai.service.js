const httpClient = require("../utils/httpClient");
const ApiError = require("../utils/apiError");

const SUPPORTED_MODELS = [
  {
    id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    name: "Llama 3.3 70B Instruct (Fast)",
    provider: "Meta",
    isDefault: true,
    description: "Best overall for complex reasoning, instruction following, and logic.",
  },
  {
    id: "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
    name: "Llama 3.1 8B Instruct (Fast)",
    provider: "Meta",
    isDefault: false,
    description: "Recommended for general tasks and excellent efficiency.",
  },
  {
    id: "@cf/meta/llama-3.2-3b-instruct",
    name: "Llama 3.2 3B Instruct",
    provider: "Meta",
    isDefault: false,
    description: "Ultra-lightweight and optimized for maximum speed/latency.",
  },
  {
    id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    name: "DeepSeek R1 Distill Qwen 32B",
    provider: "DeepSeek",
    isDefault: false,
    description: "Advanced reasoning and logic model distilled from DeepSeek R1.",
  },
  {
    id: "@cf/qwen/qwen2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B Instruct",
    provider: "Qwen",
    isDefault: false,
    description: "Top-tier performance for coding, development, and chat scenarios.",
  },
  {
    id: "@cf/qwen/qwq-32b",
    name: "QwQ 32B",
    provider: "Qwen",
    isDefault: false,
    description: "Medium-sized reasoning model highly competitive for complex tasks.",
  },
  {
    id: "@cf/mistralai/mistral-small-3.1-24b-instruct",
    name: "Mistral Small 3.1 24B Instruct",
    provider: "Mistral AI",
    isDefault: false,
    description: "Solid alternative featuring enhanced understanding and 128K context.",
  },
  {
    id: "@cf/google/gemma-3-12b-it",
    name: "Gemma 3 12B IT",
    provider: "Google",
    isDefault: false,
    description: "Latest Google instruction-tuned model with strong multilingual support.",
  },
  {
    id: "@cf/openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "OpenAI Compatible",
    isDefault: false,
    description: "General purpose, high-reasoning model (via SSO/compat).",
  },
];

class AiService {
  /**
   * Get supported AI models list
   */
  getModels() {
    return SUPPORTED_MODELS;
  }

  /**
   * Process chat request based on the DuckGPT worker architecture
   * 
   * @param {Object} params
   * @param {string} params.prompt
   * @param {string} [params.model]
   * @param {Array<Object>} [params.history]
   * @param {string} [params.system]
   * @returns {Promise<Object>}
   */
  async chat({ prompt, model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast", history = [], system }) {
    const startTime = Date.now();

    // 1. Normalize conversation history (as done in duckgpt worker.js)
    let messages = [];
    if (typeof history === "string" && history.trim() !== "") {
      try {
        messages = JSON.parse(history);
      } catch {
        messages = [];
      }
    } else if (Array.isArray(history)) {
      messages = [...history];
    }

    // 2. Prepare system prompt and user message
    const systemPrompt = system || "You are a helpful assistant named 'DuckGPT'.";
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
      { role: "user", content: prompt },
    ];

    try {
      let rawResult;

      // Option A: If Cloudflare credentials are configured, call Workers AI REST API directly
      const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (cfAccountId && cfApiToken) {
        const response = await httpClient.post(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`,
          { messages: fullMessages },
          {
            headers: {
              Authorization: `Bearer ${cfApiToken}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );
        rawResult = response.data?.result || response.data;
      } else {
        // Option B: DuckGPT Edge Worker integration
        const queryParams = new URLSearchParams({
          prompt,
          model,
          history: JSON.stringify(messages),
        });

        const response = await httpClient.get(
          `https://duck.gpt-api.workers.dev/chat/?${queryParams.toString()}`,
          { timeout: 30000 }
        );

        rawResult = response.data;
        if (rawResult?.action === "error") {
          throw ApiError.badRequest(rawResult.response || "AI Generation failed");
        }
      }

      // 3. Extract output text using the worker's normalization logic
      let textOutput = "";
      if (rawResult?.response) {
        textOutput = rawResult.response;
      } else if (rawResult?.choices?.[0]?.message?.content) {
        textOutput = rawResult.choices[0].message.content;
      } else if (rawResult?.output?.[0]?.content?.[0]?.text) {
        textOutput = rawResult.output[0].content[0].text;
      } else if (typeof rawResult === "string") {
        textOutput = rawResult;
      } else {
        textOutput = JSON.stringify(rawResult);
      }

      // 4. Parse reasoning <think> tag if present (e.g. from DeepSeek R1)
      let reasoning = null;
      let cleanResponse = textOutput;
      const thinkMatch = textOutput.match(/<think>([\s\S]*?)<\/think>/i);
      if (thinkMatch) {
        reasoning = thinkMatch[1].trim();
        cleanResponse = textOutput.replace(/<think>[\s\S]*?<\/think>/i, "").trim();
      }

      const executionTimeMs = Date.now() - startTime;

      return {
        prompt,
        model,
        response: cleanResponse,
        ...(reasoning ? { reasoning } : {}),
        metadata: {
          executionTimeMs,
          totalMessages: fullMessages.length,
          model,
        },
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw httpClient.handleAxiosError(error, "DuckGPT AI Engine");
    }
  }
}

module.exports = new AiService();
