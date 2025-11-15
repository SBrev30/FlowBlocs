import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import * as NotionAPI from './notion-api';

export interface NotionDatabase {
  id: string;
  title: string;
  icon?: string;
  url?: string;
  pageCount?: number;
  lastSynced?: string;
}

export interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  cover?: any;
  url: string;
  properties: Record<string, any>;
  databaseId?: string;
  hasChildren?: boolean;
  childCount?: number;
  children?: NotionPage[];
  createdTime?: string;
  lastEditedTime?: string;
  parentId?: string;
  objectType?: 'page' | 'database';
  depthLevel?: number;
  lastSynced?: string;
}

export interface NotionBlock {
  id: string;
  type: string;
  content?: string;
  hasChildren?: boolean;
  metadata?: Record<string, any>;
  position: number;
}

const CACHE_TTL_MINUTES = 30;

export class NotionSidebarService {
  constructor(accessToken: string) {
    void accessToken;
  }

  private async isCacheStale(
    lastSynced: string | null,
    maxAgeMinutes: number = CACHE_TTL_MINUTES
  ): Promise<boolean> {
    if (!lastSynced) return true;

    const cacheDate = new Date(lastSynced);
    const now = new Date();
    const diffMinutes = (now.getTime() - cacheDate.getTime()) / (1000 * 60);

    return diffMinutes > maxAgeMinutes;
  }

  async fetchDatabases(forceRefresh: boolean = false): Promise<NotionDatabase[]> {
    console.log('📚 Fetching databases...', { forceRefresh });

    if (!forceRefresh) {
      const { data: cached, error } = await supabase
        .from('notion_databases_cache')
        .select('*')
        .order('last_synced', { ascending: false });

      if (!error && cached && cached.length > 0) {
        const isStale = await this.isCacheStale(cached[0].last_synced);

        if (!isStale) {
          console.log('✅ Using cached databases:', cached.length);
          return cached.map((db: any) => ({
            id: db.id,
            title: db.title || 'Untitled Database',
            icon: db.icon,
            url: db.url || `https://notion.so/${db.id.replace(/-/g, '')}`,
            pageCount: db.page_count,
            lastSynced: db.last_synced,
          }));
        } else {
          console.log('⏰ Cache is stale, fetching fresh data');
        }
      } else {
        console.log('🔍 No cached data found or error:', error);
      }
    }

    console.log('🔄 Fetching fresh databases from Notion API...');
    
    try {
      const databases = await NotionAPI.searchDatabases();
      console.log('📚 Raw databases from API:', databases.length);

      // Validate databases before caching
      const validDatabases = databases.filter(db => {
        const isValid = !!(db.id && db.title && db.title.trim());
        if (!isValid) {
          console.warn('⚠️ Invalid database found:', db);
        }
        return isValid;
      });

      console.log('✅ Valid databases:', validDatabases.length);

      // Cache the databases
      for (const db of validDatabases) {
        const { error } = await supabase
          .from('notion_databases_cache')
          .upsert({
            id: db.id,
            title: db.title,
            icon: db.icon,
            url: `https://notion.so/${db.id.replace(/-/g, '')}`,
            properties_schema: {},
            page_count: 0,
            last_synced: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });

        if (error) {
          console.error('Failed to cache database:', error);
        } else {
          console.log(`💾 Cached database: ${db.title}`);
        }
      }

      return validDatabases.map(db => ({
        id: db.id,
        title: db.title,
        icon: db.icon,
        url: `https://notion.so/${db.id.replace(/-/g, '')}`,
      }));

    } catch (error) {
      console.error('❌ Failed to fetch databases:', error);
      throw error;
    }
  }

  async fetchDatabasePages(
    databaseId: string,
    forceRefresh: boolean = false
  ): Promise<NotionPage[]> {
    console.log('📄 Fetching pages for database:', databaseId, { forceRefresh });

    if (!forceRefresh) {
      const { data: cached, error } = await supabase
        .from('notion_page_properties_cache')
        .select('*')
        .eq('database_id', databaseId)
        .order('created_at', { ascending: false });

      if (!error && cached && cached.length > 0) {
        const isStale = await this.isCacheStale(cached[0].last_synced);

        if (!isStale) {
          console.log('✅ Using cached pages:', cached.length);
          return cached.map((page: any) => ({
            id: page.id,
            title: page.title || 'Untitled Page',
            icon: page.icon,
            url: page.url || `https://notion.so/${page.id.replace(/-/g, '')}`,
            properties: page.properties || {},
            databaseId: page.database_id,
            hasChildren: page.has_children,
            createdTime: page.created_time,
            lastEditedTime: page.last_edited_time,
          }));
        } else {
          console.log('⏰ Page cache is stale, fetching fresh data');
        }
      } else {
        console.log('🔍 No cached pages found or error:', error);
      }
    }

    console.log('🔄 Fetching fresh pages from Notion API...');
    
    try {
      const response = await NotionAPI.queryDatabase(databaseId);
      const pages = response.results;

      console.log(`📄 Raw pages from API: ${pages.length}`);

      // Validate and process pages
      const validPages = [];
      for (const page of pages) {
        // Debug each page
        if (!page.title || page.title.trim() === '' || page.title === 'Untitled' || page.title === 'Untitled Page') {
          console.warn(`⚠️ Page ${page.id} has invalid title: "${page.title}"`);
          NotionAPI.debugPageProperties(page);
          
          // Try to extract a better title
          const betterTitle = this.extractBetterTitle(page);
          if (betterTitle && betterTitle !== 'Untitled Page') {
            page.title = betterTitle;
            console.log(`✅ Fixed title for page ${page.id}: "${betterTitle}"`);
          }
        }

        // Only include pages with valid titles
        if (page.title && page.title.trim() && page.title !== 'Untitled') {
          validPages.push(page);
        } else {
          console.warn(`❌ Skipping page ${page.id} - no valid title found`);
        }
      }

      console.log(`✅ Valid pages: ${validPages.length} out of ${pages.length}`);

      // Check for children and cache pages
      for (const page of validPages) {
        try {
          const hasChildren = await NotionAPI.checkPageHasChildren(page.id);

          const pageData = {
            id: page.id,
            database_id: databaseId,
            title: page.title,
            icon: page.icon || null,
            url: page.url || `https://notion.so/${page.id.replace(/-/g, '')}`,
            properties: page.properties || {},
            created_time: new Date().toISOString(),
            last_edited_time: new Date().toISOString(),
            has_children: hasChildren,
            last_synced: new Date().toISOString(),
          };

          console.log(`💾 Caching page: ${pageData.title} (${page.id})`);

          const { error } = await supabase
            .from('notion_page_properties_cache')
            .upsert(pageData, {
              onConflict: 'id'
            });

          if (error) {
            console.error('Failed to cache page:', error);
          }
        } catch (error) {
          console.error(`Failed to process page ${page.id}:`, error);
        }
      }

      // Update database page count
      await supabase
        .from('notion_databases_cache')
        .update({ page_count: validPages.length })
        .eq('id', databaseId);

      console.log('✅ Pages cached:', validPages.length);
      
      const mappedPages = validPages.map(page => {
        const mappedPage: NotionPage = {
          id: page.id,
          title: page.title,
          icon: page.icon,
          url: page.url || `https://notion.so/${page.id.replace(/-/g, '')}`,
          properties: page.properties || {},
          databaseId,
          hasChildren: page.hasChildren,
        };
        console.log(`🗂️ Mapped page for UI: "${mappedPage.title}" (${mappedPage.id})`);
        return mappedPage;
      });

      return mappedPages;

    } catch (error) {
      console.error('❌ Failed to fetch database pages:', error);
      throw error;
    }
  }

  /**
   * Try to extract a better title from page properties
   */
  private extractBetterTitle(page: any): string | null {
    if (!page.properties) return null;

    // Look for any text-based properties that might serve as a title
    const textProperties = Object.entries(page.properties).filter(([_, prop]: [string, any]) => {
      return prop.type === 'rich_text' || prop.type === 'text';
    });

    for (const [propName, prop] of textProperties) {
      const content = (prop as any)[prop.type];
      if (content && Array.isArray(content) && content.length > 0 && content[0].plain_text) {
        const text = content[0].plain_text.trim();
        if (text && text.length > 0) {
          console.log(`🔧 Found alternative title in "${propName}": "${text}"`);
          return text;
        }
      }
    }

    // Look for select properties that might have meaningful values
    const selectProperties = Object.entries(page.properties).filter(([_, prop]: [string, any]) => {
      return prop.type === 'select' || prop.type === 'multi_select';
    });

    for (const [propName, prop] of selectProperties) {
      if (prop.type === 'select' && prop.select?.name) {
        console.log(`🔧 Found title candidate in select "${propName}": "${prop.select.name}"`);
        return `${prop.select.name} (${propName})`;
      }
    }

    return null;
  }

  async fetchPageContent(
    pageId: string,
    forceRefresh: boolean = false
  ): Promise<NotionBlock[]> {
    console.log('📖 Fetching content for page:', pageId);

    if (!forceRefresh) {
      const { data: cached, error } = await supabase
        .from('notion_blocks_cache')
        .select('*')
        .eq('page_id', pageId)
        .order('position', { ascending: true });

      if (!error && cached && cached.length > 0) {
        const isStale = await this.isCacheStale(cached[0].last_synced);

        if (!isStale) {
          console.log('✅ Using cached blocks:', cached.length);
          return cached.map((block: any) => ({
            id: block.id,
            type: block.type,
            content: block.content,
            hasChildren: block.has_children,
            metadata: block.metadata,
            position: block.position,
          }));
        }
      }
    }

    console.log('🔄 Fetching fresh blocks from Notion API...');
    const blocks = await NotionAPI.getPageBlocks(pageId);
    const parsedBlocks = this.parseBlocks(blocks);

    // Clear old cached blocks
    await supabase
      .from('notion_blocks_cache')
      .delete()
      .eq('page_id', pageId);

    // Cache new blocks
    for (let i = 0; i < parsedBlocks.length; i++) {
      const block = parsedBlocks[i];
      const { error } = await supabase
        .from('notion_blocks_cache')
        .insert({
          id: block.id,
          page_id: pageId,
          type: block.type,
          content: block.content || '',
          has_children: block.hasChildren || false,
          metadata: block.metadata || {},
          position: i,
          last_synced: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to cache block:', error);
      }
    }

    console.log('✅ Blocks cached:', parsedBlocks.length);
    return parsedBlocks;
  }

  private parseBlocks(blocks: any[]): NotionBlock[] {
    return blocks.map((block, index) => {
      const parsed: NotionBlock = {
        id: block.id,
        type: block.type,
        position: index,
        hasChildren: block.has_children,
        metadata: {},
      };

      switch (block.type) {
        case 'paragraph':
          parsed.content = this.extractText(block.paragraph?.rich_text);
          break;
        case 'heading_1':
          parsed.content = this.extractText(block.heading_1?.rich_text);
          break;
        case 'heading_2':
          parsed.content = this.extractText(block.heading_2?.rich_text);
          break;
        case 'heading_3':
          parsed.content = this.extractText(block.heading_3?.rich_text);
          break;
        case 'bulleted_list_item':
          parsed.content = this.extractText(block.bulleted_list_item?.rich_text);
          break;
        case 'numbered_list_item':
          parsed.content = this.extractText(block.numbered_list_item?.rich_text);
          break;
        case 'to_do':
          parsed.content = this.extractText(block.to_do?.rich_text);
          parsed.metadata = { checked: block.to_do?.checked };
          break;
        case 'code':
          parsed.content = this.extractText(block.code?.rich_text);
          parsed.metadata = { language: block.code?.language };
          break;
        case 'quote':
          parsed.content = this.extractText(block.quote?.rich_text);
          break;
        case 'image':
          const imageUrl = block.image?.file?.url || block.image?.external?.url;
          parsed.metadata = { url: imageUrl };
          parsed.content = block.image?.caption?.[0]?.plain_text || '';
          break;
        case 'divider':
          parsed.content = '';
          break;
        default:
          parsed.content = `[Unsupported block type: ${block.type}]`;
      }

      return parsed;
    });
  }

  private extractText(richText: any[]): string {
    if (!richText || !Array.isArray(richText)) return '';
    return richText.map(t => t.plain_text || '').join('');
  }

  async searchDatabases(query: string): Promise<NotionDatabase[]> {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('notion_databases_cache')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('last_synced', { ascending: false });

    if (error) {
      console.error('Search error:', error);
      return [];
    }

    return (data || []).map((db: any) => ({
      id: db.id,
      title: db.title || 'Untitled Database',
      icon: db.icon,
      url: db.url,
      pageCount: db.page_count,
      lastSynced: db.last_synced,
    }));
  }
}

export function useNotionSidebar(accessToken: string | null) {
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(
    () => (accessToken ? new NotionSidebarService(accessToken) : null),
    [accessToken]
  );

  const loadDatabases = useCallback(async (forceRefresh: boolean = false) => {
    if (!service) {
      console.log('📚 No service available, skipping database load');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📚 Loading databases...', { forceRefresh });
      const dbs = await service.fetchDatabases(forceRefresh);
      console.log('✅ Databases loaded:', dbs.length);
      setDatabases(dbs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load databases';
      console.error('❌ Failed to load databases:', err);
      setError(errorMessage);
      setDatabases([]); // Clear databases on error
    } finally {
      setLoading(false);
    }
  }, [service]);

  const loadDatabasePages = useCallback(async (
    databaseId: string,
    forceRefresh: boolean = false
  ): Promise<NotionPage[]> => {
    if (!service) {
      console.log('📄 No service available, skipping pages load');
      return [];
    }

    try {
      console.log('📄 Loading pages for database:', databaseId);
      const pages = await service.fetchDatabasePages(databaseId, forceRefresh);
      console.log('✅ Pages loaded:', pages.length);
      
      // Filter out pages without valid titles for drag-and-drop
      const validPages = pages.filter(page => {
        const isValid = NotionAPI.isPageValidForDragAndDrop(page);
        if (!isValid) {
          console.warn(`⚠️ Filtering out invalid page: ${page.id} - "${page.title}"`);
        }
        return isValid;
      });
      
      console.log(`✅ Valid pages for drag-and-drop: ${validPages.length} out of ${pages.length}`);
      return validPages;
    } catch (err) {
      console.error('❌ Failed to load pages:', err);
      throw err;
    }
  }, [service]);

  const loadPageContent = useCallback(async (
    pageId: string,
    forceRefresh: boolean = false
  ): Promise<NotionBlock[]> => {
    if (!service) return [];

    try {
      return await service.fetchPageContent(pageId, forceRefresh);
    } catch (err) {
      console.error('Failed to load page content:', err);
      throw err;
    }
  }, [service]);

  const searchDatabases = useCallback(async (query: string): Promise<NotionDatabase[]> => {
    if (!service || !query.trim()) return databases;

    try {
      return await service.searchDatabases(query);
    } catch (err) {
      console.error('Search failed:', err);
      return databases;
    }
  }, [service, databases]);

  useEffect(() => {
    if (!accessToken) {
      setDatabases([]);
      setLoading(false);
      setError(null);
    }
  }, [accessToken]);

  return {
    databases,
    loading,
    error,
    loadDatabases,
    loadDatabasePages,
    loadPageContent,
    searchDatabases,
  };
}
