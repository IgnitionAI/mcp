import {
  VectorSearchSchema,
  HybridSearchSchema,
  SemanticSearchSchema,
} from "../types.js";

// Reuse the same singleton instance
import { getAzureSearchTools } from "./search-tools.js";

export async function vectorSearch(params: any) {
  try {
    const validatedParams = VectorSearchSchema.parse(params);
    const tools = getAzureSearchTools();
    const result = await tools.vectorSearch(validatedParams as any);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in vectorSearch tool"
    };
  }
}

export async function hybridSearch(params: any) {
  try {
    const validatedParams = HybridSearchSchema.parse(params);
    const tools = getAzureSearchTools();
    const result = await tools.hybridSearch(validatedParams as any);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in hybridSearch tool"
    };
  }
}

export async function semanticSearch(params: any) {
  try {
    const validatedParams = SemanticSearchSchema.parse(params);
    const tools = getAzureSearchTools();
    const result = await tools.semanticSearch(validatedParams as any);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in semanticSearch tool"
    };
  }
}