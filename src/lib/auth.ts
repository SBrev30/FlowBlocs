import { saveAuthToken, removeAuthToken, getAuthToken } from './storage';

const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID || '';
const BACKEND_TOKEN_ENDPOINT = import.meta.env.VITE_BACKEND_TOKEN_ENDPOINT || '';

export interface NotionUser {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  accessToken?: string;
}

/**
 * Get the Chrome extension redirect URI
 */
const getRedirectURI = (): string => {
  return chrome.identity.getRedirectURL('oauth2callback');
};

/**
 * Initiate Notion OAuth flow using Chrome Identity API
 */
export const initiateNotionAuth = async (): Promise<AuthResult> => {
  try {
    // Validate configuration
    if (!NOTION_CLIENT_ID) {
      throw new Error('Notion Client ID not configured. Check your .env file.');
    }

    if (!BACKEND_TOKEN_ENDPOINT) {
      throw new Error('Backend token endpoint not configured. Check your .env file.');
    }

    const redirectUri = getRedirectURI();
    console.log('[Auth] Starting OAuth flow');
    console.log('[Auth] Redirect URI:', redirectUri);
    console.log('[Auth] Client ID:', NOTION_CLIENT_ID);

    // Build authorization URL
    const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
    authUrl.searchParams.set('client_id', NOTION_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('owner', 'user');

    console.log('[Auth] Authorization URL:', authUrl.toString());

    // Launch OAuth flow in popup
    const redirectUrl = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl.toString(),
          interactive: true
        },
        (responseUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!responseUrl) {
            reject(new Error('No response from Notion'));
            return;
          }

          resolve(responseUrl);
        }
      );
    });

    console.log('[Auth] Got redirect URL:', redirectUrl);

    // Extract authorization code
    const url = new URL(redirectUrl);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    console.log('[Auth] Got authorization code, exchanging for token...');

    // Exchange code for access token via backend
    const response = await fetch(BACKEND_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Token exchange failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      throw new Error('No access token in response');
    }

    console.log('[Auth] Successfully obtained access token');

    // Save token to storage
    await saveAuthToken(accessToken);

    console.log('[Auth] Authentication complete!');

    return {
      success: true,
      accessToken
    };

  } catch (error) {
    console.error('[Auth] Authentication failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

/**
 * Get current authentication status
 */
export const checkAuthStatus = async () => {
  const token = await getAuthToken();
  
  return {
    isAuthenticated: !!token,
    token: token || undefined
  };
};

/**
 * Sign out and clear stored credentials
 */
export const signOut = async (): Promise<void> => {
  console.log('[Auth] Signing out...');
  await removeAuthToken();
  console.log('[Auth] Sign out complete');
};

/**
 * Get the redirect URI (useful for debugging)
 */
export const getOAuthRedirectURI = (): string => {
  return getRedirectURI();
};
