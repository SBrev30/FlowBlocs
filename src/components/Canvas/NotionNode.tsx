import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NotionPage, getPageBlocks, updatePageContent } from '../../lib/notion-api';
import { PropertySummary } from '../PropertyDisplay';
import './NotionNode.css';

interface NotionNodeData {
  page: NotionPage;
  isExpanded?: boolean;
  content?: any[];
}

interface EditableContent {
  blocks: any[];
  isLoading: boolean;
  hasChanges: boolean;
}

const NotionNode: React.FC<NodeProps<NotionNodeData>> = ({ 
  data, 
  selected,
  id 
}) => {
  const [isExpanded, setIsExpanded] = useState(data.isExpanded || false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<EditableContent>({
    blocks: [],
    isLoading: false,
    hasChanges: false
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { page } = data;

  // Load page content when expanding or editing
  const loadContent = useCallback(async () => {
    if (!isExpanded && !isEditing) return;

    setContent(prev => ({ ...prev, isLoading: true }));
    
    try {
      const blocks = await getPageBlocks(page.id);
      console.log('📖 Loaded content blocks:', blocks.length);
      
      setContent({
        blocks: blocks || [],
        isLoading: false,
        hasChanges: false
      });
    } catch (error) {
      console.error('❌ Failed to load content:', error);
      setContent(prev => ({ 
        ...prev, 
        isLoading: false
      }));
    }
  }, [page.id, isExpanded, isEditing]);

  // Load content when expanded or editing starts
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Handle expand/collapse
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
    if (isEditing) {
      setIsEditing(false);
      setSaveStatus('idle');
    }
  }, [isExpanded, isEditing]);

  // Handle edit mode
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setIsExpanded(true);
    setSaveStatus('idle');
  }, []);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setContent(prev => ({ ...prev, hasChanges: false }));
    setSaveStatus('idle');
    loadContent(); // Reload original content
  }, [loadContent]);

  // Handle delete node
  const handleDeleteNode = useCallback(() => {
    if (window.confirm(`Are you sure you want to delete "${page.title}"?`)) {
      // Dispatch custom event to parent to handle node deletion
      const deleteEvent = new CustomEvent('deleteNode', { 
        detail: { nodeId: id } 
      });
      window.dispatchEvent(deleteEvent);
    }
  }, [id, page.title]);

  // Handle open in Notion
  const openInNotion = useCallback(() => {
    const notionUrl = `https://notion.so/${page.id.replace(/-/g, '')}`;
    window.open(notionUrl, '_blank');
  }, [page.id]);

  // Convert Notion blocks to editable HTML
  const blocksToHtml = useCallback((blocks: any[]): string => {
    return blocks.map(block => {
      switch (block.type) {
        case 'paragraph':
          const text = extractText(block.paragraph?.rich_text);
          return `<p data-block-id="${block.id}" data-block-type="paragraph">${text}</p>`;
        
        case 'heading_1':
          const h1Text = extractText(block.heading_1?.rich_text);
          return `<h1 data-block-id="${block.id}" data-block-type="heading_1">${h1Text}</h1>`;
        
        case 'heading_2':
          const h2Text = extractText(block.heading_2?.rich_text);
          return `<h2 data-block-id="${block.id}" data-block-type="heading_2">${h2Text}</h2>`;
        
        case 'heading_3':
          const h3Text = extractText(block.heading_3?.rich_text);
          return `<h3 data-block-id="${block.id}" data-block-type="heading_3">${h3Text}</h3>`;
        
        case 'bulleted_list_item':
          const bulletText = extractText(block.bulleted_list_item?.rich_text);
          return `<li data-block-id="${block.id}" data-block-type="bulleted_list_item">${bulletText}</li>`;
        
        case 'numbered_list_item':
          const numberedText = extractText(block.numbered_list_item?.rich_text);
          return `<li data-block-id="${block.id}" data-block-type="numbered_list_item" data-numbered="true">${numberedText}</li>`;
        
        case 'to_do':
          const todoText = extractText(block.to_do?.rich_text);
          const checked = block.to_do?.checked ? 'checked' : '';
          return `<div data-block-id="${block.id}" data-block-type="to_do" class="todo-item">
            <input type="checkbox" ${checked} disabled> ${todoText}
          </div>`;
        
        case 'quote':
          const quoteText = extractText(block.quote?.rich_text);
          return `<blockquote data-block-id="${block.id}" data-block-type="quote">${quoteText}</blockquote>`;
        
        case 'code':
          const codeText = extractText(block.code?.rich_text);
          const language = block.code?.language || '';
          return `<pre data-block-id="${block.id}" data-block-type="code" data-language="${language}"><code>${codeText}</code></pre>`;
        
        case 'divider':
          return `<hr data-block-id="${block.id}" data-block-type="divider">`;
        
        default:
          return `<p data-block-id="${block.id}" data-block-type="${block.type}">[${block.type}]</p>`;
      }
    }).join('\n');
  }, []);

  // Extract text from rich text array
  const extractText = (richText: any[]): string => {
    if (!richText || !Array.isArray(richText)) return '';
    return richText.map(item => item.plain_text || '').join('');
  };

  // Convert HTML back to Notion blocks
  const htmlToBlocks = useCallback((html: string): any[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = doc.body.children;
    
    const blocks = [];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement;
      const blockId = element.getAttribute('data-block-id');
      const blockType = element.getAttribute('data-block-type');
      const text = element.textContent || '';
      
      if (!text.trim() && blockType !== 'divider') continue;
      
      const richText = text ? [{ type: 'text', text: { content: text } }] : [];
      
      switch (blockType) {
        case 'paragraph':
          blocks.push({
            id: blockId,
            type: 'paragraph',
            paragraph: { rich_text: richText }
          });
          break;
        
        case 'heading_1':
          blocks.push({
            id: blockId,
            type: 'heading_1',
            heading_1: { rich_text: richText }
          });
          break;
        
        case 'heading_2':
          blocks.push({
            id: blockId,
            type: 'heading_2',
            heading_2: { rich_text: richText }
          });
          break;
        
        case 'heading_3':
          blocks.push({
            id: blockId,
            type: 'heading_3',
            heading_3: { rich_text: richText }
          });
          break;
        
        case 'bulleted_list_item':
          blocks.push({
            id: blockId,
            type: 'bulleted_list_item',
            bulleted_list_item: { rich_text: richText }
          });
          break;
        
        case 'numbered_list_item':
          blocks.push({
            id: blockId,
            type: 'numbered_list_item',
            numbered_list_item: { rich_text: richText }
          });
          break;
        
        case 'quote':
          blocks.push({
            id: blockId,
            type: 'quote',
            quote: { rich_text: richText }
          });
          break;
        
        case 'code':
          const language = element.getAttribute('data-language') || 'plain text';
          blocks.push({
            id: blockId,
            type: 'code',
            code: { 
              rich_text: richText,
              language: language
            }
          });
          break;
        
        case 'divider':
          blocks.push({
            id: blockId,
            type: 'divider',
            divider: {}
          });
          break;
        
        default:
          // Treat unknown types as paragraphs
          blocks.push({
            id: blockId || `new-${Date.now()}-${i}`,
            type: 'paragraph',
            paragraph: { rich_text: richText }
          });
      }
    }
    
    return blocks;
  }, []);

  // Handle content change (mark as changed but no autosave)
  const handleContentChange = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    if (!isEditing) return;
    setContent(prev => ({ ...prev, hasChanges: true }));
    setSaveStatus('idle');
  }, [isEditing]);

  // Save changes to Notion (manual save only)
  const saveChanges = useCallback(async () => {
    const editorElement = document.querySelector(`#editor-${id}`) as HTMLDivElement;
    if (!editorElement || !content.hasChanges) return;
    
    setSaveStatus('saving');
    
    try {
      const html = editorElement.innerHTML;
      const updatedBlocks = htmlToBlocks(html);
      
      console.log('💾 Saving changes:', updatedBlocks.length, 'blocks');
      
      // Update each block individually
      const updatePromises = updatedBlocks.map(async (block) => {
        if (block.id && !block.id.startsWith('new-')) {
          // Update existing block
          const updateData = {
            [block.type]: block[block.type]
          };
          await updatePageContent(block.id, updateData);
        }
      });
      
      await Promise.all(updatePromises);
      
      setContent(prev => ({ 
        ...prev, 
        hasChanges: false,
        blocks: updatedBlocks
      }));
      setSaveStatus('saved');
      
      // Clear saved status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      
      console.log('✅ Changes saved successfully');
      
    } catch (error) {
      console.error('❌ Failed to save changes:', error);
      setSaveStatus('error');
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, [content.hasChanges, htmlToBlocks, id]);

  // Render save status
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className="save-status saving">💾 Saving...</span>;
      case 'saved':
        return <span className="save-status saved">✅ Saved</span>;
      case 'error':
        return <span className="save-status error">❌ Save failed</span>;
      default:
        return content.hasChanges ? (
          <span className="save-status unsaved">● Unsaved changes</span>
        ) : null;
    }
  };

  return (
    <div className={`flowblocs-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${isEditing ? 'editing' : ''}`}>
      {/* Node Header */}
      <div className="flowblocs-node-header">
        <div className="flowblocs-node-title">
          {page.icon && <span className="flowblocs-node-icon">{page.icon}</span>}
          <span className="flowblocs-title-text">{page.title}</span>
        </div>
        
        <div className="flowblocs-node-actions">
          {/* Expand/Collapse Button */}
          <button
            className={`flowblocs-action-btn expand-btn ${isExpanded ? 'active' : ''}`}
            onClick={toggleExpanded}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              {isExpanded ? (
                // Collapse icon (diagonal arrows inward)
                <path d="m3.8 14.7 2.1-2.1 1.4 1.4-2.1 2.1c-.4.4-1 .4-1.4 0s-.4-1 0-1.4zm14.4-5.4-2.1 2.1-1.4-1.4 2.1-2.1c.4-.4 1-.4 1.4 0s.4 1 0 1.4zM15 3h3a3 3 0 0 1 3 3v3l-1.5-1.5-1.4 1.4L20 7V6a1 1 0 0 0-1-1h-1l-1.9 1.9-1.4-1.4L15 3zM9 21H6a3 3 0 0 1-3-3v-3l1.5 1.5 1.4-1.4L4 17v1a1 1 0 0 0 1 1h1l1.9-1.9 1.4 1.4L9 21z"/>
              ) : (
                // Expand icon (diagonal arrows outward)  
                <path d="M9 9V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H15v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h6z"/>
              )}
            </svg>
          </button>
          
          {/* Open in Notion Button */}
          <button
            className="flowblocs-action-btn notion-btn"
            onClick={openInNotion}
            title="Open in Notion"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h8.586L5.293 17.293a1 1 0 1 0 1.414 1.414L17 8.414V17a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1H8a1 1 0 1 0 0 2z"/>
            </svg>
          </button>
          
          {/* Delete Button */}
          <button
            className="flowblocs-action-btn delete-btn"
            onClick={handleDeleteNode}
            title="Delete node"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Properties Summary */}
      {!isExpanded && (
        <div className="flowblocs-node-summary">
          <PropertySummary page={page} />
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="flowblocs-node-content">
          {/* Property Display */}
          <div className="flowblocs-node-properties">
            <PropertySummary page={page} />
          </div>

          {/* Content Area */}
          <div className="flowblocs-content-area">
            {content.isLoading ? (
              <div className="flowblocs-loading">
                <span>📖 Loading content...</span>
              </div>
            ) : isEditing ? (
              <>
                {/* Editor Header */}
                <div className="flowblocs-editor-header">
                  <div className="flowblocs-editor-title">✏️ Editing Content</div>
                  <div className="flowblocs-editor-actions">
                    {renderSaveStatus()}
                    <button 
                      className="flowblocs-save-btn"
                      onClick={saveChanges}
                      disabled={!content.hasChanges || saveStatus === 'saving'}
                    >
                      Save
                    </button>
                    <button 
                      className="flowblocs-cancel-btn"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                
                {/* Editable Content */}
                <div
                  id={`editor-${id}`}
                  className="flowblocs-content-editor"
                  contentEditable
                  suppressContentEditableWarning={true}
                  onInput={handleContentChange}
                  dangerouslySetInnerHTML={{ 
                    __html: blocksToHtml(content.blocks) 
                  }}
                />
                
                {/* Editor Help */}
                <div className="flowblocs-editor-help">
                  <small>
                    💡 Make your changes and click Save when ready
                  </small>
                </div>
              </>
            ) : (
              <>
                {/* Read-only Content with Edit Button */}
                <div className="flowblocs-content-header">
                  <button
                    className="flowblocs-edit-btn"
                    onClick={startEditing}
                    title="Edit content"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 21v-4.25L16.2 3.575q.3-.275.663-.425.362-.15.762-.15t.775.15q.375.15.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763-.138.362-.438.662L7.25 21H3ZM17.6 7.8L19 6.4 17.6 5l-1.4 1.4 1.4 1.4Z"/>
                    </svg>
                    Edit
                  </button>
                </div>
                
                <div 
                  className="flowblocs-content-display"
                  dangerouslySetInnerHTML={{ 
                    __html: blocksToHtml(content.blocks) 
                  }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Node Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default NotionNode;