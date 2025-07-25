#!/usr/bin/env node

// Test script pour les nouvelles fonctionnalités Phase 4
// Vector Search et Semantic Search sur l'index Elite Dangerous

import { searchDocuments } from './dist/tools/search-tools.js';
import { vectorSearch, semanticSearch } from './dist/tools/vector-tools.js';

const indexName = "rag-1753386801239";

console.log("🚀 Test Phase 4 - Vector & Semantic Search sur Elite Dangerous RAG");
console.log("================================================================\n");

// Test 1: Recherche classique sur les Thargoids
console.log("📖 Test 1: Recherche classique - 'thargoid combat'");
try {
  const classicResult = await searchDocuments({
    indexName,
    searchText: "thargoid combat",
    top: 3,
    highlightFields: ["chunk", "title"]
  });
  
  console.log("Résultats:", classicResult.success ? classicResult.data.results.length : "Erreur");
  if (classicResult.success && classicResult.data.results.length > 0) {
    console.log("Premier résultat:", classicResult.data.results[0]?.document?.title || "N/A");
  }
  console.log("---");
} catch (error) {
  console.log("Erreur test 1:", error.message);
}

// Test 2: Recherche vectorielle pure (nécessite un vrai embedding)
console.log("🔍 Test 2: Vector Search - simulation");
try {
  // Vector simulé - en vrai il faudrait un embedding d'OpenAI pour "thargoid combat"
  const dummyVector = Array(1536).fill(0).map(() => Math.random() * 0.1);
  
  const vectorResult = await vectorSearch({
    indexName,
    vectorQueries: [{
      vector: dummyVector,
      fields: "text_vector", 
      k: 3
    }],
    top: 3
  });
  
  console.log("Résultats vector:", vectorResult.success ? "OK" : vectorResult.error);
} catch (error) {
  console.log("Erreur test 2:", error.message);
}

// Test 3: Recherche sémantique avec réponses
console.log("🧠 Test 3: Semantic Search avec réponses");
try {
  const semanticResult = await semanticSearch({
    indexName,
    searchText: "Comment combattre efficacement les Thargoids dans Elite Dangerous ?",
    semanticConfiguration: "rag-1753386801239-semantic-configuration",
    answers: {
      answerType: "extractive",
      count: 2,
      threshold: 0.6
    },
    captions: {
      captionType: "extractive",
      highlight: true
    },
    top: 5
  });
  
  console.log("Résultats semantic:", semanticResult.success ? "OK" : semanticResult.error);
  if (semanticResult.success) {
    console.log("Réponses trouvées:", semanticResult.data?.answers?.length || 0);
    console.log("Captions trouvées:", semanticResult.data?.captions?.length || 0);
  }
} catch (error) {
  console.log("Erreur test 3:", error.message);
}

console.log("\n✅ Tests Phase 4 terminés !");