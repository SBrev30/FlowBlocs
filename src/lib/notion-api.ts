import { getAuthToken } from './storage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PROXY_URL = `${SUPABASE_URL}/functions/v1/notion-api-proxy`;

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
  parentId?: string;
  hasChildren?: boolean;
  childCount?: number;
  children?: NotionPage[];
  depthLevel?: number;
  objectType?: 'page' | 'database';
  lastSynced?: string;
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

export const getPageChildren = async (pageId: string): Promise<NotionPage[]> => {
  const response = await makeNotionRequest('/search', 'POST', {
    filter: {
      property: 'object',
      value: 'page',
    },
    query: '',
  });

  const blocks = await getPageBlocks(pageId);
  const childPageBlocks = blocks.filter(
    (block: any) => block.type === 'child_page'
  );

  const childPages: NotionPage[] = [];
  for (const block of childPageBlocks) {
    try {
      const pageResponse = await makeNotionRequest(`/pages/${block.id}`, 'GET');
      const titleProperty = Object.values(pageResponse.properties).find(
        (prop: any) => prop.type === 'title'
      ) as any;

      childPages.push({
        id: pageResponse.id,
        title: titleProperty?.title?.[0]?.plain_text || block.child_page?.title || 'Untitled',
        icon: extractIcon(pageResponse.icon),
        cover: pageResponse.cover,
        properties: pageResponse.properties,
        url: pageResponse.url,
        parentId: pageId,
        objectType: 'page',
      });
    } catch (error) {
      console.error(`Failed to fetch child page ${block.id}:`, error);
    }
  }

  return childPages;
};

export const checkPageHasChildren = async (pageId: string): Promise<boolean> => {
  try {
    const blocks = await getPageBlocks(pageId);
    return blocks.some((block: any) => block.type === 'child_page');
  } catch (error) {
    console.error(`Failed to check children for page ${pageId}:`, error);
    return false;
  }
};

export const getPageHierarchy = async (
  pageId: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<NotionPage | null> => {
  try {
    const pageResponse = await makeNotionRequest(`/pages/${pageId}`, 'GET');
    const titleProperty = Object.values(pageResponse.properties).find(
      (prop: any) => prop.type === 'title'
    ) as any;

    const page: NotionPage = {
      id: pageResponse.id,
      title: titleProperty?.title?.[0]?.plain_text || 'Untitled',
      icon: extractIcon(pageResponse.icon),
      cover: pageResponse.cover,
      properties: pageResponse.properties,
      url: pageResponse.url,
      depthLevel: currentDepth,
      objectType: 'page',
      children: [],
    };

    if (currentDepth < maxDepth) {
      const children = await getPageChildren(pageId);
      page.hasChildren = children.length > 0;
      page.childCount = children.length;

      if (children.length > 0) {
        const childHierarchies = await Promise.all(
          children.map(child => getPageHierarchy(child.id, maxDepth, currentDepth + 1))
        );
        page.children = childHierarchies.filter(Boolean) as NotionPage[];
      }
    } else {
      page.hasChildren = await checkPageHasChildren(pageId);
    }

    return page;
  } catch (error) {
    console.error(`Failed to fetch page hierarchy for ${pageId}:`, error);
    return null;
  }
};
