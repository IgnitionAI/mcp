# MCP (Model Context Protocol)

This repository contains implementations of the Model Context Protocol (MCP), an open standard that connects AI systems with external tools and data sources.

## About IgnitionAI

IgnitionAI is an open-source organization dedicated to advancing AI capabilities through accessible and collaborative tools. We believe in the power of community-driven development to create robust, ethical, and innovative AI solutions.

## Repository Contents

This is a monorepo containing multiple MCP server implementations:

- **azure-storage-mcp**: Complete Azure Storage integration with Table Storage, Blob Storage, Service Bus Queues, and Storage Queues
- **azure-ai-search**: Azure AI Search integration (in development)
- **linkedin-mcp**: LinkedIn API integration with OAuth authentication
- **linkedin-mcp-http**: HTTP variant of LinkedIn MCP server
- **fit-mcp**: MCP implementation for fitness and nutrition calculations
- **node-mcp**: Simple Node.js MCP implementation
- **mcp-template**: Base template for creating new MCP servers

## Development

### Prerequisites
- Node.js and pnpm
- Service-specific credentials (see individual server documentation)

### Commands
- `pnpm build` - Build all projects
- `pnpm start` - Start development server
- `pnpm start:prod` - Start production server
- `pnpm inspect` - Run MCP inspector for debugging
- `docker compose up -d` - Start LinkedIn HTTP server

## About MCP

The Model Context Protocol (MCP) is a standard that enables AI models to interact with external tools, APIs, and services, extending their capabilities beyond their initial training. These repositories are available for everyone to use, modify, and contribute to.

## Configuration Examples

### Azure Storage MCP
```json
"azure-storage": {
  "command": "npx",
  "args": ["azure-storage-mcp"],
  "env": {
    "AZURE_STORAGE_CONNECTION_STRING": "your-connection-string"
  }
}
```

### Azure AI Search MCP
```json
"azure-ai-search": {
  "command": "npx",
  "args": ["azure-ai-search-mcp"],
  "env": {
    "AZURE_SEARCH_ENDPOINT": "your-search-endpoint",
    "AZURE_SEARCH_API_KEY": "your-api-key"
  }
}
```

### LinkedIn MCP
```json
"linkedin": {
  "command": "npx",
  "args": ["-y", "linkedin-mcp"],
  "env": {
    "LINKEDIN_CLIENT_ID": "your-client-id",
    "LINKEDIN_CLIENT_SECRET": "your-client-secret",
    "LINKEDIN_REDIRECT_URI": "your-redirect-uri"
  }
}
```

### Fit MCP
```json
"fit-mcp": {
  "command": "npx",
  "args": ["fitmcp"]
}
```

### How to Get LinkedIn API Keys
To obtain the necessary LinkedIn API credentials (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_REDIRECT_URI`), follow these steps:

1. **Create a LinkedIn Developer Account**  
   Visit [LinkedIn Developer Portal](https://www.linkedin.com/developers/) and log in with your LinkedIn account.

2. **Create a New App**  
   Click **Create app**, fill out the required details, and submit.

3. **Get Client ID and Client Secret**  
   After creating the app, navigate to the **Auth** or **Settings** tab to find your **Client ID** and **Client Secret**.

4. **Set Redirect URI**  
   In the app’s **OAuth 2.0 settings**, add your redirect URL (e.g., `https://yourapp.com/auth/linkedin/callback`). Use this URL as your `LINKEDIN_REDIRECT_URI`.

Make sure to create the `env` file, based on the given `.env.example`.

## Architecture

Each MCP server follows a consistent pattern:
- **server.ts** - Main entry point with tool/resource registration
- **tools/** - Business logic implementations  
- **resources/** - Data access providers
- **prompts/** - Template definitions
- **types.ts** - Zod schemas for validation
- **lib/** - Shared utilities and API clients

All servers use:
- TypeScript with ESM modules
- Rollup for bundling
- pnpm as package manager
- Individual npm publishing under `@ignitionai/` scope

## Contributing

We welcome contributions from the community! If you'd like to contribute, please feel free to submit pull requests or open issues.

## License

These MCP implementations are released under open-source licenses. See individual directories for specific license information.

More information about the Model Context Protocol is available on the official website: https://modelcontextprotocol.org
