#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { 
  SearchDocumentsSchema,
  GetDocumentSchema,
  SuggestSchema,
  AutocompleteSchema,
  ListIndexesSchema,
  GetIndexSchema,
  GetIndexStatisticsSchema,
  UploadDocumentsSchema,
  MergeDocumentsSchema,
  DeleteDocumentsSchema,
  VectorSearchSchema,
  HybridSearchSchema,
  SemanticSearchSchema,
} from "./types.js";
import { 
  searchDocuments,
  getDocument,
  suggest,
  autocomplete,
} from "./tools/search-tools.js";
import {
  listIndexes,
  getIndexSchema,
  getIndexStatistics,
} from "./tools/index-tools.js";
import {
  uploadDocuments,
  mergeDocuments,
  deleteDocuments,
} from "./tools/document-tools.js";
import {
  vectorSearch,
  hybridSearch,
  semanticSearch,
} from "./tools/vector-tools.js";
import { getAzureSearchTools } from "./tools/search-tools.js";
import { AzureSearchIndexResources } from "./resources/index-resources.js";

dotenv.config();

// Create server instance
const server = new McpServer({
  name: "AzureAISearchMCP",
  version: "1.0.0",
  description: "MCP server for interacting with Azure AI Search"
});

// Register search tools
server.tool(
  "search-documents",
  "Search documents in an Azure AI Search index with comprehensive filtering and faceting options",
  SearchDocumentsSchema.shape,
  async (params) => {
    try {
      const result = await searchDocuments(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching documents: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get-document",
  "Retrieve a specific document by its key from an Azure AI Search index",
  GetDocumentSchema.shape,
  async (params) => {
    try {
      const result = await getDocument(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving document: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "suggest",
  "Get search suggestions using a configured suggester in Azure AI Search",
  SuggestSchema.shape,
  async (params) => {
    try {
      const result = await suggest(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting suggestions: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "autocomplete",
  "Get autocomplete suggestions for partial search terms using Azure AI Search",
  AutocompleteSchema.shape,
  async (params) => {
    try {
      const result = await autocomplete(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting autocomplete: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register index management tools
server.tool(
  "list-indexes",
  "List all available search indexes in the Azure AI Search service",
  ListIndexesSchema.shape,
  async (params) => {
    try {
      const result = await listIndexes(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing indexes: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get-index-schema",
  "Get the schema definition of a specific search index including fields, analyzers, and configuration",
  GetIndexSchema.shape,
  async (params) => {
    try {
      const result = await getIndexSchema(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting index schema: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get-index-statistics",
  "Get statistics and usage information for a specific search index",
  GetIndexStatisticsSchema.shape,
  async (params) => {
    try {
      const result = await getIndexStatistics(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting index statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register document management tools
server.tool(
  "upload-documents",
  "Upload new documents to an Azure AI Search index. Documents will be added or updated if they already exist.",
  UploadDocumentsSchema.shape,
  async (params) => {
    try {
      const result = await uploadDocuments(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error uploading documents: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "merge-documents",
  "Merge or update existing documents in an Azure AI Search index. Only provided fields will be updated.",
  MergeDocumentsSchema.shape,
  async (params) => {
    try {
      const result = await mergeDocuments(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error merging documents: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "delete-documents",
  "Delete documents from an Azure AI Search index by their key values.",
  DeleteDocumentsSchema.shape,
  async (params) => {
    try {
      const result = await deleteDocuments(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting documents: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register vector and semantic search tools (Phase 4)
server.tool(
  "vector-search",
  "Perform pure vector similarity search using k-nearest neighbors on vector fields in Azure AI Search",
  VectorSearchSchema.shape,
  async (params) => {
    try {
      const result = await vectorSearch(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error in vector search: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "hybrid-search",
  "Perform hybrid search combining traditional text search with vector similarity search for enhanced relevance",
  HybridSearchSchema.shape,
  async (params) => {
    try {
      const result = await hybridSearch(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error in hybrid search: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "semantic-search",
  "Perform semantic search using Azure AI Search semantic capabilities with answers and captions",
  SemanticSearchSchema.shape,
  async (params) => {
    try {
      const result = await semanticSearch(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error in semantic search: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start the server
async function main() {
  // Register dynamic resources for discovered indexes
  const searchTools = getAzureSearchTools();
  const indexResourceManager = new AzureSearchIndexResources(server, searchTools);
  await indexResourceManager.registerDynamicResources();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Azure AI Search MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
