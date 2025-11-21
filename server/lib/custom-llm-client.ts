import { spawn } from "child_process";
import https from "https";

interface LLMMessage {
  role: string;
  content: string | any;
}

interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      tool_calls?: any[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface CustomLLMConfig {
  apiEndpoint: string;
  apiKey?: string | null;
  actualModelName?: string;
}

export class CustomLLMClient {
  private apiEndpoint: string;
  private apiKey: string | null;
  private actualModelName: string;
  private oauthToken: string | null = null;
  private baseURL: string | null = null;

  constructor(config: CustomLLMConfig) {
    this.apiEndpoint = config.apiEndpoint;
    this.apiKey = config.apiKey || null;
    this.actualModelName = config.actualModelName || "gpt-4-1-2025-04-14-eastus-dz";
  }

  async createChatCompletion(options: {
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<LLMResponse> {
    const { messages, temperature = 0.7, maxTokens = 4096 } = options;
    let retries = 3;

    // Fetch OAuth token if not yet fetched
    if (!this.oauthToken) {
      try {
        const tokenResponse = await this.fetchOAuthConfig();
        this.oauthToken = tokenResponse.access_token;
        if (tokenResponse.baseURL) {
          this.baseURL = tokenResponse.baseURL;
        }
        console.log('[CustomLLM] OAuth token fetched successfully');
      } catch (err) {
        console.error('[CustomLLM] Failed to fetch OAuth token:', err);
        throw err;
      }
    }

    const makeRequest = (): Promise<any> =>
      new Promise(async (resolve, reject) => {
        const requestPayload = {
          model: this.actualModelName,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
          })),
          temperature,
          max_tokens: maxTokens,
        };
        const requestBody = JSON.stringify(requestPayload);

        try {
          const endpoint = this.baseURL ? `${this.baseURL}/chat/completions` : this.apiEndpoint;
          const url = new URL(endpoint);
          const reqOptions = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.oauthToken}`,
              "Content-Length": Buffer.byteLength(requestBody),
            },
            rejectUnauthorized: false,
          };
          let responseData = "";
          const req = https.request(reqOptions, (res) => {
            res.on("data", (chunk) => {
              responseData += chunk;
            });
            res.on("end", () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const data = JSON.parse(responseData);
                  resolve(data);
                } catch (e) {
                  reject(new Error(`Failed to parse response: ${responseData}`));
                }
              } else if (res.statusCode === 401) {
                this.oauthToken = null;
                reject(new Error(`Unauthorized – token expired or invalid: ${responseData}`));
              } else {
                reject(
                  new Error(`API request failed with status ${res.statusCode}: ${responseData}`)
                );
              }
            });
          });
          req.on("error", (err) => reject(err));
          req.write(requestBody);
          req.end();
        } catch (err) {
          reject(err);
        }
      });

    while (retries > 0) {
      try {
        const data = await makeRequest();
        const messageContent = data?.choices?.[0]?.message?.content || data.content || "";
        const toolCalls =
          Array.isArray(data?.choices?.[0]?.message?.tool_calls) &&
          data.choices[0].message.tool_calls.length > 0
            ? data.choices[0].message.tool_calls
            : [];
        const messageObj: any = { role: "assistant", content: messageContent };
        if (toolCalls.length > 0) messageObj.tool_calls = toolCalls;

        const formattedResponse: LLMResponse = {
          id: data.id || "custom-" + Date.now(),
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: this.actualModelName,
          choices: [
            {
              index: 0,
              message: messageObj,
              finish_reason: data?.choices?.[0]?.finish_reason || "stop",
            },
          ],
          usage: {
            prompt_tokens: data?.usage?.prompt_tokens || 0,
            completion_tokens: data?.usage?.completion_tokens || 0,
            total_tokens: data?.usage?.total_tokens || 0,
          },
        };

        return formattedResponse;
      } catch (error: any) {
        if (error.message.includes("Unauthorized")) {
          retries--;
          if (retries === 0) throw error;
          try {
            const tokenResponse = await this.fetchOAuthConfig();
            this.oauthToken = tokenResponse.access_token;
            console.log('[CustomLLM] OAuth token refreshed after unauthorized error');
          } catch (tokenError) {
            console.error('[CustomLLM] Failed to refresh OAuth token:', tokenError);
            throw tokenError;
          }
        } else {
          console.error('[CustomLLM] Error:', error);
          if (retries <= 0) throw error;
          retries--;
        }
      }
    }

    throw new Error('Max retries exceeded');
  }

  async fetchOAuthConfig(): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("python", ["fetch_token.py"]);
      let output = "";
      let errorOutput = "";
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${errorOutput}`));
        } else {
          try {
            const result = JSON.parse(output.trim());
            if (result.error) {
              reject(new Error(`OAuth error: ${result.error}`));
            } else {
              resolve(result);
            }
          } catch (e) {
            reject(new Error(`Failed to parse OAuth response: ${output}`));
          }
        }
      });
    });
  }
}
