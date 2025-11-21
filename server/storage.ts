import { randomUUID } from "crypto";
import type {
  Workflow,
  InsertWorkflow,
  Execution,
  InsertExecution,
  Template,
  Session,
} from "@shared/schema";

export interface IStorage {
  // Workflows
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;

  // Executions
  getExecutions(): Promise<Execution[]>;
  getExecution(id: string): Promise<Execution | undefined>;
  getExecutionsByWorkflow(workflowId: string): Promise<Execution[]>;
  createExecution(execution: InsertExecution): Promise<Execution>;
  updateExecution(id: string, execution: Partial<Execution>): Promise<Execution | undefined>;

  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;

  // Session
  getSession(): Promise<Session>;
  updateSession(updates: Partial<Session>): Promise<Session>;
}

export class MemStorage implements IStorage {
  private workflows: Map<string, Workflow>;
  private executions: Map<string, Execution>;
  private templates: Map<string, Template>;
  private session: Session;

  constructor() {
    this.workflows = new Map();
    this.executions = new Map();
    this.templates = new Map();
    
    const sessionId = randomUUID();
    this.session = {
      id: sessionId,
      workflows: [],
      executions: [],
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };

    // Initialize with pre-built templates
    this.initializeTemplates();
  }

  private initializeTemplates() {
    const templates: Template[] = [
      {
        id: randomUUID(),
        name: "E-commerce Product Scraper",
        description: "Extract product names, prices, and ratings from e-commerce websites. Supports pagination and filtering.",
        category: "ecommerce",
        icon: "shopping-cart",
        tags: ["scraping", "products", "prices", "e-commerce"],
        exampleUrl: "https://www.amazon.com",
        workflow: {
          steps: [
            { id: randomUUID(), type: "navigate", description: "Navigate to product listing page", config: { url: "{{TARGET_URL}}" }, order: 0 },
            { id: randomUUID(), type: "extract", description: "Extract product data", config: { schema: "{ name: string, price: string, rating: number }[]" }, order: 1 },
          ],
        },
      },
      {
        id: randomUUID(),
        name: "Form Auto-Fill & Submit",
        description: "Automatically fill out and submit web forms with predefined data. Great for testing and automation.",
        category: "forms",
        icon: "file-text",
        tags: ["forms", "automation", "testing"],
        workflow: {
          steps: [
            { id: randomUUID(), type: "navigate", description: "Go to form page", config: { url: "{{FORM_URL}}" }, order: 0 },
            { id: randomUUID(), type: "act", description: "Fill form fields", config: { action: "Fill all form fields with provided data" }, order: 1 },
            { id: randomUUID(), type: "act", description: "Submit form", config: { action: "Click submit button" }, order: 2 },
          ],
        },
      },
      {
        id: randomUUID(),
        name: "Research & Data Collection",
        description: "Search for information across multiple sources and compile results. Perfect for market research.",
        category: "research",
        icon: "search",
        tags: ["research", "data", "collection", "analysis"],
        workflow: {
          steps: [
            { id: randomUUID(), type: "navigate", description: "Navigate to search engine", config: { url: "https://www.google.com" }, order: 0 },
            { id: randomUUID(), type: "act", description: "Enter search query", config: { action: "Type search query and press enter" }, order: 1 },
            { id: randomUUID(), type: "extract", description: "Extract search results", config: { schema: "{ title: string, url: string, description: string }[]" }, order: 2 },
          ],
        },
      },
      {
        id: randomUUID(),
        name: "Price Monitoring",
        description: "Track product prices over time and get alerts when prices drop below threshold.",
        category: "monitoring",
        icon: "trending-up",
        tags: ["monitoring", "prices", "alerts", "tracking"],
        workflow: {
          steps: [
            { id: randomUUID(), type: "navigate", description: "Go to product page", config: { url: "{{PRODUCT_URL}}" }, order: 0 },
            { id: randomUUID(), type: "extract", description: "Extract current price", config: { schema: "{ price: number, currency: string, inStock: boolean }" }, order: 1 },
          ],
        },
      },
      {
        id: randomUUID(),
        name: "Competitive Analysis",
        description: "Analyze competitor websites to gather pricing, features, and positioning data.",
        category: "analysis",
        icon: "bar-chart",
        tags: ["analysis", "competitors", "market", "intelligence"],
        workflow: {
          steps: [
            { id: randomUUID(), type: "navigate", description: "Visit competitor site", config: { url: "{{COMPETITOR_URL}}" }, order: 0 },
            { id: randomUUID(), type: "observe", description: "Identify key elements", config: { action: "Find pricing tables and feature lists" }, order: 1 },
            { id: randomUUID(), type: "extract", description: "Extract competitive data", config: { schema: "{ features: string[], pricing: object[], positioning: string }" }, order: 2 },
          ],
        },
      },
      {
        id: randomUUID(),
        name: "Lead Generation",
        description: "Scrape contact information and company details from business directories and LinkedIn.",
        category: "generation",
        icon: "users",
        tags: ["leads", "contacts", "b2b", "outreach"],
        workflow: {
          steps: [
            { id: randomUUID(), type: "navigate", description: "Go to directory", config: { url: "{{DIRECTORY_URL}}" }, order: 0 },
            { id: randomUUID(), type: "extract", description: "Extract business listings", config: { schema: "{ company: string, email: string, phone: string, website: string }[]" }, order: 1 },
          ],
        },
      },
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const workflow: Workflow = {
      ...insertWorkflow,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.workflows.set(id, workflow);
    this.session.workflows.push(id);
    this.session.lastAccessedAt = now;
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.workflows.set(id, updated);
    this.session.lastAccessedAt = new Date().toISOString();
    return updated;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const deleted = this.workflows.delete(id);
    if (deleted) {
      this.session.workflows = this.session.workflows.filter(wid => wid !== id);
      this.session.lastAccessedAt = new Date().toISOString();
    }
    return deleted;
  }

  // Executions
  async getExecutions(): Promise<Execution[]> {
    return Array.from(this.executions.values()).sort((a, b) => {
      const aTime = a.startedAt || a.completedAt || '';
      const bTime = b.startedAt || b.completedAt || '';
      return bTime.localeCompare(aTime);
    });
  }

  async getExecution(id: string): Promise<Execution | undefined> {
    return this.executions.get(id);
  }

  async getExecutionsByWorkflow(workflowId: string): Promise<Execution[]> {
    return Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId)
      .sort((a, b) => {
        const aTime = a.startedAt || '';
        const bTime = b.startedAt || '';
        return bTime.localeCompare(aTime);
      });
  }

  async createExecution(insertExecution: InsertExecution): Promise<Execution> {
    const id = randomUUID();
    const execution: Execution = {
      ...insertExecution,
      id,
    };
    this.executions.set(id, execution);
    this.session.executions.push(id);
    this.session.lastAccessedAt = new Date().toISOString();
    return execution;
  }

  async updateExecution(id: string, updates: Partial<Execution>): Promise<Execution | undefined> {
    const execution = this.executions.get(id);
    if (!execution) return undefined;
    
    const updated = {
      ...execution,
      ...updates,
    };
    this.executions.set(id, updated);
    this.session.lastAccessedAt = new Date().toISOString();
    return updated;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  // Session
  async getSession(): Promise<Session> {
    this.session.lastAccessedAt = new Date().toISOString();
    return this.session;
  }

  async updateSession(updates: Partial<Session>): Promise<Session> {
    this.session = {
      ...this.session,
      ...updates,
      lastAccessedAt: new Date().toISOString(),
    };
    return this.session;
  }
}

export const storage = new MemStorage();
