import React from 'react';
import { Maximize2, Minimize2, ExternalLink, Trash2, ChevronRight, Loader2 } from 'lucide-react';

interface ActionButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  className?: string;
  disabled?: boolean;
  size?: number;
}

export const ExpandButton: React.FC<ActionButtonProps & { isExpanded: boolean }> = ({
  onClick,
  title,
  isExpanded,
  size = 16
}) => (
  <button
    className={`flowblocs-action-btn expand-btn ${isExpanded ? 'active' : ''}`}
    onClick={onClick}
    title={title}
  >
    {isExpanded ? <Minimize2 size={size} /> : <Maximize2 size={size} />}
  </button>
);

export const OpenInNotionButton: React.FC<ActionButtonProps> = ({
  onClick,
  title,
  size = 16
}) => (
  <button
    className="flowblocs-action-btn notion-btn"
    onClick={onClick}
    title={title}
  >
    <ExternalLink size={size} />
  </button>
);

export const DeleteButton: React.FC<ActionButtonProps> = ({
  onClick,
  title,
  size = 16
}) => (
  <button
    className="flowblocs-action-btn delete-btn"
    onClick={onClick}
    title={title}
  >
    <Trash2 size={size} />
  </button>
);

export const ChevronButton: React.FC<ActionButtonProps & { isOpen?: boolean }> = ({
  onClick,
  title,
  isOpen = false,
  className = '',
  size = 16
}) => (
  <button
    className={`flowblocs-action-btn chevron-btn ${isOpen ? 'open' : ''} ${className}`}
    onClick={onClick}
    title={title}
  >
    <ChevronRight size={size} />
  </button>
);

export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = ''
}) => (
  <div className={`flowblocs-loading-spinner ${className}`}>
    <Loader2 size={size} className="animate-spin" />
  </div>
);

export const EditButton: React.FC<ActionButtonProps> = ({
  onClick,
  title,
  size = 16
}) => (
  <button
    className="flowblocs-edit-btn"
    onClick={onClick}
    title={title}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 21v-4.25L16.2 3.575q.3-.275.663-.425.362-.15.762-.15t.775.15q.375.15.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763-.138.362-.438.662L7.25 21H3ZM17.6 7.8L19 6.4 17.6 5l-1.4 1.4 1.4 1.4Z"/>
    </svg>
    Edit
  </button>
);
