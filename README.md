# MCP (Model Context Protocol)

This repository contains implementations of the Model Context Protocol (MCP), an open standard that connects AI systems with external tools and data sources.

## About IgnitionAI

IgnitionAI is an open-source organization dedicated to advancing AI capabilities through accessible and collaborative tools. We believe in the power of community-driven development to create robust, ethical, and innovative AI solutions.

## Repository Contents

- **fit-mcp**: MCP implementation for fitness and nutrition calculations
- **node-mcp**: Node.js extra simple MCP implementation

## About MCP

The Model Context Protocol (MCP) is a standard that enables AI models to interact with external tools, APIs, and services, extending their capabilities beyond their initial training. These repositories are available for everyone to use, modify, and contribute to.

## Getting Started

### Fit-mcp config :
```json
    "fit-mcp": {
      "command": "npx",
      "args": [
        "fitmcp"
      ]
    },
```

### Linkedin-mcp config : 
```json
    "linkedin": {
      "command": "npx",
      "args": [
        "-y",
        "linkedin-mcp"
      ],
      "env": {
      }
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

### Run the MCP HTTP Server
```sh
docker compose up -d
```

## Contributing

We welcome contributions from the community! If you'd like to contribute, please feel free to submit pull requests or open issues.

## License

These MCP implementations are released under open-source licenses. See individual directories for specific license information.

More information about the Model Context Protocol is available on the official website: https://modelcontextprotocol.org
