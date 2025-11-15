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
  // New property for structured display
  formattedProperties?: FormattedProperty[];
}

export interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}

export interface FormattedProperty {
  name: string;
  type: string;
  value: string | string[];
  displayValue: string;
  color?: string;
  url?: string;
}

const extractIcon = (icon: any): string | undefined => {
  if (!icon) return undefined;
  if (icon.type === 'emoji') return icon.emoji;
  if (icon.type === 'external' && icon.external?.url) return '🔗';
  if (icon.type === 'file' && icon.file?.url) return '📄';
  return undefined;
};

/**
 * Extract title from database object (different structure than pages)
 */
const extractDatabaseTitle = (database: any): string => {
  if (database.title && Array.isArray(database.title) && database.title.length > 0) {
    const firstTitle = database.title[0];
    if (firstTitle.plain_text) {
      console.log('✅ Database title extracted:', firstTitle.plain_text);
      return firstTitle.plain_text;
    }
  }
  
  console.warn('⚠️ Could not extract database title, using fallback');
  return 'Untitled Database';
};

/**
 * Extract title from page properties (different structure than database titles)
 */
const extractPageTitle = (properties: any, fallback: string = 'Untitled'): string => {
  if (!properties) {
    console.warn('⚠️ No properties object provided for title extraction');
    return fallback;
  }

  const titleProperty = Object.values(properties).find(
    (prop: any) => prop?.type === 'title'
  ) as any;

  if (titleProperty?.title && Array.isArray(titleProperty.title) && titleProperty.title.length > 0) {
    const firstTitle = titleProperty.title[0];
    if (firstTitle.plain_text) {
      console.log('✅ Page title extracted:', firstTitle.plain_text);
      return firstTitle.plain_text;
    }
  }

  const commonNames = ['Name', 'Title', 'title', 'name'];
  for (const propName of commonNames) {
    const prop = properties[propName];
    if (prop?.type === 'title' && prop.title?.[0]?.plain_text) {
      console.log(`✅ Found title in property "${propName}":`, prop.title[0].plain_text);
      return prop.title[0].plain_text;
    }
  }

  console.warn('⚠️ Could not extract title from properties:', Object.keys(properties));
  return fallback;
};

/**
 * Extract rich text content from Notion rich text array
 */
const extractRichText = (richTextArray: any[]): string => {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(item => item.plain_text || '').join('');
};

/**
 * Format a single page property for display
 */
const formatProperty = (propertyName: string, property: any): FormattedProperty | null => {
  if (!property || !property.type) return null;

  const base: FormattedProperty = {
    name: propertyName,
    type: property.type,
    value: '',
    displayValue: '',
  };

  switch (property.type) {
    case 'title':
      if (property.title && Array.isArray(property.title)) {
        base.value = extractRichText(property.title);
        base.displayValue = base.value;
      }
      break;

    case 'rich_text':
      if (property.rich_text && Array.isArray(property.rich_text)) {
        base.value = extractRichText(property.rich_text);
        base.displayValue = base.value || '(Empty)';
      }
      break;

    case 'number':
      if (property.number !== null && property.number !== undefined) {
        base.value = property.number.toString();
        base.displayValue = property.number.toString();
      } else {
        base.displayValue = '(Not set)';
      }
      break;

    case 'select':
      if (property.select) {
        base.value = property.select.name;
        base.displayValue = property.select.name;
        base.color = property.select.color;
      } else {
        base.displayValue = '(Not selected)';
      }
      break;

    case 'multi_select':
      if (property.multi_select && Array.isArray(property.multi_select)) {
        const values = property.multi_select.map((item: any) => item.name);
        base.value = values;
        base.displayValue = values.length > 0 ? values.join(', ') : '(No tags)';
        
        // Store colors for individual tags
        const colors = property.multi_select.map((item: any) => item.color);
        base.color = colors.length > 0 ? colors[0] : undefined; // Use first color for simplicity
      } else {
        base.displayValue = '(No tags)';
      }
      break;

    case 'date':
      if (property.date) {
        let dateStr = property.date.start;
        if (property.date.end) {
          dateStr += ` → ${property.date.end}`;
        }
        base.value = dateStr;
        base.displayValue = dateStr;
      } else {
        base.displayValue = '(No date)';
      }
      break;

    case 'people':
      if (property.people && Array.isArray(property.people)) {
        const names = property.people.map((person: any) => person.name || 'Unknown');
        base.value = names;
        base.displayValue = names.length > 0 ? names.join(', ') : '(No people)';
      } else {
        base.displayValue = '(No people)';
      }
      break;

    case 'files':
      if (property.files && Array.isArray(property.files)) {
        const fileNames = property.files.map((file: any) => file.name || 'File');
        base.value = fileNames;
        base.displayValue = fileNames.length > 0 ? `${fileNames.length} file(s)` : '(No files)';
      } else {
        base.displayValue = '(No files)';
      }
      break;

    case 'checkbox':
      base.value = property.checkbox ? 'true' : 'false';
      base.displayValue = property.checkbox ? '✅ Yes' : '❌ No';
      break;

    case 'url':
      if (property.url) {
        base.value = property.url;
        base.displayValue = property.url;
        base.url = property.url;
      } else {
        base.displayValue = '(No URL)';
      }
      break;

    case 'email':
      if (property.email) {
        base.value = property.email;
        base.displayValue = property.email;
      } else {
        base.displayValue = '(No email)';
      }
      break;

    case 'phone_number':
      if (property.phone_number) {
        base.value = property.phone_number;
        base.displayValue = property.phone_number;
      } else {
        base.displayValue = '(No phone)';
      }
      break;

    case 'formula':
      if (property.formula) {
        // Formula results can be various types
        if (property.formula.type === 'string') {
          base.value = property.formula.string || '';
          base.displayValue = property.formula.string || '(Empty)';
        } else if (property.formula.type === 'number') {
          base.value = property.formula.number?.toString() || '';
          base.displayValue = property.formula.number?.toString() || '(No result)';
        } else if (property.formula.type === 'boolean') {
          base.value = property.formula.boolean ? 'true' : 'false';
          base.displayValue = property.formula.boolean ? '✅ True' : '❌ False';
        }
      } else {
        base.displayValue = '(No result)';
      }
      break;

    case 'relation':
      if (property.relation && Array.isArray(property.relation)) {
        base.value = property.relation.map((rel: any) => rel.id);
        base.displayValue = property.relation.length > 0 
          ? `${property.relation.length} relation(s)`
          : '(No relations)';
      } else {
        base.displayValue = '(No relations)';
      }
      break;

    case 'rollup':
      if (property.rollup) {
        // Rollup results can be various types
        if (property.rollup.type === 'array') {
          const arrayLength = property.rollup.array?.length || 0;
          base.displayValue = `${arrayLength} item(s)`;
        } else if (property.rollup.type === 'number') {
          base.value = property.rollup.number?.toString() || '';
          base.displayValue = property.rollup.number?.toString() || '(No result)';
        }
      } else {
        base.displayValue = '(No rollup)';
      }
      break;

    case 'created_time':
      base.value = property.created_time;
      base.displayValue = new Date(property.created_time).toLocaleString();
      break;

    case 'created_by':
      if (property.created_by) {
        base.value = property.created_by.name || 'Unknown';
        base.displayValue = property.created_by.name || 'Unknown';
      }
      break;

    case 'last_edited_time':
      base.value = property.last_edited_time;
      base.displayValue = new Date(property.last_edited_time).toLocaleString();
      break;

    case 'last_edited_by':
      if (property.last_edited_by) {
        base.value = property.last_edited_by.name || 'Unknown';
        base.displayValue = property.last_edited_by.name || 'Unknown';
      }
      break;

    default:
      base.displayValue = `(${property.type})`;
      console.warn(`⚠️ Unsupported property type: ${property.type}`);
  }

  return base;
};

/**
 * Format all properties of a page for display
 */
export const formatPageProperties = (properties: Record<string, any>): FormattedProperty[] => {
  if (!properties) return [];

  const formatted: FormattedProperty[] = [];
  
  Object.entries(properties).forEach(([name, property]) => {
    const formattedProp = formatProperty(name, property);
    if (formattedProp) {
      formatted.push(formattedProp);
    }
  });

  // Sort properties: title first, then alphabetically
  formatted.sort((a, b) => {
    if (a.type === 'title') return -1;
    if (b.type === 'title') return 1;
    return a.name.localeCompare(b.name);
  });

  return formatted;
};

/**
 * Get summary information for a page (tags, key properties, etc.)
 */
export const getPageSummary = (page: NotionPage): {
  title: string;
  tags: string[];
  status?: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  keyProperties: FormattedProperty[];
} => {
  const formatted = formatPageProperties(page.properties);
  
  const summary = {
    title: page.title,
    tags: [] as string[],
    keyProperties: [] as FormattedProperty[],
  };

  formatted.forEach(prop => {
    // Extract common property types
    if (prop.type === 'multi_select') {
      if (Array.isArray(prop.value)) {
        summary.tags.push(...prop.value);
      }
    }
    
    // Check for common property names
    const lowerName = prop.name.toLowerCase();
    if (lowerName.includes('status') && prop.type === 'select') {
      (summary as any).status = prop.displayValue;
    } else if (lowerName.includes('priority') && prop.type === 'select') {
      (summary as any).priority = prop.displayValue;
    } else if ((lowerName.includes('assign') || lowerName.includes('owner')) && prop.type === 'people') {
      (summary as any).assignee = prop.displayValue;
    } else if ((lowerName.includes('due') || lowerName.includes('deadline')) && prop.type === 'date') {
      (summary as any).dueDate = prop.displayValue;
    }

    // Include non-empty, non-title properties as key properties
    if (prop.type !== 'title' && prop.displayValue && !prop.displayValue.includes('(') && !prop.displayValue.includes('No ')) {
      summary.keyProperties.push(prop);
    }
  });

  return summary;
};

// ... rest of the existing functions remain the same ...

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

  if (!response.results || !Array.isArray(response.results)) {
    console.warn('⚠️ No databases found or invalid response structure');
    return [];
  }

  return response.results.map((db: any) => {
    const title = extractDatabaseTitle(db);
    console.log(`📚 Database found: ${title} (${db.id})`);
    return {
      id: db.id,
      title,
      icon: extractIcon(db.icon),
    };
  });
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

  console.log(`🗂️ Querying database ${databaseId}...`);
  const response = await makeNotionRequest(
    `/databases/${databaseId}/query`,
    'POST',
    body
  );

  if (!response.results || !Array.isArray(response.results)) {
    console.warn('⚠️ No pages found or invalid response structure');
    return {
      results: [],
      hasMore: false,
    };
  }

  console.log(`📄 Raw pages from API:`, response.results.length);

  const results = response.results.map((page: any) => {
    const title = extractPageTitle(page.properties, 'Untitled Page');
    console.log(`📄 Processing page: ${title} (${page.id})`);
    
    // Format properties for display
    const formattedProperties = formatPageProperties(page.properties);
    
    if (!title || title === 'Untitled Page') {
      console.warn(`⚠️ Page ${page.id} has no valid title. Properties:`, Object.keys(page.properties || {}));
      Object.entries(page.properties || {}).forEach(([key, prop]) => {
        console.log(`  Property "${key}":`, prop);
      });
    }

    const processedPage: NotionPage = {
      id: page.id,
      title,
      icon: extractIcon(page.icon),
      cover: page.cover,
      properties: page.properties,
      url: page.url,
      formattedProperties, // Add formatted properties
    };

    return processedPage;
  });

  console.log(`✅ Successfully processed ${results.length} pages`);

  return {
    results,
    hasMore: response.has_more,
    nextCursor: response.next_cursor,
  };
};

// ... rest of the existing functions remain the same ...

export const getPageBlocks = async (pageId: string): Promise<NotionBlock[]> => {
  console.log(`📖 Fetching blocks for page: ${pageId}`);
  const response = await makeNotionRequest(`/blocks/${pageId}/children`, 'GET');
  
  if (!response.results || !Array.isArray(response.results)) {
    console.warn('⚠️ No blocks found or invalid response structure');
    return [];
  }
  
  console.log(`✅ Retrieved ${response.results.length} blocks`);
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
  const blocks = await getPageBlocks(pageId);
  const childPageBlocks = blocks.filter(
    (block: any) => block.type === 'child_page'
  );

  console.log(`👶 Found ${childPageBlocks.length} child pages for ${pageId}`);

  const childPages: NotionPage[] = [];
  for (const block of childPageBlocks) {
    try {
      const pageResponse = await makeNotionRequest(`/pages/${block.id}`, 'GET');
      const title = extractPageTitle(
        pageResponse.properties,
        block.child_page?.title || 'Untitled Child Page'
      );

      console.log(`👶 Child page: ${title} (${pageResponse.id})`);

      childPages.push({
        id: pageResponse.id,
        title,
        icon: extractIcon(pageResponse.icon),
        cover: pageResponse.cover,
        properties: pageResponse.properties,
        url: pageResponse.url,
        parentId: pageId,
        objectType: 'page',
        formattedProperties: formatPageProperties(pageResponse.properties),
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
    const hasChildren = blocks.some((block: any) => block.type === 'child_page');
    console.log(`🔍 Page ${pageId} has children: ${hasChildren}`);
    return hasChildren;
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
    const title = extractPageTitle(pageResponse.properties, 'Untitled Page');
    console.log(`🌳 Page hierarchy: ${title} at depth ${currentDepth}`);

    const page: NotionPage = {
      id: pageResponse.id,
      title,
      icon: extractIcon(pageResponse.icon),
      cover: pageResponse.cover,
      properties: pageResponse.properties,
      url: pageResponse.url,
      depthLevel: currentDepth,
      objectType: 'page',
      children: [],
      formattedProperties: formatPageProperties(pageResponse.properties),
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

/**
 * Utility function to validate if a page has a proper title for drag-and-drop
 */
export const isPageValidForDragAndDrop = (page: NotionPage): boolean => {
  const isValid = !!(page.title && page.title.trim() && page.title !== 'Untitled' && page.title !== 'Untitled Page');
  if (!isValid) {
    console.warn(`⚠️ Page ${page.id} is not valid for drag-and-drop: title="${page.title}"`);
  }
  return isValid;
};

/**
 * Debug function to log the structure of a page's properties
 */
export const debugPageProperties = (page: any) => {
  console.log('🔍 Page Debug Info:');
  console.log('  ID:', page.id);
  console.log('  Raw Properties:', page.properties);
  
  if (page.properties) {
    Object.entries(page.properties).forEach(([key, prop]: [string, any]) => {
      console.log(`  Property "${key}":`, {
        type: prop.type,
        value: prop[prop.type],
      });
    });
  }
};
