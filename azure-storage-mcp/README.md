# Azure Storage MCP Server

[![npm version](https://badge.fury.io/js/@ignitionai%2Fazure-storage-mcp.svg)](https://badge.fury.io/js/@ignitionai%2Fazure-storage-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for Azure Table Storage, providing complete CRUD operations, batch processing, schema validation, and advanced querying capabilities.

## Features

### 🔥 **Core Operations**
- **Complete CRUD**: Create, Read, Update, Delete entities
- **Batch Processing**: Handle up to 100 entities per operation
- **Table Management**: Create and delete tables
- **Advanced Querying**: OData filters, pagination, sorting

### 🛡️ **Data Integrity**
- **Schema Validation**: Automatic inference and validation against existing data
- **Type Safety**: Comprehensive Zod validation for Azure Table Storage constraints
- **Error Handling**: Detailed error messages with actionable suggestions

### ⚡ **Performance & Reliability**
- **Efficient Batching**: Automatic grouping by PartitionKey
- **Resource Discovery**: Dynamic table and entity discovery
- **Connection Flexibility**: Support for connection strings and managed identity

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
        "AZURE_STORAGE_ACCOUNT_NAME": "YOUR_ACCOUNT_NAME"
      }
    }
}
```

### 3. Start Using with Claude

The server will automatically discover your tables and provide 13 powerful tools:

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

## Usage Examples

### Creating Entities

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
| `AZURE_STORAGE_CONNECTION_STRING` | Full connection string | One of these |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name (for managed identity) | One of these |

### Azure Table Storage Limits

The server enforces Azure Table Storage constraints:
- **Entity Size**: Max 252 properties per entity
- **Property Size**: Max 64KB for string/binary values
- **Batch Size**: Max 100 entities per batch operation
- **Key Format**: PartitionKey/RowKey cannot contain `/`, `\\`, `#`, `?`

## Dynamic Resources

Tables are automatically discovered and exposed as MCP resources:

- `azure-table://{tableName}` - Full table data
- `azure-table://{tableName}/{partitionKey}` - Filtered by partition

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