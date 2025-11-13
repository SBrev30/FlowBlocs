import { useState, useEffect } from 'react';
import notionService from '../services/notionService';

/**
 * Custom React hook for Notion API operations
 * Handles authentication state and provides convenient methods
 */
export function useNotion() {
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load access token from storage on mount
  useEffect(() => {
    const loadToken = async () => {
      try {
        // For Chrome Extension
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['notionAccessToken'], (result) => {
            if (result.notionAccessToken) {
              setAccessToken(result.notionAccessToken);
              setIsAuthenticated(true);
            }
            setLoading(false);
          });
        } 
        // For web app - use localStorage
        else {
          const token = localStorage.getItem('notionAccessToken');
          if (token) {
            setAccessToken(token);
            setIsAuthenticated(true);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load access token:', error);
        setLoading(false);
      }
    };

    loadToken();
  }, []);

  // Save access token to storage
  const saveToken = async (token) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ notionAccessToken: token });
      } else {
        localStorage.setItem('notionAccessToken', token);
      }
      setAccessToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save access token:', error);
      throw error;
    }
  };

  // Remove access token from storage
  const clearToken = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove(['notionAccessToken']);
      } else {
        localStorage.removeItem('notionAccessToken');
      }
      setAccessToken(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to clear access token:', error);
      throw error;
    }
  };

  // Wrapper methods that automatically pass the token
  const api = {
    getCurrentUser: () => notionService.getCurrentUser(accessToken),
    searchDatabases: (pageSize) => notionService.searchDatabases(accessToken, pageSize),
    search: (query, pageSize) => notionService.search(accessToken, query, pageSize),
    getDatabase: (databaseId) => notionService.getDatabase(accessToken, databaseId),
    queryDatabase: (databaseId, options) => notionService.queryDatabase(accessToken, databaseId, options),
    getPage: (pageId) => notionService.getPage(accessToken, pageId),
    getBlockChildren: (blockId, startCursor) => notionService.getBlockChildren(accessToken, blockId, startCursor),
    updatePage: (pageId, properties) => notionService.updatePage(accessToken, pageId, properties),
    appendBlockChildren: (blockId, children) => notionService.appendBlockChildren(accessToken, blockId, children),
    updateBlock: (blockId, updates) => notionService.updateBlock(accessToken, blockId, updates),
    deleteBlock: (blockId) => notionService.deleteBlock(accessToken, blockId),
    getUser: (userId) => notionService.getUser(accessToken, userId),
    listUsers: (startCursor) => notionService.listUsers(accessToken, startCursor),
    createPage: (parent, properties, children) => notionService.createPage(accessToken, parent, properties, children)
  };

  return {
    isAuthenticated,
    loading,
    accessToken,
    saveToken,
    clearToken,
    ...api
  };
}
