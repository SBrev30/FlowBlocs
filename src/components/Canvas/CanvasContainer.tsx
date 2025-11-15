import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NotionPage, NotionBlock } from '../../lib/notion-sidebar-integration';
import { saveCanvasState, getCanvasState } from '../../lib/storage';
import NotionNode from './NotionNode';
import { Moon, Sun, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import './Canvas.css';

const nodeTypes = {
  notionNode: NotionNode,
};

interface CanvasContainerProps {
  onDrop: (page: NotionPage, position: { x: number; y: number }) => Promise<NotionBlock[]>;
  onClearCanvas: () => void;
}

const CanvasContainer = ({ onDrop, onClearCanvas }: CanvasContainerProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCanvasState();
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      saveCanvas();
    }, 2000);

    setSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [nodes, edges]);

  const loadCanvasState = async () => {
    const state = await getCanvasState();
    if (state) {
      setNodes(state.nodes || []);
      setEdges(state.edges || []);
      if (state.viewport && reactFlowInstance) {
        reactFlowInstance.setViewport(state.viewport);
      }
    }
  };

  const loadThemePreference = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  };

  const saveCanvas = async () => {
    const viewport = reactFlowInstance?.getViewport();
    await saveCanvasState({
      nodes,
      edges,
      viewport,
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    onClearCanvas();
  }, [setNodes, setEdges, onClearCanvas]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDropHandler = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const pageData = event.dataTransfer.getData('application/notion-page');
      console.log('📥 Drop received, raw data:', pageData?.substring(0, 200));

      if (!pageData || !reactFlowInstance) {
        console.error('❌ Drop failed: no page data or react flow instance');
        return;
      }

      let page: NotionPage;
      try {
        page = JSON.parse(pageData);
        console.log('✅ Parsed page data:', {
          id: page.id,
          title: page.title,
          icon: page.icon,
          url: page.url,
        });
      } catch (error) {
        console.error('❌ Failed to parse page data:', error);
        return;
      }

      if (!page.id || !page.title) {
        console.error('❌ Invalid page structure:', page);
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      console.log('📍 Drop position:', position);

      const nodeId = `${page.id}-${Date.now()}`;

      const newNode: Node = {
        id: nodeId,
        type: 'notionNode',
        position,
        data: {
          page,
          expanded: false,
          loading: true,
          blocks: [],
        },
      };

      setNodes((nds) => nds.concat(newNode));

      try {
        const blocks = await onDrop(page, position);

        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  blocks,
                  loading: false,
                },
              };
            }
            return node;
          })
        );
      } catch (error) {
        console.error('Failed to load page content:', error);
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  loading: false,
                  error: 'Failed to load content',
                },
              };
            }
            return node;
          })
        );
      }
    },
    [reactFlowInstance, onDrop, setNodes]
  );

  const handleZoomIn = () => {
    reactFlowInstance?.zoomIn();
  };

  const handleZoomOut = () => {
    reactFlowInstance?.zoomOut();
  };

  const handleFitView = () => {
    reactFlowInstance?.fitView({ padding: 0.2 });
  };

  return (
    <div className="canvas-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDropHandler}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background
          color={theme === 'dark' ? '#ffffff1a' : '#00000014'}
          gap={16}
          variant={BackgroundVariant.Dots}
        />
        <Controls showInteractive={false} />

        <Panel position="top-right" className="canvas-toolbar">
          <button className="toolbar-button" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <div className="toolbar-divider" />
          <button className="toolbar-button" onClick={handleZoomIn} title="Zoom in">
            <ZoomIn size={18} />
          </button>
          <button className="toolbar-button" onClick={handleZoomOut} title="Zoom out">
            <ZoomOut size={18} />
          </button>
          <button className="toolbar-button" onClick={handleFitView} title="Fit view">
            <Maximize2 size={18} />
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default CanvasContainer;
