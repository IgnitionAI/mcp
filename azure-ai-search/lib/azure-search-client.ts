import { SearchClient, SearchIndexClient, AzureKeyCredential } from "@azure/search-documents";
import { DefaultAzureCredential } from "@azure/identity";
import dotenv from "dotenv";
import type { 
  AzureSearchConfig,
  SearchResult,
  DocumentResult,
  SuggestResult,
  AutocompleteResult,
  IndexResult,
  BatchResult,
  VectorSearchResult,
  SemanticSearchResult,
  VectorQuery 
} from "../types.js";

dotenv.config();

export class AzureSearchTools {
  private indexClient: SearchIndexClient | null = null;
  private searchClients: Map<string, SearchClient<any>> = new Map();
  private config: AzureSearchConfig;

  /**
   * Removes vector fields from search results to avoid returning large vector arrays
   * @param results Array of search results
   * @returns Filtered results without vector fields
   */
  private removeVectorFields(results: any[]): any[] {
    return results.map(result => {
      if (!result || typeof result !== 'object') return result;
      
      const filteredResult = { ...result };
      
      // Recursively filter nested objects (like document property)
      this.filterVectorFieldsRecursive(filteredResult);
      
      return filteredResult;
    });
  }

  /**
   * Recursively removes vector fields from an object
   * @param obj Object to filter
   */
  private filterVectorFieldsRecursive(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      // Check if this field should be removed
      if (this.isVectorField(key, value)) {
        delete obj[key];
        return;
      }
      
      // Recursively filter nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.filterVectorFieldsRecursive(value);
      }
    });
  }

  /**
   * Determines if a field is a vector field that should be removed
   * @param key Field name
   * @param value Field value
   * @returns True if field should be removed
   */
  private isVectorField(key: string, value: any): boolean {
    const keyLower = key.toLowerCase();
    
    // Check field name patterns
    if (keyLower.includes('vector') || 
        keyLower.includes('embedding') ||
        key.endsWith('Vector') || 
        key.endsWith('_vector') ||
        key.endsWith('Embedding') ||
        key.endsWith('_embedding')) {
      return true;
    }
    
    // Check if it's a large numeric array (likely a vector)
    if (Array.isArray(value) && 
        value.length > 50 && // Lower threshold for safety
        value.length < 10000 && // Reasonable upper bound for vectors
        value.every((item: any) => typeof item === 'number')) {
      return true;
    }
    
    return false;
  }

  constructor(config?: Partial<AzureSearchConfig>) {
    this.config = {
      endpoint: config?.endpoint || process.env.AZURE_SEARCH_ENDPOINT || "",
      apiKey: config?.apiKey || process.env.AZURE_SEARCH_API_KEY,
      apiVersion: config?.apiVersion || "2023-11-01",
    };

    if (!this.config.endpoint) {
      throw new Error("Azure Search endpoint is required. Set AZURE_SEARCH_ENDPOINT environment variable or provide it in config.");
    }
  }

  private getIndexClient(): SearchIndexClient {
    if (!this.indexClient) {
      const credential = this.config.apiKey 
        ? new AzureKeyCredential(this.config.apiKey)
        : new DefaultAzureCredential();

      this.indexClient = new SearchIndexClient(this.config.endpoint, credential);
    }
    return this.indexClient;
  }

  private getSearchClient(indexName: string): SearchClient<any> {
    if (!this.searchClients.has(indexName)) {
      const credential = this.config.apiKey
        ? new AzureKeyCredential(this.config.apiKey)
        : new DefaultAzureCredential();

      const client = new SearchClient(this.config.endpoint, indexName, credential);
      this.searchClients.set(indexName, client);
    }
    return this.searchClients.get(indexName)!;
  }

  // Search Operations
  async searchDocuments(params: {
    indexName: string;
    searchText: string;
    searchMode?: "any" | "all";
    searchFields?: string[];
    select?: string[];
    filter?: string;
    orderBy?: string[];
    top?: number;
    skip?: number;
    includeTotalCount?: boolean;
    facets?: string[];
    highlightFields?: string[];
    highlightPreTag?: string;
    highlightPostTag?: string;
    minimumCoverage?: number;
    queryType?: "simple" | "full";
  }): Promise<SearchResult> {
    try {
      const client = this.getSearchClient(params.indexName);
      
      const searchOptions: any = {
        searchMode: params.searchMode,
        searchFields: params.searchFields,
        select: params.select,
        filter: params.filter,
        orderBy: params.orderBy,
        top: params.top,
        skip: params.skip,
        includeTotalCount: params.includeTotalCount,
        facets: params.facets,
        highlightFields: params.highlightFields?.join(','), // Convert array to comma-separated string
        highlightPreTag: params.highlightPreTag,
        highlightPostTag: params.highlightPostTag,
        minimumCoverage: params.minimumCoverage,
        queryType: params.queryType,
      };

      const response = await client.search(params.searchText, searchOptions);
      
      const results = [];
      for await (const result of response.results) {
        results.push(result);
      }

      // Remove vector fields from results
      const filteredResults = this.removeVectorFields(results);

      return {
        success: true,
        data: {
          results: filteredResults,
          count: response.count,
          facets: response.facets,
          coverage: response.coverage,
          // nextPageParameters: response.nextPageParameters, // Property doesn't exist in current API
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async getDocument(params: {
    indexName: string;
    key: string;
    select?: string[];
  }): Promise<DocumentResult> {
    try {
      const client = this.getSearchClient(params.indexName);
      
      const result = await client.getDocument(params.key, {
        selectedFields: params.select,
      });

      // Remove vector fields from result
      const filteredResult = this.removeVectorFields([result])[0];

      return {
        success: true,
        data: filteredResult,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async suggest(params: {
    indexName: string;
    searchText: string;
    suggesterName: string;
    fuzzy?: boolean;
    highlightPreTag?: string;
    highlightPostTag?: string;
    minimumCoverage?: number;
    orderBy?: string[];
    searchFields?: string[];
    select?: string[];
    top?: number;
    filter?: string;
  }): Promise<SuggestResult> {
    try {
      const client = this.getSearchClient(params.indexName);
      
      const response = await client.suggest(params.searchText, params.suggesterName, {
        useFuzzyMatching: params.fuzzy,
        highlightPreTag: params.highlightPreTag,
        highlightPostTag: params.highlightPostTag,
        minimumCoverage: params.minimumCoverage,
        orderBy: params.orderBy,
        searchFields: params.searchFields,
        select: params.select,
        top: params.top,
        filter: params.filter,
      });

      return {
        success: true,
        data: {
          results: response.results.map(r => ({
            text: r.text,
            document: r.document,
          })),
          coverage: response.coverage,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async autocomplete(params: {
    indexName: string;
    searchText: string;
    suggesterName: string;
    autocompleteMode?: "oneTerm" | "twoTerms" | "oneTermWithContext";
    fuzzy?: boolean;
    highlightPreTag?: string;
    highlightPostTag?: string;
    minimumCoverage?: number;
    searchFields?: string[];
    top?: number;
    filter?: string;
  }): Promise<AutocompleteResult> {
    try {
      const client = this.getSearchClient(params.indexName);
      
      const response = await client.autocomplete(params.searchText, params.suggesterName, {
        autocompleteMode: params.autocompleteMode,
        useFuzzyMatching: params.fuzzy,
        highlightPreTag: params.highlightPreTag,
        highlightPostTag: params.highlightPostTag,
        minimumCoverage: params.minimumCoverage,
        searchFields: params.searchFields,
        top: params.top,
        filter: params.filter,
      });

      return {
        success: true,
        data: {
          results: response.results.map(r => ({
            text: r.text,
            queryPlusText: r.queryPlusText,
          })),
          coverage: response.coverage,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Index Management
  async listIndexes(params?: { select?: string[] }): Promise<IndexResult> {
    try {
      console.error("=== DEBUG: Starting listIndexes ===");
      console.error("Config:", { 
        endpoint: this.config.endpoint, 
        hasApiKey: !!this.config.apiKey,
        apiKeyPrefix: this.config.apiKey?.substring(0, 10) + "..."
      });
      
      const client = this.getIndexClient();
      console.error("=== DEBUG: IndexClient created successfully ===");
      
      const response = await client.listIndexes();
      console.error("=== DEBUG: listIndexes response received ===");
      console.error("Response type:", typeof response);
      console.error("Response constructor:", response.constructor.name);
      
      const indexes = [];
      let count = 0;
      for await (const index of response) {
        count++;
        console.error(`=== DEBUG: Processing index #${count} ===`);
        console.error("Index type:", typeof index);
        console.error("Index keys:", Object.keys(index));
        console.error("Index name:", index.name);
        console.error("Raw index object:", JSON.stringify(index, null, 2));
        
        if (params?.select && params.select.length > 0) {
          const filteredIndex: any = {};
          for (const field of params.select) {
            if (field in index) {
              filteredIndex[field] = (index as any)[field];
            }
          }
          indexes.push(filteredIndex);
        } else {
          // Debug: Include raw data in response for troubleshooting
          const debugInfo = {
            indexType: typeof index,
            indexKeys: Object.keys(index),
            indexName: index.name,
            indexConstructor: index.constructor?.name
          };
          
          // Try multiple approaches to get the data
          let simplifiedIndex;
          
          try {
            // Approach 1: Manual property extraction
            simplifiedIndex = {
              _debug: debugInfo,
              name: index.name || "unknown",
              etag: index.etag || null,
              fieldsCount: (index.fields?.length) || 0,
              fields: index.fields ? index.fields.map((field: any) => ({
                name: field.name || "unknown",
                type: field.type || "unknown",
                key: Boolean(field.key),
                searchable: Boolean(field.searchable),
                filterable: Boolean(field.filterable),
                facetable: Boolean(field.facetable),
                sortable: Boolean(field.sortable),
                vectorSearchDimensions: field.vectorSearchDimensions || null
              })) : [],
              suggesters: index.suggesters ? index.suggesters.map((s: any) => ({
                name: s.name || "unknown",
                searchMode: s.searchMode || null,
                sourceFields: s.sourceFields || []
              })) : [],
              scoringProfiles: index.scoringProfiles ? index.scoringProfiles.map((sp: any) => sp.name || "unknown") : [],
              hasSemanticSearch: Boolean(index.semanticSearch?.configurations?.length),
              hasVectorSearch: Boolean(index.vectorSearch?.profiles?.length),
              corsOptions: index.corsOptions ? {
                allowedOrigins: index.corsOptions.allowedOrigins || [],
                maxAgeInSeconds: index.corsOptions.maxAgeInSeconds || 0
              } : null
            };
          } catch (error) {
            // Fallback: just return basic info
            simplifiedIndex = {
              _error: "Failed to parse index object",
              _debug: debugInfo,
              _rawIndex: JSON.stringify(index, null, 2).substring(0, 500) + "..."
            };
          }
          
          indexes.push(simplifiedIndex);
        }
      }
      
      console.error(`=== DEBUG: Processed ${count} indexes total ===`);
      console.error("Final indexes array length:", indexes.length);

      return {
        success: true,
        data: indexes,
      };
    } catch (error) {
      console.error("=== DEBUG: Error in listIndexes ===");
      console.error("Error:", error);
      console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async getIndex(indexName: string): Promise<IndexResult> {
    try {
      const client = this.getIndexClient();
      const index = await client.getIndex(indexName);

      // Return a clean, serializable version of the index
      const cleanIndex = JSON.parse(JSON.stringify(index));

      return {
        success: true,
        data: cleanIndex,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async getIndexStatistics(indexName: string): Promise<IndexResult> {
    try {
      const client = this.getIndexClient();
      const stats = await client.getIndexStatistics(indexName);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Document Management
  async uploadDocuments(params: {
    indexName: string;
    documents: any[];
  }): Promise<BatchResult> {
    try {
      const client = this.getSearchClient(params.indexName);
      const response = await client.uploadDocuments(params.documents);

      return {
        success: true,
        data: {
          results: response.results.map(r => ({
            key: r.key,
            status: r.succeeded,
            errorMessage: r.errorMessage,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async mergeDocuments(params: {
    indexName: string;
    documents: any[];
  }): Promise<BatchResult> {
    try {
      const client = this.getSearchClient(params.indexName);
      const response = await client.mergeDocuments(params.documents);

      return {
        success: true,
        data: {
          results: response.results.map(r => ({
            key: r.key,
            status: r.succeeded,
            errorMessage: r.errorMessage,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async deleteDocuments(params: {
    indexName: string;
    keyField: string;
    keyValues: string[];
  }): Promise<BatchResult> {
    try {
      const client = this.getSearchClient(params.indexName);
      
      // Convert key values to documents for deletion
      const documentsToDelete = params.keyValues.map(key => ({
        [params.keyField]: key,
      }));

      const response = await client.deleteDocuments(documentsToDelete);

      return {
        success: true,
        data: {
          results: response.results.map(r => ({
            key: r.key,
            status: r.succeeded,
            errorMessage: r.errorMessage,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Phase 4: Vector Search Operations
  async vectorSearch(params: {
    indexName: string;
    vectorQueries: VectorQuery[];
    select?: string[];
    filter?: string;
    top?: number;
    skip?: number;
  }): Promise<VectorSearchResult> {
    try {
      const client = this.getSearchClient(params.indexName);
      
      const searchOptions: any = {
        vectorQueries: params.vectorQueries.map(vq => ({
          vector: vq.vector,
          fields: vq.fields,
          k: vq.k,
          exhaustive: vq.exhaustive,
        })),
        select: params.select,
        filter: params.filter,
        top: params.top,
        skip: params.skip,
      };

      const response = await client.search("*", searchOptions);
      
      const results = [];
      for await (const result of response.results) {
        results.push(result);
      }

      // Remove vector fields from results
      const filteredResults = this.removeVectorFields(results);

      return {
        success: true,
        data: {
          results: filteredResults,
          count: response.count,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async hybridSearch(params: {
    indexName: string;
    searchText: string;
    vectorQueries: VectorQuery[];
    searchMode?: "any" | "all";
    searchFields?: string[];
    select?: string[];
    filter?: string;
    orderBy?: string[];
    top?: number;
    skip?: number;
    queryType?: "simple" | "full";
  }): Promise<SearchResult> {
    try {
      const client = this.getSearchClient(params.indexName);
      
      const searchOptions: any = {
        searchMode: params.searchMode,
        searchFields: params.searchFields,
        vectorQueries: params.vectorQueries.map(vq => ({
          vector: vq.vector,
          fields: vq.fields,
          k: vq.k,
          exhaustive: vq.exhaustive,
        })),
        select: params.select,
        filter: params.filter,
        orderBy: params.orderBy,
        top: params.top,
        skip: params.skip,
        queryType: params.queryType,
      };

      const response = await client.search(params.searchText, searchOptions);
      
      const results = [];
      for await (const result of response.results) {
        results.push(result);
      }

      // Remove vector fields from results
      const filteredResults = this.removeVectorFields(results);

      return {
        success: true,
        data: {
          results: filteredResults,
          count: response.count,
          facets: response.facets,
          coverage: response.coverage,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Phase 4: Semantic Search Operations
  async semanticSearch(params: {
    indexName: string;
    searchText: string;
    semanticConfiguration: string;
    searchFields?: string[];
    select?: string[];
    filter?: string;
    orderBy?: string[];
    top?: number;
    skip?: number;
    answers?: {
      answerType: "extractive";
      count?: number;
      threshold?: number;
    };
    captions?: {
      captionType: "extractive";
      maxTextRecordsToProcess?: number;
      highlight?: boolean;
    };
  }): Promise<SemanticSearchResult> {
    try {
      const client = this.getSearchClient(params.indexName);
      
      const searchOptions: any = {
        queryType: "semantic",
        semanticConfiguration: params.semanticConfiguration,
        searchFields: params.searchFields,
        select: params.select,
        filter: params.filter,
        orderBy: params.orderBy,
        top: params.top,
        skip: params.skip,
      };

      // Add semantic answers if configured
      if (params.answers) {
        searchOptions.answers = {
          answerType: params.answers.answerType,
          count: params.answers.count,
          threshold: params.answers.threshold,
        };
      }

      // Add semantic captions if configured
      if (params.captions) {
        searchOptions.captions = {
          captionType: params.captions.captionType,
          maxTextRecordsToProcess: params.captions.maxTextRecordsToProcess,
          highlight: params.captions.highlight,
        };
      }

      const response = await client.search(params.searchText, searchOptions);
      
      const results = [];
      for await (const result of response.results) {
        results.push(result);
      }

      // Remove vector fields from results
      const filteredResults = this.removeVectorFields(results);

      return {
        success: true,
        data: {
          results: filteredResults,
          count: response.count,
          answers: (response as any).answers?.map((answer: any) => ({
            key: answer.key || "",
            text: answer.text || "",
            highlights: answer.highlights || "",
            score: answer.score || 0,
          })),
          captions: (response as any).captions?.map((caption: any) => ({
            text: caption.text || "",
            highlights: caption.highlights || "",
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}