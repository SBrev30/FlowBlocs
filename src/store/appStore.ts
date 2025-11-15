import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { NotionDatabase, NotionPage } from '../lib/notion-sidebar-integration';

interface User {
  id: string;
  name: string;
  avatar_url?: string;
}

interface CanvasNode {
  id: string;
  pageId: string;
  databaseId: string;
  title: string;
  position: { x: number; y: number };
  data: NotionPage;
}

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  
  // Database state
  databases: NotionDatabase[];
  databasePages: Record<string, NotionPage[]>;
  expandedDatabases: Set<string>;
  loadingDatabases: boolean;
  loadingPages: Set<string>;
  
  // Search state
  searchQuery: string;
  filteredDatabases: NotionDatabase[];
  
  // Canvas state
  canvasNodes: CanvasNode[];
  
  // UI state
  sidebarCollapsed: boolean;
  
  // Actions
  setAuth: (token: string | null, user: User | null) => void;
  clearAuth: () => void;
  setDatabases: (databases: NotionDatabase[]) => void;
  setDatabasePages: (databaseId: string, pages: NotionPage[]) => void;
  toggleDatabase: (databaseId: string) => void;
  setLoadingDatabases: (loading: boolean) => void;
  setLoadingPages: (databaseId: string, loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  addCanvasNode: (node: CanvasNode) => void;
  removeCanvasNode: (nodeId: string) => void;
  clearCanvas: () => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  refreshDatabases: () => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isAuthenticated: false,
    accessToken: null,
    user: null,
    databases: [],
    databasePages: {},
    expandedDatabases: new Set(),
    loadingDatabases: false,
    loadingPages: new Set(),
    searchQuery: '',
    filteredDatabases: [],
    canvasNodes: [],
    sidebarCollapsed: false,
    
    // Auth actions
    setAuth: (token, user) =>
      set({
        accessToken: token,
        user,
        isAuthenticated: !!token,
      }),
    
    clearAuth: () =>
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        databases: [],
        databasePages: {},
        expandedDatabases: new Set(),
        filteredDatabases: [],
        searchQuery: '',
        loadingDatabases: false,
        loadingPages: new Set(),
      }),
    
    // Database actions
    setDatabases: (databases) => {
      const { searchQuery } = get();
      set({
        databases,
        filteredDatabases: searchQuery ? 
          databases.filter(db => 
            db.title.toLowerCase().includes(searchQuery.toLowerCase())
          ) : databases,
      });
    },
    
    setDatabasePages: (databaseId, pages) =>
      set((state) => ({
        databasePages: {
          ...state.databasePages,
          [databaseId]: pages,
        },
      })),
    
    toggleDatabase: (databaseId) =>
      set((state) => {
        const newExpanded = new Set(state.expandedDatabases);
        if (newExpanded.has(databaseId)) {
          newExpanded.delete(databaseId);
        } else {
          newExpanded.add(databaseId);
        }
        return { expandedDatabases: newExpanded };
      }),
    
    setLoadingDatabases: (loading) =>
      set({ loadingDatabases: loading }),
    
    setLoadingPages: (databaseId, loading) =>
      set((state) => {
        const newLoadingPages = new Set(state.loadingPages);
        if (loading) {
          newLoadingPages.add(databaseId);
        } else {
          newLoadingPages.delete(databaseId);
        }
        return { loadingPages: newLoadingPages };
      }),
    
    setSearchQuery: (query) => {
      const { databases } = get();
      set({
        searchQuery: query,
        filteredDatabases: query ?
          databases.filter(db =>
            db.title.toLowerCase().includes(query.toLowerCase())
          ) : databases,
      });
    },
    
    // Canvas actions
    addCanvasNode: (node) =>
      set((state) => ({
        canvasNodes: [...state.canvasNodes, node],
      })),
    
    removeCanvasNode: (nodeId) =>
      set((state) => ({
        canvasNodes: state.canvasNodes.filter(node => node.id !== nodeId),
      })),
    
    clearCanvas: () =>
      set({ canvasNodes: [] }),
    
    updateNodePosition: (nodeId, position) =>
      set((state) => ({
        canvasNodes: state.canvasNodes.map(node =>
          node.id === nodeId ? { ...node, position } : node
        ),
      })),
    
    setSidebarCollapsed: (collapsed) =>
      set({ sidebarCollapsed: collapsed }),
    
    refreshDatabases: () =>
      set({
        databases: [],
        databasePages: {},
        expandedDatabases: new Set(),
        filteredDatabases: [],
        searchQuery: '',
      }),
  }))
);

// Selectors for performance
export const useAuth = () => useAppStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  accessToken: state.accessToken,
  user: state.user,
  setAuth: state.setAuth,
  clearAuth: state.clearAuth,
}));

export const useDatabases = () => useAppStore((state) => ({
  databases: state.databases,
  filteredDatabases: state.filteredDatabases,
  databasePages: state.databasePages,
  expandedDatabases: state.expandedDatabases,
  loadingDatabases: state.loadingDatabases,
  loadingPages: state.loadingPages,
  searchQuery: state.searchQuery,
  setDatabases: state.setDatabases,
  setDatabasePages: state.setDatabasePages,
  toggleDatabase: state.toggleDatabase,
  setLoadingDatabases: state.setLoadingDatabases,
  setLoadingPages: state.setLoadingPages,
  setSearchQuery: state.setSearchQuery,
  refreshDatabases: state.refreshDatabases,
}));

export const useCanvas = () => useAppStore((state) => ({
  canvasNodes: state.canvasNodes,
  addCanvasNode: state.addCanvasNode,
  removeCanvasNode: state.removeCanvasNode,
  clearCanvas: state.clearCanvas,
  updateNodePosition: state.updateNodePosition,
}));

export const useSidebar = () => useAppStore((state) => ({
  sidebarCollapsed: state.sidebarCollapsed,
  setSidebarCollapsed: state.setSidebarCollapsed,
}));
