import { AzureSearchTools } from "../lib/azure-search-client.js";
import {
  SearchDocumentsSchema,
  GetDocumentSchema,
  SuggestSchema,
  AutocompleteSchema,
} from "../types.js";

// Singleton instance with lazy loading
let azureSearchTools: AzureSearchTools | null = null;

export function getAzureSearchTools(): AzureSearchTools {
  if (!azureSearchTools) {
    azureSearchTools = new AzureSearchTools();
  }
  return azureSearchTools;
}

export async function searchDocuments(params: any) {
  const validatedParams = SearchDocumentsSchema.parse(params);
  const tools = getAzureSearchTools();
  return await tools.searchDocuments(validatedParams as any);
}

export async function getDocument(params: any) {
  const validatedParams = GetDocumentSchema.parse(params);
  const tools = getAzureSearchTools();
  return await tools.getDocument(validatedParams as any);
}

export async function suggest(params: any) {
  const validatedParams = SuggestSchema.parse(params);
  const tools = getAzureSearchTools();
  return await tools.suggest(validatedParams as any);
}

export async function autocomplete(params: any) {
  const validatedParams = AutocompleteSchema.parse(params);
  const tools = getAzureSearchTools();
  return await tools.autocomplete(validatedParams as any);
}