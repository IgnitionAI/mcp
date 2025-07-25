import { z } from "zod";

// Azure AI Search Configuration
export const AzureSearchConfigSchema = z.object({
  endpoint: z.string().url().describe("Azure Search service endpoint"),
  apiKey: z.string().optional().describe("Azure Search API key"),
  apiVersion: z.string().optional().default("2023-11-01").describe("Azure Search API version"),
});

export type AzureSearchConfig = z.infer<typeof AzureSearchConfigSchema>;

// Search Query Parameters
export const SearchDocumentsSchema = z.object({
  indexName: z.string().min(1).describe("Name of the search index"),
  searchText: z.string().describe("Text to search for (use '*' for all documents)"),
  searchMode: z.enum(["any", "all"]).optional().default("any").describe("Search mode: any (OR) or all (AND)"),
  searchFields: z.array(z.string()).optional().describe("Fields to search in"),
  select: z.array(z.string()).optional().describe("Fields to include in results"),
  filter: z.string().optional().describe("OData filter expression"),
  orderBy: z.array(z.string()).optional().describe("Sort order (field asc/desc)"),
  top: z.number().min(1).max(1000).optional().default(50).describe("Number of results to return (1-1000)"),
  skip: z.number().min(0).optional().describe("Number of results to skip"),
  includeTotalCount: z.boolean().optional().default(false).describe("Include total count in response"),
  facets: z.array(z.string()).optional().describe("Facet fields"),
  highlightFields: z.array(z.string()).optional().describe("Fields to highlight"),
  highlightPreTag: z.string().optional().default("<em>").describe("Pre-tag for highlighting"),
  highlightPostTag: z.string().optional().default("</em>").describe("Post-tag for highlighting"),
  minimumCoverage: z.number().min(0).max(100).optional().describe("Minimum coverage percentage"),
  queryType: z.enum(["simple", "full"]).optional().default("simple").describe("Query type: simple or full (Lucene)"),
});

export type SearchDocumentsParams = z.infer<typeof SearchDocumentsSchema>;

// Get Document Parameters
export const GetDocumentSchema = z.object({
  indexName: z.string().min(1).describe("Name of the search index"),
  key: z.string().describe("Document key"),
  select: z.array(z.string()).optional().describe("Fields to include in result"),
});

export type GetDocumentParams = z.infer<typeof GetDocumentSchema>;

// Suggest Parameters
export const SuggestSchema = z.object({
  indexName: z.string().min(1).describe("Name of the search index"),
  searchText: z.string().describe("Text to get suggestions for"),
  suggesterName: z.string().describe("Name of the suggester to use"),
  fuzzy: z.boolean().optional().default(false).describe("Enable fuzzy matching"),
  highlightPreTag: z.string().optional().default("<em>").describe("Pre-tag for highlighting"),
  highlightPostTag: z.string().optional().default("</em>").describe("Post-tag for highlighting"),
  minimumCoverage: z.number().min(0).max(100).optional().describe("Minimum coverage percentage"),
  orderBy: z.array(z.string()).optional().describe("Sort order"),
  searchFields: z.array(z.string()).optional().describe("Fields to search in"),
  select: z.array(z.string()).optional().describe("Fields to include in results"),
  top: z.number().min(1).max(100).optional().default(5).describe("Number of suggestions to return"),
  filter: z.string().optional().describe("OData filter expression"),
});

export type SuggestParams = z.infer<typeof SuggestSchema>;

// Autocomplete Parameters
export const AutocompleteSchema = z.object({
  indexName: z.string().min(1).describe("Name of the search index"),
  searchText: z.string().describe("Text to autocomplete"),
  suggesterName: z.string().describe("Name of the suggester to use"),
  autocompleteMode: z.enum(["oneTerm", "twoTerms", "oneTermWithContext"]).optional().default("oneTerm").describe("Autocomplete mode"),
  fuzzy: z.boolean().optional().default(false).describe("Enable fuzzy matching"),
  highlightPreTag: z.string().optional().default("<em>").describe("Pre-tag for highlighting"),
  highlightPostTag: z.string().optional().default("</em>").describe("Post-tag for highlighting"),
  minimumCoverage: z.number().min(0).max(100).optional().describe("Minimum coverage percentage"),
  searchFields: z.array(z.string()).optional().describe("Fields to search in"),
  top: z.number().min(1).max(100).optional().default(5).describe("Number of autocomplete terms to return"),
  filter: z.string().optional().describe("OData filter expression"),
});

export type AutocompleteParams = z.infer<typeof AutocompleteSchema>;

// Index Management
export const ListIndexesSchema = z.object({
  select: z.array(z.string()).optional().describe("Fields to include in results"),
});

export type ListIndexesParams = z.infer<typeof ListIndexesSchema>;

export const GetIndexSchema = z.object({
  indexName: z.string().min(1).describe("Name of the index"),
});

export type GetIndexParams = z.infer<typeof GetIndexSchema>;

export const GetIndexStatisticsSchema = z.object({
  indexName: z.string().min(1).describe("Name of the index"),
});

export type GetIndexStatisticsParams = z.infer<typeof GetIndexStatisticsSchema>;

// Document Management
export const UploadDocumentsSchema = z.object({
  indexName: z.string().min(1).describe("Name of the search index"),
  documents: z.array(z.record(z.any())).min(1).max(1000).describe("Documents to upload (max 1000)"),
});

export type UploadDocumentsParams = z.infer<typeof UploadDocumentsSchema>;

export const MergeDocumentsSchema = z.object({
  indexName: z.string().min(1).describe("Name of the search index"),
  documents: z.array(z.record(z.any())).min(1).max(1000).describe("Documents to merge (max 1000)"),
});

export type MergeDocumentsParams = z.infer<typeof MergeDocumentsSchema>;

export const DeleteDocumentsSchema = z.object({
  indexName: z.string().min(1).describe("Name of the search index"),
  keyField: z.string().describe("Name of the key field"),
  keyValues: z.array(z.string()).min(1).max(1000).describe("Key values of documents to delete (max 1000)"),
});

export type DeleteDocumentsParams = z.infer<typeof DeleteDocumentsSchema>;

// Response Types
export interface SearchResult<T = any> {
  success: boolean;
  data?: {
    results: T[];
    count?: number;
    facets?: Record<string, any[]>;
    coverage?: number;
    nextPageParameters?: any;
  };
  error?: string;
}

export interface DocumentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SuggestResult {
  success: boolean;
  data?: {
    results: Array<{
      text: string;
      document: any;
    }>;
    coverage?: number;
  };
  error?: string;
}

export interface AutocompleteResult {
  success: boolean;
  data?: {
    results: Array<{
      text: string;
      queryPlusText: string;
    }>;
    coverage?: number;
  };
  error?: string;
}

export interface IndexResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface BatchResult {
  success: boolean;
  data?: {
    results: Array<{
      key: string;
      status: boolean;
      errorMessage?: string;
    }>;
  };
  error?: string;
}

// Phase 4: Vector Search Schemas
export const VectorQuerySchema = z.object({
  vector: z.array(z.number()).describe("Vector values for similarity search"),
  fields: z.string().describe("Vector field name to search"),
  k: z.number().min(1).max(1000).optional().default(50).describe("Number of nearest neighbors to return"),
  exhaustive: z.boolean().optional().default(false).describe("Use exhaustive search for higher accuracy"),
});

export type VectorQuery = z.infer<typeof VectorQuerySchema>;

export const VectorSearchSchema = z.object({
  indexName: z.string().min(1).describe("Name of the search index"),
  vectorQueries: z.array(VectorQuerySchema).min(1).describe("Vector queries to execute"),
  select: z.array(z.string()).optional().describe("Fields to include in results"),
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().min(1).max(1000).optional().default(50).describe("Number of results to return"),
  skip: z.number().min(0).optional().describe("Number of results to skip"),
});

export type VectorSearchParams = z.infer<typeof VectorSearchSchema>;

export const HybridSearchSchema = z.object({
  indexName: z.string().min(1).describe("Name of the search index"),
  searchText: z.string().describe("Text query for hybrid search"),
  vectorQueries: z.array(VectorQuerySchema).min(1).describe("Vector queries for hybrid search"),
  searchMode: z.enum(["any", "all"]).optional().default("any").describe("Text search mode"),
  searchFields: z.array(z.string()).optional().describe("Text fields to search in"),
  select: z.array(z.string()).optional().describe("Fields to include in results"),
  filter: z.string().optional().describe("OData filter expression"),
  orderBy: z.array(z.string()).optional().describe("Sort order"),
  top: z.number().min(1).max(1000).optional().default(50).describe("Number of results to return"),
  skip: z.number().min(0).optional().describe("Number of results to skip"),
  queryType: z.enum(["simple", "full"]).optional().default("simple").describe("Text query type"),
});

export type HybridSearchParams = z.infer<typeof HybridSearchSchema>;

// Phase 4: Semantic Search Schemas
export const SemanticSearchSchema = z.object({
  indexName: z.string().min(1).describe("Name of the search index"),
  searchText: z.string().describe("Text to search semantically"),
  semanticConfiguration: z.string().describe("Name of the semantic configuration to use"),
  searchFields: z.array(z.string()).optional().describe("Fields to search in"),
  select: z.array(z.string()).optional().describe("Fields to include in results"),
  filter: z.string().optional().describe("OData filter expression"),
  orderBy: z.array(z.string()).optional().describe("Sort order"),
  top: z.number().min(1).max(1000).optional().default(50).describe("Number of results to return"),
  skip: z.number().min(0).optional().describe("Number of results to skip"),
  answers: z.object({
    answerType: z.enum(["extractive"]).default("extractive"),
    count: z.number().min(1).max(10).optional().default(3).describe("Number of answers to generate"),
    threshold: z.number().min(0).max(1).optional().default(0.7).describe("Confidence threshold for answers"),
  }).optional().describe("Semantic answers configuration"),
  captions: z.object({
    captionType: z.enum(["extractive"]).default("extractive"),
    maxTextRecordsToProcess: z.number().min(1).max(1000).optional().default(1000),
    highlight: z.boolean().optional().default(true).describe("Enable highlighting in captions"),
  }).optional().describe("Semantic captions configuration"),
});

export type SemanticSearchParams = z.infer<typeof SemanticSearchSchema>;

// Phase 4: Response Types for Vector and Semantic Search
export interface VectorSearchResult<T = any> {
  success: boolean;
  data?: {
    results: T[];
    count?: number;
  };
  error?: string;
}

export interface SemanticSearchResult<T = any> {
  success: boolean;
  data?: {
    results: T[];
    count?: number;
    answers?: Array<{
      key: string;
      text: string;
      highlights: string;
      score: number;
    }>;
    captions?: Array<{
      text: string;
      highlights: string;
    }>;
  };
  error?: string;
}