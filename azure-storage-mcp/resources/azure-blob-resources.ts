import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AzureBlobTools } from "../tools/azure-blob-tools.js";

export class AzureBlobResources {
  private server: McpServer;
  private azureBlobTools: AzureBlobTools;

  constructor(server: McpServer, azureBlobTools: AzureBlobTools) {
    this.server = server;
    this.azureBlobTools = azureBlobTools;
  }

  async registerDynamicResources() {
    try {
      const containersResult = await this.azureBlobTools.listContainers();
      
      if (containersResult.success && containersResult.data) {
        // Pour chaque container découvert, créer des ressources
        for (const container of containersResult.data.containers) {
          // Ressource pour le container (liste des blobs)
          this.server.resource(
            `container-${container.name}`,
            `azure-blob://${container.name}`,
            {
              description: `Container Azure Blob Storage: ${container.name}`,
              mimeType: "application/json"
            },
            async () => {
              try {
                const result = await this.azureBlobTools.listBlobs(container.name);

                if (result.success) {
                  return {
                    contents: [
                      {
                        uri: `azure-blob://${container.name}`,
                        mimeType: "application/json",
                        text: JSON.stringify(result.data, null, 2)
                      }
                    ]
                  };
                } else {
                  return {
                    contents: [
                      {
                        uri: `azure-blob://${container.name}`,
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
                      uri: `azure-blob://${container.name}`,
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

          // Ressource template pour accès aux blobs individuels
          this.server.resource(
            `blob-${container.name}`,
            `azure-blob://${container.name}/{blobName}`,
            {
              description: `Blob dans le container ${container.name}`,
              mimeType: "application/octet-stream"
            },
            async (request: any) => {
              try {
                const blobName = request.params?.blobName;
                if (!blobName) {
                  return {
                    contents: [
                      {
                        uri: `azure-blob://${container.name}/${blobName || 'unknown'}`,
                        mimeType: "application/json",
                        text: JSON.stringify({ error: "blobName requis" }, null, 2)
                      }
                    ]
                  };
                }

                const result = await this.azureBlobTools.downloadBlob(container.name, blobName);

                if (result.success && result.data) {
                  return {
                    contents: [
                      {
                        uri: `azure-blob://${container.name}/${blobName}`,
                        mimeType: result.data.contentType || "application/octet-stream",
                        text: result.data.content
                      }
                    ]
                  };
                } else {
                  return {
                    contents: [
                      {
                        uri: `azure-blob://${container.name}/${blobName}`,
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
                      uri: `azure-blob://${container.name}/error`,
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

          // Ressource template pour blobs filtrés par préfixe
          this.server.resource(
            `blob-prefix-${container.name}`,
            `azure-blob://${container.name}/prefix/{prefix}`,
            {
              description: `Blobs dans ${container.name} avec préfixe`,
              mimeType: "application/json"
            },
            async (request: any) => {
              try {
                const prefix = request.params?.prefix;
                if (!prefix) {
                  return {
                    contents: [
                      {
                        uri: `azure-blob://${container.name}/prefix/${prefix || 'unknown'}`,
                        mimeType: "application/json",
                        text: JSON.stringify({ error: "prefix requis" }, null, 2)
                      }
                    ]
                  };
                }

                const result = await this.azureBlobTools.listBlobs(container.name, prefix);

                if (result.success) {
                  return {
                    contents: [
                      {
                        uri: `azure-blob://${container.name}/prefix/${prefix}`,
                        mimeType: "application/json",
                        text: JSON.stringify(result.data, null, 2)
                      }
                    ]
                  };
                } else {
                  return {
                    contents: [
                      {
                        uri: `azure-blob://${container.name}/prefix/${prefix}`,
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
                      uri: `azure-blob://${container.name}/prefix/error`,
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
      console.error("Erreur lors de l'enregistrement des ressources blob dynamiques:", error);
    }
  }
}