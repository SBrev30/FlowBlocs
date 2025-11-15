import React from 'react';
import { NotionPage, FormattedProperty, getPageSummary } from '../lib/notion-api';
import './PropertyDisplay.css';

interface PropertyDisplayProps {
  page: NotionPage;
  compact?: boolean;
  showAll?: boolean;
}

const PropertyBadge: React.FC<{ property: FormattedProperty }> = ({ property }) => {
  const getColorClass = (color?: string) => {
    if (!color) return '';
    return `property-badge-${color}`;
  };

  const renderValue = () => {
    if (property.url && property.type === 'url') {
      return (
        <a href={property.url} target="_blank" rel="noopener noreferrer" className="property-url">
          {property.displayValue}
        </a>
      );
    }

    if (property.type === 'multi_select' && Array.isArray(property.value)) {
      return (
        <div className="multi-select-container">
          {property.value.map((tag, index) => (
            <span key={index} className={`tag ${getColorClass(property.color)}`}>
              {tag}
            </span>
          ))}
        </div>
      );
    }

    return <span className="property-value">{property.displayValue}</span>;
  };

  return (
    <div className={`property-badge ${getColorClass(property.color)}`}>
      <span className="property-label">{property.name}:</span>
      {renderValue()}
    </div>
  );
};

const PropertyDisplay: React.FC<PropertyDisplayProps> = ({ 
  page, 
  compact = false, 
  showAll = false 
}) => {
  const summary = getPageSummary(page);
  const properties = page.formattedProperties || [];

  if (compact) {
    // Compact view - show only tags and key info
    return (
      <div className="property-display compact">
        {summary.tags.length > 0 && (
          <div className="tags-row">
            {summary.tags.map((tag, index) => (
              <span key={index} className="tag compact">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="key-info">
          {summary.status && (
            <span className="status-badge">{summary.status}</span>
          )}
          {summary.priority && (
            <span className="priority-badge">{summary.priority}</span>
          )}
          {summary.dueDate && (
            <span className="date-badge">📅 {summary.dueDate}</span>
          )}
        </div>
      </div>
    );
  }

  // Full view
  const displayProperties = showAll 
    ? properties 
    : properties.filter(p => p.type !== 'title' && p.displayValue && !p.displayValue.includes('(Not '));

  return (
    <div className="property-display full">
      <div className="page-header">
        <h3 className="property-page-title">
          {page.icon && <span className="page-icon">{page.icon}</span>}
          {page.title}
        </h3>
      </div>

      {summary.tags.length > 0 && (
        <div className="tags-section">
          <h4>🏷️ Tags</h4>
          <div className="tags-grid">
            {summary.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {displayProperties.length > 0 && (
        <div className="properties-section">
          <h4>📋 Properties</h4>
          <div className="properties-grid">
            {displayProperties.map((property, index) => (
              <PropertyBadge key={index} property={property} />
            ))}
          </div>
        </div>
      )}

      <div className="page-metadata">
        <div className="page-url">
          <a href={page.url} target="_blank" rel="noopener noreferrer">
            🔗 Open in Notion
          </a>
        </div>
      </div>
    </div>
  );
};

// Quick summary component for sidebar items
export const PropertySummary: React.FC<{ page: NotionPage }> = ({ page }) => {
  const summary = getPageSummary(page);
  
  return (
    <div className="property-summary">
      <div className="summary-title">
        {page.icon && <span className="icon">{page.icon}</span>}
        <span className="title">{page.title}</span>
      </div>
      
      <div className="summary-details">
        {summary.tags.length > 0 && (
          <div className="summary-tags">
            {summary.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="summary-tag">
                {tag}
              </span>
            ))}
            {summary.tags.length > 3 && (
              <span className="more-tags">+{summary.tags.length - 3}</span>
            )}
          </div>
        )}
        
        {(summary.status || summary.priority || summary.dueDate) && (
          <div className="summary-meta">
            {summary.status && (
              <span className="meta-item status">{summary.status}</span>
            )}
            {summary.priority && (
              <span className="meta-item priority">{summary.priority}</span>
            )}
            {summary.dueDate && (
              <span className="meta-item date">📅</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Debug component for development
export const PropertyDebugger: React.FC<{ page: NotionPage }> = ({ page }) => {
  const properties = page.formattedProperties || [];
  
  return (
    <div className="property-debugger">
      <h4>🔍 Property Debug: {page.title}</h4>
      <div className="debug-info">
        <div><strong>Total properties:</strong> {properties.length}</div>
        <div><strong>Raw properties:</strong> {Object.keys(page.properties || {}).length}</div>
      </div>
      
      <table className="debug-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Raw Value</th>
            <th>Display Value</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((prop, index) => (
            <tr key={index}>
              <td>{prop.name}</td>
              <td>{prop.type}</td>
              <td>{JSON.stringify(prop.value)}</td>
              <td>{prop.displayValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PropertyDisplay;
