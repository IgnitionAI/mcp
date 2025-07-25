# Tests Phase 4 - Vector & Semantic Search
## Index Elite Dangerous RAG: `rag-1753386801239`

Voici les tests à effectuer pour valider la Phase 4 sur ton index Elite Dangerous.

## Configuration Index Découverte
- **Champ vector**: `text_vector` (1536 dimensions)
- **Config sémantique**: `rag-1753386801239-semantic-configuration`
- **Champs searchables**: `chunk`, `title`, `header_1`, `header_2`, `header_3`
- **Profil vectoriel**: `rag-1753386801239-azureOpenAi-text-profile`

---

## Test 1: 📖 Search Documents Classique
**Tool**: `search-documents`
```json
{
  "indexName": "rag-1753386801239",
  "searchText": "thargoid combat",
  "top": 5,
  "highlightFields": ["chunk", "title"],
  "highlightPreTag": "<mark>",
  "highlightPostTag": "</mark>"
}
```

**Résultat attendu**: Articles/guides sur le combat contre les Thargoids avec highlighting.

---

## Test 2: 🔍 Vector Search 
**Tool**: `vector-search`
```json
{
  "indexName": "rag-1753386801239",
  "vectorQueries": [
    {
      "vector": [0.001, 0.002, 0.001, ...répéter 1536 fois...],
      "fields": "text_vector",
      "k": 5,
      "exhaustive": false
    }
  ],
  "top": 5
}
```

**Note**: Pour un vrai test, il faudrait un embedding généré par OpenAI text-embedding-3-small pour un concept comme "ship combat" ou "exploration".

---

## Test 3: 🧠 Semantic Search avec Réponses
**Tool**: `semantic-search`
```json
{
  "indexName": "rag-1753386801239",
  "searchText": "Comment combattre efficacement les Thargoids dans Elite Dangerous ?",
  "semanticConfiguration": "rag-1753386801239-semantic-configuration",
  "answers": {
    "answerType": "extractive",
    "count": 3,
    "threshold": 0.7
  },
  "captions": {
    "captionType": "extractive",
    "maxTextRecordsToProcess": 1000,
    "highlight": true
  },
  "top": 5
}
```

**Résultat attendu**: 
- Réponses extraites directement du contenu
- Captions avec highlighting
- Ranking sémantique amélioré

---

## Test 4: 🔥 Hybrid Search (Text + Vector)
**Tool**: `hybrid-search`
```json
{
  "indexName": "rag-1753386801239",
  "searchText": "ship loadout",
  "vectorQueries": [
    {
      "vector": [... embedding pour "ship loadout" ...],
      "fields": "text_vector",
      "k": 10
    }
  ],
  "searchMode": "any",
  "top": 5
}
```

**Résultat attendu**: Combinaison optimale de pertinence textuelle et vectorielle.

---

## Autres Tests Utiles

### Test index management
```json
// Tool: list-indexes
{}

// Tool: get-index-schema  
{
  "indexName": "rag-1753386801239"
}
```

### Test recherche spécialisée Elite Dangerous
```json
// Tool: search-documents
{
  "indexName": "rag-1753386801239", 
  "searchText": "guardian technology ruins",
  "searchFields": ["chunk", "title"],
  "filter": null,
  "top": 10
}
```

---

## Instructions de Test

1. **Lance l'inspecteur MCP** : `pnpm inspect`
2. **Ouvre** http://localhost:3000 dans le navigateur
3. **Teste chaque tool** avec les exemples ci-dessus
4. **Vérifie** les résultats pour :
   - ✅ Pas d'erreurs de connexion
   - ✅ Réponses bien formatées 
   - ✅ Contenu pertinent Elite Dangerous
   - ✅ Nouvelles fonctionnalités (semantic answers, vector similarity)

## Résultats Attendus

### ✅ Phase 4 Validée Si:
- [ ] `search-documents` fonctionne avec highlighting
- [ ] `vector-search` s'exécute sans erreur (même avec dummy vector)
- [ ] `semantic-search` retourne des réponses et captions
- [ ] `hybrid-search` combine text et vector
- [ ] Tous les outils gèrent les erreurs proprement
- [ ] Performance acceptable (<2s par requête)

**🎯 Objectif**: Valider que toutes les fonctionnalités Phase 4 (Vector & Semantic Search) sont opérationnelles sur ton index RAG Elite Dangerous !