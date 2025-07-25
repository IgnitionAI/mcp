# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `pnpm build` - Compiles TypeScript to JavaScript using Rollup
- **Start Development**: `pnpm start` - Runs the server directly with ts-node
- **Start Production**: `pnpm start:prod` - Runs the built server from dist/
- **Inspect**: `pnpm inspect` - Runs the MCP inspector for debugging

## Architecture Overview

This is an MCP (Model Context Protocol) server that provides Azure AI Search integration. Currently implements Phase 1 of the roadmap focusing on document retrieval and search functionality.

### Current Implementation Status

** Phase 1.1 - Configuration & Authentication**
- Azure Search Documents SDK integrated (`@azure/search-documents`)
- Dual authentication support (API key + Managed Identity)
- Environment variables: `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_API_KEY`

** Phase 1.2 - Core Search Tools (Retrieval)**
- `search-documents` - Full-text search with filtering, faceting, highlighting
- `get-document` - Retrieve specific document by key
- `suggest` - Search suggestions using configured suggesters  
- `autocomplete` - Auto-completion for partial search terms

**✅ Phase 2.1 - Index Management & Discovery**
- `list-indexes` - List all available search indexes
- `get-index-schema` - Get complete index schema and field definitions
- `get-index-statistics` - Get index usage statistics and document counts

**✅ Phase 2.2 - Dynamic Resources**
- Auto-discovery of available indexes at startup
- Dynamic resources for each index: schema, statistics, sample documents
- Resource URIs: `azure-search://indexes`, `azure-search://index/{name}/schema`, etc.

**✅ Phase 3.1 - Document Management (COMPLETE)**
- `upload-documents` - Upload/create documents (batch operations up to 1000)
- `merge-documents` - Partial update of existing documents
- `delete-documents` - Delete documents by key values (batch operations)

**✅ Phase 4.1 - Vector Search (COMPLETE)**
- `vector-search` - Pure vector similarity search using k-nearest neighbors
- `hybrid-search` - Combined text and vector search for enhanced relevance
- Support for multiple vector queries and exhaustive search modes

**✅ Phase 4.2 - Semantic Search (COMPLETE)**
- `semantic-search` - Azure AI semantic search with natural language understanding
- Semantic answers extraction from search results
- Semantic captions with highlighting support
- Integration with Azure's semantic configurations

### Core Components

- **server.ts** - Main MCP server entry point with tool registration
- **lib/azure-search-client.ts** - Azure Search client wrapper with error handling
- **tools/search-tools.ts** - Search tool implementations with validation
- **tools/index-tools.ts** - Index management tool implementations
- **resources/index-resources.ts** - Dynamic resource registration for discovered indexes
- **types.ts** - Zod schemas for Azure AI Search parameters and responses

### Key Architecture Patterns

1. **Lazy Loading**: Azure Search clients instantiated only when first accessed
2. **Client Caching**: Search clients cached per index name for efficiency
3. **Dual Authentication**: Supports both API key and DefaultAzureCredential
4. **Type Safety**: All parameters validated with Zod schemas
5. **Error Handling**: Consistent success/error response format

### Configuration

#### Environment Variables
```env
AZURE_SEARCH_ENDPOINT=https://your-service.search.windows.net
AZURE_SEARCH_API_KEY=your-api-key
```

#### Alternative: Managed Identity
```env
AZURE_SEARCH_ENDPOINT=https://your-service.search.windows.net
# No API key needed - uses DefaultAzureCredential
```

### Available Tools

#### Core Search Tools
- **search-documents** - Full-text search with filtering, faceting, highlighting
- **get-document** - Retrieve specific document by primary key  
- **suggest** - Search suggestions using configured suggester with fuzzy matching
- **autocomplete** - Auto-complete partial search terms with multiple modes

#### Index Management Tools  
- **list-indexes** - List all available search indexes
- **get-index-schema** - Get complete index schema and field definitions
- **get-index-statistics** - Get index usage statistics and document counts

#### Document Management Tools
- **upload-documents** - Upload/create documents (batch operations up to 1000)
- **merge-documents** - Partial update of existing documents  
- **delete-documents** - Delete documents by key values (batch operations)

#### Vector Search Tools (Phase 4)
- **vector-search** - Pure vector similarity search using k-nearest neighbors
- **hybrid-search** - Combined text and vector search for enhanced relevance

#### Semantic Search Tools (Phase 4)  
- **semantic-search** - Azure AI semantic search with natural language understanding

### Build System

Uses Rollup with TypeScript compilation. External dependencies are not bundled to reduce size. Some TypeScript warnings exist but don't affect functionality.

### Next Steps (Roadmap)

See `ROADMAP.md` for complete implementation plan:
- ✅ **Phase 1**: Core search and retrieval (COMPLETE)
- ✅ **Phase 2**: Index management and discovery (COMPLETE)
- ✅ **Phase 3**: Document upload/management (COMPLETE) 
- ✅ **Phase 4**: Vector and semantic search (COMPLETE)
- 🎯 **Phase 5**: Advanced index operations (create/update/delete indexes)
- 📊 **Phase 6**: Analytics and performance monitoring