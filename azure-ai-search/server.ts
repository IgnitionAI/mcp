#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Create server instance
const server = new McpServer({
  name: "AzureAISearchMCP",
  version: "1.0.0",
  description: "MCP server for interacting with Azure AI Search"
});


// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Azure Storage MCP Server running on stdio");
}
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Azure AI Searh MCP Server running on stdio");

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
