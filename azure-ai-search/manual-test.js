#!/usr/bin/env node

// Test manuel simple pour Phase 4
import dotenv from 'dotenv';
import { AzureSearchTools } from './lib/azure-search-client.js';

dotenv.config();

const tools = new AzureSearchTools();
const indexName = "rag-1753386801239";

console.log("🚀 Test Phase 4 - Elite Dangerous RAG");
console.log("=====================================\n");

// Test 1: Recherche classique Thargoids
console.log("📖 Test 1: Recherche classique 'thargoid'");
try {
  const result = await tools.searchDocuments({
    indexName,
    searchText: "thargoid",
    top: 2,
    highlightFields: ["chunk", "title"]
  });
  
  if (result.success) {
    console.log(`✅ Trouvé ${result.data.results.length} résultats`);
    if (result.data.results.length > 0) {
      const first = result.data.results[0];
      console.log(`📄 Premier: "${first.document?.title || 'Sans titre'}" (score: ${first.score || 'N/A'})`);
    }
  } else {
    console.log("❌ Erreur:", result.error);
  }
} catch (error) {
  console.log("❌ Exception:", error.message);
}

console.log("\n" + "=".repeat(50));

// Test 2: Recherche vectorielle avec un vecteur simulé
console.log("🔍 Test 2: Vector Search (simulé)");
try {
  // Vecteur aléatoire pour test (en production il faudrait un vrai embedding)
  const dummyVector = Array(1536).fill(0).map(() => Math.random() * 0.001);
  
  const result = await tools.vectorSearch({
    indexName,
    vectorQueries: [{
      vector: dummyVector,
      fields: "text_vector",
      k: 2
    }]
  });
  
  if (result.success) {
    console.log(`✅ Vector search OK: ${result.data.results.length} résultats`);
    if (result.data.results.length > 0) {
      const first = result.data.results[0];
      console.log(`📄 Premier: "${first.document?.title || 'Sans titre'}" (score: ${first.score || 'N/A'})`);
    }
  } else {
    console.log("❌ Vector search erreur:", result.error);
  }
} catch (error) {
  console.log("❌ Vector search exception:", error.message);
}

console.log("\n" + "=".repeat(50));

// Test 3: Recherche sémantique
console.log("🧠 Test 3: Semantic Search");
try {
  const result = await tools.semanticSearch({
    indexName,
    searchText: "Comment combattre les Thargoids efficacement ?",
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
    top: 3
  });
  
  if (result.success) {
    console.log(`✅ Semantic search OK: ${result.data.results.length} résultats`);
    console.log(`📝 Réponses extraites: ${result.data.answers?.length || 0}`);
    console.log(`💬 Captions: ${result.data.captions?.length || 0}`);
    
    // Afficher la première réponse si disponible
    if (result.data.answers && result.data.answers.length > 0) {
      const answer = result.data.answers[0];
      console.log(`🎯 Première réponse (score ${answer.score}): ${answer.text.substring(0, 100)}...`);
    }
  } else {
    console.log("❌ Semantic search erreur:", result.error);
  }
} catch (error) {
  console.log("❌ Semantic search exception:", error.message);
}

console.log("\n✅ Tests Phase 4 terminés !");