import { z } from "zod";

// Validation pour les noms de table Azure
const azureTableNameRegex = /^[a-zA-Z][a-zA-Z0-9]{2,62}$/;
const azureKeyRegex = /^[^/\\#?]*$/;

// Schema pour les paramètres de connexion Azure
export const AzureTableConfigSchema = z.object({
  accountName: z.string(),
  accountKey: z.string().optional(),
  tableName: z.string(),
  connectionString: z.string().optional(),
});

export type AzureTableConfig = z.infer<typeof AzureTableConfigSchema>;

// Schema pour les filtres de requête
export const TableQuerySchema = z.object({
  filter: z.string().optional(),
  select: z.array(z.string()).optional(),
  maxResults: z.number().optional(),
});

export type TableQuery = z.infer<typeof TableQuerySchema>;

// Schema pour les entités de table Azure
export const TableEntitySchema = z.record(z.any());

export type TableEntity = z.infer<typeof TableEntitySchema>;

// Schema pour les paramètres d'outil MCP
export const ReadTableToolSchema = z.object({
  tableName: z.string().describe("Nom de la table Azure à lire"),
  filter: z.string().optional().describe("Filtre OData pour les entités (ex: 'PartitionKey eq \"partition1\"')"),
  select: z.array(z.string()).optional().describe("Colonnes à sélectionner"),
  maxResults: z.number().optional().describe("Nombre maximum d'entités à retourner"),
});

// Schema pour les requêtes avancées avec pagination
export const QueryTableAdvancedSchema = z.object({
  tableName: z.string()
    .regex(azureTableNameRegex, "Le nom de table doit commencer par une lettre et contenir seulement des lettres/chiffres (3-63 caractères)")
    .describe("Nom de la table Azure à interroger"),
  filter: z.string().optional().describe("Filtre OData complexe (ex: 'Age gt 18 and Status eq \"active\"')"),
  select: z.array(z.string()).optional().describe("Colonnes à sélectionner"),
  orderBy: z.array(z.string()).optional().describe("Tri par colonnes (ex: ['Age desc', 'Name asc'])"),
  top: z.number().min(1).max(1000).optional().describe("Nombre d'entités à retourner (1-1000)"),
  skip: z.number().min(0).optional().describe("Nombre d'entités à ignorer"),
  continuationToken: z.string().optional().describe("Token de continuation pour la pagination"),
});

export type QueryTableAdvancedParams = z.infer<typeof QueryTableAdvancedSchema>;

export type ReadTableToolParams = z.infer<typeof ReadTableToolSchema>;

// Schema pour les valeurs autorisées dans Azure Table
const AzureTableValueSchema = z.union([
  z.string().max(64000), // String max 64KB
  z.number().int().min(-2147483648).max(2147483647), // Int32
  z.number().min(-1.79E+308).max(1.79E+308), // Double
  z.boolean(),
  z.date(),
  z.instanceof(Uint8Array).refine(data => data.length <= 64000, "Binary data must be <= 64KB"),
  z.null()
]);

// Schema pour créer une entité
export const CreateEntityToolSchema = z.object({
  tableName: z.string()
    .regex(azureTableNameRegex, "Le nom de table doit commencer par une lettre et contenir seulement des lettres/chiffres (3-63 caractères)")
    .describe("Nom de la table Azure"),
  partitionKey: z.string()
    .min(1, "PartitionKey ne peut pas être vide")
    .max(1024, "PartitionKey ne peut pas dépasser 1024 caractères")
    .regex(azureKeyRegex, "PartitionKey ne peut pas contenir les caractères /, \\, #, ?")
    .describe("Clé de partition de l'entité"),
  rowKey: z.string()
    .min(1, "RowKey ne peut pas être vide")
    .max(1024, "RowKey ne peut pas dépasser 1024 caractères")
    .regex(azureKeyRegex, "RowKey ne peut pas contenir les caractères /, \\, #, ?")
    .describe("Clé de ligne de l'entité"),
  entity: z.record(AzureTableValueSchema)
    .refine(data => {
      // Vérifier qu'il n'y a pas de propriétés réservées
      const reservedProps = ['PartitionKey', 'RowKey', 'Timestamp', 'ETag'];
      const hasReserved = Object.keys(data).some(key => reservedProps.includes(key));
      return !hasReserved;
    }, "L'entité ne peut pas contenir les propriétés réservées : PartitionKey, RowKey, Timestamp, ETag")
    .refine(data => Object.keys(data).length <= 252, "Une entité ne peut pas avoir plus de 252 propriétés")
    .describe("Données de l'entité à créer (max 252 propriétés, types autorisés : string, number, boolean, date, binary, null)"),
});

export type CreateEntityToolParams = z.infer<typeof CreateEntityToolSchema>;

// Schema pour mettre à jour une entité
export const UpdateEntityToolSchema = z.object({
  tableName: z.string()
    .regex(azureTableNameRegex, "Le nom de table doit commencer par une lettre et contenir seulement des lettres/chiffres (3-63 caractères)")
    .describe("Nom de la table Azure"),
  partitionKey: z.string()
    .min(1, "PartitionKey ne peut pas être vide")
    .max(1024, "PartitionKey ne peut pas dépasser 1024 caractères")
    .regex(azureKeyRegex, "PartitionKey ne peut pas contenir les caractères /, \\, #, ?")
    .describe("Clé de partition de l'entité"),
  rowKey: z.string()
    .min(1, "RowKey ne peut pas être vide")
    .max(1024, "RowKey ne peut pas dépasser 1024 caractères")
    .regex(azureKeyRegex, "RowKey ne peut pas contenir les caractères /, \\, #, ?")
    .describe("Clé de ligne de l'entité"),
  entity: z.record(AzureTableValueSchema)
    .refine(data => {
      // Vérifier qu'il n'y a pas de propriétés réservées
      const reservedProps = ['PartitionKey', 'RowKey', 'Timestamp', 'ETag'];
      const hasReserved = Object.keys(data).some(key => reservedProps.includes(key));
      return !hasReserved;
    }, "L'entité ne peut pas contenir les propriétés réservées : PartitionKey, RowKey, Timestamp, ETag")
    .refine(data => Object.keys(data).length <= 252, "Une entité ne peut pas avoir plus de 252 propriétés")
    .describe("Données de l'entité à mettre à jour (max 252 propriétés, types autorisés : string, number, boolean, date, binary, null)"),
  mode: z.enum(["merge", "replace"]).optional().default("merge").describe("Mode de mise à jour : merge ou replace"),
});

export type UpdateEntityToolParams = z.infer<typeof UpdateEntityToolSchema>;

// Schema pour supprimer une entité
export const DeleteEntityToolSchema = z.object({
  tableName: z.string()
    .regex(azureTableNameRegex, "Le nom de table doit commencer par une lettre et contenir seulement des lettres/chiffres (3-63 caractères)")
    .describe("Nom de la table Azure"),
  partitionKey: z.string()
    .min(1, "PartitionKey ne peut pas être vide")
    .max(1024, "PartitionKey ne peut pas dépasser 1024 caractères")
    .regex(azureKeyRegex, "PartitionKey ne peut pas contenir les caractères /, \\, #, ?")
    .describe("Clé de partition de l'entité"),
  rowKey: z.string()
    .min(1, "RowKey ne peut pas être vide")
    .max(1024, "RowKey ne peut pas dépasser 1024 caractères")
    .regex(azureKeyRegex, "RowKey ne peut pas contenir les caractères /, \\, #, ?")
    .describe("Clé de ligne de l'entité"),
});

export type DeleteEntityToolParams = z.infer<typeof DeleteEntityToolSchema>;

// Schema pour les opérations batch
export const BatchCreateEntitiesSchema = z.object({
  tableName: z.string()
    .regex(azureTableNameRegex, "Le nom de table doit commencer par une lettre et contenir seulement des lettres/chiffres (3-63 caractères)")
    .describe("Nom de la table Azure"),
  entities: z.array(z.object({
    partitionKey: z.string()
      .min(1, "PartitionKey ne peut pas être vide")
      .max(1024, "PartitionKey ne peut pas dépasser 1024 caractères")
      .regex(azureKeyRegex, "PartitionKey ne peut pas contenir les caractères /, \\, #, ?"),
    rowKey: z.string()
      .min(1, "RowKey ne peut pas être vide")
      .max(1024, "RowKey ne peut pas dépasser 1024 caractères")
      .regex(azureKeyRegex, "RowKey ne peut pas contenir les caractères /, \\, #, ?"),
    entity: z.record(AzureTableValueSchema)
      .refine(data => {
        const reservedProps = ['PartitionKey', 'RowKey', 'Timestamp', 'ETag'];
        const hasReserved = Object.keys(data).some(key => reservedProps.includes(key));
        return !hasReserved;
      }, "L'entité ne peut pas contenir les propriétés réservées")
      .refine(data => Object.keys(data).length <= 252, "Une entité ne peut pas avoir plus de 252 propriétés")
  }))
  .min(1, "Au moins une entité est requise")
  .max(100, "Maximum 100 entités par batch (limitation Azure)")
  .describe("Liste des entités à créer"),
});

export type BatchCreateEntitiesParams = z.infer<typeof BatchCreateEntitiesSchema>;

export const BatchUpdateEntitiesSchema = z.object({
  tableName: z.string()
    .regex(azureTableNameRegex, "Le nom de table doit commencer par une lettre et contenir seulement des lettres/chiffres (3-63 caractères)")
    .describe("Nom de la table Azure"),
  entities: z.array(z.object({
    partitionKey: z.string()
      .min(1, "PartitionKey ne peut pas être vide")
      .max(1024, "PartitionKey ne peut pas dépasser 1024 caractères")
      .regex(azureKeyRegex, "PartitionKey ne peut pas contenir les caractères /, \\, #, ?"),
    rowKey: z.string()
      .min(1, "RowKey ne peut pas être vide")
      .max(1024, "RowKey ne peut pas dépasser 1024 caractères")
      .regex(azureKeyRegex, "RowKey ne peut pas contenir les caractères /, \\, #, ?"),
    entity: z.record(AzureTableValueSchema)
      .refine(data => {
        const reservedProps = ['PartitionKey', 'RowKey', 'Timestamp', 'ETag'];
        const hasReserved = Object.keys(data).some(key => reservedProps.includes(key));
        return !hasReserved;
      }, "L'entité ne peut pas contenir les propriétés réservées")
      .refine(data => Object.keys(data).length <= 252, "Une entité ne peut pas avoir plus de 252 propriétés"),
    mode: z.enum(["merge", "replace"]).optional().default("merge")
  }))
  .min(1, "Au moins une entité est requise")
  .max(100, "Maximum 100 entités par batch (limitation Azure)")
  .describe("Liste des entités à mettre à jour"),
});

export type BatchUpdateEntitiesParams = z.infer<typeof BatchUpdateEntitiesSchema>;

export const BatchDeleteEntitiesSchema = z.object({
  tableName: z.string()
    .regex(azureTableNameRegex, "Le nom de table doit commencer par une lettre et contenir seulement des lettres/chiffres (3-63 caractères)")
    .describe("Nom de la table Azure"),
  entities: z.array(z.object({
    partitionKey: z.string()
      .min(1, "PartitionKey ne peut pas être vide")
      .max(1024, "PartitionKey ne peut pas dépasser 1024 caractères")
      .regex(azureKeyRegex, "PartitionKey ne peut pas contenir les caractères /, \\, #, ?"),
    rowKey: z.string()
      .min(1, "RowKey ne peut pas être vide")
      .max(1024, "RowKey ne peut pas dépasser 1024 caractères")
      .regex(azureKeyRegex, "RowKey ne peut pas contenir les caractères /, \\, #, ?")
  }))
  .min(1, "Au moins une entité est requise")
  .max(100, "Maximum 100 entités par batch (limitation Azure)")
  .describe("Liste des entités à supprimer"),
});

export type BatchDeleteEntitiesParams = z.infer<typeof BatchDeleteEntitiesSchema>;

// Schema pour la gestion des tables
export const CreateTableSchema = z.object({
  tableName: z.string()
    .regex(azureTableNameRegex, "Le nom de table doit commencer par une lettre et contenir seulement des lettres/chiffres (3-63 caractères)")
    .describe("Nom de la table Azure à créer"),
});

export type CreateTableParams = z.infer<typeof CreateTableSchema>;

export const DeleteTableSchema = z.object({
  tableName: z.string()
    .regex(azureTableNameRegex, "Le nom de table doit commencer par une lettre et contenir seulement des lettres/chiffres (3-63 caractères)")
    .describe("Nom de la table Azure à supprimer"),
});

export type DeleteTableParams = z.infer<typeof DeleteTableSchema>;

// Azure Blob Storage schemas
const azureContainerNameRegex = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;
const azureBlobNameRegex = /^[^\\/]+$/;

// Schema pour les paramètres de connexion Azure Blob
export const AzureBlobConfigSchema = z.object({
  accountName: z.string().optional(),
  connectionString: z.string().optional(),
}).refine(data => data.accountName || data.connectionString, {
  message: "Either accountName or connectionString must be provided"
});

export type AzureBlobConfig = z.infer<typeof AzureBlobConfigSchema>;

// Schema pour créer un container
export const CreateContainerSchema = z.object({
  containerName: z.string()
    .min(3, "Le nom du container doit contenir au moins 3 caractères")
    .max(63, "Le nom du container ne peut pas dépasser 63 caractères")
    .regex(azureContainerNameRegex, "Le nom du container doit contenir seulement des lettres minuscules, chiffres et tirets")
    .describe("Nom du container à créer"),
  publicAccess: z.enum(["container", "blob"]).optional().describe("Niveau d'accès public (container ou blob)"),
});

export type CreateContainerParams = z.infer<typeof CreateContainerSchema>;

// Schema pour supprimer un container
export const DeleteContainerSchema = z.object({
  containerName: z.string()
    .regex(azureContainerNameRegex, "Nom de container invalide")
    .describe("Nom du container à supprimer"),
});

export type DeleteContainerParams = z.infer<typeof DeleteContainerSchema>;

// Schema pour lister les blobs
export const ListBlobsSchema = z.object({
  containerName: z.string()
    .regex(azureContainerNameRegex, "Nom de container invalide")
    .describe("Nom du container"),
  prefix: z.string().optional().describe("Préfixe pour filtrer les blobs"),
});

export type ListBlobsParams = z.infer<typeof ListBlobsSchema>;

// Schema pour uploader un blob
export const UploadBlobSchema = z.object({
  containerName: z.string()
    .regex(azureContainerNameRegex, "Nom de container invalide")
    .describe("Nom du container"),
  blobName: z.string()
    .min(1, "Le nom du blob ne peut pas être vide")
    .max(1024, "Le nom du blob ne peut pas dépasser 1024 caractères")
    .describe("Nom du blob à uploader"),
  content: z.string().describe("Contenu du blob (texte ou base64)"),
  contentType: z.string().optional().describe("Type MIME du contenu"),
  metadata: z.record(z.string()).optional().describe("Métadonnées du blob"),
  overwrite: z.boolean().optional().default(false).describe("Remplacer le blob s'il existe déjà"),
});

export type UploadBlobParams = z.infer<typeof UploadBlobSchema>;

// Schema pour télécharger un blob
export const DownloadBlobSchema = z.object({
  containerName: z.string()
    .regex(azureContainerNameRegex, "Nom de container invalide")
    .describe("Nom du container"),
  blobName: z.string()
    .min(1, "Le nom du blob ne peut pas être vide")
    .describe("Nom du blob à télécharger"),
});

export type DownloadBlobParams = z.infer<typeof DownloadBlobSchema>;

// Schema pour supprimer un blob
export const DeleteBlobSchema = z.object({
  containerName: z.string()
    .regex(azureContainerNameRegex, "Nom de container invalide")
    .describe("Nom du container"),
  blobName: z.string()
    .min(1, "Le nom du blob ne peut pas être vide")
    .describe("Nom du blob à supprimer"),
});

export type DeleteBlobParams = z.infer<typeof DeleteBlobSchema>;

// Schema pour obtenir les propriétés d'un blob
export const GetBlobPropertiesSchema = z.object({
  containerName: z.string()
    .regex(azureContainerNameRegex, "Nom de container invalide")
    .describe("Nom du container"),
  blobName: z.string()
    .min(1, "Le nom du blob ne peut pas être vide")
    .describe("Nom du blob"),
});

export type GetBlobPropertiesParams = z.infer<typeof GetBlobPropertiesSchema>;