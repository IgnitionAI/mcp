#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { addToolParamsSchema, substractToolParamsSchema, calculateBmiToolParamsSchema ,greetPromptParamsSchema } from "./types";
import { addTool, calculateBmiTool, substractTool } from "./tools/tools";
import { greetPrompt } from "./prompts/prompts";
import { getGreeting, getUserProfile, listUserProfiles } from "./resources/resources";

const server = new McpServer({
  name: "Starter MCP",
  description: "Starter for ModelContextProtocol, to deploy your own Stdio MCP ",
  version: "1.0.0"
});

// Tools
server.tool("add",
  addToolParamsSchema,
  (args) => ({
    content: [{ type: "text", text: String(addTool(args.a, args.b)) }]
  })
);

server.tool("subtract",
  substractToolParamsSchema,
  async (args) => ({
    content: [{ type: "text", text: String(substractTool(args.a, args.b)) }]
  })
);

server.tool("calculate-bmi",
  calculateBmiToolParamsSchema,
  (args) => ({
    content: [{ type: "text", text: String(calculateBmiTool(args.weightKg, args.heightM))}]
  })
);

// Resources
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => getGreeting(name)
);

server.resource(
  "user-profile",
  new ResourceTemplate("user-profile://{userId}", { 
    list: async () => listUserProfiles()
  }),
  async (uri, { userId }) => {
    return getUserProfile(userId);
  }
);

// Prompts
server.prompt(
  "greet",
  greetPromptParamsSchema,
  ({ name }) => greetPrompt(name)
);

const transport = new StdioServerTransport();
await server.connect(transport);