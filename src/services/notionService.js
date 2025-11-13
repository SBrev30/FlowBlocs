/**
 * Notion API Service - Proxies all calls through Supabase Edge Function
 * Replace all direct Notion API calls with this service
 */

const SUPABASE_FUNCTION_URL = 'https://qaccpssuhvsltnzhjxfl.supabase.co/functions/v1/notion-api-proxy';

/**
 * Base proxy function to call Notion API through Supabase
 */
async function callNotionAPI({ endpoint, method = 'GET', body = null, token }) {
  if (!token) {
    throw new Error('Access token is required');
  }

  const response = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      endpoint,
      method,
      body,
      token
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'API request failed');
  }

  return response.json();
}

/**
 * Notion API Service - All methods use the proxy
 */
const notionService = {
  /**
   * Get current user information
   */
  async getCurrentUser(token) {
    return callNotionAPI({
      endpoint: '/users/me',
      method: 'GET',
      token
    });
  },

  /**
   * Search for databases in the workspace
   */
  async searchDatabases(token, pageSize = 100) {
    return callNotionAPI({
      endpoint: '/search',
      method: 'POST',
      body: {
        filter: {
          property: 'object',
          value: 'database'
        },
        page_size: pageSize
      },
      token
    });
  },

  /**
   * Search for all objects (pages and databases)
   */
  async search(token, query = '', pageSize = 100) {
    return callNotionAPI({
      endpoint: '/search',
      method: 'POST',
      body: {
        query,
        page_size: pageSize
      },
      token
    });
  },

  /**
   * Get database details
   */
  async getDatabase(token, databaseId) {
    return callNotionAPI({
      endpoint: `/databases/${databaseId}`,
      method: 'GET',
      token
    });
  },

  /**
   * Query database for pages/items
   */
  async queryDatabase(token, databaseId, options = {}) {
    const { 
      pageSize = 100, 
      startCursor = null,
      filter = null,
      sorts = null 
    } = options;

    const body = {
      page_size: pageSize
    };

    if (startCursor) body.start_cursor = startCursor;
    if (filter) body.filter = filter;
    if (sorts) body.sorts = sorts;

    return callNotionAPI({
      endpoint: `/databases/${databaseId}/query`,
      method: 'POST',
      body,
      token
    });
  },

  /**
   * Get page details
   */
  async getPage(token, pageId) {
    return callNotionAPI({
      endpoint: `/pages/${pageId}`,
      method: 'GET',
      token
    });
  },

  /**
   * Get block children (page content)
   */
  async getBlockChildren(token, blockId, startCursor = null) {
    const endpoint = startCursor 
      ? `/blocks/${blockId}/children?start_cursor=${startCursor}`
      : `/blocks/${blockId}/children`;

    return callNotionAPI({
      endpoint,
      method: 'GET',
      token
    });
  },

  /**
   * Update page properties
   */
  async updatePage(token, pageId, properties) {
    return callNotionAPI({
      endpoint: `/pages/${pageId}`,
      method: 'PATCH',
      body: { properties },
      token
    });
  },

  /**
   * Append block children (add content to page)
   */
  async appendBlockChildren(token, blockId, children) {
    return callNotionAPI({
      endpoint: `/blocks/${blockId}/children`,
      method: 'PATCH',
      body: { children },
      token
    });
  },

  /**
   * Update block
   */
  async updateBlock(token, blockId, updates) {
    return callNotionAPI({
      endpoint: `/blocks/${blockId}`,
      method: 'PATCH',
      body: updates,
      token
    });
  },

  /**
   * Delete block
   */
  async deleteBlock(token, blockId) {
    return callNotionAPI({
      endpoint: `/blocks/${blockId}`,
      method: 'DELETE',
      token
    });
  },

  /**
   * Get user details
   */
  async getUser(token, userId) {
    return callNotionAPI({
      endpoint: `/users/${userId}`,
      method: 'GET',
      token
    });
  },

  /**
   * List all users
   */
  async listUsers(token, startCursor = null) {
    const endpoint = startCursor 
      ? `/users?start_cursor=${startCursor}`
      : `/users`;

    return callNotionAPI({
      endpoint,
      method: 'GET',
      token
    });
  },

  /**
   * Create a new page
   */
  async createPage(token, parent, properties, children = []) {
    return callNotionAPI({
      endpoint: '/pages',
      method: 'POST',
      body: {
        parent,
        properties,
        children
      },
      token
    });
  }
};

export default notionService;
