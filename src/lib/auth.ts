import { saveAuthToken, removeAuthToken, getAuthToken } from './storage';

const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID || '';
const BACKEND_TOKEN_ENDPOINT = import.meta.env.VITE_BACKEND_TOKEN_ENDPOINT || '';
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || '';

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
 * Initiate Notion OAuth flow for web app
 */
export const initiateNotionAuth = async (): Promise<void> => {
  try {
    // Validate configuration
    if (!NOTION_CLIENT_ID) {
      throw new Error('Notion Client ID not configured. Check your .env file.');
    }

    if (!REDIRECT_URI) {
      throw new Error('Redirect URI not configured. Check your .env file.');
    }

    console.log('[Auth] Starting OAuth flow');
    console.log('[Auth] Redirect URI:', REDIRECT_URI);
    console.log('[Auth] Client ID:', NOTION_CLIENT_ID);

    // Build authorization URL
    const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
    authUrl.searchParams.set('client_id', NOTION_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('owner', 'user');

    console.log('[Auth] Redirecting to Notion authorization...');

    // Redirect to Notion authorization page
    window.location.href = authUrl.toString();

  } catch (error) {
    console.error('[Auth] Failed to initiate authentication:', error);
    throw error;
  }
};

/**
 * Handle OAuth callback and exchange code for token
 */
export const handleOAuthCallback = async (): Promise<AuthResult> => {
  try {
    // Get code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      return { success: false, error: 'No authorization code received' };
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
        redirect_uri: REDIRECT_URI,
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

    // Clean up URL (remove code parameter)
    window.history.replaceState({}, document.title, window.location.pathname);

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
