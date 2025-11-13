import React, { useState, useEffect } from 'react';
import useNotion from './useNotion';

/**
 * Example Sidebar Component
 * Shows how to use the useNotion hook for authentication and API calls
 */
function Sidebar() {
  const { 
    isAuthenticated, 
    loading, 
    getCurrentUser,
    searchDatabases,
    saveToken,
    clearToken 
  } = useNotion();

  const [user, setUser] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [error, setError] = useState(null);
  const [loadingDatabases, setLoadingDatabases] = useState(false);

  // OAuth configuration
  const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID;
  const REDIRECT_URI = window.location.origin;
  const TOKEN_EXCHANGE_URL = 'https://qaccpssuhvsltnzhjxfl.supabase.co/functions/v1/notion-token-exchange';

  // Load user data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
      loadDatabases();
    }
  }, [isAuthenticated]);

  const loadUserData = async () => {
    try {
      console.log('📊 Loading user data...');
      const userData = await getCurrentUser();
      console.log('✅ User data loaded:', userData);
      setUser(userData);
    } catch (err) {
      console.error('❌ Failed to load user data:', err);
      setError('Failed to load user data');
    }
  };

  const loadDatabases = async () => {
    try {
      setLoadingDatabases(true);
      console.log('📚 Loading databases...');
      const result = await searchDatabases(100);
      console.log('✅ Databases loaded:', result);
      setDatabases(result.results || []);
    } catch (err) {
      console.error('❌ Failed to load databases:', err);
      setError('Failed to load databases');
    } finally {
      setLoadingDatabases(false);
    }
  };

  const handleSignIn = () => {
    const authUrl = `https://api.notion.com/v1/oauth/authorize?` +
      `client_id=${NOTION_CLIENT_ID}&` +
      `response_type=code&` +
      `owner=user&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    window.location.href = authUrl;
  };

  const handleSignOut = async () => {
    await clearToken();
    setUser(null);
    setDatabases([]);
    setError(null);
  };

  // Handle OAuth callback (when redirected back from Notion)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          console.log('🔐 Exchanging authorization code for token...');
          
          // Exchange code for token via Supabase function
          const response = await fetch(TOKEN_EXCHANGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              redirect_uri: REDIRECT_URI
            })
          });

          if (!response.ok) {
            throw new Error('Token exchange failed');
          }

          const data = await response.json();
          console.log('✅ Token received');

          // Save token
          await saveToken(data.access_token);

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('❌ OAuth failed:', err);
          setError('Authentication failed');
        }
      }
    };

    handleOAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="sidebar">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      {/* Authentication Section */}
      <div className="auth-section">
        {!isAuthenticated ? (
          <button onClick={handleSignIn} className="sign-in-btn">
            Sign in with Notion
          </button>
        ) : (
          <div className="user-info">
            <div className="user-profile">
              {user?.avatar_url && (
                <img src={user.avatar_url} alt="User avatar" />
              )}
              <span>{user?.name || 'User'}</span>
            </div>
            <button onClick={handleSignOut} className="sign-out-btn">
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Database List */}
      {isAuthenticated && (
        <div className="database-section">
          <div className="section-header">
            <h3>Databases</h3>
            <button onClick={loadDatabases} disabled={loadingDatabases}>
              {loadingDatabases ? '⏳' : '🔄'}
            </button>
          </div>

          {loadingDatabases ? (
            <div className="loading">Loading databases...</div>
          ) : databases.length === 0 ? (
            <div className="empty-state">
              <p>No databases found</p>
              <p className="hint">
                Share a database with this integration in Notion to see it here.
              </p>
            </div>
          ) : (
            <div className="database-list">
              {databases.map((db) => (
                <div key={db.id} className="database-item" draggable>
                  <div className="db-icon">
                    {db.icon?.emoji || '📄'}
                  </div>
                  <div className="db-info">
                    <div className="db-title">
                      {db.title?.[0]?.plain_text || 'Untitled'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Sidebar;
