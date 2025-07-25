import {
  ListIndexesSchema,
  GetIndexSchema,
  GetIndexStatisticsSchema,
} from "../types.js";

// Reuse the same singleton instance
import { getAzureSearchTools } from "./search-tools.js";

export async function listIndexes(params: any) {
  try {
    console.error("=== DEBUG listIndexes tool: params received ===", params);
    
    // Handle empty params case
    const validatedParams = params ? ListIndexesSchema.parse(params) : {};
    console.error("=== DEBUG listIndexes tool: validated params ===", validatedParams);
    
    const tools = getAzureSearchTools();
    const result = await tools.listIndexes(validatedParams as any);
    
    console.error("=== DEBUG listIndexes tool: result ===", {
      success: result.success,
      dataLength: result.data?.length,
      error: result.error
    });
    
    return result;
  } catch (error) {
    console.error("=== DEBUG listIndexes tool: error ===", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in listIndexes tool"
    };
  }
}

export async function getIndexSchema(params: any) {
  const validatedParams = GetIndexSchema.parse(params);
  const tools = getAzureSearchTools();
  return await tools.getIndex(validatedParams.indexName);
}

export async function getIndexStatistics(params: any) {
  const validatedParams = GetIndexStatisticsSchema.parse(params);
  const tools = getAzureSearchTools();
  return await tools.getIndexStatistics(validatedParams.indexName);
}