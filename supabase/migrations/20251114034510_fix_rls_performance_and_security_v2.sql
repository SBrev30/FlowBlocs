/*
  # Fix RLS Performance and Security Issues

  1. RLS Policy Optimizations
    - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation of auth functions for each row, improving performance at scale
    - Affects all policies on `notion_pages` and `notion_page_cache` tables

  2. Function Security
    - Set immutable search_path on `update_updated_at_column` function
    - Prevents search_path manipulation attacks
    - Drop triggers first, then function, then recreate with security fix

  3. Notes
    - Unused indexes are intentional for future query optimization as data scales
    - They will be used once the application has more active queries
*/

-- Drop existing RLS policies for notion_pages
DROP POLICY IF EXISTS "Users can view own pages" ON notion_pages;
DROP POLICY IF EXISTS "Users can insert own pages" ON notion_pages;
DROP POLICY IF EXISTS "Users can update own pages" ON notion_pages;
DROP POLICY IF EXISTS "Users can delete own pages" ON notion_pages;

-- Drop existing RLS policies for notion_page_cache
DROP POLICY IF EXISTS "Users can view own cache" ON notion_page_cache;
DROP POLICY IF EXISTS "Users can insert own cache" ON notion_page_cache;
DROP POLICY IF EXISTS "Users can update own cache" ON notion_page_cache;
DROP POLICY IF EXISTS "Users can delete own cache" ON notion_page_cache;

-- Create optimized RLS policies for notion_pages with subquery optimization
CREATE POLICY "Users can view own pages"
  ON notion_pages FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own pages"
  ON notion_pages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own pages"
  ON notion_pages FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own pages"
  ON notion_pages FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Create optimized RLS policies for notion_page_cache with subquery optimization
CREATE POLICY "Users can view own cache"
  ON notion_page_cache FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own cache"
  ON notion_page_cache FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own cache"
  ON notion_page_cache FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own cache"
  ON notion_page_cache FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Fix function search_path security issue
-- Drop triggers first
DROP TRIGGER IF EXISTS update_notion_pages_updated_at ON notion_pages;
DROP TRIGGER IF EXISTS update_notion_page_cache_updated_at ON notion_page_cache;

-- Drop and recreate function with secure search_path
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers with the updated function
CREATE TRIGGER update_notion_pages_updated_at
  BEFORE UPDATE ON notion_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notion_page_cache_updated_at
  BEFORE UPDATE ON notion_page_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
