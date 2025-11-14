import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ExternalLink, Maximize2, Minimize2, ChevronRight, Loader2 } from 'lucide-react';
import { NotionPage, NotionBlock } from '../../lib/notion-sidebar-integration';

interface NotionNodeData {
  page: NotionPage;
  expanded?: boolean;
  blocks?: NotionBlock[];
  loading?: boolean;
  error?: string;
}

const BlockRenderer = ({ block }: { block: NotionBlock }) => {
  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading_1':
        return <h1 className="block-heading-1">{block.content}</h1>;
      case 'heading_2':
        return <h2 className="block-heading-2">{block.content}</h2>;
      case 'heading_3':
        return <h3 className="block-heading-3">{block.content}</h3>;
      case 'paragraph':
        return <p className="block-paragraph">{block.content || '\u00A0'}</p>;
      case 'bulleted_list_item':
        return (
          <div className="block-list-item bulleted">
            <span className="list-marker">•</span>
            <span>{block.content}</span>
          </div>
        );
      case 'numbered_list_item':
        return (
          <div className="block-list-item numbered">
            <span className="list-marker">{block.position + 1}.</span>
            <span>{block.content}</span>
          </div>
        );
      case 'to_do':
        return (
          <div className="block-todo">
            <input
              type="checkbox"
              checked={block.metadata?.checked || false}
              readOnly
              className="todo-checkbox"
            />
            <span>{block.content}</span>
          </div>
        );
      case 'code':
        return (
          <pre className="block-code">
            <code>{block.content}</code>
          </pre>
        );
      case 'quote':
        return <blockquote className="block-quote">{block.content}</blockquote>;
      case 'divider':
        return <hr className="block-divider" />;
      case 'image':
        return (
          <div className="block-image">
            {block.metadata?.url && (
              <img src={block.metadata.url} alt={block.content || 'Image'} />
            )}
            {block.content && <p className="image-caption">{block.content}</p>}
          </div>
        );
      default:
        return (
          <p className="block-unsupported">
            {block.content || `[${block.type}]`}
          </p>
        );
    }
  };

  return <div className={`block block-${block.type}`}>{renderBlockContent()}</div>;
};

const NotionNode = ({ data }: NodeProps<NotionNodeData>) => {
  const [expanded, setExpanded] = useState(data.expanded || false);
  const { page, blocks, loading, error } = data;

  const getIcon = (icon: any) => {
    if (!icon) return null;
    if (typeof icon === 'string') return <span className="node-emoji">{icon}</span>;
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
          {loading && (
            <div className="node-loading">
              <Loader2 className="spinner" size={20} />
              <span>Loading content...</span>
            </div>
          )}

          {error && (
            <div className="node-error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && blocks && blocks.length > 0 && (
            <div className="node-blocks">
              {blocks.map((block) => (
                <BlockRenderer key={block.id} block={block} />
              ))}
            </div>
          )}

          {!loading && !error && (!blocks || blocks.length === 0) && (
            <div className="node-empty">
              <p>No content in this page</p>
            </div>
          )}

          {page.hasChildren && (
            <div className="node-children-info">
              <div className="children-badge">
                <ChevronRight size={12} />
                <span>{page.childCount || 0} sub-page{page.childCount !== 1 ? 's' : ''}</span>
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
