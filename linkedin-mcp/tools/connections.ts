import { getAccessToken } from './auth.js';

/**
 * Type pour la direction des invitations
 */
export type InvitationDirection = 'SENT' | 'RECEIVED' | 'BOTH';

/**
 * Récupère la liste des connexions LinkedIn de l'utilisateur
 */
export async function getConnections(start: number = 0, count: number = 20) {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    // LinkedIn n'offre plus d'API directe pour les connexions, nous devons utiliser l'API de recherche
    // Voir: https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/primary-contact-api
    
    // Construire l'URL de l'API avec pagination
    const apiUrl = new URL('https://api.linkedin.com/v2/connections');
    apiUrl.searchParams.append('start', start.toString());
    apiUrl.searchParams.append('count', count.toString());
    apiUrl.searchParams.append('q', 'viewer');
    
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Si l'API des connexions n'est pas disponible, essayons l'API des contacts primaires
      // Note: LinkedIn a déprécié l'API des connexions en faveur de l'API des contacts primaires
      const contactsUrl = new URL('https://api.linkedin.com/v2/primarycontacts');
      contactsUrl.searchParams.append('start', start.toString());
      contactsUrl.searchParams.append('count', count.toString());
      
      const contactsResponse = await fetch(contactsUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
        },
      });
      
      if (!contactsResponse.ok) {
        const errorData = await contactsResponse.json();
        throw new Error(`LinkedIn API error: ${contactsResponse.status} ${JSON.stringify(errorData)}`);
      }
      
      const contactsData = await contactsResponse.json();
      
      // Transformer les données de l'API en format cohérent
      const connections = contactsData.elements.map((contact: any) => ({
        id: contact.miniProfile.entityUrn,
        firstName: contact.miniProfile.firstName,
        lastName: contact.miniProfile.lastName,
        headline: contact.miniProfile.occupation,
        profilePicture: contact.miniProfile.picture?.rootUrl + contact.miniProfile.picture?.artifacts[0]?.fileIdentifyingUrlPathSegment || null,
      }));
      
      return {
        success: true,
        connections,
        total: contactsData.paging?.total || connections.length,
        start,
        count: connections.length,
        hasMore: contactsData.paging?.links?.find((link: any) => link.rel === 'next') !== undefined,
      };
    }
    
    const data = await response.json();
    
    // Transformer les données de l'API en format cohérent
    const connections = data.elements.map((connection: any) => ({
      id: connection.miniProfile.entityUrn,
      firstName: connection.miniProfile.firstName.localized[Object.keys(connection.miniProfile.firstName.localized)[0]],
      lastName: connection.miniProfile.lastName.localized[Object.keys(connection.miniProfile.lastName.localized)[0]],
      headline: connection.miniProfile.headline?.localized[Object.keys(connection.miniProfile.headline?.localized || {})[0]] || '',
      profilePicture: connection.miniProfile.picture?.rootUrl + connection.miniProfile.picture?.artifacts[0]?.fileIdentifyingUrlPathSegment || null,
    }));
    
    return {
      success: true,
      connections,
      total: data.paging?.total || connections.length,
      start,
      count: connections.length,
      hasMore: data.paging?.links?.find((link: any) => link.rel === 'next') !== undefined,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des connexions LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de la récupération des connexions',
      error: String(error),
    };
  }
}

/**
 * Recherche des personnes sur LinkedIn
 */
export async function searchPeople(options: {
  keywords: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  count?: number;
}) {
  const { keywords, firstName, lastName, company, title, count = 10 } = options;
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    // Dans une implémentation réelle, vous feriez une requête GET à l'API LinkedIn
    // GET https://api.linkedin.com/v2/search
    
    // Simuler des résultats de recherche
    const results = Array.from({ length: count }, (_, i) => ({
      id: `urn:li:person:${200000 + i}`,
      firstName: firstName || `Prénom${i + 1}`,
      lastName: lastName || `Nom${i + 1}`,
      headline: title || `${title || 'Professionnel'} chez ${company || 'Entreprise'}`,
      industry: 'Technologie',
      location: 'Paris, France',
      connectionDegree: Math.min(i % 3 + 1, 3), // 1er, 2e ou 3e degré
      sharedConnections: i % 10,
    }));
    
    return {
      success: true,
      results,
      keywords,
      count: results.length,
      filters: {
        firstName,
        lastName,
        company,
        title,
      },
    };
  } catch (error) {
    console.error('Erreur lors de la recherche de personnes sur LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de la recherche',
      error: String(error),
    };
  }
}

/**
 * Envoie une invitation de connexion à une personne sur LinkedIn
 */
export async function sendInvitation(personId: string, message?: string) {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    // Dans une implémentation réelle, vous feriez une requête POST à l'API LinkedIn
    // POST https://api.linkedin.com/v2/invitations
    
    // Simuler l'envoi d'une invitation
    return {
      success: true,
      message: `Invitation envoyée avec succès à ${personId}`,
      includesCustomMessage: !!message,
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'une invitation LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de l\'envoi de l\'invitation',
      error: String(error),
    };
  }
}

/**
 * Récupère les invitations de connexion en attente
 */
export async function getPendingInvitations(direction: InvitationDirection = 'BOTH') {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    // Dans une implémentation réelle, vous feriez une requête GET à l'API LinkedIn
    // GET https://api.linkedin.com/v2/invitations
    
    // Simuler des invitations en attente
    const sentInvitations = direction === 'RECEIVED' ? [] : Array.from({ length: 3 }, (_, i) => ({
      id: `urn:li:invitation:${300000 + i}`,
      personId: `urn:li:person:${400000 + i}`,
      firstName: `Prénom${i + 1}`,
      lastName: `Nom${i + 1}`,
      headline: `Professionnel chez Entreprise${i + 1}`,
      sentAt: new Date(Date.now() - i * 86400000).toISOString(),
      message: i % 2 === 0 ? `Message personnalisé d'invitation #${i + 1}` : null,
    }));
    
    const receivedInvitations = direction === 'SENT' ? [] : Array.from({ length: 5 }, (_, i) => ({
      id: `urn:li:invitation:${500000 + i}`,
      personId: `urn:li:person:${600000 + i}`,
      firstName: `Prénom${i + 10}`,
      lastName: `Nom${i + 10}`,
      headline: `Professionnel chez Entreprise${i + 10}`,
      receivedAt: new Date(Date.now() - i * 43200000).toISOString(),
      message: i % 3 === 0 ? `Message personnalisé d'invitation reçue #${i + 1}` : null,
    }));
    
    return {
      success: true,
      sent: sentInvitations,
      received: receivedInvitations,
      direction,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des invitations LinkedIn:', error);
    return {
      success: false,
      message: 'Échec de la récupération des invitations',
      error: String(error),
    };
  }
}
