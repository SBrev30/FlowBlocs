import { getAuthToken } from './storage';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export interface NotionDatabase {
  id: string;
  title: string;
  icon?: {
    type: string;
    emoji?: string;
    file?: { url: string };
    external?: { url: string };
  };
  cover?: {
    type: string;
    file?: { url: string };
    external?: { url: string };
  };
}

export interface NotionPage {
  id: string;
  title: string;
  icon?: {
    type: string;
    emoji?: string;
    file?: { url: string };
    external?: { url: string };
  };
  cover?: {
    type: string;
    file?: { url: string };
    external?: { url: string };
  };
  properties: Record<string, any>;
  url: string;
}

export interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}

const makeNotionRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${NOTION_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Notion API request failed');
  }

  return response.json();
};

export const getCurrentUser = async (): Promise<any> => {
  return makeNotionRequest('/users/me');
};

export const searchDatabases = async (): Promise<NotionDatabase[]> => {
  const response = await makeNotionRequest('/search', {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        property: 'object',
        value: 'database',
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
    }),
  });

  return response.results.map((db: any) => ({
    id: db.id,
    title: db.title?.[0]?.plain_text || 'Untitled',
    icon: db.icon,
    cover: db.cover,
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

  const response = await makeNotionRequest(`/databases/${databaseId}/query`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const results = response.results.map((page: any) => {
    const titleProperty = Object.values(page.properties).find(
      (prop: any) => prop.type === 'title'
    ) as any;

    return {
      id: page.id,
      title: titleProperty?.title?.[0]?.plain_text || 'Untitled',
      icon: page.icon,
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
  const response = await makeNotionRequest(`/blocks/${pageId}/children`);
  return response.results;
};

export const updatePageContent = async (
  blockId: string,
  content: Record<string, any>
): Promise<void> => {
  await makeNotionRequest(`/blocks/${blockId}`, {
    method: 'PATCH',
    body: JSON.stringify(content),
  });
};

export const appendBlocks = async (
  blockId: string,
  children: any[]
): Promise<void> => {
  await makeNotionRequest(`/blocks/${blockId}/children`, {
    method: 'PATCH',
    body: JSON.stringify({ children }),
  });
};
