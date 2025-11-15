import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NotionPage, getPageBlocks, updatePageContent } from '../../lib/notion-api';
import { PropertySummary } from '../PropertyDisplay';
import { ExpandButton, OpenInNotionButton, DeleteButton, EditButton } from './NodeActions';
import DeleteNodePopup from './DeleteNodePopup';
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
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deletePopupPosition, setDeletePopupPosition] = useState({ x: 0, y: 0 });

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

    // Focus the editor after state update
    setTimeout(() => {
      const editor = document.getElementById(`editor-${id}`) as HTMLDivElement;
      if (editor) {
        editor.focus();
        console.log('✏️ Editor focused');
      }
    }, 100);
  }, [id]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setContent(prev => ({ ...prev, hasChanges: false }));
    setSaveStatus('idle');
    loadContent(); // Reload original content
  }, [loadContent]);

  // Handle delete node
  const handleDeleteNode = useCallback((event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setDeletePopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8
    });
    setShowDeletePopup(true);
  }, []);

  const confirmDelete = useCallback(() => {
    // Dispatch custom event to parent to handle node deletion
    const deleteEvent = new CustomEvent('deleteNode', {
      detail: { nodeId: id }
    });
    window.dispatchEvent(deleteEvent);
    setShowDeletePopup(false);
  }, [id]);

  const cancelDelete = useCallback(() => {
    setShowDeletePopup(false);
  }, []);

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
      const updatePromises = updatedBlocks
        .filter(block => block.id && !block.id.startsWith('new-'))
        .map(async (block) => {
          // Update existing block
          const updateData = {
            [block.type]: block[block.type]
          };
          const result = await updatePageContent(block.id, updateData);
          console.log(`✅ Block ${block.id} updated:`, result);
          return result;
        });

      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);
      console.log(`✅ All ${results.length} blocks updated successfully`);

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
          <ExpandButton
            isExpanded={isExpanded}
            onClick={toggleExpanded}
            title={isExpanded ? 'Collapse' : 'Expand'}
          />
          <OpenInNotionButton
            onClick={openInNotion}
            title="Open in Notion"
          />
          <DeleteButton
            onClick={handleDeleteNode as any}
            title="Delete node"
          />
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
                  tabIndex={0}
                  onInput={handleContentChange}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    // Ensure editor gets focus on click
                    const target = e.currentTarget as HTMLDivElement;
                    target.focus();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Ensure editor gets focus on click
                    const target = e.currentTarget as HTMLDivElement;
                    target.focus();
                  }}
                  onFocus={(e) => {
                    console.log('✏️ Editor received focus');
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
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
                  <EditButton
                    onClick={startEditing}
                    title="Edit content"
                  />
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

      {/* Delete Popup */}
      <DeleteNodePopup
        isOpen={showDeletePopup}
        nodeTitle={page.title}
        position={deletePopupPosition}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default NotionNode;