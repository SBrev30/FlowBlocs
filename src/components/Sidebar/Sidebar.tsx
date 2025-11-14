import { useState, useEffect } from "react";
import { Database, ChevronRight, ChevronDown, Loader2, RefreshCw, Search, X } from "lucide-react";
import { GoSidebarCollapse } from "react-icons/go";
import { getCurrentUser } from "../../lib/notion-api";
import { getAuthToken } from "../../lib/storage";
import { useNotionSidebar, NotionDatabase, NotionPage } from "../../lib/notion-sidebar-integration";
import AuthSection from "./AuthSection";
import PageTreeItem from "./PageTreeItem";
import "./Sidebar.css";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onDragStart: (page: NotionPage, databaseId: string) => void;
}

const Sidebar = ({ isCollapsed, onToggle, onDragStart }: SidebarProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [databasePages, setDatabasePages] = useState<Record<string, NotionPage[]>>({});
  const [loadingPages, setLoadingPages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDatabases, setFilteredDatabases] = useState<NotionDatabase[]>([]);

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

  const checkAuth = async () => {
    console.log("🔍 Checking authentication...");
    try {
      const token = await getAuthToken();
      console.log("🔑 Token exists:", !!token);

      if (token) {
        setAccessToken(token);
        setIsAuthenticated(true);
        await loadUserData();
      } else {
        console.log("❌ No token found");
        setIsAuthenticated(false);
        setAccessToken(null);
        setUser(null);
        setDatabases([]);
        setFilteredDatabases([]);
        setDatabasePages({});
        setExpandedDatabases(new Set());
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      setIsAuthenticated(false);
      setAccessToken(null);
    }
  };

  const loadUserData = async () => {
    console.log("👤 Loading user data...");
    try {
      const userData = await getCurrentUser();
      console.log("✅ User loaded:", userData);
      setUser(userData);
    } catch (error) {
      console.error("❌ Failed to load user data:", error);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadDatabases();
    }
  }, [accessToken]);

  useEffect(() => {
    setFilteredDatabases(databases);
    if (databases.length === 0) {
      setDatabasePages({});
      setExpandedDatabases(new Set());
      setSearchQuery('');
    }
  }, [databases]);

  const handleRefresh = () => {
    loadDatabases(true);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchDatabasesService(query);
      setFilteredDatabases(results);
    } else {
      setFilteredDatabases(databases);
    }
  };

  const toggleDatabase = async (databaseId: string) => {
    console.log("🔄 Toggling database:", databaseId);
    const newExpanded = new Set(expandedDatabases);

    if (newExpanded.has(databaseId)) {
      newExpanded.delete(databaseId);
      setExpandedDatabases(newExpanded);
    } else {
      newExpanded.add(databaseId);
      setExpandedDatabases(newExpanded);

      if (!databasePages[databaseId]) {
        console.log("📄 Loading pages for database:", databaseId);
        setLoadingPages(new Set(loadingPages).add(databaseId));
        try {
          const pages = await loadDatabasePages(databaseId);
          console.log("✅ Pages loaded:", pages.length, pages);

          setDatabasePages(prev => ({
            ...prev,
            [databaseId]: pages
          }));
        } catch (error) {
          console.error("❌ Failed to load database pages:", error);
        } finally {
          const newLoadingPages = new Set(loadingPages);
          newLoadingPages.delete(databaseId);
          setLoadingPages(newLoadingPages);
        }
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, page: NotionPage, databaseId: string) => {
    console.log("🎯 Drag started:", page.title);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/notion-page", JSON.stringify(page));
    onDragStart(page, databaseId);
  };

  if (isCollapsed) {
    return (
      <div className="sidebar collapsed">
        <button
          className="collapse-btn"
          onClick={onToggle}
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
          onClick={onToggle}
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
                onClick={() => handleSearch('')}
                className="clear-button"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {loading ? (
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
                <button
                  onClick={handleRefresh}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
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
                    onClick={() => toggleDatabase(db.id)}
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
