import {
  UploadDocumentsSchema,
  MergeDocumentsSchema,
  DeleteDocumentsSchema,
} from "../types.js";

// Reuse the same singleton instance
import { getAzureSearchTools } from "./search-tools.js";

export async function uploadDocuments(params: any) {
  try {
    console.error("=== DEBUG uploadDocuments tool: params received ===", {
      indexName: params.indexName,
      documentsCount: params.documents?.length,
      firstDocKeys: params.documents?.[0] ? Object.keys(params.documents[0]) : []
    });
    
    const validatedParams = UploadDocumentsSchema.parse(params);
    console.error("=== DEBUG uploadDocuments tool: validated params ===", {
      indexName: validatedParams.indexName,
      documentsCount: validatedParams.documents.length
    });
    
    const tools = getAzureSearchTools();
    const result = await tools.uploadDocuments(validatedParams as any);
    
    console.error("=== DEBUG uploadDocuments tool: result ===", {
      success: result.success,
      resultsCount: result.data?.results?.length,
      error: result.error
    });
    
    return result;
  } catch (error) {
    console.error("=== DEBUG uploadDocuments tool: error ===", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in uploadDocuments tool"
    };
  }
}

export async function mergeDocuments(params: any) {
  try {
    console.error("=== DEBUG mergeDocuments tool: params received ===", {
      indexName: params.indexName,
      documentsCount: params.documents?.length,
      firstDocKeys: params.documents?.[0] ? Object.keys(params.documents[0]) : []
    });
    
    const validatedParams = MergeDocumentsSchema.parse(params);
    console.error("=== DEBUG mergeDocuments tool: validated params ===", {
      indexName: validatedParams.indexName,
      documentsCount: validatedParams.documents.length
    });
    
    const tools = getAzureSearchTools();
    const result = await tools.mergeDocuments(validatedParams as any);
    
    console.error("=== DEBUG mergeDocuments tool: result ===", {
      success: result.success,
      resultsCount: result.data?.results?.length,
      error: result.error
    });
    
    return result;
  } catch (error) {
    console.error("=== DEBUG mergeDocuments tool: error ===", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in mergeDocuments tool"
    };
  }
}

export async function deleteDocuments(params: any) {
  try {
    console.error("=== DEBUG deleteDocuments tool: params received ===", {
      indexName: params.indexName,
      keyField: params.keyField,
      keyValuesCount: params.keyValues?.length,
      keyValues: params.keyValues
    });
    
    const validatedParams = DeleteDocumentsSchema.parse(params);
    console.error("=== DEBUG deleteDocuments tool: validated params ===", {
      indexName: validatedParams.indexName,
      keyField: validatedParams.keyField,
      keyValuesCount: validatedParams.keyValues.length
    });
    
    const tools = getAzureSearchTools();
    const result = await tools.deleteDocuments(validatedParams as any);
    
    console.error("=== DEBUG deleteDocuments tool: result ===", {
      success: result.success,
      resultsCount: result.data?.results?.length,
      error: result.error
    });
    
    return result;
  } catch (error) {
    console.error("=== DEBUG deleteDocuments tool: error ===", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in deleteDocuments tool"
    };
  }
}