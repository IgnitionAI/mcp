# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `pnpm build` - Compiles TypeScript to JavaScript using Rollup
- **Start Development**: `pnpm start` - Runs the server directly with ts-node
- **Start Production**: `pnpm start:prod` - Runs the built server from dist/
- **Inspect**: `pnpm inspect` - Runs the MCP inspector for debugging

## Architecture Overview

This is an MCP (Model Context Protocol) server that provides comprehensive Azure Storage integration, supporting Azure Table Storage, Azure Blob Storage, and Azure Service Bus Queues. The server exposes Azure storage services as both tools and resources.

### Core Components

- **server.ts** - Main MCP server entry point with tool registration and dynamic resource management
- **tools/azure-table-tools.ts** - Azure Table Storage client wrapper with authentication handling
- **tools/azure-blob-tools.ts** - Azure Blob Storage client wrapper with container and blob operations
- **tools/azure-queue-tools.ts** - Azure Service Bus client wrapper with queue and message operations
- **resources/azure-table-resources.ts** - Dynamic resource registration for Azure Tables
- **resources/azure-blob-resources.ts** - Dynamic resource registration for Azure Blob containers
- **types.ts** - Zod schemas for type validation and parameter definitions

### Key Architecture Patterns

1. **Lazy Loading**: Azure Storage Tools are instantiated only when first accessed through `getAzureTableTools()`, `getAzureBlobTools()`, and `getAzureQueueTools()`

2. **Dynamic Resource Registration**: The server discovers available Azure tables and blob containers at startup and creates resources automatically, including filtered views by PartitionKey (tables) and prefix (blobs)

3. **Dual Authentication**: Supports both connection string and managed identity authentication via `DefaultAzureCredential`

4. **Error Handling**: Consistent error response format with success/error flags and structured error messages

### MCP Integration Points

#### Azure Table Storage
- **Tools**: Complete CRUD operations, batch processing, schema inspection, and advanced querying
- **Resources**: Dynamic resources created for each discovered table with URIs like `azure-table://{tableName}` and `azure-table://{tableName}/{partitionKey}`

#### Azure Blob Storage  
- **Tools**: Container management (create, list, delete), blob operations (upload, download, list, delete, properties)
- **Resources**: Dynamic resources created for each discovered container with URIs like `azure-blob://{containerName}`, `azure-blob://{containerName}/{blobName}`, and `azure-blob://{containerName}/prefix/{prefix}`

#### Azure Service Bus Queues
- **Tools**: Queue management (create, list, delete), message operations (send, receive, peek), queue properties
- **Configuration**: Requires `AZURE_SERVICE_BUS_CONNECTION_STRING` or `AZURE_SERVICE_BUS_NAMESPACE` environment variable

### Configuration

#### Azure Storage (Tables & Blobs)
The server requires either:
- `AZURE_STORAGE_CONNECTION_STRING` environment variable
- `AZURE_STORAGE_ACCOUNT_NAME` environment variable (uses DefaultAzureCredential)

#### Azure Service Bus (Queues)
The server requires either:
- `AZURE_SERVICE_BUS_CONNECTION_STRING` environment variable
- `AZURE_SERVICE_BUS_NAMESPACE` environment variable (uses DefaultAzureCredential)

### Build System

Uses Rollup with TypeScript compilation, preserving the shebang for CLI execution. External dependencies are not bundled