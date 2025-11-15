import { X, Trash2 } from 'lucide-react';
import './DeleteNodePopup.css';

interface DeleteNodePopupProps {
  isOpen: boolean;
  nodeTitle: string;
  position: { x: number; y: number };
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteNodePopup = ({ 
  isOpen, 
  nodeTitle, 
  position, 
  onConfirm, 
  onCancel 
}: DeleteNodePopupProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="delete-popup-overlay" onClick={onCancel} />
      <div 
        className="delete-node-popup" 
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px` 
        }}
      >
        <div className="delete-popup-header">
          <Trash2 size={16} className="delete-icon" />
          <span>Delete Node</span>
          <button className="close-btn" onClick={onCancel}>
            <X size={14} />
          </button>
        </div>
        
        <div className="delete-popup-content">
          <p>Remove <strong>{nodeTitle}</strong> from canvas?</p>
          <small>This will only remove it from the canvas, not from Notion.</small>
        </div>
        
        <div className="delete-popup-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="delete-btn" onClick={onConfirm}>
            Remove
          </button>
        </div>
      </div>
    </>
  );
};

export default DeleteNodePopup;
