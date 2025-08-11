import * as React from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FileTreeNode {
  id: string
  name: string
  type: "file" | "folder"
  children?: FileTreeNode[]
  isExpanded?: boolean
  isSelected?: boolean
  path?: string
  size?: number
  modified?: Date
}

interface FileTreeProps {
  nodes: FileTreeNode[]
  onNodeClick?: (node: FileTreeNode) => void
  onNodeExpand?: (node: FileTreeNode) => void
  selectedNodeId?: string
  className?: string
  showIcons?: boolean
  showSize?: boolean
  indentSize?: number
}

interface FileTreeNodeProps {
  node: FileTreeNode
  level: number
  onNodeClick?: (node: FileTreeNode) => void
  onNodeExpand?: (node: FileTreeNode) => void
  selectedNodeId?: string
  showIcons?: boolean
  showSize?: boolean
  indentSize?: number
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level,
  onNodeClick,
  onNodeExpand,
  selectedNodeId,
  showIcons = true,
  showSize = false,
  indentSize = 16
}) => {
  const isSelected = selectedNodeId === node.id
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = node.isExpanded || false

  const handleClick = () => {
    if (node.type === "folder" && onNodeExpand) {
      onNodeExpand(node)
    }
    if (onNodeClick) {
      onNodeClick(node)
    }
  }

  const getIcon = () => {
    if (!showIcons) return null

    if (node.type === "folder") {
      return isExpanded ? (
        <FolderOpen className="w-4 h-4 text-v0-gold" />
      ) : (
        <Folder className="w-4 h-4 text-v0-gold" />
      )
    }
    return <File className="w-4 h-4 text-v0-text-muted" />
  }

  const getChevron = () => {
    if (node.type !== "folder" || !hasChildren) return null

    return isExpanded ? (
      <ChevronDown className="w-3 h-3 text-v0-text-muted" />
    ) : (
      <ChevronRight className="w-3 h-3 text-v0-text-muted" />
    )
  }

  const formatSize = (bytes?: number) => {
    if (!bytes || !showSize) return null
    
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 cursor-pointer rounded-sm transition-colors",
          "hover:bg-v0-bg-secondary",
          isSelected && "bg-v0-bg-tertiary text-v0-text-primary",
          !isSelected && "text-v0-text-primary"
        )}
        style={{ paddingLeft: `${level * indentSize + 8}px` }}
        onClick={handleClick}
      >
        <div className="w-3 flex justify-center">
          {getChevron()}
        </div>
        
        {getIcon()}
        
        <span className="flex-1 text-sm font-light truncate">
          {node.name}
        </span>
        
        {showSize && node.size && (
          <span className="text-xs text-v0-text-muted ml-2">
            {formatSize(node.size)}
          </span>
        )}
      </div>

      {node.type === "folder" && isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
              onNodeExpand={onNodeExpand}
              selectedNodeId={selectedNodeId}
              showIcons={showIcons}
              showSize={showSize}
              indentSize={indentSize}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const FileTree = React.forwardRef<HTMLDivElement, FileTreeProps>(
  ({ 
    nodes, 
    onNodeClick, 
    onNodeExpand, 
    selectedNodeId, 
    className,
    showIcons = true,
    showSize = false,
    indentSize = 16,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-sm select-none",
          className
        )}
        {...props}
      >
        {nodes.map((node) => (
          <FileTreeNode
            key={node.id}
            node={node}
            level={0}
            onNodeClick={onNodeClick}
            onNodeExpand={onNodeExpand}
            selectedNodeId={selectedNodeId}
            showIcons={showIcons}
            showSize={showSize}
            indentSize={indentSize}
          />
        ))}
      </div>
    )
  }
)
FileTree.displayName = "FileTree"

export { FileTree, type FileTreeProps }
