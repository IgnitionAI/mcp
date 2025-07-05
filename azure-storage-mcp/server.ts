#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { AzureTableTools } from "./tools/azure-table-tools.js";
import { AzureBlobTools } from "./tools/azure-blob-tools.js";
import { AzureQueueTools } from "./tools/azure-queue-tools.js";
import { AzureStorageQueueTools } from "./tools/azure-storage-queue-tools.js";
import { AzureTableResources } from "./resources/azure-table-resources.js";
import { AzureBlobResources } from "./resources/azure-blob-resources.js";

dotenv.config();

// Create server instance
const server = new McpServer({
  name: "AzureStorageMCP",
  version: "1.0.4",
  description: "MCP server for interacting with Azure Storage"
});

// Initialisation des outils Azure (lazy loading)
let azureTableTools: AzureTableTools | null = null;
let azureBlobTools: AzureBlobTools | null = null;
let azureQueueTools: AzureQueueTools | null = null;
let azureStorageQueueTools: AzureStorageQueueTools | null = null;

function getAzureTableTools(): AzureTableTools {
  if (!azureTableTools) {
    azureTableTools = new AzureTableTools();
  }
  return azureTableTools;
}

function getAzureBlobTools(): AzureBlobTools {
  if (!azureBlobTools) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    azureBlobTools = new AzureBlobTools({ connectionString, accountName });
  }
  return azureBlobTools;
}

function getAzureQueueTools(): AzureQueueTools {
  if (!azureQueueTools) {
    const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
    const namespaceName = process.env.AZURE_SERVICE_BUS_NAMESPACE;
    azureQueueTools = new AzureQueueTools({ connectionString, namespaceName });
  }
  return azureQueueTools;
}

function getAzureStorageQueueTools(): AzureStorageQueueTools {
  if (!azureStorageQueueTools) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    azureStorageQueueTools = new AzureStorageQueueTools({ connectionString, accountName });
  }
  return azureStorageQueueTools;
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

// Register Azure Blob tools
server.tool(
  "list-azure-blob-containers",
  "Lister tous les containers Azure Blob Storage disponibles",
  {},
  async () => {
    try {
      const result = await getAzureBlobTools().listContainers();

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
            text: `Erreur lors de la liste des containers: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "create-azure-blob-container",
  "Créer un nouveau container Azure Blob Storage",
  {
    containerName: z.string().describe("Nom du container (3-63 caractères, lettres minuscules, chiffres et tirets)"),
    publicAccess: z.enum(["container", "blob"]).optional().describe("Niveau d'accès public (container ou blob)"),
  },
  async ({ containerName, publicAccess }) => {
    try {
      const result = await getAzureBlobTools().createContainer(containerName, { publicAccess });

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
            text: `Erreur lors de la création du container: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "delete-azure-blob-container",
  "Supprimer un container Azure Blob Storage. ATTENTION: Cette opération supprime le container et tous ses blobs !",
  {
    containerName: z.string().describe("Nom du container à supprimer"),
  },
  async ({ containerName }) => {
    try {
      const result = await getAzureBlobTools().deleteContainer(containerName);

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
            text: `Erreur lors de la suppression du container: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "list-azure-blobs",
  "Lister tous les blobs dans un container Azure Blob Storage",
  {
    containerName: z.string().describe("Nom du container"),
    prefix: z.string().optional().describe("Préfixe pour filtrer les blobs"),
  },
  async ({ containerName, prefix }) => {
    try {
      const result = await getAzureBlobTools().listBlobs(containerName, prefix);

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
            text: `Erreur lors de la liste des blobs: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "upload-azure-blob",
  "Uploader un blob dans un container Azure Blob Storage",
  {
    containerName: z.string().describe("Nom du container"),
    blobName: z.string().describe("Nom du blob à uploader"),
    content: z.string().describe("Contenu du blob (texte ou base64)"),
    contentType: z.string().optional().describe("Type MIME du contenu"),
    metadata: z.record(z.string()).optional().describe("Métadonnées du blob"),
    overwrite: z.boolean().optional().default(false).describe("Remplacer le blob s'il existe déjà"),
  },
  async ({ containerName, blobName, content, contentType, metadata, overwrite }) => {
    try {
      const result = await getAzureBlobTools().uploadBlob(containerName, blobName, content, {
        contentType,
        metadata,
        overwrite,
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
            text: `Erreur lors de l'upload du blob: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "read-azure-blob",
  "Lire le contenu d'un blob Azure Blob Storage (version simplifiée)",
  {
    containerName: z.string().describe("Nom du container"),
    blobName: z.string().describe("Nom du blob à lire"),
  },
  async ({ containerName, blobName }) => {
    try {
      const result = await getAzureBlobTools().downloadBlob(containerName, blobName);

      if (result.success && result.data) {
        return {
          content: [
            {
              type: "text",
              text: result.data.content,
            },
          ],
          isError: false,
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: result.error || "Erreur lors de la lecture du blob",
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erreur lors de la lecture du blob: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "download-azure-blob",
  "Télécharger un blob depuis un container Azure Blob Storage (avec métadonnées complètes)",
  {
    containerName: z.string().describe("Nom du container"),
    blobName: z.string().describe("Nom du blob à télécharger"),
  },
  async ({ containerName, blobName }) => {
    try {
      const result = await getAzureBlobTools().downloadBlob(containerName, blobName);

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
            text: `Erreur lors du téléchargement du blob: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "delete-azure-blob",
  "Supprimer un blob dans un container Azure Blob Storage",
  {
    containerName: z.string().describe("Nom du container"),
    blobName: z.string().describe("Nom du blob à supprimer"),
  },
  async ({ containerName, blobName }) => {
    try {
      const result = await getAzureBlobTools().deleteBlob(containerName, blobName);

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
            text: `Erreur lors de la suppression du blob: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "get-azure-blob-properties",
  "Obtenir les propriétés et métadonnées d'un blob Azure Blob Storage",
  {
    containerName: z.string().describe("Nom du container"),
    blobName: z.string().describe("Nom du blob"),
  },
  async ({ containerName, blobName }) => {
    try {
      const result = await getAzureBlobTools().getBlobProperties(containerName, blobName);

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
            text: `Erreur lors de la récupération des propriétés: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Azure Service Bus Queue tools
server.tool(
  "list-azure-queues",
  "Lister toutes les queues Azure Service Bus disponibles",
  {},
  async () => {
    try {
      const result = await getAzureQueueTools().listQueues();

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
            text: `Erreur lors de la liste des queues: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "create-azure-queue",
  "Créer une nouvelle queue Azure Service Bus",
  {
    queueName: z.string().describe("Nom de la queue à créer"),
    maxSizeInMegabytes: z.number().min(1).max(5120).optional().describe("Taille max en MB (1-5120)"),
    defaultMessageTimeToLive: z.string().optional().describe("TTL par défaut (ISO 8601, ex: P14D)"),
    lockDuration: z.string().optional().describe("Durée de verrouillage (ISO 8601, ex: PT30S)"),
    requiresDuplicateDetection: z.boolean().optional().describe("Activer détection doublons"),
    requiresSession: z.boolean().optional().describe("Requiert des sessions"),
    deadLetteringOnMessageExpiration: z.boolean().optional().describe("Dead letter sur expiration"),
  },
  async ({ queueName, maxSizeInMegabytes, defaultMessageTimeToLive, lockDuration, requiresDuplicateDetection, requiresSession, deadLetteringOnMessageExpiration }) => {
    try {
      const result = await getAzureQueueTools().createQueue(queueName, {
        maxSizeInMegabytes,
        defaultMessageTimeToLive,
        lockDuration,
        requiresDuplicateDetection,
        requiresSession,
        deadLetteringOnMessageExpiration,
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
            text: `Erreur lors de la création de la queue: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "delete-azure-queue",
  "Supprimer une queue Azure Service Bus. ATTENTION: Cette opération supprime la queue et tous ses messages !",
  {
    queueName: z.string().describe("Nom de la queue à supprimer"),
  },
  async ({ queueName }) => {
    try {
      const result = await getAzureQueueTools().deleteQueue(queueName);

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
            text: `Erreur lors de la suppression de la queue: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "send-queue-message",
  "Envoyer un message dans une queue Azure Service Bus",
  {
    queueName: z.string().describe("Nom de la queue"),
    messageBody: z.string().describe("Corps du message à envoyer"),
    messageId: z.string().optional().describe("ID unique du message"),
    correlationId: z.string().optional().describe("ID de corrélation"),
    label: z.string().optional().describe("Label/sujet du message"),
    timeToLive: z.number().optional().describe("TTL du message en millisecondes"),
    sessionId: z.string().optional().describe("ID de session"),
    userProperties: z.record(z.any()).optional().describe("Propriétés personnalisées"),
  },
  async ({ queueName, messageBody, messageId, correlationId, label, timeToLive, sessionId, userProperties }) => {
    try {
      const result = await getAzureQueueTools().sendMessage(queueName, messageBody, {
        messageId,
        correlationId,
        label,
        timeToLive,
        sessionId,
        userProperties,
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
            text: `Erreur lors de l'envoi du message: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "receive-queue-message",
  "Recevoir et traiter des messages d'une queue Azure Service Bus (les messages sont supprimés de la queue)",
  {
    queueName: z.string().describe("Nom de la queue"),
    maxMessageCount: z.number().min(1).max(100).optional().describe("Nombre max de messages (1-100)"),
    maxWaitTimeInMs: z.number().min(1).max(300000).optional().describe("Temps d'attente max en ms"),
  },
  async ({ queueName, maxMessageCount, maxWaitTimeInMs }) => {
    try {
      const result = await getAzureQueueTools().receiveMessage(queueName, {
        maxMessageCount,
        maxWaitTimeInMs,
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
            text: `Erreur lors de la réception du message: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "peek-queue-message",
  "Aperçu des messages d'une queue Azure Service Bus (sans les supprimer)",
  {
    queueName: z.string().describe("Nom de la queue"),
    maxMessageCount: z.number().min(1).max(100).optional().describe("Nombre max de messages (1-100)"),
  },
  async ({ queueName, maxMessageCount }) => {
    try {
      const result = await getAzureQueueTools().peekMessage(queueName, {
        maxMessageCount,
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
            text: `Erreur lors de l'aperçu des messages: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "get-azure-queue-properties",
  "Obtenir les propriétés et statistiques d'une queue Azure Service Bus",
  {
    queueName: z.string().describe("Nom de la queue"),
  },
  async ({ queueName }) => {
    try {
      const result = await getAzureQueueTools().getQueueProperties(queueName);

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
            text: `Erreur lors de la récupération des propriétés: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Azure Storage Queue tools
server.tool(
  "list-azure-storage-queues",
  "Lister toutes les queues Azure Storage disponibles",
  {},
  async () => {
    try {
      const result = await getAzureStorageQueueTools().listQueues();

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
            text: `Erreur lors de la liste des queues: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "create-azure-storage-queue",
  "Créer une nouvelle queue Azure Storage",
  {
    queueName: z.string().describe("Nom de la queue à créer (3-63 caractères, lettres minuscules, chiffres et tirets)"),
    metadata: z.record(z.string()).optional().describe("Métadonnées de la queue"),
  },
  async ({ queueName, metadata }) => {
    try {
      const result = await getAzureStorageQueueTools().createQueue(queueName, { metadata });

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
            text: `Erreur lors de la création de la queue: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "delete-azure-storage-queue",
  "Supprimer une queue Azure Storage. ATTENTION: Cette opération supprime la queue et tous ses messages !",
  {
    queueName: z.string().describe("Nom de la queue à supprimer"),
  },
  async ({ queueName }) => {
    try {
      const result = await getAzureStorageQueueTools().deleteQueue(queueName);

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
            text: `Erreur lors de la suppression de la queue: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "send-storage-queue-message",
  "Envoyer un message dans une queue Azure Storage",
  {
    queueName: z.string().describe("Nom de la queue"),
    messageText: z.string().describe("Texte du message à envoyer (max 64KB)"),
  },
  async ({ queueName, messageText }) => {
    try {
      const result = await getAzureStorageQueueTools().sendMessage(queueName, messageText);

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
            text: `Erreur lors de l'envoi du message: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "receive-storage-queue-messages",
  "Recevoir et traiter des messages d'une queue Azure Storage (les messages deviennent invisibles temporairement)",
  {
    queueName: z.string().describe("Nom de la queue"),
    numberOfMessages: z.number().min(1).max(32).optional().describe("Nombre de messages à recevoir (1-32)"),
  },
  async ({ queueName, numberOfMessages }) => {
    try {
      const result = await getAzureStorageQueueTools().receiveMessages(queueName, {
        numberOfMessages,
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
            text: `Erreur lors de la réception des messages: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "peek-storage-queue-messages",
  "Aperçu des messages d'une queue Azure Storage (sans les rendre invisibles)",
  {
    queueName: z.string().describe("Nom de la queue"),
    numberOfMessages: z.number().min(1).max(32).optional().describe("Nombre de messages à apercevoir (1-32)"),
  },
  async ({ queueName, numberOfMessages }) => {
    try {
      const result = await getAzureStorageQueueTools().peekMessages(queueName, {
        numberOfMessages,
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
            text: `Erreur lors de l'aperçu des messages: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "delete-storage-queue-message",
  "Supprimer un message spécifique d'une queue Azure Storage",
  {
    queueName: z.string().describe("Nom de la queue"),
    messageId: z.string().describe("ID du message à supprimer"),
    popReceipt: z.string().describe("Pop receipt du message (obtenu lors de la réception)"),
  },
  async ({ queueName, messageId, popReceipt }) => {
    try {
      const result = await getAzureStorageQueueTools().deleteMessage(queueName, messageId, popReceipt);

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
            text: `Erreur lors de la suppression du message: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "clear-storage-queue-messages",
  "Vider tous les messages d'une queue Azure Storage",
  {
    queueName: z.string().describe("Nom de la queue à vider"),
  },
  async ({ queueName }) => {
    try {
      const result = await getAzureStorageQueueTools().clearMessages(queueName);

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
            text: `Erreur lors du vidage de la queue: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "get-azure-storage-queue-properties",
  "Obtenir les propriétés et statistiques d'une queue Azure Storage",
  {
    queueName: z.string().describe("Nom de la queue"),
  },
  async ({ queueName }) => {
    try {
      const result = await getAzureStorageQueueTools().getQueueProperties(queueName);

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
            text: `Erreur lors de la récupération des propriétés: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
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
  const tableResourceManager = new AzureTableResources(server, getAzureTableTools());
  await tableResourceManager.registerDynamicResources();
  
  // Enregistrer dynamiquement les ressources pour tous les containers blob
  const blobResourceManager = new AzureBlobResources(server, getAzureBlobTools());
  await blobResourceManager.registerDynamicResources();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Azure Storage MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
