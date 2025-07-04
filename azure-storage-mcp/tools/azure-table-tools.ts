import { TableClient, TableServiceClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import { 
  ReadTableToolParams, 
  ReadTableToolSchema, 
  CreateEntityToolParams, 
  CreateEntityToolSchema,
  UpdateEntityToolParams,
  UpdateEntityToolSchema,
  DeleteEntityToolParams,
  DeleteEntityToolSchema,
  BatchCreateEntitiesParams,
  BatchCreateEntitiesSchema,
  BatchUpdateEntitiesParams,
  BatchUpdateEntitiesSchema,
  BatchDeleteEntitiesParams,
  BatchDeleteEntitiesSchema,
  CreateTableParams,
  CreateTableSchema,
  DeleteTableParams,
  DeleteTableSchema,
  QueryTableAdvancedParams,
  QueryTableAdvancedSchema
} from "../types.js";

export class AzureTableTools {
  private tableServiceClient: TableServiceClient;
  private connectionString: string;
  private accountName: string;

  constructor(connectionString?: string, accountName?: string) {
    this.connectionString = connectionString || process.env.AZURE_STORAGE_CONNECTION_STRING || "";
    this.accountName = accountName || process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
    
    if (this.connectionString) {
      this.tableServiceClient = TableServiceClient.fromConnectionString(this.connectionString);
    } else if (this.accountName) {
      const credential = new DefaultAzureCredential();
      this.tableServiceClient = new TableServiceClient(
        `https://${this.accountName}.table.core.windows.net`,
        credential
      );
    } else {
      throw new Error("Configuration Azure manquante : CONNECTION_STRING ou ACCOUNT_NAME requis");
    }
  }

  async readTable(params: ReadTableToolParams) {
    try {
      // Validation des paramètres
      const validatedParams = ReadTableToolSchema.parse(params);
      
      // Création du client de table
      const tableClient = this.getTableClient(validatedParams.tableName);
      
      // Configuration de la requête
      const queryOptions: any = {};
      
      if (validatedParams.filter) {
        queryOptions.filter = validatedParams.filter;
      }
      
      if (validatedParams.select) {
        queryOptions.select = validatedParams.select;
      }

      // Exécution de la requête
      const entities = [];
      const entitiesIter = tableClient.listEntities(queryOptions);
      
      let count = 0;
      const maxResults = validatedParams.maxResults || 100;
      
      for await (const entity of entitiesIter) {
        if (count >= maxResults) break;
        
        // Nettoyage des métadonnées Azure
        const cleanEntity = this.cleanEntity(entity);
        entities.push(cleanEntity);
        count++;
      }

      return {
        success: true,
        data: entities,
        count: entities.length,
        tableName: validatedParams.tableName
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName: params.tableName
      };
    }
  }

  private cleanEntity(entity: any) {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(entity)) {
      // Exclure les métadonnées Azure
      if (!key.startsWith("odata.") && !key.startsWith("@odata.")) {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  async listTables() {
    try {
      const tables = [];
      const tablesIter = this.tableServiceClient.listTables();
      
      for await (const table of tablesIter) {
        tables.push(table.name);
      }
      
      return {
        success: true,
        data: tables,
        count: tables.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      };
    }
  }

  private getTableClient(tableName: string): TableClient {
    if (this.connectionString) {
      return TableClient.fromConnectionString(this.connectionString, tableName);
    } else {
      return new TableClient(
        `https://${this.accountName}.table.core.windows.net`,
        tableName,
        new DefaultAzureCredential()
      );
    }
  }

  async createEntity(params: CreateEntityToolParams) {
    try {
      const validatedParams = CreateEntityToolSchema.parse(params);
      
      // Valider contre le schéma existant de la table
      const schemaValidation = await this.validateEntityAgainstSchema(
        validatedParams.tableName, 
        validatedParams.entity
      );

      const tableClient = this.getTableClient(validatedParams.tableName);
      
      // Préparer l'entité avec PartitionKey et RowKey
      const entity = {
        partitionKey: validatedParams.partitionKey,
        rowKey: validatedParams.rowKey,
        ...validatedParams.entity
      };

      await tableClient.createEntity(entity);

      return {
        success: true,
        data: { 
          partitionKey: validatedParams.partitionKey,
          rowKey: validatedParams.rowKey,
          message: "Entité créée avec succès",
          entitySize: Object.keys(validatedParams.entity).length,
          schemaValidation: {
            conformsToSchema: schemaValidation.success,
            warnings: schemaValidation.warnings,
            errors: schemaValidation.errors
          }
        },
        tableName: validatedParams.tableName
      };
      
    } catch (error) {
      if (error instanceof Error) {
        // Messages d'erreur plus explicites
        if (error.message.includes("EntityAlreadyExists")) {
          return {
            success: false,
            error: `Une entité avec PartitionKey="${params.partitionKey}" et RowKey="${params.rowKey}" existe déjà dans la table "${params.tableName}". Utilisez update-azure-table-entity pour la modifier.`,
            tableName: params.tableName,
            errorType: "EntityAlreadyExists"
          };
        }
        if (error.message.includes("TableNotFound")) {
          return {
            success: false,
            error: `La table "${params.tableName}" n'existe pas. Créez-la d'abord ou vérifiez le nom.`,
            tableName: params.tableName,
            errorType: "TableNotFound"
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName: params.tableName
      };
    }
  }

  async updateEntity(params: UpdateEntityToolParams) {
    try {
      const validatedParams = UpdateEntityToolSchema.parse(params);
      
      // Valider contre le schéma existant de la table
      const schemaValidation = await this.validateEntityAgainstSchema(
        validatedParams.tableName, 
        validatedParams.entity
      );

      const tableClient = this.getTableClient(validatedParams.tableName);
      
      // Préparer l'entité avec PartitionKey et RowKey
      const entity = {
        partitionKey: validatedParams.partitionKey,
        rowKey: validatedParams.rowKey,
        ...validatedParams.entity
      };

      if (validatedParams.mode === "replace") {
        await tableClient.updateEntity(entity, "Replace");
      } else {
        await tableClient.updateEntity(entity, "Merge");
      }

      return {
        success: true,
        data: { 
          partitionKey: validatedParams.partitionKey,
          rowKey: validatedParams.rowKey,
          mode: validatedParams.mode,
          message: "Entité mise à jour avec succès",
          schemaValidation: {
            conformsToSchema: schemaValidation.success,
            warnings: schemaValidation.warnings,
            errors: schemaValidation.errors
          }
        },
        tableName: validatedParams.tableName
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName: params.tableName
      };
    }
  }

  async deleteEntity(params: DeleteEntityToolParams) {
    try {
      const validatedParams = DeleteEntityToolSchema.parse(params);
      const tableClient = this.getTableClient(validatedParams.tableName);
      
      await tableClient.deleteEntity(validatedParams.partitionKey, validatedParams.rowKey);

      return {
        success: true,
        data: { 
          partitionKey: validatedParams.partitionKey,
          rowKey: validatedParams.rowKey,
          message: "Entité supprimée avec succès"
        },
        tableName: validatedParams.tableName
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName: params.tableName
      };
    }
  }

  async inferTableSchema(tableName: string, sampleSize: number = 10) {
    try {
      const tableClient = this.getTableClient(tableName);
      
      // Récupérer un échantillon d'entités pour inférer le schéma
      const entities = [];
      const entitiesIter = tableClient.listEntities();
      
      let count = 0;
      for await (const entity of entitiesIter) {
        if (count >= sampleSize) break;
        entities.push(this.cleanEntity(entity));
        count++;
      }

      if (entities.length === 0) {
        return {
          success: true,
          data: {
            isEmpty: true,
            message: "Table vide - aucun schéma à inférer",
            suggestedSchema: {}
          },
          tableName
        };
      }

      // Analyser les propriétés et leurs types
      const schemaAnalysis = this.analyzeEntitySchema(entities);

      return {
        success: true,
        data: {
          isEmpty: false,
          sampleSize: entities.length,
          schema: schemaAnalysis.schema,
          commonProperties: schemaAnalysis.commonProperties,
          optionalProperties: schemaAnalysis.optionalProperties,
          typeVariations: schemaAnalysis.typeVariations,
          examples: entities.slice(0, 3) // Premiers exemples pour référence
        },
        tableName
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName
      };
    }
  }

  private analyzeEntitySchema(entities: any[]) {
    const propertyFrequency: { [key: string]: number } = {};
    const propertyTypes: { [key: string]: Set<string> } = {};

    // Analyser chaque entité
    entities.forEach(entity => {
      Object.entries(entity).forEach(([key, value]) => {
        // Compter la fréquence des propriétés
        propertyFrequency[key] = (propertyFrequency[key] || 0) + 1;
        
        // Analyser les types
        if (!propertyTypes[key]) {
          propertyTypes[key] = new Set();
        }
        propertyTypes[key].add(this.getValueType(value));
      });
    });

    const totalEntities = entities.length;
    const commonProperties: string[] = [];
    const optionalProperties: string[] = [];
    const schema: { [key: string]: any } = {};
    const typeVariations: { [key: string]: string[] } = {};

    // Classer les propriétés selon leur fréquence
    Object.entries(propertyFrequency).forEach(([property, frequency]) => {
      const presence = frequency / totalEntities;
      const types = Array.from(propertyTypes[property]);
      
      schema[property] = {
        type: types.length === 1 ? types[0] : types,
        frequency: frequency,
        presence: Math.round(presence * 100) + '%',
        required: presence >= 0.8 // 80% de présence = requis
      };

      if (presence >= 0.8) {
        commonProperties.push(property);
      } else {
        optionalProperties.push(property);
      }

      if (types.length > 1) {
        typeVariations[property] = types;
      }
    });

    return {
      schema,
      commonProperties,
      optionalProperties,
      typeVariations
    };
  }

  private getValueType(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (value instanceof Uint8Array) return 'binary';
    return 'unknown';
  }

  async validateEntityAgainstSchema(tableName: string, entity: any) {
    const schemaResult = await this.inferTableSchema(tableName, 20);
    
    if (!schemaResult.success || schemaResult.data.isEmpty) {
      return {
        success: true,
        message: "Table vide - validation ignorée",
        warnings: []
      };
    }

    const schema = schemaResult.data.schema;
    const warnings: string[] = [];
    const errors: string[] = [];

    // Vérifier les propriétés requises
    schemaResult.data.commonProperties.forEach(requiredProp => {
      if (!(requiredProp in entity)) {
        warnings.push(`Propriété attendue manquante: "${requiredProp}" (présente dans ${schema[requiredProp].presence} des entités existantes)`);
      }
    });

    // Vérifier les types des propriétés fournies
    Object.entries(entity).forEach(([key, value]) => {
      if (schema[key]) {
        const expectedTypes = Array.isArray(schema[key].type) ? schema[key].type : [schema[key].type];
        const actualType = this.getValueType(value);
        
        if (!expectedTypes.includes(actualType)) {
          errors.push(`Type incorrect pour "${key}": attendu ${expectedTypes.join(' ou ')}, reçu ${actualType}`);
        }
      } else {
        warnings.push(`Nouvelle propriété: "${key}" (non présente dans les entités existantes)`);
      }
    });

    return {
      success: errors.length === 0,
      message: errors.length === 0 ? "Entité conforme au schéma" : "Erreurs de validation détectées",
      errors,
      warnings,
      schemaInfo: {
        totalProperties: Object.keys(schema).length,
        requiredProperties: schemaResult.data.commonProperties.length,
        optionalProperties: schemaResult.data.optionalProperties.length
      }
    };
  }

  async batchCreateEntities(params: BatchCreateEntitiesParams) {
    try {
      const validatedParams = BatchCreateEntitiesSchema.parse(params);
      const tableClient = this.getTableClient(validatedParams.tableName);
      
      // Grouper les entités par PartitionKey (limitation Azure)
      const entitiesByPartition = this.groupEntitiesByPartition(validatedParams.entities);
      const results: any[] = [];
      
      for (const [partitionKey, entities] of entitiesByPartition.entries()) {
        try {
          // Valider le schéma pour chaque entité
          const schemaValidations = [];
          for (const entityData of entities) {
            const validation = await this.validateEntityAgainstSchema(
              validatedParams.tableName, 
              entityData.entity
            );
            schemaValidations.push({
              partitionKey: entityData.partitionKey,
              rowKey: entityData.rowKey,
              validation
            });
          }

          // Préparer les entités pour le batch
          const entitiesToCreate = entities.map(entityData => ({
            partitionKey: entityData.partitionKey,
            rowKey: entityData.rowKey,
            ...entityData.entity
          }));

          // Exécuter le batch pour cette partition
          const batchResponses = await tableClient.submitTransaction(
            entitiesToCreate.map(entity => ["create", entity])
          );

          results.push({
            partitionKey,
            success: true,
            count: entities.length,
            entities: entities.map((e, index) => ({
              partitionKey: e.partitionKey,
              rowKey: e.rowKey,
              status: "created",
              schemaValidation: schemaValidations[index]?.validation
            }))
          });

        } catch (error) {
          results.push({
            partitionKey,
            success: false,
            count: entities.length,
            error: error instanceof Error ? error.message : "Erreur inconnue",
            entities: entities.map(e => ({
              partitionKey: e.partitionKey,
              rowKey: e.rowKey,
              status: "failed"
            }))
          });
        }
      }

      const totalSuccess = results.filter(r => r.success).reduce((sum, r) => sum + r.count, 0);
      const totalFailed = results.filter(r => !r.success).reduce((sum, r) => sum + r.count, 0);

      return {
        success: totalFailed === 0,
        data: {
          totalEntities: validatedParams.entities.length,
          successful: totalSuccess,
          failed: totalFailed,
          partitions: results.length,
          details: results
        },
        tableName: validatedParams.tableName
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName: params.tableName
      };
    }
  }

  async batchUpdateEntities(params: BatchUpdateEntitiesParams) {
    try {
      const validatedParams = BatchUpdateEntitiesSchema.parse(params);
      const tableClient = this.getTableClient(validatedParams.tableName);
      
      // Grouper les entités par PartitionKey
      const entitiesByPartition = this.groupEntitiesByPartition(validatedParams.entities);
      const results: any[] = [];
      
      for (const [partitionKey, entities] of entitiesByPartition.entries()) {
        try {
          // Valider le schéma pour chaque entité
          const schemaValidations = [];
          for (const entityData of entities) {
            const validation = await this.validateEntityAgainstSchema(
              validatedParams.tableName, 
              entityData.entity
            );
            schemaValidations.push({
              partitionKey: entityData.partitionKey,
              rowKey: entityData.rowKey,
              validation
            });
          }

          // Préparer les entités pour le batch
          const entitiesToUpdate = entities.map(entityData => ({
            partitionKey: entityData.partitionKey,
            rowKey: entityData.rowKey,
            ...entityData.entity
          }));

          // Exécuter le batch pour cette partition
          const updateMode = entities[0].mode === "replace" ? "Replace" : "Merge";
          const batchResponses = await tableClient.submitTransaction(
            entitiesToUpdate.map(entity => ["update", entity, updateMode])
          );

          results.push({
            partitionKey,
            success: true,
            count: entities.length,
            mode: updateMode,
            entities: entities.map((e, index) => ({
              partitionKey: e.partitionKey,
              rowKey: e.rowKey,
              status: "updated",
              mode: e.mode,
              schemaValidation: schemaValidations[index]?.validation
            }))
          });

        } catch (error) {
          results.push({
            partitionKey,
            success: false,
            count: entities.length,
            error: error instanceof Error ? error.message : "Erreur inconnue",
            entities: entities.map(e => ({
              partitionKey: e.partitionKey,
              rowKey: e.rowKey,
              status: "failed"
            }))
          });
        }
      }

      const totalSuccess = results.filter(r => r.success).reduce((sum, r) => sum + r.count, 0);
      const totalFailed = results.filter(r => !r.success).reduce((sum, r) => sum + r.count, 0);

      return {
        success: totalFailed === 0,
        data: {
          totalEntities: validatedParams.entities.length,
          successful: totalSuccess,
          failed: totalFailed,
          partitions: results.length,
          details: results
        },
        tableName: validatedParams.tableName
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName: params.tableName
      };
    }
  }

  async batchDeleteEntities(params: BatchDeleteEntitiesParams) {
    try {
      const validatedParams = BatchDeleteEntitiesSchema.parse(params);
      const tableClient = this.getTableClient(validatedParams.tableName);
      
      // Grouper les entités par PartitionKey
      const entitiesByPartition = this.groupEntitiesByPartition(validatedParams.entities);
      const results: any[] = [];
      
      for (const [partitionKey, entities] of entitiesByPartition.entries()) {
        try {
          // Préparer les entités pour le batch
          const entitiesToDelete = entities.map(entityData => ({
            partitionKey: entityData.partitionKey,
            rowKey: entityData.rowKey
          }));

          // Exécuter le batch pour cette partition
          const batchResponses = await tableClient.submitTransaction(
            entitiesToDelete.map(entity => ["delete", entity])
          );

          results.push({
            partitionKey,
            success: true,
            count: entities.length,
            entities: entities.map(e => ({
              partitionKey: e.partitionKey,
              rowKey: e.rowKey,
              status: "deleted"
            }))
          });

        } catch (error) {
          results.push({
            partitionKey,
            success: false,
            count: entities.length,
            error: error instanceof Error ? error.message : "Erreur inconnue",
            entities: entities.map(e => ({
              partitionKey: e.partitionKey,
              rowKey: e.rowKey,
              status: "failed"
            }))
          });
        }
      }

      const totalSuccess = results.filter(r => r.success).reduce((sum, r) => sum + r.count, 0);
      const totalFailed = results.filter(r => !r.success).reduce((sum, r) => sum + r.count, 0);

      return {
        success: totalFailed === 0,
        data: {
          totalEntities: validatedParams.entities.length,
          successful: totalSuccess,
          failed: totalFailed,
          partitions: results.length,
          details: results
        },
        tableName: validatedParams.tableName
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName: params.tableName
      };
    }
  }

  async createTable(params: CreateTableParams) {
    try {
      const validatedParams = CreateTableSchema.parse(params);
      
      // Vérifier si la table existe déjà
      const existingTables = await this.listTables();
      if (existingTables.success && existingTables.data?.includes(validatedParams.tableName)) {
        return {
          success: false,
          error: `La table "${validatedParams.tableName}" existe déjà`,
          tableName: validatedParams.tableName,
          errorType: "TableAlreadyExists"
        };
      }

      await this.tableServiceClient.createTable(validatedParams.tableName);

      return {
        success: true,
        data: {
          tableName: validatedParams.tableName,
          message: "Table créée avec succès",
          created: new Date().toISOString()
        },
        tableName: validatedParams.tableName
      };

    } catch (error) {
      if (error instanceof Error && error.message.includes("TableAlreadyExists")) {
        return {
          success: false,
          error: `La table "${params.tableName}" existe déjà`,
          tableName: params.tableName,
          errorType: "TableAlreadyExists"
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName: params.tableName
      };
    }
  }

  async deleteTable(params: DeleteTableParams) {
    try {
      const validatedParams = DeleteTableSchema.parse(params);
      
      // Vérifier si la table existe
      const existingTables = await this.listTables();
      if (existingTables.success && !existingTables.data?.includes(validatedParams.tableName)) {
        return {
          success: false,
          error: `La table "${validatedParams.tableName}" n'existe pas`,
          tableName: validatedParams.tableName,
          errorType: "TableNotFound"
        };
      }

      await this.tableServiceClient.deleteTable(validatedParams.tableName);

      return {
        success: true,
        data: {
          tableName: validatedParams.tableName,
          message: "Table supprimée avec succès",
          deleted: new Date().toISOString()
        },
        tableName: validatedParams.tableName
      };

    } catch (error) {
      if (error instanceof Error && error.message.includes("TableNotFound")) {
        return {
          success: false,
          error: `La table "${params.tableName}" n'existe pas`,
          tableName: params.tableName,
          errorType: "TableNotFound"
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName: params.tableName
      };
    }
  }

  async queryTableAdvanced(params: QueryTableAdvancedParams) {
    try {
      const validatedParams = QueryTableAdvancedSchema.parse(params);
      const tableClient = this.getTableClient(validatedParams.tableName);
      
      // Configuration de la requête avancée
      const queryOptions: any = {};
      
      if (validatedParams.filter) {
        queryOptions.filter = validatedParams.filter;
      }
      
      if (validatedParams.select) {
        queryOptions.select = validatedParams.select;
      }

      // Azure Table Storage ne supporte pas ORDER BY nativement
      // Nous collectons les données et trions côté client
      const entities = [];
      let continuationToken = validatedParams.continuationToken;
      let totalCollected = 0;
      const maxToCollect = validatedParams.top || 100;
      const skipCount = validatedParams.skip || 0;

      // Collecte des entités avec pagination
      do {
        const pageOptions = { ...queryOptions };
        if (continuationToken) {
          pageOptions.continuationToken = continuationToken;
        }

        const entitiesIter = tableClient.listEntities(pageOptions);
        let pageResults = [];
        
        for await (const entity of entitiesIter) {
          pageResults.push(this.cleanEntity(entity));
          if (pageResults.length >= 1000) break; // Limite de sécurité
        }

        entities.push(...pageResults);
        
        // Récupérer le token de continuation si disponible
        // Note: Azure SDK peut ne pas exposer directement le token via l'itérateur
        continuationToken = undefined; // Pour l'instant, pas de support de continuation
        
        // Arrêter si on a assez d'entités pour satisfaire skip + top
        if (entities.length >= skipCount + maxToCollect) {
          break;
        }
        
      } while (continuationToken && entities.length < 5000); // Limite de sécurité

      // Tri côté client si spécifié
      if (validatedParams.orderBy && validatedParams.orderBy.length > 0) {
        entities.sort((a, b) => {
          for (const orderClause of validatedParams.orderBy!) {
            const [field, direction = 'asc'] = orderClause.split(' ');
            const isDesc = direction.toLowerCase() === 'desc';
            
            const aValue = a[field];
            const bValue = b[field];
            
            if (aValue < bValue) return isDesc ? 1 : -1;
            if (aValue > bValue) return isDesc ? -1 : 1;
          }
          return 0;
        });
      }

      // Application de skip et top
      const startIndex = skipCount;
      const endIndex = startIndex + maxToCollect;
      const resultEntities = entities.slice(startIndex, endIndex);

      // Générer un token de continuation pour la page suivante
      const hasMore = entities.length > endIndex || continuationToken;
      const nextContinuationToken = hasMore ? 
        Buffer.from(JSON.stringify({ 
          skip: skipCount + maxToCollect, 
          originalToken: continuationToken 
        })).toString('base64') : undefined;

      return {
        success: true,
        data: {
          entities: resultEntities,
          count: resultEntities.length,
          totalAvailable: entities.length,
          hasMore,
          continuationToken: nextContinuationToken,
          queryInfo: {
            filter: validatedParams.filter,
            select: validatedParams.select,
            orderBy: validatedParams.orderBy,
            top: validatedParams.top,
            skip: validatedParams.skip
          }
        },
        tableName: validatedParams.tableName
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName: params.tableName
      };
    }
  }

  async checkEntityExists(tableName: string, partitionKey: string, rowKey: string) {
    try {
      const tableClient = this.getTableClient(tableName);
      
      try {
        const entity = await tableClient.getEntity(partitionKey, rowKey);
        return {
          success: true,
          exists: true,
          data: {
            partitionKey,
            rowKey,
            entity: this.cleanEntity(entity),
            message: "Entité trouvée"
          },
          tableName
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("ResourceNotFound")) {
          return {
            success: true,
            exists: false,
            data: {
              partitionKey,
              rowKey,
              message: "Entité non trouvée"
            },
            tableName
          };
        }
        throw error;
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tableName
      };
    }
  }

  private groupEntitiesByPartition(entities: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    entities.forEach(entity => {
      const partitionKey = entity.partitionKey;
      if (!groups.has(partitionKey)) {
        groups.set(partitionKey, []);
      }
      groups.get(partitionKey)!.push(entity);
    });
    
    return groups;
  }
}