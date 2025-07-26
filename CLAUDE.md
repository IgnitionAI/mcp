# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Running
- **Build**: `pnpm build` - Compiles TypeScript to JavaScript using Rollup
- **Start Development**: `pnpm start` - Runs server directly with ts-node/esm loader
- **Start Production**: `pnpm start:prod` - Runs built server from dist/
- **Inspect**: `pnpm inspect` - Runs MCP inspector for debugging

### Testing and Docker
- **Run Tests**: `pnpm test` (currently placeholder)
- **Docker Compose**: `docker compose up -d` - Starts LinkedIn MCP HTTP server

## Repository Architecture

This is a monorepo containing multiple Model Context Protocol (MCP) server implementations for different services and APIs. Each MCP server follows a consistent architecture pattern with tools, resources, and prompts.

### Core MCP Server Structure

Each MCP server typically contains:
- **server.ts** - Main MCP server entry point with tool/resource registration
- **tools/** - Directory containing tool implementations (business logic)
- **resources/** - Directory containing resource providers (data access)
- **prompts/** - Directory containing prompt templates
- **types.ts** - Zod schemas for type validation and parameter definitions
- **lib/** - Shared library code and API clients

### Current MCP Servers

#### Azure Storage MCP (`azure-storage-mcp/`)
Complete Azure Storage integration supporting:
- **Azure Table Storage**: CRUD operations, batch processing, schema inference, advanced querying
- **Azure Blob Storage**: Container/blob management, upload/download, metadata handling
- **Azure Service Bus Queues**: Message sending/receiving, queue management
- **Azure Storage Queues**: Simple queue operations

Architecture patterns:
- Lazy loading of Azure clients via getter functions
- Dynamic resource registration based on discovered tables/containers
- Dual authentication support (connection string + managed identity)
- Consistent error handling with success/error response format

#### Azure AI Search MCP (`azure-ai-search/`)
Currently in development - basic server setup exists but tools not yet implemented.

#### LinkedIn MCP (`linkedin-mcp/`)
LinkedIn API integration with OAuth authentication:
- Profile management, connection handling, post operations
- Both stdio (`linkedin-mcp/`) and HTTP (`linkedin-mcp-http/`) variants

#### Fitness MCP (`fit-mcp/`)
Fitness and nutrition calculations with prompts and resources.

#### Template MCP (`mcp-template/`)
Base template for creating new MCP servers with example tools, prompts, and resources.

#### Node MCP (`node-mcp/`)
Simple Node.js MCP implementation.

### Build System

All projects use:
- **Rollup** for bundling with TypeScript compilation
- **rollup-plugin-preserve-shebang** to maintain CLI executability
- **pnpm** as package manager (configured in package.json)
- External dependencies are not bundled to reduce size

### Configuration Patterns

#### Environment Variables
Most servers use dotenv and require service-specific credentials:
- Azure services: `AZURE_STORAGE_CONNECTION_STRING` or `AZURE_STORAGE_ACCOUNT_NAME`
- LinkedIn: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`

#### Package Configuration
- All packages are ESM modules (`"type": "module"`)
- CLI executables defined in `bin` field pointing to `dist/server.js`
- Consistent script naming: `build`, `start`, `start:prod`, `inspect`

### Development Workflow

1. Each MCP server can be developed independently
2. Use the mcp-template as starting point for new servers
3. Follow the established patterns for tools, resources, and error handling
4. Test with MCP inspector: `pnpm inspect`
5. LinkedIn HTTP variant can be tested with Docker Compose

### Publishing

Individual MCP servers are published as separate npm packages under `@ignitionai/` scope with public access.