import { URL } from 'url';

/**
 * Types pour les options et les tokens
 */
type LinkedInOptions = {
  timeout?: number;
  mobileToken?: boolean;
};

type LinkedInTokens = {
  accessToken: string;
  expiresIn: number;
  expiresAt?: number;
};

/**
 * Classe principale LinkedIn
 */
class LinkedIn {
  private clientId: string;
  private clientSecret: string;
  private callbackUrl: string | null;
  private options: LinkedInOptions;
  private accessToken: string | null = null;
  private state: string | null = null;

  /**
   * Constructeur pour l'instance LinkedIn
   */
  constructor(clientId: string, clientSecret: string, callbackUrl?: string, options: LinkedInOptions = {}) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.callbackUrl = callbackUrl || null;
    this.options = {
      timeout: options.timeout || 60000, // 60 secondes par défaut
      mobileToken: options.mobileToken || false
    };
  }

  /**
   * Méthodes d'authentification
   */
  auth = {
    /**
     * Définit l'URL de callback
     */
    setCallback: (callbackUrl: string): void => {
      this.callbackUrl = callbackUrl;
    },

    /**
     * Génère une URL d'autorisation pour rediriger l'utilisateur
     */
    authorize: (res: any, scope: string[], state?: string): string => {
      if (!this.callbackUrl) {
        throw new Error('Callback URL is required for authorization');
      }

      // Générer un état aléatoire si non fourni
      this.state = state || Math.random().toString(36).substring(2, 15);
      
      // Construire l'URL d'authentification LinkedIn
      const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', this.clientId);
      authUrl.searchParams.append('redirect_uri', this.callbackUrl);
      authUrl.searchParams.append('state', this.state);
      authUrl.searchParams.append('scope', scope.join(' '));
      
      const redirectUrl = authUrl.toString();
      
      // Si res est fourni, rediriger directement
      if (res && typeof res.redirect === 'function') {
        res.redirect(redirectUrl);
        return redirectUrl;
      }
      
      // Sinon, retourner l'URL pour que l'application puisse gérer la redirection
      return redirectUrl;
    },

    /**
     * Échange le code d'autorisation contre un token d'accès
     */
    getAccessToken: async (res: any, code: string, state: string, callback: (err: Error | null, data?: any) => void): Promise<void> => {
      try {
        // Vérifier l'état pour prévenir les attaques CSRF
        if (this.state && state !== this.state) {
          throw new Error('State mismatch - possible CSRF attack');
        }

        if (!this.callbackUrl) {
          throw new Error('Callback URL is required for token exchange');
        }
        
        // Échanger le code d'autorisation contre des tokens d'accès
        const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', this.callbackUrl);
        params.append('client_id', this.clientId);
        params.append('client_secret', this.clientSecret);
        
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        
        // Stocker le token d'accès
        this.accessToken = data.access_token;
        
        // Si res est fourni et a une méthode json, envoyer la réponse
        if (res && typeof res.json === 'function') {
          res.json(data);
        }
        
        // Appeler le callback avec les résultats
        callback(null, data);
      } catch (error) {
        console.error('Erreur lors de l\'authentification LinkedIn:', error);
        callback(error as Error);
      }
    }
  };

  /**
   * Initialise une instance avec un token d'accès
   */
  static init(accessToken: string, options: LinkedInOptions = {}): LinkedInClient {
    return new LinkedInClient(accessToken, options);
  }

  /**
   * Crée une instance de LinkedIn avec les identifiants d'application
   */
  static createInstance(clientId: string, clientSecret: string, callbackUrl?: string, options: LinkedInOptions = {}): LinkedIn {
    return new LinkedIn(clientId, clientSecret, callbackUrl, options);
  }
}

/**
 * Classe client LinkedIn pour les appels API avec un token d'accès
 */
class LinkedInClient {
  private accessToken: string;
  private options: LinkedInOptions;
  
  // Sous-modules pour les différentes API
  public people: PeopleModule;
  public companies: CompaniesModule;
  public companies_search: CompaniesSearchModule;
  public connections: ConnectionsModule;
  public group: GroupModule;

  constructor(accessToken: string, options: LinkedInOptions = {}) {
    this.accessToken = accessToken;
    this.options = {
      timeout: options.timeout || 60000,
      mobileToken: options.mobileToken || false
    };
    
    // Initialiser les sous-modules
    this.people = new PeopleModule(this);
    this.companies = new CompaniesModule(this);
    this.companies_search = new CompaniesSearchModule(this);
    this.connections = new ConnectionsModule(this);
    this.group = new GroupModule(this);
  }

  /**
   * Effectue une requête API vers LinkedIn
   */
  async request(method: string, path: string, body?: any): Promise<any> {
    try {
      const url = `https://api.linkedin.com/v2/${path}`;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      };
      
      // Ajouter des en-têtes spécifiques pour les tokens mobiles
      if (this.options.mobileToken) {
        headers['x-li-format'] = 'json';
      }
      
      const requestOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(this.options.timeout || 60000),
      };
      
      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Erreur lors de la requête LinkedIn ${method} ${path}:`, error);
      throw error;
    }
  }

  /**
   * Obtient le token d'accès
   */
  getAccessToken(): string {
    return this.accessToken;
  }
}

/**
 * Module pour les opérations liées aux profils
 */
class PeopleModule {
  private client: LinkedInClient;
  
  constructor(client: LinkedInClient) {
    this.client = client;
  }
  
  /**
   * Récupère le profil de l'utilisateur connecté
   */
  async me(fields?: string[]): Promise<any> {
    const path = fields ? `me?projection=(${fields.join(',')})` : 'me';
    return await this.client.request('GET', path);
  }
  
  /**
   * Récupère un profil par URL publique
   */
  async url(url: string, fields?: string[]): Promise<any> {
    // Dans l'API LinkedIn actuelle, il n'y a pas d'endpoint direct pour rechercher par URL
    // On simulerait cette fonctionnalité en extrayant l'identifiant de l'URL
    const path = fields ? `people?q=vanityName&projection=(${fields.join(',')})` : 'people?q=vanityName';
    return await this.client.request('GET', path);
  }
  
  /**
   * Récupère un profil par ID
   */
  async id(id: string, fields?: string[]): Promise<any> {
    const path = fields ? `people/${id}?projection=(${fields.join(',')})` : `people/${id}`;
    return await this.client.request('GET', path);
  }
}

/**
 * Module pour les opérations liées aux entreprises
 */
class CompaniesModule {
  private client: LinkedInClient;
  
  constructor(client: LinkedInClient) {
    this.client = client;
  }
  
  /**
   * Récupère une entreprise par ID
   */
  async company(id: string): Promise<any> {
    return await this.client.request('GET', `companies/${id}`);
  }
  
  /**
   * Récupère une entreprise par nom
   */
  async name(name: string): Promise<any> {
    return await this.client.request('GET', `companies?q=vanityName&vanityName=${encodeURIComponent(name)}`);
  }
  
  /**
   * Récupère une entreprise par domaine d'email
   */
  async email_domain(domain: string): Promise<any> {
    return await this.client.request('GET', `companies?q=emailDomain&emailDomain=${encodeURIComponent(domain)}`);
  }
  
  /**
   * Récupère plusieurs entreprises
   */
  async multiple(ids: string): Promise<any> {
    return await this.client.request('GET', `companies?ids=${encodeURIComponent(ids)}`);
  }
  
  /**
   * Récupère les entreprises dont l'utilisateur est administrateur
   */
  async asAdmin(): Promise<any> {
    return await this.client.request('GET', 'organizationAcls?q=roleAssignee');
  }
  
  /**
   * Récupère les mises à jour d'une entreprise
   */
  async updates(id: string): Promise<any> {
    return await this.client.request('GET', `companies/${id}/updates`);
  }
  
  /**
   * Récupère une mise à jour spécifique d'une entreprise
   */
  async getUpdate(companyId: string, updateId: string): Promise<any> {
    return await this.client.request('GET', `companies/${companyId}/updates/${updateId}`);
  }
}

/**
 * Module pour la recherche d'entreprises
 */
class CompaniesSearchModule {
  private client: LinkedInClient;
  
  constructor(client: LinkedInClient) {
    this.client = client;
  }
  
  /**
   * Recherche des entreprises par nom
   */
  async name(name: string, count: number = 10): Promise<any> {
    return await this.client.request('GET', `companiesSearch?q=name&keywords=${encodeURIComponent(name)}&count=${count}`);
  }
}

/**
 * Module pour les opérations liées aux connexions
 */
class ConnectionsModule {
  private client: LinkedInClient;
  
  constructor(client: LinkedInClient) {
    this.client = client;
  }
  
  /**
   * Récupère les connexions de l'utilisateur
   */
  async retrieve(): Promise<any> {
    return await this.client.request('GET', 'connections?q=viewer');
  }
}

/**
 * Module pour les opérations liées aux groupes
 */
class GroupModule {
  private client: LinkedInClient;
  
  constructor(client: LinkedInClient) {
    this.client = client;
  }
  
  /**
   * Récupère les discussions d'un groupe
   */
  async feeds(groupId: number, fields?: string[], options: any = {}): Promise<any> {
    let path = `groups/${groupId}/posts`;
    
    if (fields && fields.length > 0) {
      path += `?projection=(${fields.join(',')})`;
    }
    
    if (options.order) {
      path += path.includes('?') ? '&' : '?';
      path += `sortBy=${options.order}`;
    }
    
    return await this.client.request('GET', path);
  }
}

// Fonction principale pour créer une instance LinkedIn
function createLinkedIn(clientId: string, clientSecret: string, callbackUrl?: string, options: LinkedInOptions = {}): LinkedIn {
  return LinkedIn.createInstance(clientId, clientSecret, callbackUrl, options);
}

// Exporter la fonction principale et les classes
export default createLinkedIn;
export { LinkedIn, LinkedInClient, LinkedInOptions };
