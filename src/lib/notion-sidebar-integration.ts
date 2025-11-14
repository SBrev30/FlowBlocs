import { useState, useCallback, useEffect } from 'react';
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
  url: string;
  properties: Record<string, any>;
  databaseId?: string;
  hasChildren?: boolean;
  createdTime?: string;
  lastEditedTime?: string;
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
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
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
    console.log('📚 Fetching databases...');

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
            title: db.title,
            icon: db.icon,
            url: db.url,
            pageCount: db.page_count,
            lastSynced: db.last_synced,
          }));
        }
      }
    }

    console.log('🔄 Fetching fresh databases from Notion API...');
    const databases = await NotionAPI.searchDatabases();

    for (const db of databases) {
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
      }
    }

    console.log('✅ Databases cached:', databases.length);
    return databases.map(db => ({
      id: db.id,
      title: db.title,
      icon: db.icon,
      url: `https://notion.so/${db.id.replace(/-/g, '')}`,
    }));
  }

  async fetchDatabasePages(
    databaseId: string,
    forceRefresh: boolean = false
  ): Promise<NotionPage[]> {
    console.log('📄 Fetching pages for database:', databaseId);

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
            title: page.title,
            icon: page.icon,
            url: page.url,
            properties: page.properties,
            databaseId: page.database_id,
            hasChildren: page.has_children,
            createdTime: page.created_time,
            lastEditedTime: page.last_edited_time,
          }));
        }
      }
    }

    console.log('🔄 Fetching fresh pages from Notion API...');
    const response = await NotionAPI.queryDatabase(databaseId);
    const pages = response.results;

    for (const page of pages) {
      const hasChildren = await NotionAPI.checkPageHasChildren(page.id);

      const { error } = await supabase
        .from('notion_page_properties_cache')
        .upsert({
          id: page.id,
          database_id: databaseId,
          title: page.title,
          icon: page.icon,
          url: page.url,
          properties: page.properties,
          created_time: new Date().toISOString(),
          last_edited_time: new Date().toISOString(),
          has_children: hasChildren,
          last_synced: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Failed to cache page:', error);
      }
    }

    await supabase
      .from('notion_databases_cache')
      .update({ page_count: pages.length })
      .eq('id', databaseId);

    console.log('✅ Pages cached:', pages.length);
    return pages.map(page => ({
      ...page,
      databaseId,
    }));
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

    await supabase
      .from('notion_blocks_cache')
      .delete()
      .eq('page_id', pageId);

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
      title: db.title,
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

  const service = accessToken ? new NotionSidebarService(accessToken) : null;

  const loadDatabases = useCallback(async (forceRefresh: boolean = false) => {
    if (!service) return;

    setLoading(true);
    setError(null);

    try {
      const dbs = await service.fetchDatabases(forceRefresh);
      setDatabases(dbs);
    } catch (err) {
      console.error('Failed to load databases:', err);
      setError(err instanceof Error ? err.message : 'Failed to load databases');
    } finally {
      setLoading(false);
    }
  }, [service]);

  const loadDatabasePages = useCallback(async (
    databaseId: string,
    forceRefresh: boolean = false
  ): Promise<NotionPage[]> => {
    if (!service) return [];

    try {
      return await service.fetchDatabasePages(databaseId, forceRefresh);
    } catch (err) {
      console.error('Failed to load pages:', err);
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
