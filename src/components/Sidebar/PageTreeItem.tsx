import { useState } from "react";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { NotionPage, getPageChildren } from "../../lib/notion-api";

interface PageTreeItemProps {
  page: NotionPage;
  databaseId: string;
  depth: number;
  onDragStart: (page: NotionPage, databaseId: string) => void;
}

const PageTreeItem = ({ page, databaseId, depth, onDragStart }: PageTreeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<NotionPage[]>(page.children || []);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedChildren, setHasLoadedChildren] = useState(false);

  const toggleExpand = async () => {
    if (!page.hasChildren) return;

    if (!isExpanded && !hasLoadedChildren) {
      setIsLoading(true);
      try {
        const childPages = await getPageChildren(page.id);
        setChildren(childPages);
        setHasLoadedChildren(true);
      } catch (error) {
        console.error(`Failed to load children for ${page.id}:`, error);
      } finally {
        setIsLoading(false);
      }
    }

    setIsExpanded(!isExpanded);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/notion-page", JSON.stringify(page));
    onDragStart(page, databaseId);
  };

  return (
    <div className="page-tree-item">
      <div
        className="page-item"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        draggable
        onDragStart={handleDragStart}
      >
        {page.hasChildren && (
          <button
            className="expand-btn"
            onClick={toggleExpand}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {isLoading ? (
              <Loader2 className="spinner" size={12} />
            ) : isExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </button>
        )}
        {!page.hasChildren && <span style={{ width: "20px", display: "inline-block" }} />}
        <span className="page-icon">{page.icon || "📄"}</span>
        <span className="page-title">{page.title}</span>
        {page.hasChildren && page.childCount !== undefined && (
          <span
            className="child-count-badge"
            style={{
              marginLeft: "auto",
              fontSize: "10px",
              color: "#888",
              padding: "2px 6px",
              borderRadius: "8px",
              backgroundColor: "rgba(0,0,0,0.05)",
            }}
          >
            {page.childCount}
          </span>
        )}
      </div>

      {isExpanded && children.length > 0 && (
        <div className="page-children">
          {children.map((childPage) => (
            <PageTreeItem
              key={childPage.id}
              page={childPage}
              databaseId={databaseId}
              depth={depth + 1}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PageTreeItem;
