import createLinkedIn, { LinkedIn, LinkedInClient } from '../lib/linkedin.js';
import dotenv from 'dotenv';
import { getAccessToken as getAuthToken } from './auth.js';

dotenv.config();

// Singleton pour l'instance LinkedIn
let linkedinInstance: LinkedIn | null = null;
let linkedinClient: LinkedInClient | null = null;

// Cache pour l'URN de la personne
let personUrnCache: string | null = null;

/**
 * Réinitialise le cache de l'URN de la personne
 * Utile après une nouvelle authentification pour forcer une nouvelle récupération
 */
export function resetPersonUrnCache(): void {
  console.log('Réinitialisation du cache de l\'URN de la personne');
  personUrnCache = null;
}

/**
 * Récupère l'URN LinkedIn de la personne connectée
 * Met en cache l'URN pour éviter les appels répétitifs
 * Utilise le sub d'OpenID Connect pour construire l'URN
 */
export async function getPersonUrn(): Promise<string | null> {
  if (personUrnCache) {
    console.log('URN trouvé dans le cache:', personUrnCache);
    return personUrnCache;
  }
  
  console.log('URN non trouvé dans le cache, vérification du token d\'accès');
  
  // Récupérer le token d'accès
  const accessToken = getAccessToken();
  if (!accessToken) {
    console.error('Token d\'accès non disponible. Veuillez vous authentifier d\'abord.');
    return null;
  }
  
  console.log('Token d\'accès disponible, appel à l\'API LinkedIn');
  
  try {
    // Utiliser l'endpoint OpenID Connect /v2/userinfo pour récupérer le sub
    console.log('Appel à l\'endpoint OpenID Connect /v2/userinfo...');
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`LinkedIn API error response (/v2/userinfo): ${response.status}\n${responseText}`);
      throw new Error(`LinkedIn API error: ${response.status} - ${responseText.substring(0, 100)}...`);
    }
    
    const profile = await response.json();
    console.log('Profil récupéré via /v2/userinfo:', JSON.stringify(profile, null, 2));
    
    // Extraire le sub et construire l'URN
    if (profile && profile.sub) {
      // Construire l'URN au format urn:li:person:{sub}
      personUrnCache = `urn:li:person:${profile.sub}`;
      console.log('ID utilisateur (sub) extrait:', profile.sub);
      console.log('URN LinkedIn construit et mis en cache:', personUrnCache);
      return personUrnCache;
    } else {
      console.error('Profil récupéré mais sans champ sub:', profile);
      console.log('Propriétés disponibles dans le profil:', Object.keys(profile));
      throw new Error('Impossible de récupérer le sub OpenID Connect');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URN de la personne:', error);
    return null;
  }
}

/**
 * Obtient ou crée l'instance LinkedIn
 */
export function getLinkedInInstance(): LinkedIn {
  if (!linkedinInstance) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    if (!clientId || !clientSecret) {
      throw new Error('Configuration LinkedIn manquante dans les variables d\'environnement');
    }
    
    linkedinInstance = createLinkedIn(clientId, clientSecret, redirectUri);
  }
  
  return linkedinInstance;
}

/**
 * Initialise le processus d'authentification avec LinkedIn
 */
export async function loginLinkedIn(redirectUri: string = process.env.LINKEDIN_REDIRECT_URI) {
  try {
    const linkedin = getLinkedInInstance();
    
    // Définir l'URL de callback si elle est fournie
    if (redirectUri) {
      linkedin.auth.setCallback(redirectUri);
    }
    
    // Définir les scopes LinkedIn - inclure OpenID Connect et w_member_social
    const scope = ['openid', 'profile', 'email', 'w_member_social'];
    
    // Générer un état aléatoire pour la sécurité
    const state = Math.random().toString(36).substring(2, 15);
    
    // Obtenir l'URL d'autorisation
    const authUrl = linkedin.auth.authorize(null, scope, state);
    
    return {
      authUrl,
      state,
    };
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL d\'authentification LinkedIn:', error);
    throw error;
  }
}

/**
 * Traite le callback d'authentification LinkedIn et obtient les tokens
 */
export async function handleLinkedInCallback(code: string, state?: string) {
  console.log('Début du traitement du callback LinkedIn avec code:', code ? 'Code présent' : 'Code absent');
  
  return new Promise<any>((resolve, reject) => {
    try {
      const linkedin = getLinkedInInstance();
      console.log('Instance LinkedIn récupérée, échange du code contre un token...');
      
      linkedin.auth.getAccessToken(null, code, state || '', (err, data) => {
        if (err) {
          console.error('Erreur lors de l\'authentification LinkedIn:', err);
          resolve({
            success: false,
            message: 'Échec de l\'authentification',
            error: String(err),
          });
        } else {
          console.log('Token d\'accès obtenu avec succès, initialisation du client LinkedIn...');
          console.log('Données du token:', { 
            expires_in: data.expires_in,
            token_présent: !!data.access_token,
            token_length: data.access_token ? data.access_token.length : 0
          });
          
          // Initialiser le client avec le token d'accès
          try {
            linkedinClient = LinkedIn.init(data.access_token, {
              timeout: 30000 // 30 secondes
            });
            
            // Réinitialiser le cache de l'URN pour forcer une nouvelle récupération
            personUrnCache = null;
            
            console.log('Client LinkedIn initialisé avec succès');
            resolve({
              success: true,
              message: 'Authentification réussie',
              expiresIn: data.expires_in,
            });
          } catch (initError) {
            console.error('Erreur lors de l\'initialisation du client LinkedIn:', initError);
            resolve({
              success: false,
              message: 'Échec de l\'initialisation du client LinkedIn',
              error: String(initError),
            });
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors du traitement du callback LinkedIn:', error);
      resolve({
        success: false,
        message: 'Échec de l\'authentification',
        error: String(error),
      });
    }
  });
}



/**
 * Vérifie si l'utilisateur est authentifié avec LinkedIn
 */
export async function checkLinkedInAuth() {
  const isAuthenticated = linkedinClient !== null;
  
  return {
    isAuthenticated,
  };
}

/**
 * Déconnecte l'utilisateur de LinkedIn
 */
export async function logoutLinkedIn() {
  linkedinClient = null;
  
  return {
    success: true,
    message: 'Déconnexion réussie',
  };
}

/**
 * Fonction utilitaire pour obtenir le client LinkedIn (à utiliser dans d'autres modules)
 */
export function getLinkedInClient(): LinkedInClient | null {
  return linkedinClient;
}

/**
 * Fonction utilitaire pour obtenir le token d'accès (pour compatibilité avec l'ancienne API)
 */
export function getAccessToken(): string | null {
  console.log('linkedinAdapter.getAccessToken appelé - utilisation du token de auth.ts');
  
  // Utiliser la fonction getAccessToken de auth.ts
  const token = getAuthToken();
  
  if (!token) {
    console.error('getAccessToken: Aucun token disponible dans auth.ts');
    return null;
  }
  
  console.log('getAccessToken: Token récupéré avec succès depuis auth.ts');
  return token;
}

/**
 * Fonction de diagnostic pour afficher toutes les informations disponibles sur l'utilisateur
 */
export async function diagnosticUserInfo() {
  console.log('Début du diagnostic utilisateur...');
  
  const accessToken = getAccessToken();
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    // Essayer plusieurs endpoints pour voir ce qui fonctionne
    const endpoints = [
      { url: 'https://api.linkedin.com/v2/me', name: '/v2/me' },
      { url: 'https://api.linkedin.com/v2/userinfo', name: '/v2/userinfo' },
      { url: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', name: '/v2/emailAddress' },
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Tentative avec l'endpoint ${endpoint.name}...`);
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Réponse de ${endpoint.name}:`, JSON.stringify(data, null, 2));
          results[endpoint.name] = data;
        } else {
          const text = await response.text();
          console.error(`Erreur ${response.status} pour ${endpoint.name}: ${text}`);
          results[endpoint.name] = { error: response.status, message: text };
        }
      } catch (error) {
        console.error(`Exception pour ${endpoint.name}:`, error);
        results[endpoint.name] = { error: 'Exception', message: String(error) };
      }
    }
    
    return {
      success: true,
      message: 'Diagnostic terminé',
      results
    };
  } catch (error) {
    console.error('Erreur générale lors du diagnostic:', error);
    return {
      success: false,
      message: 'Erreur lors du diagnostic',
      error: String(error)
    };
  }
}
