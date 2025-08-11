import { FolderOpen, FileText, Workflow, Layout, Users, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface IconSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function IconSidebar({ activeView, onViewChange }: IconSidebarProps) {
  const sidebarItems = [
    { id: "project", icon: FolderOpen, label: "Project" },
    { id: "outline", icon: FileText, label: "Project Outline" },
    { id: "workflows", icon: Workflow, label: "Workflows" },
    { id: "templates", icon: Layout, label: "Templates" },
    { id: "collaborators", icon: Users, label: "Collaborators" },
    { id: "switch", icon: ArrowLeftRight, label: "Switch Project" },
  ]

  return (
    <div className="w-12 bg-v0-bg-tertiary border-r border-v0-border-primary flex flex-col items-center py-3 gap-2">
      {sidebarItems.map((item) => {
        const Icon = item.icon
        const isActive = activeView === item.id

        return (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            className={`w-8 h-8 p-0 rounded-md transition-colors ${
              isActive
                ? "bg-v0-gold text-black hover:bg-v0-gold-hover"
                : "text-v0-text-muted hover:bg-v0-border-primary hover:text-v0-text-primary"
            }`}
            onClick={() => onViewChange(item.id)}
            title={item.label}
          >
            <Icon className="w-4 h-4 stroke-1" />
          </Button>
        )
      })}
    </div>
  )
}
