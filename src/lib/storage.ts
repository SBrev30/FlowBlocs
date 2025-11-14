import { Node, Edge } from 'reactflow';
import { NotionPage } from './notion-api';

const AUTH_TOKEN_KEY = 'notionAccessToken';
const CANVAS_STATE_KEY = 'canvasState';
const PAGE_HIERARCHY_CACHE_KEY = 'pageHierarchyCache';
const EXPANDED_PAGES_KEY = 'expandedPages';

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Web app storage using localStorage instead of chrome.storage
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
    throw error;
  }
};

export const saveCanvasState = async (state: CanvasState): Promise<void> => {
  try {
    localStorage.setItem(CANVAS_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving canvas state:', error);
    throw error;
  }
};

export const getCanvasState = async (): Promise<CanvasState | null> => {
  try {
    const stateStr = localStorage.getItem(CANVAS_STATE_KEY);
    return stateStr ? JSON.parse(stateStr) : null;
  } catch (error) {
    console.error('Error getting canvas state:', error);
    return null;
  }
};

export const clearCanvasState = async (): Promise<void> => {
  try {
    localStorage.removeItem(CANVAS_STATE_KEY);
  } catch (error) {
    console.error('Error clearing canvas state:', error);
    throw error;
  }
};

export interface PageHierarchyCache {
  [pageId: string]: {
    data: NotionPage;
    timestamp: number;
    expiresAt: number;
  };
}

export const savePageHierarchy = async (
  pageId: string,
  data: NotionPage,
  ttlMinutes: number = 30
): Promise<void> => {
  try {
    const cache = await getPageHierarchyCache();
    const now = Date.now();
    cache[pageId] = {
      data,
      timestamp: now,
      expiresAt: now + ttlMinutes * 60 * 1000,
    };
    localStorage.setItem(PAGE_HIERARCHY_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving page hierarchy:', error);
    throw error;
  }
};

export const getPageHierarchy = async (pageId: string): Promise<NotionPage | null> => {
  try {
    const cache = await getPageHierarchyCache();
    const cached = cache[pageId];

    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now > cached.expiresAt) {
      delete cache[pageId];
      localStorage.setItem(PAGE_HIERARCHY_CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    return cached.data;
  } catch (error) {
    console.error('Error getting page hierarchy:', error);
    return null;
  }
};

export const getPageHierarchyCache = async (): Promise<PageHierarchyCache> => {
  try {
    const cacheStr = localStorage.getItem(PAGE_HIERARCHY_CACHE_KEY);
    return cacheStr ? JSON.parse(cacheStr) : {};
  } catch (error) {
    console.error('Error getting page hierarchy cache:', error);
    return {};
  }
};

export const clearPageHierarchyCache = async (): Promise<void> => {
  try {
    localStorage.removeItem(PAGE_HIERARCHY_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing page hierarchy cache:', error);
    throw error;
  }
};

export const saveExpandedPages = async (pageIds: string[]): Promise<void> => {
  try {
    localStorage.setItem(EXPANDED_PAGES_KEY, JSON.stringify(pageIds));
  } catch (error) {
    console.error('Error saving expanded pages:', error);
    throw error;
  }
};

export const getExpandedPages = async (): Promise<string[]> => {
  try {
    const expandedStr = localStorage.getItem(EXPANDED_PAGES_KEY);
    return expandedStr ? JSON.parse(expandedStr) : [];
  } catch (error) {
    console.error('Error getting expanded pages:', error);
    return [];
  }
};

export const clearExpiredCache = async (): Promise<void> => {
  try {
    const cache = await getPageHierarchyCache();
    const now = Date.now();
    let hasChanges = false;

    for (const pageId in cache) {
      if (now > cache[pageId].expiresAt) {
        delete cache[pageId];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      localStorage.setItem(PAGE_HIERARCHY_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
};
