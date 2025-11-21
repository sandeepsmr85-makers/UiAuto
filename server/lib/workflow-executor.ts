import { Stagehand } from "@browserbasehq/stagehand";
import { CustomLLMClient } from "./custom-llm-client";
import type { Workflow, Execution, AutomationStep, LogEntry } from "@shared/schema";
import type { Server as SocketIOServer } from "socket.io";

interface ExecutorConfig {
  io: SocketIOServer;
  onLog: (log: LogEntry) => void;
  onProgress: (progress: number) => void;
  onComplete: (results: any) => void;
  onError: (error: string) => void;
}

export class WorkflowExecutor {
  private stagehand: Stagehand | null = null;
  private io: SocketIOServer;
  private executionId: string;
  private logs: LogEntry[] = [];
  private startTime: number = 0;
  private tokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  };

  constructor(executionId: string, io: SocketIOServer) {
    this.executionId = executionId;
    this.io = io;
  }

  private addLog(level: string, category: string, message: string) {
    const log: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
    };
    this.logs.push(log);
    
    // Emit log via WebSocket
    this.io.emit("execution:log", {
      type: "execution:log",
      executionId: this.executionId,
      log,
    });

    // Persist logs to storage immediately for durability
    this.persistLogsToStorage().catch(err => {
      console.error(`Failed to persist logs: ${err.message}`);
    });

    console.log(`[${level.toUpperCase()}] [${category}] ${message}`);
  }

  private async persistLogsToStorage() {
    // Import storage dynamically to avoid circular dependency
    const { storage } = await import("../storage");
    await storage.updateExecution(this.executionId, {
      logs: this.logs,
    });
  }

  private async initStagehand(workflow: Workflow): Promise<void> {
    this.addLog("info", "initialization", "Initializing browser automation...");

    const config = workflow.browserConfig || { headless: true };
    
    try {
      // Initialize custom LLM client
      const customLLM = new CustomLLMClient({
        apiEndpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
        apiKey: process.env.AZURE_OPENAI_API_KEY || null,
        actualModelName: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4-1-2025-04-14-eastus-dz",
      });

      this.stagehand = new Stagehand({
        env: "LOCAL",
        headless: config.headless !== false,
        verbose: 1,
        debugDom: true,
        enableCaching: false,
        domSettleTimeoutMs: 30000,
        llmClient: async (options: any) => {
          try {
            const response = await customLLM.createChatCompletion({
              messages: options.messages,
              temperature: options.temperature || 0.7,
              maxTokens: options.maxTokens || 4096,
            });

            // Track token usage
            if (response.usage) {
              this.tokenUsage.promptTokens += response.usage.prompt_tokens;
              this.tokenUsage.completionTokens += response.usage.completion_tokens;
              this.tokenUsage.totalTokens += response.usage.total_tokens;
              // Rough estimate: $0.03 per 1K prompt tokens, $0.06 per 1K completion tokens
              this.tokenUsage.estimatedCost +=
                (response.usage.prompt_tokens / 1000) * 0.03 +
                (response.usage.completion_tokens / 1000) * 0.06;
            }

            return response;
          } catch (error: any) {
            this.addLog("error", "llm", `LLM request failed: ${error.message}`);
            throw error;
          }
        },
      } as any);

      await this.stagehand.init();

      if (config.viewport) {
        await this.stagehand.context.setViewportSize({
          width: config.viewport.width,
          height: config.viewport.height,
        });
      }

      if (config.userAgent) {
        await this.stagehand.context.setUserAgent(config.userAgent);
      }

      this.addLog("success", "initialization", "Browser automation initialized successfully");
    } catch (error: any) {
      this.addLog("error", "initialization", `Failed to initialize: ${error.message}`);
      throw error;
    }
  }

  private async executeStep(step: AutomationStep, context: any = {}): Promise<any> {
    if (!this.stagehand) {
      throw new Error("Stagehand not initialized");
    }

    this.addLog("info", "step", `Executing step ${step.order + 1}: ${step.type} - ${step.description}`);

    try {
      let result: any = null;

      switch (step.type) {
        case "navigate":
          result = await this.executeNavigate(step);
          break;
        case "act":
          result = await this.executeAct(step);
          break;
        case "extract":
          result = await this.executeExtract(step);
          break;
        case "observe":
          result = await this.executeObserve(step);
          break;
        case "agent":
          result = await this.executeAgent(step);
          break;
        case "wait":
          result = await this.executeWait(step);
          break;
        case "screenshot":
          result = await this.executeScreenshot(step);
          break;
        case "scroll":
          result = await this.executeScroll(step);
          break;
        default:
          this.addLog("warning", "step", `Unknown step type: ${step.type}`);
      }

      this.addLog("success", "step", `Step ${step.order + 1} completed successfully`);
      return result;
    } catch (error: any) {
      this.addLog("error", "step", `Step ${step.order + 1} failed: ${error.message}`);
      throw error;
    }
  }

  private async executeNavigate(step: AutomationStep): Promise<void> {
    const url = step.config.url || "";
    this.addLog("info", "navigation", `Navigating to ${url}`);
    await this.stagehand!.page.goto(url);
    this.addLog("success", "navigation", `Successfully navigated to ${url}`);
  }

  private async executeAct(step: AutomationStep): Promise<any> {
    const action = step.config.action || step.description;
    this.addLog("info", "act", `Performing action: ${action}`);
    
    const result = await this.stagehand!.act(action);
    
    this.addLog("success", "act", `Action completed: ${action}`);
    return result;
  }

  private async executeExtract(step: AutomationStep): Promise<any> {
    const instruction = step.config.instruction || step.description;
    const schema = step.config.schema;
    
    this.addLog("info", "extract", `Extracting data: ${instruction}`);
    
    let extractResult: any;
    
    if (schema) {
      // Parse schema if it's a string
      const schemaObj = typeof schema === "string" ? JSON.parse(schema) : schema;
      extractResult = await this.stagehand!.extract(instruction, {
        schema: schemaObj,
      } as any);
    } else {
      extractResult = await this.stagehand!.extract(instruction);
    }
    
    this.addLog("success", "extract", `Data extracted successfully`);
    return extractResult;
  }

  private async executeObserve(step: AutomationStep): Promise<any> {
    const instruction = step.config.instruction || step.description;
    this.addLog("info", "observe", `Observing: ${instruction}`);
    
    const observations = await this.stagehand!.observe(instruction);
    
    this.addLog("success", "observe", `Observation completed`);
    return observations;
  }

  private async executeAgent(step: AutomationStep): Promise<any> {
    const instruction = step.config.instruction || step.description;
    
    this.addLog("info", "agent", `Starting autonomous agent: ${instruction}`);
    
    const result = await this.stagehand!.agent(instruction as any);
    
    this.addLog("success", "agent", `Agent completed successfully`);
    return result;
  }

  private async executeWait(step: AutomationStep): Promise<void> {
    const duration = step.config.duration || 1000;
    const selector = step.config.selector;
    
    if (selector) {
      this.addLog("info", "wait", `Waiting for element: ${selector}`);
      await this.stagehand!.page.waitForSelector(selector, { timeout: duration });
      this.addLog("success", "wait", `Element found: ${selector}`);
    } else {
      this.addLog("info", "wait", `Waiting for ${duration}ms`);
      await new Promise(resolve => setTimeout(resolve, duration));
      this.addLog("success", "wait", `Wait completed`);
    }
  }

  private async executeScreenshot(step: AutomationStep): Promise<string> {
    const path = step.config.path || `screenshot-${Date.now()}.png`;
    this.addLog("info", "screenshot", `Taking screenshot: ${path}`);
    
    const screenshot = await this.stagehand!.page.screenshot({
      path,
      fullPage: step.config.fullPage || false,
    });
    
    this.addLog("success", "screenshot", `Screenshot saved: ${path}`);
    return path;
  }

  private async executeScroll(step: AutomationStep): Promise<void> {
    const direction = step.config.direction || "down";
    const amount = step.config.amount || 500;
    
    this.addLog("info", "scroll", `Scrolling ${direction} by ${amount}px`);
    
    await this.stagehand!.page.evaluate((scrollAmount: number, scrollDirection: string) => {
      if (scrollDirection === "down") {
        window.scrollBy(0, scrollAmount);
      } else if (scrollDirection === "up") {
        window.scrollBy(0, -scrollAmount);
      }
    }, amount, direction);
    
    this.addLog("success", "scroll", `Scroll completed`);
  }

  async execute(workflow: Workflow): Promise<{
    results: any;
    logs: LogEntry[];
    duration: number;
    tokenUsage: typeof this.tokenUsage;
  }> {
    this.startTime = Date.now();
    this.addLog("info", "execution", `Starting workflow: ${workflow.name}`);

    // Ensure cleanup happens in all cases using try/finally
    try {
      // Initialize browser
      await this.initStagehand(workflow);

      const results: any[] = [];
      const totalSteps = workflow.steps.length;

      if (workflow.executionMode === "sequential") {
        // Execute steps sequentially
        for (let i = 0; i < workflow.steps.length; i++) {
          const step = workflow.steps[i];
          
          // Emit normalized progress matching wsMessageSchema
          this.io.emit("execution:progress", {
            type: "execution:progress",
            executionId: this.executionId,
            currentStep: i,
            totalSteps: totalSteps,
            stepDescription: step.description,
          });
          
          const result = await this.executeStep(step);
          if (result) {
            results.push({ step: step.id, result });
          }
        }
      } else if (workflow.executionMode === "parallel") {
        // Execute steps in parallel
        this.addLog("info", "execution", "Executing steps in parallel");
        const stepPromises = workflow.steps.map(step => this.executeStep(step));
        const stepResults = await Promise.allSettled(stepPromises);
        
        stepResults.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            results.push({ step: workflow.steps[index].id, result: result.value });
          } else if (result.status === "rejected") {
            this.addLog("error", "execution", `Parallel step ${index + 1} failed: ${result.reason}`);
          }
        });
      }

      // Final progress update
      this.io.emit("execution:progress", {
        type: "execution:progress",
        executionId: this.executionId,
        currentStep: totalSteps,
        totalSteps: totalSteps,
        stepDescription: "Completed",
      });

      const duration = Date.now() - this.startTime;
      this.addLog("success", "execution", `Workflow completed in ${(duration / 1000).toFixed(2)}s`);

      return {
        results: results.length === 1 ? results[0].result : results,
        logs: this.logs,
        duration,
        tokenUsage: this.tokenUsage,
      };
    } catch (error: any) {
      const duration = Date.now() - this.startTime;
      this.addLog("error", "execution", `Workflow failed: ${error.message}`);

      // Return logs even on failure so they can be persisted
      return {
        results: null,
        logs: this.logs,
        duration,
        tokenUsage: this.tokenUsage,
      };
    } finally {
      // Always cleanup browser, even if initialization failed
      await this.cleanup();
    }
  }

  private async cleanup(): Promise<void> {
    if (this.stagehand) {
      try {
        this.addLog("info", "cleanup", "Closing browser instance");
        await this.stagehand.close();
        this.stagehand = null;
        this.addLog("success", "cleanup", "Browser closed successfully");
      } catch (error: any) {
        this.addLog("warning", "cleanup", `Browser cleanup warning: ${error.message}`);
      }
    }
  }
}
