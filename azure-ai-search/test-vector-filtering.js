#!/usr/bin/env node

/**
 * Test script to demonstrate vector field filtering
 * This simulates the exact data structure from the LangSmith trace
 */

// Simulate the AzureSearchTools class methods for testing
class TestVectorFilter {
  /**
   * Determines if a field is a vector field that should be removed
   */
  isVectorField(key, value) {
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
        value.every((item) => typeof item === 'number')) {
      return true;
    }
    
    return false;
  }

  /**
   * Recursively removes vector fields from an object
   */
  filterVectorFieldsRecursive(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      // Check if this field should be removed
      if (this.isVectorField(key, value)) {
        console.log(`🗑️  REMOVING vector field: "${key}" (${Array.isArray(value) ? `array of ${value.length} numbers` : typeof value})`);
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
   * Removes vector fields from search results
   */
  removeVectorFields(results) {
    return results.map(result => {
      if (!result || typeof result !== 'object') return result;
      
      const filteredResult = { ...result };
      
      // Recursively filter nested objects (like document property)
      this.filterVectorFieldsRecursive(filteredResult);
      
      return filteredResult;
    });
  }
}

// Test data simulating the exact structure from LangSmith trace
const mockSearchResults = [
  {
    score: 15.204945,
    document: {
      chunk_id: "fc37433d5ae7_aHR0cHM6Ly9zdG9yYWdlcG9ydGZvbGlv",
      parent_id: "aHR0cHM6Ly9zdG9yYWdlcG9ydGZvbGlv",
      chunk: "alpha, beta et gamma) le 16 décembre 2014, Release Version 1.0.",
      title: "galnet.fr_elite-dangerous-release-s1_.md",
      header_1: "Elite Dangerous - Saison 1 RELEASE",
      header_2: "Elite Dangerous, Saison 1",
      header_3: "",
      // This is the problematic field from the trace - huge vector array
      text_vector: Array.from({length: 1536}, (_, i) => Math.random() * 2 - 1), // 1536 random numbers
      // Additional vector fields to test
      embedding_field: Array.from({length: 768}, (_, i) => Math.random()),
      content_Vector: Array.from({length: 512}, (_, i) => Math.random()),
      search_embedding: Array.from({length: 256}, (_, i) => Math.random())
    }
  },
  {
    score: 15.084188,
    document: {
      chunk_id: "38fab6c7b272_aHR0cHM6Ly9zdG9yYWdlcG9ydGZvbGlv",
      chunk: "Les bêtas dans Elite: Dangerous sont toujours des moments assez 'épiques'",
      title: "galnet.fr_beta-elite-dangerous-faq_.md",
      text_vector: Array.from({length: 1536}, (_, i) => Math.random() * 2 - 1),
      // Test edge cases
      small_array: [1, 2, 3], // Should NOT be removed (too small)
      large_string_array: Array.from({length: 100}, (_, i) => `item${i}`), // Should NOT be removed (not numbers)
      mixed_array: [1, "text", 3] // Should NOT be removed (mixed types)
    }
  }
];

console.log("🧪 TESTING VECTOR FIELD FILTERING");
console.log("=" .repeat(50));

const filter = new TestVectorFilter();

console.log("\n📊 BEFORE FILTERING:");
console.log(`Result 1 - document keys: ${Object.keys(mockSearchResults[0].document).join(', ')}`);
console.log(`Result 1 - text_vector length: ${mockSearchResults[0].document.text_vector.length}`);
console.log(`Result 2 - document keys: ${Object.keys(mockSearchResults[1].document).join(', ')}`);

console.log("\n🔄 APPLYING FILTER...");
const filteredResults = filter.removeVectorFields(mockSearchResults);

console.log("\n✅ AFTER FILTERING:");
console.log(`Result 1 - document keys: ${Object.keys(filteredResults[0].document).join(', ')}`);
console.log(`Result 2 - document keys: ${Object.keys(filteredResults[1].document).join(', ')}`);

console.log("\n🎯 VERIFICATION:");
const hasVectorFields = filteredResults.some(result => {
  const doc = result.document;
  return Object.keys(doc).some(key => 
    key.toLowerCase().includes('vector') || 
    key.toLowerCase().includes('embedding') ||
    (Array.isArray(doc[key]) && doc[key].length > 50 && doc[key].every(item => typeof item === 'number'))
  );
});

if (hasVectorFields) {
  console.log("❌ FAILED: Vector fields still present!");
} else {
  console.log("✅ SUCCESS: No vector fields found in filtered results!");
}

console.log("\n📋 PRESERVED FIELDS:");
filteredResults.forEach((result, index) => {
  console.log(`Result ${index + 1}:`, Object.keys(result.document).join(', '));
});

console.log("\n🎉 Test completed!");
