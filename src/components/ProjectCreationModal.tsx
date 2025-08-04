import * as React from "react"
import { useState } from "react"

import { YarnLogo } from "@/components/v0-components/yarn-logo"
import { V0ModalHeader, V0ProjectForm, V0ProjectFormData } from "@/components/v0-components/composition-patterns";
import { 
  Dialog, 
  DialogContent 
} from "./ui/dialog"
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { addProject, setCurrentProject } = useAppStore()

  const handleSubmit = async (formData: V0ProjectFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the Tauri backend to create the project
      const result = await invoke('create_project', { name: formData.name.trim() })
      
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
      
      // Close modal
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
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <V0ModalHeader
          title="Create New Project"
          description="Create a new project for your documents and workflows. The project will be organized in your local file system."
          icon={<YarnLogo className="w-5 h-5" />}
        />
        
        <div className="py-4">
          {error && (
            <div className="mb-4 p-3 bg-v0-red/10 border border-v0-red/20 rounded-md">
              <p className="text-sm text-v0-red">{error}</p>
            </div>
          )}
          
          <V0ProjectForm
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectCreationModal
