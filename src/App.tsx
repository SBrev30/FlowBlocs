import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Canvas from './components/Canvas/CanvasContainer';
import { AuthCallback } from './components/AuthCallback';
import { checkAuthStatus } from './lib/auth';
import './styles/variables.css';

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCallback, setIsCallback] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') || urlParams.has('error')) {
      setIsCallback(true);
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      await checkAuthStatus();
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setIsCallback(false);
  };

  const handleAuthError = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setIsCallback(false);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleDragStart = (page: NotionPage, databaseId: string) => {
    console.log('Drag started:', page.title, 'from database:', databaseId);
  };

  const handleDrop = (page: NotionPage, position: { x: number; y: number }) => {
    console.log('Page dropped:', page.title, 'at position:', position);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isCallback) {
    return (
      <AuthCallback
        onSuccess={handleAuthSuccess}
        onError={handleAuthError}
      />
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        onDragStart={handleDragStart}
      />
      <Canvas onDrop={handleDrop} />
    </div>
  );
}

export default App;
