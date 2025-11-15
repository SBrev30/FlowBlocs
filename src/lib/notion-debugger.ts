/**
 * Debug utility for testing Notion API integration
 * Use this in your browser console to troubleshoot title extraction issues
 */

import * as NotionAPI from './notion-api';

export class NotionDebugger {
  /**
   * Test database loading and log detailed information
   */
  static async testDatabaseLoading() {
    console.log('🧪 Testing database loading...');
    
    try {
      const databases = await NotionAPI.searchDatabases();
      console.log('✅ Databases loaded:', databases);
      
      if (databases.length === 0) {
        console.warn('⚠️ No databases found. Make sure you have:');
        console.log('1. Shared databases with your Notion integration');
        console.log('2. Proper authentication token stored');
        console.log('3. Integration has read permissions');
      }
      
      return databases;
    } catch (error) {
      console.error('❌ Database loading failed:', error);
      return [];
    }
  }

  /**
   * Test loading pages from a specific database
   */
  static async testDatabasePages(databaseId: string) {
    console.log(`🧪 Testing page loading for database: ${databaseId}`);
    
    try {
      const response = await NotionAPI.queryDatabase(databaseId);
      console.log('✅ Raw API response:', response);
      
      if (response.results.length === 0) {
        console.warn('⚠️ No pages found in database');
        return [];
      }
      
      // Debug each page
      response.results.forEach((page, index) => {
        console.log(`📄 Page ${index + 1}:`);
        console.log('  ID:', page.id);
        console.log('  Title:', page.title);
        console.log('  Properties:', page.properties);
        
        // Validate for drag-and-drop
        const isValid = NotionAPI.isPageValidForDragAndDrop(page);
        console.log('  Valid for drag-and-drop:', isValid);
        
        if (!isValid) {
          console.log('  ⚠️ This page will not appear in sidebar due to invalid title');
          NotionAPI.debugPageProperties(page);
        }
      });
      
      return response.results;
    } catch (error) {
      console.error('❌ Page loading failed:', error);
      return [];
    }
  }

  /**
   * Test authentication and user info
   */
  static async testAuthentication() {
    console.log('🧪 Testing authentication...');
    
    try {
      const user = await NotionAPI.getCurrentUser();
      console.log('✅ User authenticated:', user);
      return user;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      console.log('💡 Check if your token is valid and properly stored');
      return null;
    }
  }

  /**
   * Complete integration test
   */
  static async runCompleteTest() {
    console.log('🧪 Running complete Notion integration test...\n');
    
    // Test authentication
    console.log('1️⃣ Testing authentication...');
    const user = await this.testAuthentication();
    if (!user) return;
    
    console.log('\n2️⃣ Testing database loading...');
    const databases = await this.testDatabaseLoading();
    if (databases.length === 0) return;
    
    console.log('\n3️⃣ Testing page loading...');
    for (const db of databases.slice(0, 2)) { // Test first 2 databases
      console.log(`\nTesting database: ${db.title} (${db.id})`);
      await this.testDatabasePages(db.id);
    }
    
    console.log('\n✅ Complete test finished!');
  }

  /**
   * Quick fix for pages with missing titles
   */
  static async fixMissingTitles(databaseId: string) {
    console.log(`🔧 Attempting to fix missing titles for database: ${databaseId}`);
    
    try {
      const response = await NotionAPI.queryDatabase(databaseId);
      const pagesWithIssues = response.results.filter(page => 
        !page.title || page.title === 'Untitled' || page.title === 'Untitled Page'
      );
      
      console.log(`Found ${pagesWithIssues.length} pages with title issues`);
      
      pagesWithIssues.forEach(page => {
        console.log(`🔍 Analyzing page ${page.id}:`);
        
        // Try to find alternative title sources
        if (page.properties) {
          Object.entries(page.properties).forEach(([propName, prop]: [string, any]) => {
            if (prop.type === 'rich_text' && prop.rich_text?.[0]?.plain_text) {
              console.log(`  💡 Could use "${propName}": ${prop.rich_text[0].plain_text}`);
            }
            if (prop.type === 'select' && prop.select?.name) {
              console.log(`  💡 Could use "${propName}": ${prop.select.name}`);
            }
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to analyze pages:', error);
    }
  }
}

// Expose to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).NotionDebugger = NotionDebugger;
  console.log('🧪 NotionDebugger available globally. Try:');
  console.log('NotionDebugger.runCompleteTest()');
}

export default NotionDebugger;
