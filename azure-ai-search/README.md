# Azure AI Search MCP Server

[![npm version](https://badge.fury.io/js/%40ignitionai%2Fazure-ai-search-mcp.svg)](https://badge.fury.io/js/%40ignitionai%2Fazure-ai-search-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive Model Context Protocol (MCP) server for Azure AI Search with advanced capabilities including vector search, semantic search, and document management.

## 🚀 Features

### Core Search Capabilities
- **Full-text search** with highlighting, filtering, and faceting
- **Vector search** using k-nearest neighbors for similarity matching
- **Hybrid search** combining text and vector search for optimal relevance
- **Semantic search** with Azure AI's natural language understanding
- **Auto-completion** and **search suggestions**

### Document Management
- **Batch document operations** (upload, merge, delete) up to 1000 documents
- **Schema validation** with comprehensive error handling
- **Index discovery** and dynamic resource registration

### Advanced Features
- **Semantic answers** extraction from search results
- **Semantic captions** with highlighting
- **Dynamic index discovery** and resource registration
- **Dual authentication** (API key + Managed Identity)
- **Comprehensive error handling** and logging

## 📦 Installation

```bash
npm install @ignitionai/azure-ai-search-mcp
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
AZURE_SEARCH_ENDPOINT=https://your-service.search.windows.net

# Authentication (choose one)
AZURE_SEARCH_API_KEY=your-api-key
# OR use Managed Identity (no API key needed)
```

### Claude Desktop Configuration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "azure-ai-search": {
      "command": "npx",
      "args": ["@ignitionai/azure-ai-search-mcp"],
      "env": {
        "AZURE_SEARCH_ENDPOINT": "https://your-service.search.windows.net",
        "AZURE_SEARCH_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 🛠️ Available Tools

### Search Tools
- **`search-documents`** - Full-text search with comprehensive filtering options
- **`get-document`** - Retrieve specific documents by key
- **`suggest`** - Get search suggestions using configured suggesters
- **`autocomplete`** - Auto-complete partial search terms

### Vector & Semantic Search
- **`vector-search`** - Pure vector similarity search using k-nearest neighbors
- **`hybrid-search`** - Combined text and vector search for enhanced relevance  
- **`semantic-search`** - Azure AI semantic search with natural language understanding

### Index Management
- **`list-indexes`** - List all available search indexes
- **`get-index-schema`** - Get complete index schema and field definitions
- **`get-index-statistics`** - Get index usage statistics and document counts

### Document Management
- **`upload-documents`** - Upload/create documents (batch operations up to 1000)
- **`merge-documents`** - Partial update of existing documents
- **`delete-documents`** - Delete documents by key values (batch operations)

## 📝 Usage Examples

### Basic Search
```json
{
  "tool": "search-documents",
  "arguments": {
    "indexName": "my-index",
    "searchText": "machine learning",
    "top": 10,
    "highlightFields": ["content", "title"]
  }
}
```

### Vector Search
```json
{
  "tool": "vector-search", 
  "arguments": {
    "indexName": "my-index",
    "vectorQueries": [{
      "vector": [0.1, 0.2, 0.3, ...],
      "fields": "content_vector",
      "k": 5
    }]
  }
}
```

### Semantic Search with Answers
```json
{
  "tool": "semantic-search",
  "arguments": {
    "indexName": "my-index", 
    "searchText": "How does machine learning work?",
    "semanticConfiguration": "my-semantic-config",
    "answers": {
      "count": 3,
      "threshold": 0.7
    }
  }
}
```

### Document Upload
```json
{
  "tool": "upload-documents",
  "arguments": {
    "indexName": "my-index",
    "documents": [
      {
        "id": "1",
        "title": "Document Title",
        "content": "Document content..."
      }
    ]
  }
}
```

## 🏗️ Architecture

### Core Components
- **server.ts** - Main MCP server with tool registration
- **lib/azure-search-client.ts** - Azure Search client wrapper
- **tools/** - Individual tool implementations
- **resources/** - Dynamic resource registration
- **types.ts** - Zod schemas for validation

### Key Patterns
- **Lazy Loading** - Azure Search clients instantiated on demand
- **Client Caching** - Search clients cached per index
- **Type Safety** - All parameters validated with Zod schemas
- **Error Handling** - Consistent success/error response format

## 🎯 Use Cases

### RAG Applications
- **Knowledge retrieval** with semantic understanding
- **Hybrid search** for optimal relevance scoring
- **Document management** for knowledge base updates

### Content Discovery
- **Vector similarity** for related content recommendations
- **Semantic answers** for Q&A applications
- **Auto-completion** for search interfaces

### Enterprise Search
- **Multi-modal search** across text and vector content
- **Advanced filtering** and faceted navigation
- **Batch operations** for data management

## 🔍 Requirements

- **Node.js** >= 18.0.0
- **Azure AI Search** service
- **Azure credentials** (API key or Managed Identity)

## 📚 Documentation

- [Full Documentation](https://github.com/IgnitionAI/azure-ai-search-mcp)
- [Azure AI Search Documentation](https://docs.microsoft.com/en-us/azure/search/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🏢 About IgnitionAI

This MCP server is developed and maintained by [IgnitionAI](https://ignitionai.dev), focusing on AI-powered search and knowledge management solutions.

---

**Made with ❤️ for the Claude MCP ecosystem**