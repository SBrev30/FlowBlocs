import { useState, useEffect } from "react";
import { Database, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { GoSidebarCollapse } from "react-icons/go";
import { searchDatabases, queryDatabase, getCurrentUser, NotionPage, NotionDatabase } from "../../lib/notion-api";
import { getAuthToken } from "../../lib/storage";
import AuthSection from "./AuthSection";
import useNotion from './useNotion';
import "./Sidebar.css";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onDragStart: (page: NotionPage, databaseId: string) => void;
}

const Sidebar = ({ isCollapsed, onToggle, onDragStart }: SidebarProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [databasePages, setDatabasePages] = useState<Record<string, NotionPage[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingPages, setLoadingPages] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log("🔍 Checking authentication...");
    try {
      const token = await getAuthToken();
      console.log("🔑 Token exists:", !!token);
      
      if (token) {
        setIsAuthenticated(true);
        await loadUserData();
        await loadDatabases();
      } else {
        console.log("❌ No token found");
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      setError("Authentication failed");
    } finally {
      setLoading(false);
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
      setError("Failed to load user data");
    }
  };

  const loadDatabases = async () => {
    console.log("📚 Loading databases...");
    try {
      const dbs = await searchDatabases();
      console.log("✅ Databases loaded:", dbs.length, dbs);
      setDatabases(dbs);
      
      if (dbs.length === 0) {
        console.log("⚠️ No databases found - have you shared any with the integration?");
        setError("No databases found. Share a database with this integration in Notion.");
      }
    } catch (error) {
      console.error("❌ Failed to load databases:", error);
      setError("Failed to load databases: " + (error as Error).message);
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
      
      // Load pages if not already loaded
      if (!databasePages[databaseId]) {
        console.log("📄 Loading pages for database:", databaseId);
        setLoadingPages(new Set(loadingPages).add(databaseId));
        try {
          const response = await queryDatabase(databaseId);
          console.log("✅ Pages loaded:", response.results.length, response.results);
          setDatabasePages(prev => ({
            ...prev,
            [databaseId]: response.results
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
          ) : databases.length === 0 ? (
            <div className="empty-state">
              <p>No databases found</p>
              <small>Share a database with this integration in Notion</small>
              <button 
                onClick={loadDatabases}
                style={{ 
                  marginTop: '8px', 
                  padding: '4px 8px', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="database-list">
              {databases.map(db => (
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
                          <div
                            key={page.id}
                            className="page-item"
                            draggable
                            onDragStart={(e) => handleDragStart(e, page, db.id)}
                          >
                            <span className="page-icon">{page.icon || "📄"}</span>
                            <span className="page-title">{page.title}</span>
                          </div>
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
