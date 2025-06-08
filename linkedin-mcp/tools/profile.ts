import { getAccessToken } from './auth.js';

/**
 * Récupère les informations du profil LinkedIn de l'utilisateur connecté
 */
export async function getProfile() {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    // Appel à l'API LinkedIn pour récupérer les informations de profil
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Essayer de lire le corps de la réponse comme texte d'abord
      const responseText = await response.text();
      console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
      
      // Essayer de parser comme JSON si possible
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
      } catch (parseError) {
        // Si ce n'est pas du JSON, renvoyer le texte brut
        throw new Error(`LinkedIn API error: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
      }
    }
    
    const profile = await response.json();
    
    // Récupérer l'image de profil via une requête séparée
    let profilePictureData = null;
    try {
      const pictureResponse = await fetch('https://api.linkedin.com/v2/userinfo?projection=(id,profilePicture(displayImage~:playableStreams))', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
        },
      });
      
      if (pictureResponse.ok) {
        const pictureData = await pictureResponse.json();
        profilePictureData = pictureData.profilePicture;
      }
    } catch (pictureError) {
      console.error('Erreur lors de la récupération de l\'image de profil:', pictureError);
    }
    
    // Ajouter l'image de profil si disponible
    if (profilePictureData) {
      profile.profilePicture = profilePictureData;
    }
    
    return {
      success: true,
      profile,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du profil LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de la récupération du profil',
      error: String(error),
    };
  }
}

/**
 * Récupère l'adresse email associée au compte LinkedIn de l'utilisateur
 */
export async function getEmail() {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    // Appel à l'API LinkedIn pour récupérer l'adresse email
    const response = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Essayer de lire le corps de la réponse comme texte d'abord
      const responseText = await response.text();
      console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
      
      // Essayer de parser comme JSON si possible
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
      } catch (parseError) {
        // Si ce n'est pas du JSON, renvoyer le texte brut
        throw new Error(`LinkedIn API error: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
      }
    }
    
    const emailResponse = await response.json();
    
    return {
      success: true,
      email: emailResponse.elements[0]['handle~'].emailAddress
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'email LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de la récupération de l\'email',
      error: String(error),
    };
  }
}

/**
 * Met à jour le titre professionnel (headline) sur le profil LinkedIn
 */
export async function updateHeadline(headline: string) {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    // Endpoint pour mettre à jour le profil
    const apiUrl = 'https://api.linkedin.com/v2/me';
    
    // Préparer les données pour la mise à jour du headline
    const patchData = {
      patch: {
        $set: {
          headline: headline
        }
      }
    };
    
    // Effectuer la requête PATCH à l'API LinkedIn
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(patchData)
    });
    
    // Vérifier la réponse
    if (!response.ok) {
      // Essayer de lire le corps de la réponse comme texte d'abord
      const responseText = await response.text();
      console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
      
      // Essayer de parser comme JSON si possible
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
      } catch (parseError) {
        // Si ce n'est pas du JSON, renvoyer le texte brut
        throw new Error(`LinkedIn API error: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
      }
    }
    
    return {
      success: true,
      message: `Titre professionnel mis à jour avec succès: "${headline}"`,
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du titre LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de la mise à jour du titre',
      error: String(error),
    };
  }
}
