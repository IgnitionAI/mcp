import { resetPersonUrnCache } from './linkedinAdapter.js';

type LinkedInTokens = {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
};

let tokens: LinkedInTokens | null = null;


export async function loginLinkedIn(clientId: string, redirectUri: string = process.env.LINKEDIN_REDIRECT_URI) {
  const state = Math.random().toString(36).substring(2, 15);
  
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


export async function handleLinkedInCallback(code: string, state?: string) {
  try {
    
    
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Configuration LinkedIn manquante dans les variables d\'environnement');
    }
    
    console.log(`Échange du code d'autorisation contre un token d'accès...`);
    console.log(`URI de redirection utilisée: ${redirectUri}`);
    
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
    

    if (!response.ok) {

      const responseText = await response.text();
      console.error(`LinkedIn API error response: ${response.status}\n${responseText.substring(0, 500)}`);
      

      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
      } catch (parseError) {

        throw new Error(`LinkedIn API error: ${response.status}\nResponse not in JSON format`);
      }
    }
    

    const responseText = await response.text();
    console.log(`LinkedIn API success response length: ${responseText.length} chars`);
    

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`Failed to parse LinkedIn response as JSON: ${responseText.substring(0, 500)}`);
      throw new Error(`Failed to parse LinkedIn response as JSON`);
    }
    
    console.log('Token d\'accès obtenu avec succès');
    
    tokens = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      refreshToken: data.refresh_token,
    };
    

    if (data.id_token) {
      console.log('ID token OpenID Connect reçu');
      

    } else {
      console.log('Aucun ID token reçu - vérifiez que le scope "openid" est bien demandé');
    }
    

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


export async function checkLinkedInAuth() {
  const isAuthenticated = tokens !== null && tokens.expiresAt > Date.now();
  
  return {
    isAuthenticated,
    expiresAt: tokens?.expiresAt,
  };
}


export async function logoutLinkedIn() {
  tokens = null;
  
  return {
    success: true,
    message: 'Déconnexion réussie',
  };
}


export function getAccessToken(): string | null {
  if (!tokens || tokens.expiresAt <= Date.now()) {
    return null;
  }
  
  return tokens.accessToken;
}
