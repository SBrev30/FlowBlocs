import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Canvas from './components/Canvas/CanvasContainer';
import { AuthCallback } from './components/AuthCallback';
import { checkAuthStatus } from './lib/auth';
import { getAuthToken } from './lib/storage';
import { NotionSidebarService, NotionPage, NotionBlock } from './lib/notion-sidebar-integration';
import './styles/variables.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCallback, setIsCallback] = useState(false);

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

  const handleDragStart = (page: NotionPage, databaseId: string) => {
    console.log('Drag started:', page.title, 'from database:', databaseId);
  };

  const handleDrop = async (page: NotionPage, position: { x: number; y: number }): Promise<NotionBlock[]> => {
    console.log('Page dropped:', page.title, 'at position:', position);

    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        return [];
      }

      const service = new NotionSidebarService(token);
      const blocks = await service.fetchPageContent(page.id);
      console.log('Fetched blocks for page:', page.title, blocks);
      return blocks;
    } catch (error) {
      console.error('Failed to fetch page content:', error);
      return [];
    }
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
        onDragStart={handleDragStart}
      />
      <Canvas
        onDrop={handleDrop}
      />
    </div>
  );
}

export default App;
