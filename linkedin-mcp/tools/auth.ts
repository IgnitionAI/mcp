import { resetPersonUrnCache } from './linkedinAdapter.js';

// Type pour stocker les tokens
type LinkedInTokens = {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
};

// Stockage des tokens (en mémoire pour cet exemple - à remplacer par une solution plus sécurisée)
let tokens: LinkedInTokens | null = null;

// Pour une application en production, utilisez une solution de stockage sécurisée comme Redis ou une base de données

/**
 * Initialise le processus d'authentification avec LinkedIn
 */
export async function loginLinkedIn(clientId: string, redirectUri: string = process.env.LINKEDIN_REDIRECT_URI) {
  // Générer un état aléatoire pour la sécurité
  const state = Math.random().toString(36).substring(2, 15);
  
  // Construire l'URL d'authentification LinkedIn
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', 'openid profile email w_member_social');
  
  return {
    authUrl: authUrl.toString(),
    state,
  };
}

/**
 * Traite le callback d'authentification LinkedIn et obtient les tokens
 */
export async function handleLinkedInCallback(code: string, state?: string) {
  try {
    // Note: Dans une implémentation réelle, vous devriez vérifier l'état pour prévenir les attaques CSRF
    
    // Obtenir les variables d'environnement
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Configuration LinkedIn manquante dans les variables d\'environnement');
    }
    
    console.log(`Échange du code d'autorisation contre un token d'accès...`);
    console.log(`URI de redirection utilisée: ${redirectUri}`);
    
    // Échanger le code d'autorisation contre des tokens d'accès
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    // Vérifier si la réponse est OK et gérer différents formats de réponse
    if (!response.ok) {
      // Essayer de lire le corps de la réponse comme texte d'abord
      const responseText = await response.text();
      console.error(`LinkedIn API error response: ${response.status}\n${responseText.substring(0, 500)}`);
      
      // Essayer de parser comme JSON si possible
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
      } catch (parseError) {
        // Si ce n'est pas du JSON, renvoyer le texte brut
        throw new Error(`LinkedIn API error: ${response.status}\nResponse not in JSON format`);
      }
    }
    
    // Essayer de lire le corps de la réponse comme texte d'abord
    const responseText = await response.text();
    console.log(`LinkedIn API success response length: ${responseText.length} chars`);
    
    // Puis parser comme JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`Failed to parse LinkedIn response as JSON: ${responseText.substring(0, 500)}`);
      throw new Error(`Failed to parse LinkedIn response as JSON`);
    }
    
    console.log('Token d\'accès obtenu avec succès');
    
    // Stocker les tokens
    tokens = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      refreshToken: data.refresh_token,
    };
    
    // Vérifier si nous avons reçu un ID token (OpenID Connect)
    if (data.id_token) {
      console.log('ID token OpenID Connect reçu');
      
      // Dans une implémentation complète, nous pourrions valider et décoder le JWT ici
      // Mais pour notre cas d'usage, nous utiliserons directement l'endpoint /v2/userinfo
    } else {
      console.log('Aucun ID token reçu - vérifiez que le scope "openid" est bien demandé');
    }
    
    // Réinitialiser le cache de l'URN pour forcer une nouvelle récupération via /v2/userinfo
    // avec le nouveau token d'accès
    resetPersonUrnCache();
    
    return {
      success: true,
      message: 'Authentification réussie',
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Erreur lors de l\'authentification LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de l\'authentification',
      error: String(error),
    };
  }
}

/**
 * Vérifie si l'utilisateur est authentifié avec LinkedIn
 */
export async function checkLinkedInAuth() {
  const isAuthenticated = tokens !== null && tokens.expiresAt > Date.now();
  
  return {
    isAuthenticated,
    expiresAt: tokens?.expiresAt,
  };
}

/**
 * Déconnecte l'utilisateur de LinkedIn
 */
export async function logoutLinkedIn() {
  tokens = null;
  
  return {
    success: true,
    message: 'Déconnexion réussie',
  };
}

/**
 * Fonction utilitaire pour obtenir le token d'accès (à utiliser dans d'autres modules)
 */
export function getAccessToken(): string | null {
  if (!tokens || tokens.expiresAt <= Date.now()) {
    return null;
  }
  
  return tokens.accessToken;
}
