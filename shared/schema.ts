import { z } from "zod";

// Workflow Schemas
export const workflowStepSchema = z.object({
  id: z.string(),
  type: z.enum(['act', 'extract', 'observe', 'navigate', 'wait', 'screenshot', 'scroll', 'agent']),
  description: z.string(),
  config: z.record(z.any()),
  order: z.number(),
});

export const workflowSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  steps: z.array(workflowStepSchema),
  executionMode: z.enum(['sequential', 'parallel']).default('sequential'),
  browserConfig: z.object({
    headless: z.boolean().default(true),
    viewport: z.object({
      width: z.number().default(1920),
      height: z.number().default(1080),
    }).optional(),
    userAgent: z.string().optional(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertWorkflowSchema = workflowSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type Workflow = z.infer<typeof workflowSchema>;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type WorkflowStep = z.infer<typeof workflowStepSchema>;
export type AutomationStep = WorkflowStep; // Alias for consistency

// Execution Schemas
export const executionLogSchema = z.object({
  timestamp: z.string(),
  level: z.enum(['info', 'success', 'warning', 'error']),
  category: z.string(),
  message: z.string(),
  data: z.any().optional(),
});

export const executionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']),
  logs: z.array(executionLogSchema),
  results: z.any().optional(),
  error: z.string().optional(),
  tokenUsage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
    estimatedCost: z.number(),
  }).optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  duration: z.number().optional(),
});

export const insertExecutionSchema = executionSchema.omit({ id: true });

export type Execution = z.infer<typeof executionSchema>;
export type InsertExecution = z.infer<typeof insertExecutionSchema>;
export type ExecutionLog = z.infer<typeof executionLogSchema>;
export type LogEntry = ExecutionLog; // Alias for consistency

// Template Schemas
export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['ecommerce', 'forms', 'research', 'monitoring', 'analysis', 'generation']),
  icon: z.string(),
  workflow: z.any(),
  exampleUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type Template = z.infer<typeof templateSchema>;

// Extraction Schema Schemas
export const extractionSchemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  schema: z.string(), // JSON string of Zod schema
  createdAt: z.string(),
});

export type ExtractionSchema = z.infer<typeof extractionSchemaSchema>;

// Session/History Schemas
export const sessionSchema = z.object({
  id: z.string(),
  workflows: z.array(z.string()),
  executions: z.array(z.string()),
  createdAt: z.string(),
  lastAccessedAt: z.string(),
});

export type Session = z.infer<typeof sessionSchema>;

// WebSocket Message Schemas
export const wsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('execution:started'),
    executionId: z.string(),
    workflowId: z.string(),
  }),
  z.object({
    type: z.literal('execution:log'),
    executionId: z.string(),
    log: executionLogSchema,
  }),
  z.object({
    type: z.literal('execution:progress'),
    executionId: z.string(),
    currentStep: z.number(),
    totalSteps: z.number(),
    stepDescription: z.string(),
  }),
  z.object({
    type: z.literal('execution:completed'),
    executionId: z.string(),
    results: z.any(),
    tokenUsage: z.object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      totalTokens: z.number(),
      estimatedCost: z.number(),
    }).optional(),
  }),
  z.object({
    type: z.literal('execution:failed'),
    executionId: z.string(),
    error: z.string(),
  }),
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;
