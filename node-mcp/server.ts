#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "test",
  version: "1.0.0"
});

server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

server.tool("subtract",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a - b) }]
  })
);

server.tool(
    "calculate-bmi",
    {
      weightKg: z.number(),
      heightM: z.number()
    },
    async ({ weightKg, heightM }) => ({
      content: [{
        type: "text",
        text: String(weightKg / (heightM * heightM))
      }]
    })
);

server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);


server.resource(
  "user-profile",
  new ResourceTemplate("user-profile://{userId}", { 
    list: async () => ({
      resources: [
        { 
          name: "Utilisateur 1", 
          uri: "user-profile://1", 
          description: "Profil de l'utilisateur 1" 
        },
        { 
          name: "Utilisateur 2", 
          uri: "user-profile://2", 
          description: "Profil de l'utilisateur 2" 
        },
        { 
          name: "Utilisateur 3", 
          uri: "user-profile://3", 
          description: "Profil de l'utilisateur 3" 
        }
      ]
    }) 
  }),
  async (uri, { userId }) => {
    const profiles = {
      "1": { name: "Alice", age: 28, job: "Développeur" },
      "2": { name: "Bob", age: 34, job: "Designer" },
      "3": { name: "Charlie", age: 42, job: "Manager" }
    };
    
    const userIdKey = Array.isArray(userId) ? userId[0] : userId;
    const profile = userIdKey in profiles 
      ? profiles[userIdKey as keyof typeof profiles] 
      : { name: "Inconnu", age: 0, job: "N/A" };
    
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(profile, null, 2)
      }]
    };
  }
);

server.prompt(
    "review-code",
    { code: z.string() },
    ({ code }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please review this code:\n\n${code}`
        }
      }]
    })
  );

  server.prompt(
    "greet",
    { name: z.string() },
    ({ name }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please greet ${name}`
        }
      }]
    })
  );

const transport = new StdioServerTransport();
await server.connect(transport);