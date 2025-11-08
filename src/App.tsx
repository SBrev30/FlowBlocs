import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import CanvasContainer from './components/Canvas/CanvasContainer';
import { NotionPage } from './lib/notion-api';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Load sidebar collapsed state from localStorage
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) {
      setIsSidebarCollapsed(savedCollapsed === 'true');
    }
  }, []);

  const handlePageDragStart = (page: NotionPage) => {
    console.log('Drag started:', page.title);
  };

  const handlePageDrop = (page: NotionPage, position: { x: number; y: number }) => {
    console.log('Page dropped:', page.title, 'at position:', position);
  };

  const toggleSidebar = () => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', String(newCollapsed));
  };

  return (
    <div className="app-container">
      <Sidebar
        onPageDragStart={handlePageDragStart}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <CanvasContainer onDrop={handlePageDrop} />
    </div>
  );
}

export default App;
