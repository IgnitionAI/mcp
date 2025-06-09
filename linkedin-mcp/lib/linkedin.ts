type LinkedInOptions = {
  timeout?: number;
  mobileToken?: boolean;
};

type LinkedInTokens = {
  accessToken: string;
  expiresIn: number;
  expiresAt?: number;
};

class LinkedIn {
  private clientId: string;
  private clientSecret: string;
  private callbackUrl: string | null;
  private options: LinkedInOptions;
  private accessToken: string | null = null;
  private state: string | null = null;


  constructor(clientId: string, clientSecret: string, callbackUrl?: string, options: LinkedInOptions = {}) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.callbackUrl = callbackUrl || null;
    this.options = {
      timeout: options.timeout || 60000, 
      mobileToken: options.mobileToken || false
    };
  }


  auth = {

    setCallback: (callbackUrl: string): void => {
      this.callbackUrl = callbackUrl;
    },

    
    authorize: (res: any, scope: string[], state?: string): string => {
      if (!this.callbackUrl) {
        throw new Error('Callback URL is required for authorization');
      }


      this.state = state || Math.random().toString(36).substring(2, 15);
      

      const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', this.clientId);
      authUrl.searchParams.append('redirect_uri', this.callbackUrl);
      authUrl.searchParams.append('state', this.state);
      authUrl.searchParams.append('scope', scope.join(' '));
      
      const redirectUrl = authUrl.toString();
      

      if (res && typeof res.redirect === 'function') {
        res.redirect(redirectUrl);
        return redirectUrl;
      }
      

      return redirectUrl;
    },


    getAccessToken: async (res: any, code: string, state: string, callback: (err: Error | null, data?: any) => void): Promise<void> => {
      try {

        if (this.state && state !== this.state) {
          throw new Error('State mismatch - possible CSRF attack');
        }

        if (!this.callbackUrl) {
          throw new Error('Callback URL is required for token exchange');
        }
        
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
        

        this.accessToken = data.access_token;
        
        if (res && typeof res.json === 'function') {
          res.json(data);
        }
        
        callback(null, data);
      } catch (error) {
        console.error('Erreur lors de l\'authentification LinkedIn:', error);
        callback(error as Error);
      }
    }
  };

  static init(accessToken: string, options: LinkedInOptions = {}): LinkedInClient {
    return new LinkedInClient(accessToken, options);
  }


  static createInstance(clientId: string, clientSecret: string, callbackUrl?: string, options: LinkedInOptions = {}): LinkedIn {
    return new LinkedIn(clientId, clientSecret, callbackUrl, options);
  }
}


class LinkedInClient {
  private accessToken: string;
  private options: LinkedInOptions;
  
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
    
    this.people = new PeopleModule(this);
    this.companies = new CompaniesModule(this);
    this.companies_search = new CompaniesSearchModule(this);
    this.connections = new ConnectionsModule(this);
    this.group = new GroupModule(this);
  }


  async request(method: string, path: string, body?: any): Promise<any> {
    try {
      const url = `https://api.linkedin.com/v2/${path}`;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      };
      
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


  getAccessToken(): string {
    return this.accessToken;
  }
}


class PeopleModule {
  private client: LinkedInClient;
  
  constructor(client: LinkedInClient) {
    this.client = client;
  }
  

  async me(fields?: string[]): Promise<any> {
    const path = fields ? `me?projection=(${fields.join(',')})` : 'me';
    return await this.client.request('GET', path);
  }
  

  async url(url: string, fields?: string[]): Promise<any> {
    const path = fields ? `people?q=vanityName&projection=(${fields.join(',')})` : 'people?q=vanityName';
    return await this.client.request('GET', path);
  }
  

  async id(id: string, fields?: string[]): Promise<any> {
    const path = fields ? `people/${id}?projection=(${fields.join(',')})` : `people/${id}`;
    return await this.client.request('GET', path);
  }
}


class CompaniesModule {
  private client: LinkedInClient;
  
  constructor(client: LinkedInClient) {
    this.client = client;
  }

  async company(id: string): Promise<any> {
    return await this.client.request('GET', `companies/${id}`);
  }

  async name(name: string): Promise<any> {
    return await this.client.request('GET', `companies?q=vanityName&vanityName=${encodeURIComponent(name)}`);
  }
  

  async email_domain(domain: string): Promise<any> {
    return await this.client.request('GET', `companies?q=emailDomain&emailDomain=${encodeURIComponent(domain)}`);
  }
  

  async multiple(ids: string): Promise<any> {
    return await this.client.request('GET', `companies?ids=${encodeURIComponent(ids)}`);
  }
  

  async asAdmin(): Promise<any> {
    return await this.client.request('GET', 'organizationAcls?q=roleAssignee');
  }
  

  async updates(id: string): Promise<any> {
    return await this.client.request('GET', `companies/${id}/updates`);
  }
  

  async getUpdate(companyId: string, updateId: string): Promise<any> {
    return await this.client.request('GET', `companies/${companyId}/updates/${updateId}`);
  }
}


class CompaniesSearchModule {
  private client: LinkedInClient;
  
  constructor(client: LinkedInClient) {
    this.client = client;
  }
  

  async name(name: string, count: number = 10): Promise<any> {
    return await this.client.request('GET', `companiesSearch?q=name&keywords=${encodeURIComponent(name)}&count=${count}`);
  }
}


class ConnectionsModule {
  private client: LinkedInClient;
  
  constructor(client: LinkedInClient) {
    this.client = client;
  }
  

  async retrieve(): Promise<any> {
    return await this.client.request('GET', 'connections?q=viewer');
  }
}


class GroupModule {
  private client: LinkedInClient;
  
  constructor(client: LinkedInClient) {
    this.client = client;
  }
  

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


function createLinkedIn(clientId: string, clientSecret: string, callbackUrl?: string, options: LinkedInOptions = {}): LinkedIn {
  return LinkedIn.createInstance(clientId, clientSecret, callbackUrl, options);
}


export default createLinkedIn;
export { LinkedIn, LinkedInClient, LinkedInOptions };
