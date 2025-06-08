#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Importer les fonctions d'authentification
import { 
  loginLinkedIn, 
  handleLinkedInCallback, 
  checkLinkedInAuth, 
  logoutLinkedIn, 
} from "./tools/auth.js";


// Importer les fonctions de publications
import { 
  createPost, 
  getPosts, 
  likePost, 
  commentPost,
  PostVisibility,
  PostScope 
} from "./tools/posts.js";

// Importer les fonctions de connexions
import { 
  getConnections, 
  searchPeople, 
  sendInvitation, 
  getPendingInvitations,
  InvitationDirection 
} from "./tools/connections.js";

// Importer les fonctions d'entreprises
import {
  companiesSearch,
  getCompanyById,
  getCompanyByName,
  getCompanyByEmailDomain,
  getMultipleCompanies,
  getCompaniesAsAdmin,
  getCompanyUpdates,
  getCompanyUpdate
} from './tools/companies.js';

import dotenv from "dotenv";
import { getPersonUrn, diagnosticUserInfo } from "./tools/linkedinAdapter.js";
dotenv.config();

const server = new McpServer({
  name: "LinkedInMCP",
  version: "1.0.0",
  description: "Serveur MCP pour interagir avec LinkedIn"
});

// Constantes pour l'authentification LinkedIn
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID; // À remplacer par votre client ID

// Créer les outils MCP pour l'authentification
server.tool('linkedin_login',
  async () => {
    try {
      // Utiliser l'URI de redirection fournie ou celle de l'environnement
      const result = await loginLinkedIn(LINKEDIN_CLIENT_ID, "https://www.linkedin.com/developers/tools/oauth/redirect");
      
      // Stocker l'état pour la vérification ultérieure
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

// Créer les outils MCP pour le profil
// server.tool('linkedin_get_profile',
//   {},
//   async () => {
//     const result = await getProfile();
//     return {
//       content: [{ type: "text", text: JSON.stringify(result) }]
//     };
//   }
// );

// server.tool('linkedin_get_email',
//   {},
//   async () => {
//     const result = await getEmail();
//     return {
//       content: [{ type: "text", text: JSON.stringify(result) }]
//     };
//   }
// );

// server.tool('linkedin_update_headline',
//   {
//     headline: z.string().describe('Nouveau titre professionnel')
//   },
//   async ({ headline }) => {
//     const result = await updateHeadline(headline);
//     return {
//       content: [{ type: "text", text: JSON.stringify(result) }]
//     };
//   }
// );

// Créer les outils MCP pour les publications
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

server.tool('linkedin_get_posts',
  {
    count: z.number().int().min(1).max(50).default(10).describe('Nombre de publications à récupérer'),
    scope: z.enum(['SELF', 'CONNECTIONS']).default('SELF').describe('Portée des publications à récupérer')
  },
  async ({ count, scope }) => {
    const result = await getPosts(count, scope as PostScope);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_like_post',
  {
    postId: z.string().describe('ID de la publication à aimer')
  },
  async ({ postId }) => {
    const result = await likePost(postId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_comment_post',
  {
    postId: z.string().describe('ID de la publication à commenter'),
    text: z.string().describe('Contenu du commentaire')
  },
  async ({ postId, text }) => {
    const result = await commentPost(postId, text);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

// Créer les outils MCP pour les connexions
server.tool('linkedin_get_connections',
  {},
  async () => {
    const result = await getConnections();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_search_people',
  { 
    keywords: z.string().describe('Mots-clés pour la recherche'),
    firstName: z.string().optional().describe('Prénom de la personne'),
    lastName: z.string().optional().describe('Nom de famille de la personne'),
    company: z.string().optional().describe('Entreprise actuelle ou précédente'),
    title: z.string().optional().describe('Titre du poste actuel ou précédent'),
    count: z.number().optional().describe('Nombre de résultats à retourner')
  },
  async ({ keywords, firstName, lastName, company, title, count }) => {
    const result = await searchPeople({ keywords, firstName, lastName, company, title, count });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_send_invitation',
  { 
    personId: z.string().describe('ID de la personne à inviter'),
    message: z.string().optional().describe('Message personnalisé pour l\'invitation')
  },
  async ({ personId, message }) => {
    const result = await sendInvitation(personId, message);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_get_pending_invitations',
  { 
    direction: z.enum(['SENT', 'RECEIVED', 'BOTH']).optional().default('BOTH').describe('Direction des invitations (SENT, RECEIVED ou BOTH)')
  },
  async ({ direction }) => {
    const result = await getPendingInvitations(direction as InvitationDirection);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_companies_search',
  { 
    name: z.string().describe('Nom de l\'entreprise à rechercher'),
    count: z.number().optional().describe('Nombre de résultats à retourner')
  },
  async ({ name, count }) => {
    const result = await companiesSearch(name, count);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_get_company_by_id',
  { 
    companyId: z.string().describe('ID de l\'entreprise à récupérer')
  },
  async ({ companyId }) => {
    const result = await getCompanyById(companyId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_get_company_by_name',
  { 
    companyName: z.string().describe('Nom de l\'entreprise à récupérer')
  },
  async ({ companyName }) => {
    const result = await getCompanyByName(companyName);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_get_company_by_email_domain',
  { 
    emailDomain: z.string().describe('Domaine d\'email de l\'entreprise à récupérer')
  },
  async ({ emailDomain }) => {
    const result = await getCompanyByEmailDomain(emailDomain);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_get_multiple_companies',
  { 
    companyIds: z.string().describe('IDs des entreprises à récupérer, séparés par des virgules')
  },
  async ({ companyIds }) => {
    const result = await getMultipleCompanies(companyIds);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_get_companies_as_admin',
  {},
  async () => {
    const result = await getCompaniesAsAdmin();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_get_company_updates',
  { 
    companyId: z.string().describe('ID de l\'entreprise dont on veut récupérer les mises à jour')
  },
  async ({ companyId }) => {
    const result = await getCompanyUpdates(companyId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool('linkedin_get_company_update',
  { 
    companyId: z.string().describe('ID de l\'entreprise'),
    updateId: z.string().describe('ID de la mise à jour à récupérer')
  },
  async ({ companyId, updateId }) => {
    const result = await getCompanyUpdate(companyId, updateId);
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
  {},
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