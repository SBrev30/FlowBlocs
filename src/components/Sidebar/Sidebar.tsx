import { useState, useEffect } from "react";
import { Database, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { GoSidebarCollapse } from "react-icons/go";
import { searchDatabases, queryDatabase, getCurrentUser } from "../../lib/notion-api";
import { getAuthToken } from "../../lib/storage";
import AuthSection from "./AuthSection";
import "./Sidebar.css";

interface NotionDatabase {
  id: string;
  title: string;
  icon?: string;
}

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
}

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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        setIsAuthenticated(true);
        await loadUserData();
        await loadDatabases();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const loadDatabases = async () => {
    try {
      const dbs = await searchDatabases();
      setDatabases(dbs);
    } catch (error) {
      console.error("Failed to load databases:", error);
    }
  };

  const toggleDatabase = async (databaseId: string) => {
    const newExpanded = new Set(expandedDatabases);
    
    if (newExpanded.has(databaseId)) {
      newExpanded.delete(databaseId);
      setExpandedDatabases(newExpanded);
    } else {
      newExpanded.add(databaseId);
      setExpandedDatabases(newExpanded);
      
      // Load pages if not already loaded
      if (!databasePages[databaseId]) {
        setLoadingPages(new Set(loadingPages).add(databaseId));
        try {
          const response = await queryDatabase(databaseId);
          setDatabasePages(prev => ({
            ...prev,
            [databaseId]: response.results
          }));
        } catch (error) {
          console.error("Failed to load database pages:", error);
        } finally {
          const newLoadingPages = new Set(loadingPages);
          newLoadingPages.delete(databaseId);
          setLoadingPages(newLoadingPages);
        }
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, page: NotionPage, databaseId: string) => {
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
          ) : databases.length === 0 ? (
            <div className="empty-state">
              <p>No databases found</p>
              <small>Share a database with this integration in Notion</small>
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
