import { useState, useEffect } from "react";
import { Database, ChevronRight, ChevronDown, Loader2, RefreshCw, Search, X, Trash2 } from "lucide-react";
import { GoSidebarCollapse } from "react-icons/go";
import { getCurrentUser } from "../../lib/notion-api";
import { getAuthToken } from "../../lib/storage";
import { useNotionSidebar, NotionPage } from "../../lib/notion-sidebar-integration";
import { useAuth, useDatabases, useCanvas, useSidebar } from "../../store/appStore";
import AuthSection from "./AuthSection";
import PageTreeItem from "./PageTreeItem";
import "./Sidebar.css";

interface SidebarProps {
  onDragStart: (page: NotionPage, databaseId: string) => void;
}

const Sidebar = ({ onDragStart }: SidebarProps) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const { isAuthenticated, accessToken, user, setAuth, clearAuth } = useAuth();
  const { 
    filteredDatabases, 
    databasePages, 
    expandedDatabases, 
    loadingDatabases, 
    loadingPages, 
    searchQuery,
    setDatabases,
    setDatabasePages,
    toggleDatabase,
    setLoadingDatabases,
    setLoadingPages,
    setSearchQuery,
    refreshDatabases
  } = useDatabases();
  const { canvasNodes, clearCanvas } = useCanvas();
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();

  const {
    databases,
    loading,
    error,
    loadDatabases,
    loadDatabasePages,
    searchDatabases: searchDatabasesService,
  } = useNotionSidebar(accessToken);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    setLoadingDatabases(loading);
  }, [loading, setLoadingDatabases]);

  useEffect(() => {
    if (databases.length > 0) {
      setDatabases(databases);
    }
  }, [databases, setDatabases]);

  const checkAuth = async () => {
    console.log("🔍 Checking authentication...");
    try {
      const token = await getAuthToken();
      console.log("🔑 Token exists:", !!token);

      if (token) {
        const userData = await getCurrentUser();
        setAuth(token, userData);
        console.log("✅ Auth set:", userData);
      } else {
        clearAuth();
        console.log("❌ No token found, cleared auth");
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      clearAuth();
    }
  };

  const handleRefresh = () => {
    refreshDatabases();
    loadDatabases(true);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() && databases.length > 0) {
      await searchDatabasesService(query);
    }
  };

  const handleClearCanvas = () => {
    if (canvasNodes.length === 0) return;
    setShowClearConfirm(true);
  };

  const confirmClearCanvas = () => {
    clearCanvas();
    setShowClearConfirm(false);
  };

  const handleToggleDatabase = async (databaseId: string) => {
    toggleDatabase(databaseId);
    
    if (!expandedDatabases.has(databaseId) && !databasePages[databaseId]) {
      console.log("📄 Loading pages for database:", databaseId);
      setLoadingPages(databaseId, true);
      try {
        const pages = await loadDatabasePages(databaseId);
        setDatabasePages(databaseId, pages);
        console.log("✅ Pages loaded:", pages.length);
      } catch (error) {
        console.error("❌ Failed to load database pages:", error);
      } finally {
        setLoadingPages(databaseId, false);
      }
    }
  };

  if (sidebarCollapsed) {
    return (
      <div className="sidebar collapsed">
        <button
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(false)}
          title="Expand sidebar"
        >
          <GoSidebarCollapse size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>FlowBlocs</h2>
        <button
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(true)}
          title="Collapse sidebar"
        >
          <GoSidebarCollapse size={20} />
        </button>
      </div>

      <AuthSection
        isAuthenticated={isAuthenticated}
        user={user}
        onAuthChange={checkAuth}
      />

      {isAuthenticated && (
        <div className="sidebar-content">
          <div className="section-header">
            <Database size={16} />
            <span>Databases</span>
            <button
              onClick={handleRefresh}
              className="icon-button"
              title="Refresh databases"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="search-bar">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search databases..."
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="clear-button"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="canvas-controls">
            <button
              className={`clear-canvas-btn ${canvasNodes.length === 0 ? 'disabled' : ''}`}
              onClick={handleClearCanvas}
              disabled={canvasNodes.length === 0}
              title={canvasNodes.length === 0 ? 'No nodes to clear' : `Clear all ${canvasNodes.length} nodes from canvas`}
            >
              <Trash2 size={14} />
              Clear Canvas ({canvasNodes.length})
            </button>
          </div>

          {showClearConfirm && (
            <div className="clear-confirm-popup">
              <p>Remove all {canvasNodes.length} nodes from canvas?</p>
              <small>This will only clear the canvas, not delete from Notion.</small>
              <div className="confirm-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="clear-btn"
                  onClick={confirmClearCanvas}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {loadingDatabases ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={20} />
              <span>Loading databases...</span>
            </div>
          ) : error ? (
            <div className="error-state">
              <p style={{ color: '#ef4444', fontSize: '14px', padding: '12px' }}>{error}</p>
            </div>
          ) : filteredDatabases.length === 0 ? (
            <div className="empty-state">
              <p>{searchQuery ? 'No databases match your search' : 'No databases found'}</p>
              <small>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Share a database with this integration in Notion'}
              </small>
              {!searchQuery && (
                <button onClick={handleRefresh} style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>
                  Refresh
                </button>
              )}
            </div>
          ) : (
            <div className="database-list">
              {filteredDatabases.map(db => (
                <div key={db.id} className="database-item">
                  <button
                    className="database-header"
                    onClick={() => handleToggleDatabase(db.id)}
                  >
                    {expandedDatabases.has(db.id) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    <span className="database-icon">{db.icon || "📄"}</span>
                    <span className="database-title">{db.title}</span>
                  </button>

                  {expandedDatabases.has(db.id) && (
                    <div className="pages-list">
                      {loadingPages.has(db.id) ? (
                        <div className="loading-pages">
                          <Loader2 className="spinner" size={16} />
                          <span>Loading pages...</span>
                        </div>
                      ) : databasePages[db.id]?.length === 0 ? (
                        <div className="empty-pages">
                          <small>No pages in this database</small>
                        </div>
                      ) : (
                        databasePages[db.id]?.map(page => (
                          <PageTreeItem
                            key={page.id}
                            page={page}
                            databaseId={db.id}
                            depth={0}
                            onDragStart={onDragStart}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
