# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `pnpm build` - Compiles TypeScript to JavaScript using Rollup
- **Start Development**: `pnpm start` - Runs the server directly with ts-node
- **Start Production**: `pnpm start:prod` - Runs the built server from dist/
- **Inspect**: `pnpm inspect` - Runs the MCP inspector for debugging

## Architecture Overview

This is an MCP (Model Context Protocol) server that provides Azure Table Storage integration. The server exposes Azure Table data as both tools and resources.

### Core Components

- **server.ts** - Main MCP server entry point with tool registration and dynamic resource management
- **tools/azure-table-tools.ts** - Azure Table Storage client wrapper with authentication handling
- **types.ts** - Zod schemas for type validation and parameter definitions

### Key Architecture Patterns

1. **Lazy Loading**: Azure Table Tools are instantiated only when first accessed through `getAzureTableTools()`

2. **Dynamic Resource Registration**: The server discovers available Azure tables at startup and creates resources for each table automatically, including filtered views by PartitionKey

3. **Dual Authentication**: Supports both connection string and managed identity authentication via `DefaultAzureCredential`

4. **Error Handling**: Consistent error response format with success/error flags and structured error messages

### MCP Integration Points

- **Tools**: `read-azure-table` and `list-azure-tables` expose Azure operations as callable tools
- **Resources**: Dynamic resources created for each discovered table with URIs like `azure-table://{tableName}` and `azure-table://{tableName}/{partitionKey}`

### Configuration

The server requires either:
- `AZURE_STORAGE_CONNECTION_STRING` environment variable
- `AZURE_STORAGE_ACCOUNT_NAME` environment variable (uses DefaultAzureCredential)

### Build System

Uses Rollup with TypeScript compilation, preserving the shebang for CLI execution. External dependencies are not bundled
