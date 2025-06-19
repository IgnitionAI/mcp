# @ignitionai/mcp-template

Un serveur MCP (Model Context Protocol) avec des outils, des prompts et des ressources.

## Installation

```bash
# Avec npm
npm install @ignitionai/mcp-template

# Avec pnpm (recommandé)
pnpm add @ignitionai/mcp-template
```

## Utilisation

### En ligne de commande

```bash
# Exécuter directement
npx @ignitionai/mcp-template

# Avec l'inspecteur MCP
npx -y @modelcontextprotocol/inspector npx @ignitionai/mcp-template
```

### Dans votre code

```javascript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { addTool, calculateBmiTool } from "@ignitionai/mcp-template/tools";
```

## Fonctionnalités

### Outils
- `addTool`: Addition de deux nombres
- `substractTool`: Soustraction de deux nombres
- `calculateBmiTool`: Calcul de l'IMC (Indice de Masse Corporelle)

### Prompts
- `greetPrompt`: Génère un message de salutation

### Ressources
- `getGreeting`: Récupère un message de salutation
- `getUserProfile`: Récupère le profil d'un utilisateur
- `listUserProfiles`: Liste tous les profils d'utilisateurs disponibles

## Développement

```bash
# Installer les dépendances
pnpm install

# Construire le package
pnpm build

# Démarrer le serveur
pnpm start
```

## Guide de déploiement

### Prérequis

- Un compte npm (https://www.npmjs.com/signup)
- Accès à l'organisation `ignitionai` sur npm
- Node.js 18+ et pnpm installés

### Étapes de déploiement

#### 1. Préparation du package

1. Cloner le dépôt
   ```bash
   git clone https://github.com/ignitionai/mcp-template.git
   cd mcp-template
   ```

2. Installer les dépendances
   ```bash
   pnpm install
   ```

3. Mettre à jour les informations du package dans `package.json`
   ```json
   {
     "name": "@ignitionai/mcp-template",
     "version": "1.0.0",
     "description": "ModelContextProtocol server with tools, prompts and resources"
   }
   ```

4. Construire le package
   ```bash
   pnpm build
   ```

#### 2. Publication sur npm

1. Connexion à npm
   ```bash
   npm login
   ```

2. Vérifier l'accès à l'organisation
   ```bash
   npm whoami
   npm org ls ignitionai
   ```

3. Publier le package
   ```bash
   npm publish
   ```
   
   Pour une publication en mode test (sans réellement publier) :
   ```bash
   npm publish --dry-run
   ```

#### 3. Mise à jour du package

Pour les futures mises à jour, suivez les règles de versionnement sémantique :

```bash
# Pour les corrections de bugs
npm version patch

# Pour les nouvelles fonctionnalités rétrocompatibles
npm version minor

# Pour les changements non rétrocompatibles
npm version major

# Puis publiez la nouvelle version
git push --follow-tags
npm publish
```

#### 4. Intégration avec les modèles d'IA

Ce serveur MCP peut être utilisé avec différents modèles d'IA compatibles avec le protocole MCP :

1. **Avec un modèle local via Ollama**
   ```bash
   ollama run gemma -- --mcp-server "npx @ignitionai/mcp-template"
   ```

2. **Avec un modèle cloud**
   Consultez la documentation du fournisseur pour l'intégration MCP.

3. **Pour le développement et les tests**
   ```bash
   npx -y @modelcontextprotocol/inspector npx @ignitionai/mcp-template
   ```

#### 5. Déploiement en production

Pour un déploiement en production, vous pouvez utiliser :

1. **Docker**
   ```bash
   # Créer un Dockerfile
   echo 'FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["node", "dist/server.js"]' > Dockerfile
   
   # Construire l'image
   docker build -t ignitionai/mcp-template .
   
   # Exécuter le conteneur
   docker run -p 3000:3000 ignitionai/mcp-template
   ```

2. **Service systemd**
   ```bash
   # Créer un fichier service
   echo '[Unit]
Description=MCP Template Server
After=network.target

[Service]
Type=simple
User=nodeuser
WorkingDirectory=/opt/mcp-template
ExecStart=/usr/bin/node /opt/mcp-template/dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target' | sudo tee /etc/systemd/system/mcp-template.service
   
   # Activer et démarrer le service
   sudo systemctl enable mcp-template
   sudo systemctl start mcp-template
   ```


## Licence

MIT
