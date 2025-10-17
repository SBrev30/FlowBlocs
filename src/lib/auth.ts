import { saveAuthToken, removeAuthToken } from './storage';

const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID || '';
const NOTION_REDIRECT_URI = import.meta.env.VITE_NOTION_REDIRECT_URI || chrome.identity.getRedirectURL();
const BACKEND_TOKEN_ENDPOINT = import.meta.env.VITE_BACKEND_TOKEN_ENDPOINT || '';

export interface NotionUser {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
}

export const initiateNotionAuth = (): void => {
  const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
  authUrl.searchParams.set('client_id', NOTION_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('owner', 'user');
  authUrl.searchParams.set('redirect_uri', NOTION_REDIRECT_URI);

  window.location.href = authUrl.toString();
};

export const handleAuthCallback = async (code: string): Promise<string> => {
  try {
    const response = await fetch(BACKEND_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: NOTION_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    const accessToken = data.access_token;

    await saveAuthToken(accessToken);
    return accessToken;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  await removeAuthToken();
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await chrome.storage.sync.get(['notionAccessToken']);
  return !!token.notionAccessToken;
};
