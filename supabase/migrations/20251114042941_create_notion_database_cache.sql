/*
  # Create Notion Database Cache Tables
  
  ## Summary
  Creates caching tables for Notion databases, their pages, and content blocks.
  Works alongside existing notion_pages table to provide comprehensive caching.
  
  ## New Tables
  
  ### 1. notion_databases_cache
  Stores database metadata and reduces API calls for database listings
  - `id` (text, primary key) - Notion database ID
  - `title` (text) - Database title
  - `url` (text) - Direct link to database
  - `icon` (text) - Database icon
  - `properties_schema` (jsonb) - Database property definitions
  - `page_count` (integer) - Number of pages
  - `last_synced` (timestamptz) - Cache timestamp
  - `created_at` (timestamptz) - Record creation
  
  ### 2. notion_page_properties_cache
  Stores full page properties and metadata
  - `id` (text, primary key) - Notion page ID
  - `database_id` (text) - Parent database
  - `title` (text) - Page title
  - `url` (text) - Page URL
  - `icon` (text) - Page icon
  - `properties` (jsonb) - All page properties
  - `created_time` (timestamptz) - Original creation
  - `last_edited_time` (timestamptz) - Last edit in Notion
  - `has_children` (boolean) - Has sub-pages
  - `last_synced` (timestamptz) - Cache timestamp
  - `created_at` (timestamptz) - Record creation
  
  ### 3. notion_blocks_cache
  Stores page content blocks for rendering
  - `id` (text, primary key) - Block ID
  - `page_id` (text) - Parent page
  - `type` (text) - Block type
  - `content` (text) - Text content
  - `has_children` (boolean) - Has nested blocks
  - `metadata` (jsonb) - Additional data
  - `position` (integer) - Order in page
  - `last_synced` (timestamptz) - Cache timestamp
  - `created_at` (timestamptz) - Record creation
  
  ## Security
  - RLS enabled
  - Public read/write for client-side caching
  
  ## Performance
  - Indexes on foreign keys
  - Indexes on last_synced for cache expiration
*/

-- Create notion_databases_cache table
CREATE TABLE IF NOT EXISTS notion_databases_cache (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  icon TEXT,
  properties_schema JSONB DEFAULT '{}'::jsonb,
  page_count INTEGER DEFAULT 0,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notion_page_properties_cache table
CREATE TABLE IF NOT EXISTS notion_page_properties_cache (
  id TEXT PRIMARY KEY,
  database_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  icon TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  created_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_edited_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  has_children BOOLEAN DEFAULT FALSE,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notion_blocks_cache table  
CREATE TABLE IF NOT EXISTS notion_blocks_cache (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'paragraph',
  content TEXT,
  has_children BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_props_database ON notion_page_properties_cache(database_id);
CREATE INDEX IF NOT EXISTS idx_blocks_cache_page ON notion_blocks_cache(page_id);
CREATE INDEX IF NOT EXISTS idx_databases_cache_synced ON notion_databases_cache(last_synced);
CREATE INDEX IF NOT EXISTS idx_page_props_synced ON notion_page_properties_cache(last_synced);
CREATE INDEX IF NOT EXISTS idx_blocks_cache_position ON notion_blocks_cache(page_id, position);

-- Enable Row Level Security
ALTER TABLE notion_databases_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_page_properties_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_blocks_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (client-side caching)
CREATE POLICY "Allow public read on databases_cache"
  ON notion_databases_cache FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert on databases_cache"
  ON notion_databases_cache FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update on databases_cache"
  ON notion_databases_cache FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on databases_cache"
  ON notion_databases_cache FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read on page_props_cache"
  ON notion_page_properties_cache FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert on page_props_cache"
  ON notion_page_properties_cache FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update on page_props_cache"
  ON notion_page_properties_cache FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on page_props_cache"
  ON notion_page_properties_cache FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read on blocks_cache"
  ON notion_blocks_cache FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert on blocks_cache"
  ON notion_blocks_cache FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update on blocks_cache"
  ON notion_blocks_cache FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on blocks_cache"
  ON notion_blocks_cache FOR DELETE
  TO anon
  USING (true);