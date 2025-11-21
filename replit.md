# Stagehand Automation Studio

## Overview

This is an AI-powered browser automation platform built on Browserbase's Stagehand v3. The application enables users to create, execute, and monitor complex web automation workflows using natural language instructions. It features a modern Material Design-inspired interface with real-time execution monitoring, template library, and comprehensive workflow management capabilities.

The system combines a React/TypeScript frontend with an Express backend, real-time WebSocket communication, and PostgreSQL database storage via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- Socket.io client for real-time WebSocket communication

**UI Component System:**
- shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Material Design principles adapted for developer tools
- Theme support (light/dark mode) via context provider
- Custom color system using HSL with CSS variables

**State Management:**
- React Query for server state caching and synchronization
- React Context for theme and global UI state
- Local component state for form inputs and UI interactions
- WebSocket listeners for real-time execution updates

**Design Rationale:**
The frontend prioritizes developer ergonomics with a sidebar navigation pattern, card-based layouts, and generous whitespace. The choice of Wouter over React Router reduces bundle size while maintaining routing functionality. React Query eliminates the need for Redux by handling server state, caching, and optimistic updates automatically.

### Backend Architecture

**Technology Stack:**
- Express.js server handling HTTP and WebSocket connections
- Socket.io for bi-directional real-time communication
- TypeScript for type safety across client and server
- ESM module system for modern JavaScript features

**API Design:**
- RESTful endpoints for CRUD operations on workflows, executions, and templates
- WebSocket events for real-time execution logs and progress updates
- Shared schema validation using Zod between client and server
- JSON request/response format with centralized error handling

**Execution Engine:**
- `WorkflowExecutor` class manages Stagehand browser automation instances
- Supports sequential and parallel step execution modes
- Real-time log streaming via WebSocket to connected clients
- Token usage tracking for cost estimation (OpenAI API)
- Graceful error handling with detailed logging

**Storage Layer:**
- In-memory storage implementation (`MemStorage`) for development
- Interface-based design (`IStorage`) allows swapping to database persistence
- Models: Workflows, Executions, Templates, and Session
- Session tracking for workflow and execution history

**Architecture Decision:**
The backend uses in-memory storage by default for simplicity and rapid development. The `IStorage` interface pattern allows seamless migration to PostgreSQL (via Drizzle) or other databases without changing business logic. WebSocket integration provides live feedback during long-running browser automations.

### Browser Automation Layer

**Stagehand Integration:**
- Browserbase Stagehand v3 for AI-powered browser automation
- Custom LLM client supporting Azure OpenAI with OAuth token fetching
- Python script (`fetch_token.py`) placeholder for OAuth implementation
- Support for multiple action types: act, extract, observe, navigate, wait, screenshot, agent

**Workflow Step Types:**
- `act`: Perform actions on web elements (click, type, etc.)
- `extract`: Extract data from web pages
- `observe`: Monitor page state or elements
- `navigate`: Navigate to URLs
- `wait`: Pause execution for timing control
- `screenshot`: Capture page screenshots
- `agent`: Execute complex AI-driven automation sequences

**Execution Configuration:**
- Headless/headful browser modes
- Custom viewport dimensions (default 1920x1080)
- User agent string customization
- Browser configuration per workflow

**Design Considerations:**
Stagehand abstracts Playwright complexity with AI-driven element detection and natural language actions. The custom LLM client allows using Azure OpenAI deployments with OAuth authentication, providing enterprise flexibility. The modular step system enables building complex multi-stage automations.

## External Dependencies

### Third-Party Services

**Browserbase Stagehand:**
- Core automation library for AI-powered browser control
- Version: ^3.0.3
- Purpose: Handles browser lifecycle, element detection, and action execution

**Azure OpenAI (Custom LLM Client):**
- Optional custom LLM client implementation
- Requires OAuth token fetching via `fetch_token.py`
- Purpose: Powers AI-driven element detection and natural language action interpretation
- Note: User must implement their own `fetch_token.py` with appropriate OAuth flow

### Database

**PostgreSQL with Drizzle ORM:**
- Schema definition in `shared/schema.ts`
- Connection via `@neondatabase/serverless` driver
- Drizzle Kit for migrations (config in `drizzle.config.ts`)
- Database URL required via `DATABASE_URL` environment variable
- Note: Application may be provisioned without PostgreSQL initially and added later

**Schema Models:**
- `workflows`: Automation workflow definitions with steps and configuration
- `executions`: Execution runs with status, logs, results, and token usage
- `templates`: Pre-built workflow templates for common use cases
- `session`: Current session tracking for workflows and executions

### Frontend Libraries

**UI Components:**
- Radix UI primitives for accessible component foundations
- shadcn/ui for pre-built, customizable components
- Monaco Editor for code viewing/editing
- React Syntax Highlighter for code display

**Development Tools:**
- Replit-specific Vite plugins for development experience
- Runtime error overlay
- Cartographer for project exploration
- Development banner

### Build and Development

**Build Tools:**
- Vite for frontend bundling and HMR
- esbuild for backend bundling
- TypeScript compiler for type checking
- Tailwind CSS with PostCSS

**Environment Requirements:**
- Node.js with ESM support
- `DATABASE_URL` environment variable for PostgreSQL connection
- Optional: Azure OpenAI credentials and OAuth implementation