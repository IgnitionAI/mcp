#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { 
  loginLinkedIn, 
  handleLinkedInCallback, 
  checkLinkedInAuth, 
  logoutLinkedIn, 
} from "./tools/auth.js";
import { 
  createPost, 
  PostVisibility,
} from "./tools/posts.js";
import { getPersonUrn, diagnosticUserInfo } from "./tools/linkedinAdapter.js";
import dotenv from "dotenv";

dotenv.config();

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;
const server = new McpServer({
  name: "LinkedInMCP",
  version: "1.0.0",
  description: "Serveur MCP pour interagir avec LinkedIn"
});


server.tool('linkedin_login',
  async () => {
    try {
      const result = await loginLinkedIn(LINKEDIN_CLIENT_ID, LINKEDIN_REDIRECT_URI);
      
      const authState = result.state;
      
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({
            message: "Pour vous connecter à LinkedIn, ouvrez cette URL dans votre navigateur",
            authUrl: result.authUrl,
            state: authState,
            instructions: "Après vous être connecté, vous serez redirigé vers l'URI de redirection. Copiez le code et l'état depuis l'URL et utilisez-les avec l'outil linkedin_callback."
          })
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({
            error: true,
            message: `Erreur lors de la génération de l'URL d'authentification: ${error.message}`
          })
        }]
      };
    }
  }
);

server.tool('linkedin_callback',
  { 
    code: z.string().describe('Code d\'autorisation reçu de LinkedIn'),
    state: z.string().describe('État de la requête pour vérification')
  },
  async ({ code, state }) => {
    try {
      const result = await handleLinkedInCallback(code, state);
      
      if (result.success) {
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: "Authentification réussie! Vous pouvez maintenant utiliser les autres outils LinkedIn MCP.",
              expiresIn: result.expiresIn,
              nextSteps: "Essayez d'utiliser linkedin_get_profile pour récupérer votre profil LinkedIn."
            })
          }]
        };
      } else {
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: false,
              message: result.message || "Erreur d'authentification",
              error: result.error
            })
          }]
        };
      }
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({
            success: false,
            message: `Erreur lors du traitement du callback: ${error.message}`
          })
        }]
      };
    }
  }
);

server.tool('linkedin_check_auth',
  {},
  async () => {
    const result = await checkLinkedInAuth();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);



server.tool('linkedin_logout',
  {},
  async () => {
    const result = await logoutLinkedIn();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_create_post',
  {
    text: z.string().describe('Contenu textuel de la publication'),
    visibility: z.enum(['PUBLIC', 'CONNECTIONS']).default('PUBLIC').describe('Visibilité de la publication'),
    mediaUrls: z.array(z.string()).optional().describe('URLs des médias à joindre à la publication')
  },
  async ({ text, visibility, mediaUrls }) => {
    const result = await createPost(text, visibility as PostVisibility, mediaUrls);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);


server.tool('linkedin_get_person_urn',
  {},
  async () => {
    const urn = await getPersonUrn();
    return {
      content: [{ type: "text", text: JSON.stringify(urn) }]
    };
  }
);

server.tool('linkedin_diagnostic_user_info',
  {
    
  },
  async () => {
    const result = await diagnosticUserInfo();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

const transport = new StdioServerTransport();
server.connect(transport);

console.log("Serveur LinkedIn MCP démarré avec succès.");
