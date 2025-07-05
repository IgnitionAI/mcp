# Azure Storage MCP Server

[![npm version](https://badge.fury.io/js/@ignitionai%2Fazure-storage-mcp.svg)](https://badge.fury.io/js/@ignitionai%2Fazure-storage-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for Azure Storage services, providing complete integration with Azure Table Storage, Azure Blob Storage, and Azure Service Bus Queues. Features include CRUD operations, batch processing, schema validation, advanced querying, container management, blob operations, and asynchronous workflow orchestration.

## Features

### 🔥 **Core Operations**
- **Complete CRUD**: Create, Read, Update, Delete entities
- **Batch Processing**: Handle up to 100 entities per operation
- **Table Management**: Create and delete tables
- **Advanced Querying**: OData filters, pagination, sorting
- **Container Management**: Create, list, and delete blob containers
- **Blob Operations**: Upload, download, list, and delete blobs
- **Queue Management**: Create, list, and delete Service Bus queues
- **Message Operations**: Send, receive, and peek queue messages

### 🛡️ **Data Integrity**
- **Schema Validation**: Automatic inference and validation against existing data
- **Type Safety**: Comprehensive Zod validation for all Azure Storage services
- **Error Handling**: Detailed error messages with actionable suggestions
- **Content Type Detection**: Automatic MIME type detection for blob uploads

### ⚡ **Performance & Reliability**
- **Efficient Batching**: Automatic grouping by PartitionKey
- **Resource Discovery**: Dynamic table, container, and queue discovery
- **Connection Flexibility**: Support for connection strings and managed identity
- **Asynchronous Processing**: Queue-based workflows for long-running tasks
- **Lazy Loading**: Service clients instantiated only when needed

## Installation

```bash
npm install -g @ignitionai/azure-storage-mcp
```

## Quick Start

### 1. Configure Authentication

**Add your Connection String**
```bash
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
```

**Add your storage account name**
```bash
AZURE_STORAGE_ACCOUNT_NAME="your-storage-account"
```

**Add your Service Bus connection (for queues)**
```bash
AZURE_SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=...;SharedAccessKey=..."
# OR
AZURE_SERVICE_BUS_NAMESPACE="your-namespace"
```

### 2. Add to Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
     "azure-storage": {
      "command": "npx",
      "args": [
        "-y",
        "@ignitionai/azure-storage-mcp"
      ],
      "env": {
        "AZURE_STORAGE_CONNECTION_STRING": "YOUR_CONNECTION_STRING",
        "AZURE_STORAGE_ACCOUNT_NAME": "YOUR_ACCOUNT_NAME",
        "AZURE_SERVICE_BUS_CONNECTION_STRING": "YOUR_SERVICE_BUS_CONNECTION_STRING"
      }
    }
}
```

### 3. Start Using with Claude

The server will automatically discover your tables, containers, and queues, providing 28 powerful tools:

## Available Tools

### 📝 **Entity Operations**
- `create-azure-table-entity` - Create a single entity
- `update-azure-table-entity` - Update entity (merge/replace modes)
- `delete-azure-table-entity` - Delete a single entity
- `check-azure-table-entity-exists` - Verify entity existence

### 📦 **Batch Operations**
- `batch-create-azure-table-entities` - Create up to 100 entities
- `batch-update-azure-table-entities` - Update up to 100 entities  
- `batch-delete-azure-table-entities` - Delete up to 100 entities

### 🗄️ **Table Management**
- `create-azure-table` - Create new tables
- `delete-azure-table` - Delete tables (⚠️ irreversible)
- `list-azure-tables` - List all available tables

### 🔍 **Data Discovery**
- `read-azure-table` - Read with OData filters
- `query-azure-table-advanced` - Advanced queries with pagination and sorting
- `inspect-azure-table-schema` - Analyze existing data structure

### 📦 **Container Operations**
- `create-blob-container` - Create new blob containers
- `list-blob-containers` - List all containers
- `delete-blob-container` - Delete containers
- `get-container-properties` - Get container metadata

### 🗃️ **Blob Operations**
- `upload-blob` - Upload files to blob storage
- `download-blob` - Download blobs with metadata
- `read-azure-blob` - Read blob content as text
- `list-blobs` - List blobs in container
- `delete-blob` - Delete individual blobs
- `get-blob-properties` - Get blob metadata

### 🚀 **Queue Operations**
- `send-queue-message` - Send messages to queues
- `receive-queue-message` - Receive and process messages
- `peek-queue-message` - Preview messages without consuming
- `create-azure-queue` - Create new Service Bus queues
- `list-azure-queues` - List all available queues
- `delete-azure-queue` - Delete queues
- `get-azure-queue-properties` - Get queue metadata and stats

## Usage Examples

### Table Storage

#### Creating Entities

```typescript
// Claude will automatically validate against existing schema
await createEntity({
  tableName: "Users",
  partitionKey: "Department_IT", 
  rowKey: "user_001",
  entity: {
    name: "John Doe",
    email: "john@company.com",
    age: 30,
    active: true
  }
})
```

### Batch Operations

```typescript
// Create multiple users efficiently
await batchCreateEntities({
  tableName: "Users",
  entities: [
    {
      partitionKey: "Department_IT",
      rowKey: "user_002", 
      entity: { name: "Jane Smith", age: 28 }
    },
    {
      partitionKey: "Department_IT", 
      rowKey: "user_003",
      entity: { name: "Bob Wilson", age: 35 }
    }
  ]
})
```

### Advanced Queries

```typescript
// Query with filtering, sorting, and pagination
await queryTableAdvanced({
  tableName: "Users",
  filter: "age gt 25 and active eq true",
  orderBy: ["age desc", "name asc"],
  top: 50,
  skip: 0
})
```

### Schema Analysis

```typescript
// Understand existing data structure
await inspectTableSchema({
  tableName: "Users",
  sampleSize: 20
})
```

### Blob Storage

#### Uploading Files

```typescript
// Upload a file to blob storage
await uploadBlob({
  containerName: "documents",
  blobName: "report-2024.pdf",
  content: "<file content>",
  contentType: "application/pdf",
  overwrite: true
})
```

#### Managing Containers

```typescript
// Create a new container
await createContainer({
  containerName: "project-assets",
  publicAccess: "none",
  metadata: {
    project: "webapp-redesign",
    environment: "production"
  }
})
```

### Queue Storage

#### Asynchronous Task Processing

```typescript
// Send a long-running task to a queue
await sendQueueMessage({
  queueName: "data-processing",
  messageBody: JSON.stringify({
    operation: "analyze-sales-data",
    dataset: "sales-2024-q4.csv",
    filters: ["region=NA", "product=software"]
  }),
  correlationId: "analysis-session-123"
})

// Later, check for results
await peekQueueMessage({
  queueName: "analysis-results",
  maxMessageCount: 1
})
```

## Schema Validation

The server automatically analyzes existing data to ensure new entries conform to established patterns:

- **Required Properties**: Detected from 80%+ presence in existing data
- **Type Validation**: Ensures consistent data types across entities
- **Azure Constraints**: Validates PartitionKey/RowKey format, property limits
- **Helpful Warnings**: Suggests missing properties or type mismatches

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_STORAGE_CONNECTION_STRING` | Storage account connection string | One of these |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name (for managed identity) | One of these |
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | Service Bus connection string | One of these |
| `AZURE_SERVICE_BUS_NAMESPACE` | Service Bus namespace (for managed identity) | One of these |

### Azure Storage Limits

The server enforces Azure Storage constraints:

**Table Storage:**
- **Entity Size**: Max 252 properties per entity
- **Property Size**: Max 64KB for string/binary values
- **Batch Size**: Max 100 entities per batch operation
- **Key Format**: PartitionKey/RowKey cannot contain `/`, `\\`, `#`, `?`

**Blob Storage:**
- **Blob Size**: Max 200GB per blob (block blobs)
- **Container Names**: 3-63 characters, lowercase letters, numbers, hyphens
- **Blob Names**: Max 1024 characters

**Service Bus Queues:**
- **Message Size**: Max 256KB (Standard), 1MB (Premium)
- **Queue Size**: Max 80GB
- **Message TTL**: Max 14 days

## Dynamic Resources

All Azure Storage resources are automatically discovered and exposed as MCP resources:

**Tables:**
- `azure-table://{tableName}` - Full table data
- `azure-table://{tableName}/{partitionKey}` - Filtered by partition

**Blob Containers:**
- `azure-blob://{containerName}` - Container contents
- `azure-blob://{containerName}/{blobName}` - Individual blob

**Service Bus Queues:**
- `azure-queue://{queueName}` - Queue properties and messages

## Development

### Building from Source

```bash
git clone https://github.com/IgnitionAI/azure-storage-mcp.git
cd azure-storage-mcp
pnpm install
pnpm build
```

### Testing

```bash
# Test the built server
pnpm start:prod

# Use MCP Inspector for debugging
pnpm inspect
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/IgnitionAI/azure-storage-mcp)
- 🐛 [Issue Tracker](https://github.com/IgnitionAI/azure-storage-mcp/issues)
- 💬 [Discussions](https://github.com/IgnitionAI/azure-storage-mcp/discussions)

---

Built with ❤️ by [IgnitionAI](https://ignitionai.dev) for the MCP ecosystem.