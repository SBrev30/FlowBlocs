/*
  # Create Page Hierarchy Tables

  1. New Tables
    - `notion_pages`
      - `id` (uuid, primary key) - internal unique identifier
      - `user_id` (uuid) - references auth.users
      - `page_id` (text) - Notion page ID
      - `parent_id` (text, nullable) - Notion parent page ID
      - `title` (text) - page title
      - `icon` (text, nullable) - page icon (emoji or URL)
      - `has_children` (boolean) - whether page has sub-pages
      - `child_count` (integer) - number of direct children
      - `depth_level` (integer) - hierarchy depth (0 = root)
      - `object_type` (text) - 'page' or 'database'
      - `notion_url` (text, nullable) - direct URL to Notion page
      - `last_synced` (timestamptz) - last sync from Notion
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `notion_page_cache`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - references auth.users
      - `page_id` (text) - Notion page ID
      - `content_json` (jsonb) - cached page content
      - `blocks_json` (jsonb, nullable) - cached page blocks
      - `expires_at` (timestamptz) - cache expiration time
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data only

  3. Indexes
    - Index on page_id for fast lookups
    - Index on parent_id for hierarchy queries
    - Index on user_id for user-specific queries
    - Composite index on (user_id, page_id) for cache queries
*/

-- Create notion_pages table
CREATE TABLE IF NOT EXISTS notion_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_id text NOT NULL,
  parent_id text,
  title text NOT NULL DEFAULT '',
  icon text,
  has_children boolean DEFAULT false,
  child_count integer DEFAULT 0,
  depth_level integer DEFAULT 0,
  object_type text DEFAULT 'page',
  notion_url text,
  last_synced timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notion_page_cache table
CREATE TABLE IF NOT EXISTS notion_page_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_id text NOT NULL,
  content_json jsonb NOT NULL DEFAULT '{}',
  blocks_json jsonb,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for notion_pages
CREATE INDEX IF NOT EXISTS idx_notion_pages_page_id ON notion_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_notion_pages_parent_id ON notion_pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_notion_pages_user_id ON notion_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_notion_pages_user_page ON notion_pages(user_id, page_id);

-- Create indexes for notion_page_cache
CREATE INDEX IF NOT EXISTS idx_notion_page_cache_user_id ON notion_page_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_notion_page_cache_page_id ON notion_page_cache(page_id);
CREATE INDEX IF NOT EXISTS idx_notion_page_cache_user_page ON notion_page_cache(user_id, page_id);
CREATE INDEX IF NOT EXISTS idx_notion_page_cache_expires ON notion_page_cache(expires_at);

-- Enable Row Level Security
ALTER TABLE notion_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_page_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notion_pages
CREATE POLICY "Users can view own pages"
  ON notion_pages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pages"
  ON notion_pages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pages"
  ON notion_pages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pages"
  ON notion_pages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notion_page_cache
CREATE POLICY "Users can view own cache"
  ON notion_page_cache FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache"
  ON notion_page_cache FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cache"
  ON notion_page_cache FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cache"
  ON notion_page_cache FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_notion_pages_updated_at ON notion_pages;
CREATE TRIGGER update_notion_pages_updated_at
  BEFORE UPDATE ON notion_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notion_page_cache_updated_at ON notion_page_cache;
CREATE TRIGGER update_notion_page_cache_updated_at
  BEFORE UPDATE ON notion_page_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
