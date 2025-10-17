import { useEffect } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import CanvasContainer from './components/Canvas/CanvasContainer';
import { NotionPage } from './lib/notion-api';
import { handleAuthCallback } from './lib/auth';

function App() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      handleAuthCallback(code)
        .then(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.reload();
        })
        .catch((error) => {
          console.error('Authentication failed:', error);
        });
    }
  }, []);

  const handlePageDragStart = (page: NotionPage) => {
    console.log('Drag started:', page.title);
  };

  const handlePageDrop = (page: NotionPage, position: { x: number; y: number }) => {
    console.log('Page dropped:', page.title, 'at position:', position);
  };

  return (
    <div className="app-container">
      <Sidebar onPageDragStart={handlePageDragStart} />
      <CanvasContainer onDrop={handlePageDrop} />
    </div>
  );
}

export default App;
