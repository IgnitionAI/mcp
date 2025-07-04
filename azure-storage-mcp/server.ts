#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { AzureTableTools } from "./tools/azure-table-tools.js";
import { AzureTableResources } from "./resources/azure-table-resources.js";

dotenv.config();

// Create server instance
const server = new McpServer({
  name: "AzureStorageMCP",
  version: "1.0.1",
  description: "Serveur MCP pour interagir avec Azure Storage"
});

// Initialisation des outils Azure Table (lazy loading)
let azureTableTools: AzureTableTools | null = null;

function getAzureTableTools(): AzureTableTools {
  if (!azureTableTools) {
    azureTableTools = new AzureTableTools();
  }
  return azureTableTools;
}

// Register Azure Table tools
server.tool(
  "read-azure-table",
  "Lire les données d'une table Azure Storage",
  {
    tableName: z.string().describe("Nom de la table Azure à lire"),
    filter: z.string().optional().describe("Filtre OData pour les entités (ex: 'PartitionKey eq \"partition1\"')"),
    select: z.array(z.string()).optional().describe("Colonnes à sélectionner"),
    maxResults: z.number().optional().describe("Nombre maximum d'entités à retourner"),
  },
  async ({ tableName, filter, select, maxResults }) => {
    try {
      const result = await getAzureTableTools().readTable({
        tableName,
        filter,
        select,
        maxResults,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erreur lors de la lecture de la table: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "list-azure-tables",
  "Lister toutes les tables Azure Storage disponibles",
  {},
  async () => {
    try {
      const result = await getAzureTableTools().listTables();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erreur lors de la liste des tables: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "create-azure-table-entity",
  "Créer une nouvelle entité dans une table Azure Storage. IMPORTANT: Les données doivent respecter les contraintes Azure Table Storage : types autorisés (string ≤64KB, number, boolean, date, binary ≤64KB, null), max 252 propriétés, pas de propriétés réservées (PartitionKey, RowKey, Timestamp, ETag). Exemple: {\"name\": \"John\", \"age\": 30, \"active\": true}",
  {
    tableName: z.string().describe("Nom de la table Azure (3-63 caractères, lettres/chiffres uniquement)"),
    partitionKey: z.string().describe("Clé de partition (1-1024 caractères, sans /, \\, #, ?)"),
    rowKey: z.string().describe("Clé de ligne (1-1024 caractères, sans /, \\, #, ?)"),
    entity: z.record(z.any()).describe("Données de l'entité (max 252 propriétés, types: string≤64KB/number/boolean/date/binary≤64KB/null)"),
  },
  async ({ tableName, partitionKey, rowKey, entity }) => {
    try {
      const result = await getAzureTableTools().createEntity({
        tableName,
        partitionKey,
        rowKey,
        entity,
      });

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
            text: `Erreur lors de la création de l'entité: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "update-azure-table-entity",
  "Mettre à jour une entité dans une table Azure Storage. Mode 'merge' (défaut): fusionne avec l'existant. Mode 'replace': remplace complètement. IMPORTANT: Respecter les contraintes Azure Table Storage (types, 252 propriétés max, pas de propriétés réservées).",
  {
    tableName: z.string().describe("Nom de la table Azure (3-63 caractères, lettres/chiffres uniquement)"),
    partitionKey: z.string().describe("Clé de partition (1-1024 caractères, sans /, \\, #, ?)"),
    rowKey: z.string().describe("Clé de ligne (1-1024 caractères, sans /, \\, #, ?)"),
    entity: z.record(z.any()).describe("Données de l'entité (max 252 propriétés, types: string≤64KB/number/boolean/date/binary≤64KB/null)"),
    mode: z.enum(["merge", "replace"]).optional().default("merge").describe("Mode : 'merge' fusionne, 'replace' remplace tout"),
  },
  async ({ tableName, partitionKey, rowKey, entity, mode }) => {
    try {
      const result = await getAzureTableTools().updateEntity({
        tableName,
        partitionKey,
        rowKey,
        entity,
        mode,
      });

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
            text: `Erreur lors de la mise à jour de l'entité: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "delete-azure-table-entity",
  "Supprimer une entité dans une table Azure Storage",
  {
    tableName: z.string().describe("Nom de la table Azure"),
    partitionKey: z.string().describe("Clé de partition de l'entité"),
    rowKey: z.string().describe("Clé de ligne de l'entité"),
  },
  async ({ tableName, partitionKey, rowKey }) => {
    try {
      const result = await getAzureTableTools().deleteEntity({
        tableName,
        partitionKey,
        rowKey,
      });

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
            text: `Erreur lors de la suppression de l'entité: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "inspect-azure-table-schema",
  "Analyser le schéma d'une table Azure Storage en examinant les entités existantes. Retourne les propriétés communes, types de données, fréquence et exemples pour aider le LLM à respecter la structure existante.",
  {
    tableName: z.string().describe("Nom de la table Azure à analyser"),
    sampleSize: z.number().optional().default(20).describe("Nombre d'entités à examiner pour l'analyse (défaut: 20)"),
  },
  async ({ tableName, sampleSize }) => {
    try {
      const result = await getAzureTableTools().inferTableSchema(tableName, sampleSize);

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
            text: `Erreur lors de l'analyse du schéma: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "batch-create-azure-table-entities",
  "Créer plusieurs entités en une seule opération batch (jusqu'à 100 entités). Les entités sont groupées automatiquement par PartitionKey. Plus efficace que des créations individuelles.",
  {
    tableName: z.string().describe("Nom de la table Azure"),
    entities: z.array(z.object({
      partitionKey: z.string().describe("Clé de partition de l'entité"),
      rowKey: z.string().describe("Clé de ligne de l'entité"),
      entity: z.record(z.any()).describe("Données de l'entité")
    })).min(1).max(100).describe("Liste des entités à créer (1-100)"),
  },
  async ({ tableName, entities }) => {
    try {
      const result = await getAzureTableTools().batchCreateEntities({
        tableName,
        entities,
      });

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
            text: `Erreur lors de la création batch: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "batch-update-azure-table-entities",
  "Mettre à jour plusieurs entités en une seule opération batch (jusqu'à 100 entités). Les entités sont groupées automatiquement par PartitionKey.",
  {
    tableName: z.string().describe("Nom de la table Azure"),
    entities: z.array(z.object({
      partitionKey: z.string().describe("Clé de partition de l'entité"),
      rowKey: z.string().describe("Clé de ligne de l'entité"),
      entity: z.record(z.any()).describe("Données de l'entité"),
      mode: z.enum(["merge", "replace"]).optional().default("merge").describe("Mode de mise à jour")
    })).min(1).max(100).describe("Liste des entités à mettre à jour (1-100)"),
  },
  async ({ tableName, entities }) => {
    try {
      const result = await getAzureTableTools().batchUpdateEntities({
        tableName,
        entities,
      });

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
            text: `Erreur lors de la mise à jour batch: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "batch-delete-azure-table-entities",
  "Supprimer plusieurs entités en une seule opération batch (jusqu'à 100 entités). Les entités sont groupées automatiquement par PartitionKey.",
  {
    tableName: z.string().describe("Nom de la table Azure"),
    entities: z.array(z.object({
      partitionKey: z.string().describe("Clé de partition de l'entité"),
      rowKey: z.string().describe("Clé de ligne de l'entité")
    })).min(1).max(100).describe("Liste des entités à supprimer (1-100)"),
  },
  async ({ tableName, entities }) => {
    try {
      const result = await getAzureTableTools().batchDeleteEntities({
        tableName,
        entities,
      });

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
            text: `Erreur lors de la suppression batch: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "create-azure-table",
  "Créer une nouvelle table Azure Storage. Le nom doit être unique dans le compte de stockage et respecter les conventions Azure.",
  {
    tableName: z.string().describe("Nom de la table Azure à créer (3-63 caractères, lettres/chiffres uniquement)"),
  },
  async ({ tableName }) => {
    try {
      const result = await getAzureTableTools().createTable({
        tableName,
      });

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
            text: `Erreur lors de la création de la table: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "delete-azure-table",
  "Supprimer une table Azure Storage et toutes ses données. ATTENTION: Cette opération est irréversible !",
  {
    tableName: z.string().describe("Nom de la table Azure à supprimer"),
  },
  async ({ tableName }) => {
    try {
      const result = await getAzureTableTools().deleteTable({
        tableName,
      });

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
            text: `Erreur lors de la suppression de la table: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "query-azure-table-advanced",
  "Requête avancée avec pagination, tri et filtres complexes. Support des filtres OData, tri côté client, pagination avec tokens de continuation.",
  {
    tableName: z.string().describe("Nom de la table Azure"),
    filter: z.string().optional().describe("Filtre OData complexe (ex: 'Age gt 18 and Status eq \"active\"')"),
    select: z.array(z.string()).optional().describe("Colonnes à sélectionner"),
    orderBy: z.array(z.string()).optional().describe("Tri par colonnes (ex: ['Age desc', 'Name asc'])"),
    top: z.number().min(1).max(1000).optional().describe("Nombre d'entités à retourner (1-1000)"),
    skip: z.number().min(0).optional().describe("Nombre d'entités à ignorer"),
    continuationToken: z.string().optional().describe("Token de continuation pour la pagination"),
  },
  async ({ tableName, filter, select, orderBy, top, skip, continuationToken }) => {
    try {
      const result = await getAzureTableTools().queryTableAdvanced({
        tableName,
        filter,
        select,
        orderBy,
        top,
        skip,
        continuationToken,
      });

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
            text: `Erreur lors de la requête avancée: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "check-azure-table-entity-exists",
  "Vérifier si une entité existe dans la table Azure Storage avant de créer ou modifier.",
  {
    tableName: z.string().describe("Nom de la table Azure"),
    partitionKey: z.string().describe("Clé de partition de l'entité"),
    rowKey: z.string().describe("Clé de ligne de l'entité"),
  },
  async ({ tableName, partitionKey, rowKey }) => {
    try {
      const result = await getAzureTableTools().checkEntityExists(tableName, partitionKey, rowKey);

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
            text: `Erreur lors de la vérification: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Start the server
async function main() {
  // Enregistrer dynamiquement les ressources pour toutes les tables
  const resourceManager = new AzureTableResources(server, getAzureTableTools());
  await resourceManager.registerDynamicResources();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Azure Storage MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
