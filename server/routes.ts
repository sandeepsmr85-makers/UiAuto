import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import express from "express";
import { storage } from "./storage";
import { workflowSchema, insertWorkflowSchema } from "@shared/schema";
import { ZodError } from "zod";
import { WorkflowExecutor } from "./lib/workflow-executor";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json());

  const httpServer = createServer(app);
  
  // WebSocket Server setup
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io"
  });

  // Store WebSocket connections
  const connections = new Map<string, any>();

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    connections.set(socket.id, socket);

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      connections.delete(socket.id);
    });
  });

  // Make io available to routes
  app.set("io", io);

  // Error handler middleware
  const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // ================== WORKFLOW ROUTES ==================

  // Get all workflows
  app.get("/api/workflows", asyncHandler(async (req: any, res: any) => {
    const workflows = await storage.getWorkflows();
    res.json(workflows);
  }));

  // Get workflow by ID
  app.get("/api/workflows/:id", asyncHandler(async (req: any, res: any) => {
    const workflow = await storage.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    res.json(workflow);
  }));

  // Create workflow
  app.post("/api/workflows", asyncHandler(async (req: any, res: any) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      throw error;
    }
  }));

  // Update workflow
  app.patch("/api/workflows/:id", asyncHandler(async (req: any, res: any) => {
    const workflow = await storage.updateWorkflow(req.params.id, req.body);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    res.json(workflow);
  }));

  // Delete workflow
  app.delete("/api/workflows/:id", asyncHandler(async (req: any, res: any) => {
    const deleted = await storage.deleteWorkflow(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    res.status(204).send();
  }));

  // Parse natural language workflow description
  app.post("/api/workflows/parse", asyncHandler(async (req: any, res: any) => {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    // Simple parser - in production this would use the LLM
    // For now, create basic steps based on keywords
    const steps = [];
    let order = 0;

    if (description.toLowerCase().includes("go to") || description.toLowerCase().includes("navigate")) {
      steps.push({
        id: `step-${Date.now()}-${order}`,
        type: "navigate",
        description: "Navigate to target URL",
        config: { url: "{{TARGET_URL}}" },
        order: order++,
      });
    }

    if (description.toLowerCase().includes("click")) {
      steps.push({
        id: `step-${Date.now()}-${order}`,
        type: "act",
        description: "Click on element",
        config: { action: "Click the specified element" },
        order: order++,
      });
    }

    if (description.toLowerCase().includes("type") || description.toLowerCase().includes("enter")) {
      steps.push({
        id: `step-${Date.now()}-${order}`,
        type: "act",
        description: "Type text into input field",
        config: { action: "Enter text into field" },
        order: order++,
      });
    }

    if (description.toLowerCase().includes("extract") || description.toLowerCase().includes("scrape")) {
      steps.push({
        id: `step-${Date.now()}-${order}`,
        type: "extract",
        description: "Extract data from page",
        config: { schema: "{ data: string[] }" },
        order: order++,
      });
    }

    if (description.toLowerCase().includes("wait")) {
      steps.push({
        id: `step-${Date.now()}-${order}`,
        type: "wait",
        description: "Wait for element or timeout",
        config: { duration: 1000 },
        order: order++,
      });
    }

    // If no specific keywords, create a generic agent step
    if (steps.length === 0) {
      steps.push({
        id: `step-${Date.now()}-0`,
        type: "agent",
        description: description,
        config: { instruction: description },
        order: 0,
      });
    }

    res.json({ steps });
  }));

  // Execute workflow
  app.post("/api/workflows/:id/execute", asyncHandler(async (req: any, res: any) => {
    const workflow = await storage.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    // Create execution record
    const execution = await storage.createExecution({
      workflowId: workflow.id,
      status: "queued",
      logs: [],
      results: null,
      startedAt: new Date().toISOString(),
    });

    // Send immediate response
    res.status(202).json(execution);

    // Start execution asynchronously
    (async () => {
      let result: any = null;
      try {
        // Update status to running
        await storage.updateExecution(execution.id, {
          status: "running",
        });
        
        io.emit("execution:started", {
          type: "execution:started",
          executionId: execution.id,
          workflowId: workflow.id,
        });

        // Execute workflow
        const executor = new WorkflowExecutor(execution.id, io);
        result = await executor.execute(workflow);

        // Check if execution failed (result.results is null indicates failure)
        if (result.results === null) {
          // Execution failed but returned logs
          await storage.updateExecution(execution.id, {
            status: "failed",
            error: "Workflow execution failed. Check logs for details.",
            logs: result.logs,
            completedAt: new Date().toISOString(),
            duration: result.duration,
            tokenUsage: result.tokenUsage,
          });

          io.emit("execution:failed", {
            type: "execution:failed",
            executionId: execution.id,
            error: "Workflow execution failed",
          });
        } else {
          // Execution completed successfully
          await storage.updateExecution(execution.id, {
            status: "completed",
            logs: result.logs,
            results: result.results,
            completedAt: new Date().toISOString(),
            duration: result.duration,
            tokenUsage: result.tokenUsage,
          });

          io.emit("execution:completed", {
            type: "execution:completed",
            executionId: execution.id,
            results: result.results,
            duration: result.duration,
          });
        }
      } catch (error: any) {
        // Unexpected error outside of executor
        const logs = result?.logs || [];
        const duration = result?.duration || Date.now() - new Date(execution.startedAt || Date.now()).getTime();
        
        await storage.updateExecution(execution.id, {
          status: "failed",
          error: error.message,
          completedAt: new Date().toISOString(),
          logs,
          duration,
          tokenUsage: result?.tokenUsage,
        });

        io.emit("execution:failed", {
          type: "execution:failed",
          executionId: execution.id,
          error: error.message,
        });
      }
    })();
  }));

  // ================== EXECUTION ROUTES ==================

  // Get all executions
  app.get("/api/executions", asyncHandler(async (req: any, res: any) => {
    const executions = await storage.getExecutions();
    res.json(executions);
  }));

  // Get execution by ID
  app.get("/api/executions/:id", asyncHandler(async (req: any, res: any) => {
    const execution = await storage.getExecution(req.params.id);
    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }
    res.json(execution);
  }));

  // Get executions by workflow ID
  app.get("/api/workflows/:workflowId/executions", asyncHandler(async (req: any, res: any) => {
    const executions = await storage.getExecutionsByWorkflow(req.params.workflowId);
    res.json(executions);
  }));

  // ================== TEMPLATE ROUTES ==================

  // Get all templates
  app.get("/api/templates", asyncHandler(async (req: any, res: any) => {
    const templates = await storage.getTemplates();
    res.json(templates);
  }));

  // Get template by ID
  app.get("/api/templates/:id", asyncHandler(async (req: any, res: any) => {
    const template = await storage.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json(template);
  }));

  // Use template (create workflow from template)
  app.post("/api/templates/use", asyncHandler(async (req: any, res: any) => {
    const { templateId } = req.body;
    
    if (!templateId) {
      return res.status(400).json({ error: "Template ID is required" });
    }

    const template = await storage.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Create workflow from template
    const workflow = await storage.createWorkflow({
      name: `${template.name} (from template)`,
      description: template.description,
      steps: template.workflow.steps || [],
      executionMode: "sequential",
      browserConfig: {
        headless: true,
        viewport: { width: 1920, height: 1080 },
      },
    });

    res.status(201).json(workflow);
  }));

  // ================== SESSION ROUTES ==================

  // Get session
  app.get("/api/session", asyncHandler(async (req: any, res: any) => {
    const session = await storage.getSession();
    res.json(session);
  }));

  // ================== EXPORT ROUTES ==================

  // Export execution results as JSON
  app.get("/api/executions/:id/export/json", asyncHandler(async (req: any, res: any) => {
    const execution = await storage.getExecution(req.params.id);
    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="execution-${execution.id}.json"`);
    res.json(execution.results || {});
  }));

  // Export execution results as CSV
  app.get("/api/executions/:id/export/csv", asyncHandler(async (req: any, res: any) => {
    const execution = await storage.getExecution(req.params.id);
    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }

    // Simple CSV conversion
    const results = execution.results;
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: "Results must be an array for CSV export" });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: "No data to export" });
    }

    // Get headers from first object
    const headers = Object.keys(results[0]);
    const csvRows = [headers.join(',')];

    // Add data rows
    for (const row of results) {
      const values = headers.map(header => {
        const value = row[header];
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="execution-${execution.id}.csv"`);
    res.send(csv);
  }));

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message
    });
  });

  return httpServer;
}
