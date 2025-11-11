import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import AuthCallback from './components/AuthCallback';
import { checkAuthStatus } from './lib/auth';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCallback, setIsCallback] = useState(false);

  useEffect(() => {
    // Check if this is an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') || urlParams.has('error')) {
      setIsCallback(true);
      setIsLoading(false);
      return;
    }

    // Check authentication status
    const checkAuth = async () => {
      const status = await checkAuthStatus();
      setIsAuthenticated(status.isAuthenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = () => {
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    setIsCallback(false);
    setIsAuthenticated(true);
  };

  const handleAuthError = () => {
    // Clear URL parameters and return to main view
    window.history.replaceState({}, document.title, window.location.pathname);
    setIsCallback(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show callback handler if this is OAuth redirect
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
        isAuthenticated={isAuthenticated} 
        onAuthChange={setIsAuthenticated} 
      />
      <Canvas />
    </div>
  );
}

export default App;
