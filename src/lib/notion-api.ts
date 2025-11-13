import { getAuthToken } from './storage';

// Use Supabase Edge Function to proxy Notion API calls (fixes CORS)
const SUPABASE_PROXY_URL = 'https://qaccpssuhvsltnzhjxfl.supabase.co/functions/v1/notion-api-proxy';

export interface NotionDatabase {
  id: string;
  title: string;
  icon?: string;
}

export interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  cover?: any;
  properties: Record<string, any>;
  url: string;
}

export interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}

const extractIcon = (icon: any): string | undefined => {
  if (!icon) return undefined;
  if (icon.type === 'emoji') return icon.emoji;
  if (icon.type === 'external' && icon.external?.url) return '🔗';
  if (icon.type === 'file' && icon.file?.url) return '📄';
  return undefined;
};

/**
 * Make a request through Supabase proxy to avoid CORS issues
 */
const makeNotionRequest = async (
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> => {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  console.log(`🔄 API Request: ${method} ${endpoint}`);

  const response = await fetch(SUPABASE_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      endpoint,
      method,
      body,
      token
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API Error:', error);
    throw new Error(error.error || 'Notion API request failed');
  }

  const data = await response.json();
  console.log(`✅ API Response: ${method} ${endpoint}`, data);
  return data;
};

export const getCurrentUser = async (): Promise<any> => {
  return makeNotionRequest('/users/me', 'GET');
};

export const searchDatabases = async (): Promise<NotionDatabase[]> => {
  const response = await makeNotionRequest('/search', 'POST', {
    filter: {
      property: 'object',
      value: 'database',
    },
    sort: {
      direction: 'descending',
      timestamp: 'last_edited_time',
    },
  });

  return response.results.map((db: any) => ({
    id: db.id,
    title: db.title?.[0]?.plain_text || 'Untitled',
    icon: extractIcon(db.icon),
  }));
};

export const queryDatabase = async (
  databaseId: string,
  startCursor?: string
): Promise<{ results: NotionPage[]; hasMore: boolean; nextCursor?: string }> => {
  const body: any = {
    page_size: 100,
  };

  if (startCursor) {
    body.start_cursor = startCursor;
  }

  const response = await makeNotionRequest(
    `/databases/${databaseId}/query`,
    'POST',
    body
  );

  const results = response.results.map((page: any) => {
    const titleProperty = Object.values(page.properties).find(
      (prop: any) => prop.type === 'title'
    ) as any;

    return {
      id: page.id,
      title: titleProperty?.title?.[0]?.plain_text || 'Untitled',
      icon: extractIcon(page.icon),
      cover: page.cover,
      properties: page.properties,
      url: page.url,
    };
  });

  return {
    results,
    hasMore: response.has_more,
    nextCursor: response.next_cursor,
  };
};

export const getPageBlocks = async (pageId: string): Promise<NotionBlock[]> => {
  const response = await makeNotionRequest(`/blocks/${pageId}/children`, 'GET');
  return response.results;
};

export const updatePageContent = async (
  blockId: string,
  content: Record<string, any>
): Promise<void> => {
  await makeNotionRequest(`/blocks/${blockId}`, 'PATCH', content);
};

export const appendBlocks = async (
  blockId: string,
  children: any[]
): Promise<void> => {
  await makeNotionRequest(`/blocks/${blockId}/children`, 'PATCH', { children });
};
