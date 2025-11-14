import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ExternalLink, Maximize2, Minimize2, ChevronRight } from 'lucide-react';
import { NotionPage } from '../../lib/notion-api';

interface NotionNodeData {
  page: NotionPage;
  expanded?: boolean;
}

const NotionNode = ({ data }: NodeProps<NotionNodeData>) => {
  const [expanded, setExpanded] = useState(data.expanded || false);
  const { page } = data;

  const getIcon = (icon: any) => {
    if (!icon) return null;
    if (icon.type === 'emoji') return <span className="node-emoji">{icon.emoji}</span>;
    if (icon.type === 'file' && icon.file) return <img src={icon.file.url} alt="" className="node-icon-img" />;
    if (icon.type === 'external' && icon.external) return <img src={icon.external.url} alt="" className="node-icon-img" />;
    return null;
  };

  const getCover = (cover: any) => {
    if (!cover) return null;
    if (cover.type === 'file' && cover.file) return cover.file.url;
    if (cover.type === 'external' && cover.external) return cover.external.url;
    return null;
  };

  const coverUrl = getCover(page.cover);

  return (
    <div className={`notion-node ${expanded ? 'expanded' : 'collapsed'}`}>
      <Handle type="target" position={Position.Top} className="node-handle" />

      {coverUrl && expanded && (
        <div className="node-cover">
          <img src={coverUrl} alt="" />
        </div>
      )}

      <div className="node-header">
        <div className="node-icon">{getIcon(page.icon)}</div>
        <div className="node-title">{page.title || 'Untitled'}</div>
        <div className="node-actions">
          <button
            className="node-action-button"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="node-action-button"
            title="Open in Notion"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {expanded && (
        <div className="node-content">
          <div className="node-content-placeholder">
            <p className="placeholder-text">Double-click to edit content</p>
            <p className="placeholder-hint">Content editing coming soon</p>
          </div>
          {page.hasChildren && page.childCount && page.childCount > 0 && (
            <div className="node-children-info">
              <div className="children-badge">
                <ChevronRight size={12} />
                <span>{page.childCount} sub-page{page.childCount > 1 ? 's' : ''}</span>
              </div>
              <p className="children-hint">Sub-pages can be found in the sidebar</p>
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="node-handle" />
    </div>
  );
};

export default memo(NotionNode);
