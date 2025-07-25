import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAzureSearchTools } from "../tools/search-tools.js";

export class AzureSearchIndexResources {
  constructor(
    private server: McpServer,
    private searchTools: ReturnType<typeof getAzureSearchTools>
  ) {}

  async registerDynamicResources() {
    try {
      // Get list of available indexes
      const indexesResult = await this.searchTools.listIndexes();
      
      if (!indexesResult.success || !indexesResult.data) {
        console.error("Failed to fetch indexes for resource registration:", indexesResult.error);
        return;
      }

      const indexes = indexesResult.data;
      console.error(`Registering resources for ${indexes.length} indexes`);
      
      // Register a resource for the indexes list
      this.server.resource(
        "indexes-list",
        new ResourceTemplate("azure-search://indexes", { list: undefined }),
        async () => ({
          contents: [
            {
              type: "text",
              text: JSON.stringify(indexes, null, 2),
            },
          ],
        })
      );

      // Register individual index resources
      for (const index of indexes) {
        const indexName = index.name;
        
        // Resource for index schema
        this.server.resource(
          `index-schema-${indexName}`,
          new ResourceTemplate(`azure-search://index/${indexName}/schema`, { list: undefined }),
          async () => {
            const schemaResult = await this.searchTools.getIndex(indexName);
            return {
              contents: [
                {
                  type: "text",
                  text: JSON.stringify(schemaResult, null, 2),
                },
              ],
            };
          }
        );

        // Resource for index statistics
        this.server.resource(
          `index-stats-${indexName}`,
          new ResourceTemplate(`azure-search://index/${indexName}/statistics`, { list: undefined }),
          async () => {
            const statsResult = await this.searchTools.getIndexStatistics(indexName);
            return {
              contents: [
                {
                  type: "text",
                  text: JSON.stringify(statsResult, null, 2),
                },
              ],
            };
          }
        );

        // Resource for sample documents from the index
        this.server.resource(
          `index-sample-${indexName}`,
          new ResourceTemplate(`azure-search://index/${indexName}/sample`, { list: undefined }),
          async () => {
            const searchResult = await this.searchTools.searchDocuments({
              indexName,
              searchText: "*",
              top: 5, // Get first 5 documents as sample
            });
            return {
              contents: [
                {
                  type: "text",
                  text: JSON.stringify(searchResult, null, 2),
                },
              ],
            };
          }
        );
      }

      console.error(`Successfully registered ${indexes.length * 3 + 1} resources`);
      
    } catch (error) {
      console.error("Error registering dynamic resources:", error);
    }
  }
}