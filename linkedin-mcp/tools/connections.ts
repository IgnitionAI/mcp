import { getAccessToken } from './auth.js';


export type InvitationDirection = 'SENT' | 'RECEIVED' | 'BOTH';


export async function getConnections(start: number = 0, count: number = 20) {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {

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

    const searchUrl = new URL('https://api.linkedin.com/v2/people-search');
    searchUrl.searchParams.append('keywords', keywords);
    searchUrl.searchParams.append('count', count.toString());
    

    if (firstName) searchUrl.searchParams.append('firstName', firstName);
    if (lastName) searchUrl.searchParams.append('lastName', lastName);
    if (company) searchUrl.searchParams.append('company', company);
    if (title) searchUrl.searchParams.append('title', title);
    
    console.log(`Recherche LinkedIn avec URL: ${searchUrl.toString()}`);
    
    const response = await fetch(searchUrl.toString(), {
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
      throw new Error(`LinkedIn API error: ${response.status} - ${responseText.substring(0, 100)}...`);
    }
    
    const data = await response.json();
    console.log('Réponse de recherche LinkedIn:', JSON.stringify(data, null, 2));
    
    const results = data.elements?.map((person: any) => ({
      id: person.entityUrn || person.id,
      firstName: person.firstName?.localized?.[Object.keys(person.firstName?.localized || {})[0]] || person.firstName,
      lastName: person.lastName?.localized?.[Object.keys(person.lastName?.localized || {})[0]] || person.lastName,
      headline: person.headline?.localized?.[Object.keys(person.headline?.localized || {})[0]] || person.headline,
      industry: person.industry,
      location: person.location?.preferredGeoPlace?.label?.localized?.[Object.keys(person.location?.preferredGeoPlace?.label?.localized || {})[0]] || null,
      connectionDegree: person.connectionDegree || null,
      sharedConnections: person.sharedConnectionsCount || 0,
    })) || [];
    
    return {
      success: true,
      results,
      keywords,
      count: results.length,
      total: data.paging?.total || results.length,
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


export async function sendInvitation(personId: string, message?: string) {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {

    if (!personId.startsWith('urn:li:person:')) {
      throw new Error('Format d\'ID de personne invalide. Doit être au format urn:li:person:{id}');
    }
    

    const payload: any = {
      invitee: personId,
      invitationType: 'CONNECTION',
    };
    

    if (message) {
      payload.message = {
        subject: 'Invitation à se connecter',
        body: message.substring(0, 300),
      };
    }
    
    console.log(`Envoi d'invitation à ${personId} avec payload:`, JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://api.linkedin.com/v2/invitations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
      throw new Error(`LinkedIn API error: ${response.status} - ${responseText.substring(0, 100)}...`);
    }
    
    const data = await response.json();
    console.log('Réponse d\'invitation LinkedIn:', JSON.stringify(data, null, 2));
    
    return {
      success: true,
      message: `Invitation envoyée avec succès à ${personId}`,
      includesCustomMessage: !!message,
      response: data,
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

export async function getPendingInvitations(direction: InvitationDirection = 'BOTH') {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'Non authentifié. Veuillez vous connecter d\'abord.',
    };
  }
  
  try {
    const invitationsUrl = new URL('https://api.linkedin.com/v2/invitations');
    
    if (direction === 'SENT') {
      invitationsUrl.searchParams.append('filter', 'sender');
    } else if (direction === 'RECEIVED') {
      invitationsUrl.searchParams.append('filter', 'recipient');
    }
    
    console.log(`Récupération des invitations LinkedIn avec URL: ${invitationsUrl.toString()}`);
    
    const response = await fetch(invitationsUrl.toString(), {
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
      throw new Error(`LinkedIn API error: ${response.status} - ${responseText.substring(0, 100)}...`);
    }
    
    const data = await response.json();
    console.log('Réponse des invitations LinkedIn:', JSON.stringify(data, null, 2));
    
    const sentInvitations = direction !== 'RECEIVED' ? 
      (data.elements?.filter((inv: any) => inv.direction === 'OUTGOING').map((inv: any) => ({
        id: inv.entityUrn || inv.id,
        personId: inv.invitee.miniProfile?.entityUrn || inv.invitee,
        firstName: inv.invitee.miniProfile?.firstName?.localized?.[Object.keys(inv.invitee.miniProfile?.firstName?.localized || {})[0]] || '',
        lastName: inv.invitee.miniProfile?.lastName?.localized?.[Object.keys(inv.invitee.miniProfile?.lastName?.localized || {})[0]] || '',
        headline: inv.invitee.miniProfile?.headline?.localized?.[Object.keys(inv.invitee.miniProfile?.headline?.localized || {})[0]] || '',
        sentAt: inv.sentAt || new Date().toISOString(),
        message: inv.message?.body || null,
      })) || []) : [];
    
    const receivedInvitations = direction !== 'SENT' ? 
      (data.elements?.filter((inv: any) => inv.direction === 'INCOMING').map((inv: any) => ({
        id: inv.entityUrn || inv.id,
        personId: inv.inviter.miniProfile?.entityUrn || inv.inviter,
        firstName: inv.inviter.miniProfile?.firstName?.localized?.[Object.keys(inv.inviter.miniProfile?.firstName?.localized || {})[0]] || '',
        lastName: inv.inviter.miniProfile?.lastName?.localized?.[Object.keys(inv.inviter.miniProfile?.lastName?.localized || {})[0]] || '',
        headline: inv.inviter.miniProfile?.headline?.localized?.[Object.keys(inv.inviter.miniProfile?.headline?.localized || {})[0]] || '',
        receivedAt: inv.sharedAt || new Date().toISOString(),
        message: inv.message?.body || null,
      })) || []) : [];
    
    return {
      success: true,
      sent: sentInvitations,
      received: receivedInvitations,
      direction,
      total: data.paging?.total || (sentInvitations.length + receivedInvitations.length),
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
