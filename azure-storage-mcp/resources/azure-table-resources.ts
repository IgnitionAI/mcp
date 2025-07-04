import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AzureTableTools } from "../tools/azure-table-tools.js";

export class AzureTableResources {
  private server: McpServer;
  private azureTableTools: AzureTableTools;

  constructor(server: McpServer, azureTableTools: AzureTableTools) {
    this.server = server;
    this.azureTableTools = azureTableTools;
  }

  async registerDynamicResources() {
    try {
      const tablesResult = await this.azureTableTools.listTables();
      
      if (tablesResult.success && tablesResult.data) {
        // Pour chaque table découverte, créer une ressource
        for (const tableName of tablesResult.data) {
          // Ressource pour la table complète
          this.server.resource(
            tableName,
            `azure-table://${tableName}`,
            {
              description: `Table Azure Storage: ${tableName}`,
              mimeType: "application/json"
            },
            async () => {
              try {
                const result = await this.azureTableTools.readTable({
                  tableName: tableName,
                  maxResults: 100,
                });

                if (result.success) {
                  return {
                    contents: [
                      {
                        uri: `azure-table://${tableName}`,
                        mimeType: "application/json",
                        text: JSON.stringify(result.data, null, 2)
                      }
                    ]
                  };
                } else {
                  return {
                    contents: [
                      {
                        uri: `azure-table://${tableName}`,
                        mimeType: "application/json",
                        text: JSON.stringify({ error: result.error }, null, 2)
                      }
                    ]
                  };
                }
              } catch (error) {
                return {
                  contents: [
                    {
                      uri: `azure-table://${tableName}`,
                      mimeType: "application/json",
                      text: JSON.stringify(
                        { error: error instanceof Error ? error.message : "Erreur inconnue" },
                        null,
                        2
                      )
                    }
                  ]
                };
              }
            }
          );

          // Ressource template pour filtrage par PartitionKey
          this.server.resource(
            `${tableName}-filtered`,
            `azure-table://${tableName}/{partitionKey}`,
            {
              description: `Table ${tableName} filtrée par PartitionKey`,
              mimeType: "application/json"
            },
            async (request: any) => {
              try {
                const partitionKey = request.params?.partitionKey;
                if (!partitionKey) {
                  return {
                    contents: [
                      {
                        uri: `azure-table://${tableName}/${partitionKey || 'unknown'}`,
                        mimeType: "application/json",
                        text: JSON.stringify({ error: "partitionKey requis" }, null, 2)
                      }
                    ]
                  };
                }

                const result = await this.azureTableTools.readTable({
                  tableName: tableName,
                  filter: `PartitionKey eq '${partitionKey}'`,
                  maxResults: 100,
                });

                if (result.success) {
                  return {
                    contents: [
                      {
                        uri: `azure-table://${tableName}/${partitionKey}`,
                        mimeType: "application/json",
                        text: JSON.stringify(result.data, null, 2)
                      }
                    ]
                  };
                } else {
                  return {
                    contents: [
                      {
                        uri: `azure-table://${tableName}/${partitionKey}`,
                        mimeType: "application/json",
                        text: JSON.stringify({ error: result.error }, null, 2)
                      }
                    ]
                  };
                }
              } catch (error) {
                return {
                  contents: [
                    {
                      uri: `azure-table://${tableName}/error`,
                      mimeType: "application/json",
                      text: JSON.stringify(
                        { error: error instanceof Error ? error.message : "Erreur inconnue" },
                        null,
                        2
                      )
                    }
                  ]
                };
              }
            }
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des ressources dynamiques:", error);
    }
  }
}