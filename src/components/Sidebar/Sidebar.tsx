import { useState, useEffect } from 'react';
import { Database, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { GoSidebarCollapse } from 'react-icons/go';
import { searchDatabases, queryDatabase, getCurrentUser, NotionDatabase, NotionPage } from '../../lib/notion-api';
import { getAuthToken } from '../../lib/storage';
import AuthSection from './AuthSection';
import './Sidebar.css';

interface SidebarProps {
  onPageDragStart: (page: NotionPage) => void;
}

interface SidebarContainerProps {
  onPageDragStart: (page: NotionPage) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SidebarContent = ({ onPageDragStart }: SidebarProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [databasePages, setDatabasePages] = useState<Map<string, NotionPage[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingPages, setLoadingPages] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getAuthToken();
    setIsAuthenticated(!!token);

    if (token) {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        await loadDatabases();
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    }
    setLoading(false);
  };

  const loadDatabases = async () => {
    try {
      const dbs = await searchDatabases();
      setDatabases(dbs);
    } catch (error) {
      console.error('Failed to load databases:', error);
    }
  };

  const toggleDatabase = async (databaseId: string) => {
    const newExpanded = new Set(expandedDatabases);

    if (newExpanded.has(databaseId)) {
      newExpanded.delete(databaseId);
    } else {
      newExpanded.add(databaseId);

      if (!databasePages.has(databaseId)) {
        setLoadingPages(new Set(loadingPages).add(databaseId));
        try {
          const { results } = await queryDatabase(databaseId);
          setDatabasePages(new Map(databasePages).set(databaseId, results));
        } catch (error) {
          console.error('Failed to load database pages:', error);
        } finally {
          const newLoadingPages = new Set(loadingPages);
          newLoadingPages.delete(databaseId);
          setLoadingPages(newLoadingPages);
        }
      }
    }

    setExpandedDatabases(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, page: NotionPage) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/notion-page', JSON.stringify(page));
    onPageDragStart(page);
  };

  const getIcon = (icon: any) => {
    if (!icon) return null;
    if (icon.type === 'emoji') return icon.emoji;
    if (icon.type === 'file' && icon.file) return <img src={icon.file.url} alt="" className="icon-img" />;
    if (icon.type === 'external' && icon.external) return <img src={icon.external.url} alt="" className="icon-img" />;
    return null;
  };

  if (loading) {
    return (
      <div className="sidebar">
        <div className="sidebar-loading">
          <Loader2 className="animate-spin" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">FlowBlocs</h1>
      </div>

      <AuthSection
        isAuthenticated={isAuthenticated}
        user={user}
        onAuthChange={checkAuth}
      />

      {isAuthenticated && (
        <div className="sidebar-content">
          <div className="databases-section">
            <h2 className="section-title">Databases</h2>

            {databases.length === 0 ? (
              <div className="empty-state">
                <Database size={32} className="empty-icon" />
                <p className="empty-text">No databases found</p>
                <p className="empty-hint">Share a database with this integration</p>
              </div>
            ) : (
              <div className="databases-list">
                {databases.map((database) => (
                  <div key={database.id} className="database-item">
                    <button
                      className="database-header"
                      onClick={() => toggleDatabase(database.id)}
                    >
                      <span className="database-icon">
                        {expandedDatabases.has(database.id) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </span>
                      <span className="database-emoji">{getIcon(database.icon) || <Database size={16} />}</span>
                      <span className="database-title">{database.title}</span>
                    </button>

                    {expandedDatabases.has(database.id) && (
                      <div className="pages-list">
                        {loadingPages.has(database.id) ? (
                          <div className="pages-loading">
                            <Loader2 className="animate-spin" size={16} />
                          </div>
                        ) : (
                          databasePages.get(database.id)?.map((page) => (
                            <div
                              key={page.id}
                              className="page-item"
                              draggable
                              onDragStart={(e) => handleDragStart(e, page)}
                            >
                              <span className="page-icon">{getIcon(page.icon)}</span>
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
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ onPageDragStart, isCollapsed, onToggleCollapse }: SidebarContainerProps) => {
  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        className="sidebar-collapse-btn"
        onClick={onToggleCollapse}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <GoSidebarCollapse
          size={20}
          style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {!isCollapsed && <SidebarContent onPageDragStart={onPageDragStart} />}
    </div>
  );
};

export default Sidebar;
