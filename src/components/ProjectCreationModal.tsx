import * as React from "react"
import { useState } from "react"
import { Folder, Plus, Loader2 } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useAppStore } from "../stores/useAppStore"
import { invoke } from '@tauri-apps/api/tauri'

interface ProjectCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({
  open, 
  onOpenChange
}) => {
  const [projectName, setProjectName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { addProject, setCurrentProject } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!projectName.trim()) {
      setError("Project name is required")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Call the Tauri backend to create the project
      const result = await invoke('create_project', { name: projectName.trim() })
      
      // Parse the returned project JSON
      const projectData = JSON.parse(result as string)
      
      // Add the created project to our Zustand store
      addProject({
        id: projectData.id,
        name: projectData.name,
        path: projectData.path
      })
      
      // Set as current project
      setCurrentProject(projectData.id)
      
      // Reset form and close modal
      setProjectName("")
      onOpenChange(false)
      
    } catch (error: any) {
      console.error("Failed to create project:", error)
      setError(error?.message || "Failed to create project. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setProjectName("")
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Create a new project for your documents and workflows. 
            The project will be organized in your local file system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="project-name"
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isLoading}
              className="w-full"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </form>

        <DialogFooter className="pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || !projectName.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectCreationModal
