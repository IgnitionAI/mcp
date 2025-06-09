import { getAccessToken } from './auth.js';
import { getPersonUrn } from './linkedinAdapter.js';


export type PostVisibility = 'PUBLIC' | 'CONNECTIONS';
export type PostScope = 'SELF' | 'CONNECTIONS';

export async function createPost(text: string, visibility: PostVisibility = 'CONNECTIONS', mediaUrls?: string[]) {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    const personUrn = await getPersonUrn();
    if (!personUrn) {
      return {
        success: false,
        message: 'Impossible de récupérer l\'URN de l\'utilisateur',
      };
    }
    
    console.log('URN récupéré pour la création de post:', personUrn);
    

    const postData = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text
          },
          shareMediaCategory: mediaUrls && mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
          media: mediaUrls ? mediaUrls.map(url => ({
            status: 'READY',
            description: {
              text: 'Image partagée via l\'API LinkedIn'
            },
            media: url,
            title: {
              text: 'Image partagée'
            }
          })) : undefined
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility === 'PUBLIC' ? 'PUBLIC' : 'CONNECTIONS'
      }
    };
    
    // Effectuer la requête POST à l'API LinkedIn
    console.log('Envoi de la requête POST à l\'API LinkedIn avec les données:', JSON.stringify(postData, null, 2));
    
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postData)
    });
    
    console.log('Réponse de l\'API LinkedIn - Status:', response.status);
    

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
      
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
      } catch (parseError) {
        throw new Error(`LinkedIn API error: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
      }
    }
    
    const result = await response.json();
    const postId = result.id;
    
    return {
      success: true,
      message: 'Publication créée avec succès',
      postId,
      mediaCount: mediaUrls?.length || 0,
    };
  } catch (error) {
    console.error('Erreur lors de la création d\'une publication LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de la création de la publication',
      error: String(error),
    };
  }
}

export async function getPosts(count: number = 10, scope: PostScope = 'SELF') {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {

    const personUrn = await getPersonUrn()
    let apiUrl = 'https://api.linkedin.com/v2/ugcPosts';
    
    if (scope === 'SELF') {
      apiUrl += `?q=authors&authors=List(${encodeURIComponent(`urn:li:person:${personUrn}`)})&count=${count}`;
    } else {
      apiUrl = `https://api.linkedin.com/v2/shares?q=connectionOf&connectionOf=${encodeURIComponent(`urn:li:person:${personUrn}`)}&count=${count}`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
      
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
      } catch (parseError) {
        throw new Error(`LinkedIn API error: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
      }
    }
    
    const result = await response.json();
    const posts = result.elements || [];
    
    return {
      success: true,
      posts,
      scope,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des publications LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de la récupération des publications',
      error: String(error),
    };
  }
}


export async function likePost(postId: string) {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {

    const personUrn = await getPersonUrn();
    const likeData = {
      actor: `urn:li:person:${personUrn}`,
      object: postId
    };
    
    const response = await fetch('https://api.linkedin.com/v2/socialActions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(likeData)
    });
    

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
      } catch (parseError) {
        throw new Error(`LinkedIn API error: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
      }
    }
    
    return {
      success: true,
      message: `Publication ${postId} aimée avec succès`,
    };
  } catch (error) {
    console.error('Erreur lors de l\'action d\'aimer sur LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de l\'action d\'aimer',
      error: String(error),
    };
  }
}


export async function commentPost(postId: string, text: string) {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    const personUrn = await getPersonUrn();
    const commentData = {
      actor: `urn:li:person:${personUrn}`,
      object: postId,
      message: {
        text: text
      }
    };
    
    const response = await fetch(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(commentData)
    });
    

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
      
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
      } catch (parseError) {
        throw new Error(`LinkedIn API error: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
      }
    }
    
    const result = await response.json();
    const commentId = result.id || `urn:li:comment:${Date.now()}`;
    
    return {
      success: true,
      message: `Commentaire ajouté avec succès à la publication ${postId}`,
      commentId,
    };
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un commentaire sur LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de l\'ajout du commentaire',
      error: String(error),
    };
  }
}
