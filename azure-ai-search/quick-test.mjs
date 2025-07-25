// Test simple avec MCP Client
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

console.log("🚀 Test rapide Phase 4 - Elite Dangerous");

const serverProcess = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

const transport = new StdioClientTransport({
  process: serverProcess,
});

const client = new Client(
  { name: 'test-client', version: '1.0.0' },
  { capabilities: {} }
);

try {
  await client.connect(transport);
  console.log("✅ Connecté au serveur MCP");

  // Test 1: Search classique
  console.log("\n📖 Test search-documents...");
  const searchResult = await client.request(
    { method: 'tools/call' },
    {
      name: 'search-documents',
      arguments: {
        indexName: 'rag-1753386801239',
        searchText: 'thargoid',
        top: 2
      }
    }
  );
  console.log("Résultat search:", searchResult.content[0].text.substring(0, 200) + "...");

  // Test 2: Semantic search
  console.log("\n🧠 Test semantic-search...");
  const semanticResult = await client.request(
    { method: 'tools/call' },
    {
      name: 'semantic-search', 
      arguments: {
        indexName: 'rag-1753386801239',
        searchText: 'Comment combattre les Thargoids ?',
        semanticConfiguration: 'rag-1753386801239-semantic-configuration',
        answers: { count: 2, threshold: 0.6 },
        top: 3
      }
    }
  );
  console.log("Résultat semantic:", semanticResult.content[0].text.substring(0, 200) + "...");

  console.log("\n✅ Tests terminés avec succès !");

} catch (error) {
  console.error("❌ Erreur:", error.message);
} finally {
  await client.close();
  serverProcess.kill();
}