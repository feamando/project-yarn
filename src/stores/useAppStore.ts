import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Types for our global state
export interface Project {
  id: string
  name: string
  path: string
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  projectId: string
  path: string
  name: string
  content: string
  state: 'draft' | 'memo' | 'prfaq' | 'prd' | 'epic_breakdown' | 'archived'
  createdAt: Date
  updatedAt: Date
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'sm' | 'md' | 'lg'
  aiEnabled: boolean
  autoSave: boolean
  wordWrap: boolean
}

// Main application state interface
interface AppState {
  // Current active items
  currentProjectId: string | null
  currentDocumentId: string | null
  
  // Collections
  projects: Project[]
  documents: Document[]
  
  // UI State
  leftPanelWidth: number
  rightPanelWidth: number
  isLeftPanelVisible: boolean
  isRightPanelVisible: boolean
  
  // Application settings
  settings: AppSettings
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Actions
  setCurrentProject: (projectId: string | null) => void
  setCurrentDocument: (documentId: string | null) => void
  addProject: (project: Omit<Project, 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void
  addDocument: (document: Omit<Document, 'createdAt' | 'updatedAt'>) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  removeDocument: (id: string) => void
  setPanelWidth: (panel: 'left' | 'right', width: number) => void
  togglePanel: (panel: 'left' | 'right') => void
  updateSettings: (updates: Partial<AppSettings>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// Default settings
const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 'md',
  aiEnabled: true,
  autoSave: true,
  wordWrap: true,
}

// Create the Zustand store
export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Initial state
      currentProjectId: null,
      currentDocumentId: null,
      projects: [],
      documents: [],
      leftPanelWidth: 20,
      rightPanelWidth: 20,
      isLeftPanelVisible: true,
      isRightPanelVisible: true,
      settings: defaultSettings,
      isLoading: false,
      error: null,

      // Actions
      setCurrentProject: (projectId) => 
        set({ currentProjectId: projectId }, false, 'setCurrentProject'),

      setCurrentDocument: (documentId) => 
        set({ currentDocumentId: documentId }, false, 'setCurrentDocument'),

      addProject: (projectData) => 
        set((state) => ({
          projects: [...state.projects, {
            ...projectData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]
        }), false, 'addProject'),

      updateProject: (id, updates) => 
        set((state) => ({
          projects: state.projects.map(project =>
            project.id === id 
              ? { ...project, ...updates, updatedAt: new Date() }
              : project
          )
        }), false, 'updateProject'),

      removeProject: (id) => 
        set((state) => ({
          projects: state.projects.filter(project => project.id !== id),
          // Clear current project if it's being removed
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
          // Remove associated documents
          documents: state.documents.filter(doc => doc.projectId !== id),
        }), false, 'removeProject'),

      addDocument: (documentData) => 
        set((state) => ({
          documents: [...state.documents, {
            ...documentData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]
        }), false, 'addDocument'),

      updateDocument: (id, updates) => 
        set((state) => ({
          documents: state.documents.map(document =>
            document.id === id 
              ? { ...document, ...updates, updatedAt: new Date() }
              : document
          )
        }), false, 'updateDocument'),

      removeDocument: (id) => 
        set((state) => ({
          documents: state.documents.filter(document => document.id !== id),
          // Clear current document if it's being removed
          currentDocumentId: state.currentDocumentId === id ? null : state.currentDocumentId,
        }), false, 'removeDocument'),

      setPanelWidth: (panel, width) => 
        set({
          [panel === 'left' ? 'leftPanelWidth' : 'rightPanelWidth']: width
        }, false, 'setPanelWidth'),

      togglePanel: (panel) => 
        set((state) => ({
          [panel === 'left' ? 'isLeftPanelVisible' : 'isRightPanelVisible']: 
            !state[panel === 'left' ? 'isLeftPanelVisible' : 'isRightPanelVisible']
        }), false, 'togglePanel'),

      updateSettings: (updates) => 
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }), false, 'updateSettings'),

      setLoading: (loading) => 
        set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) => 
        set({ error }, false, 'setError'),

      clearError: () => 
        set({ error: null }, false, 'clearError'),
    }),
    {
      name: 'project-yarn-store', // Name for Redux DevTools
    }
  )
)

// Convenience selectors
export const useCurrentProject = () => {
  const { currentProjectId, projects } = useAppStore()
  return projects.find(p => p.id === currentProjectId) || null
}

export const useCurrentDocument = () => {
  const { currentDocumentId, documents } = useAppStore()
  return documents.find(d => d.id === currentDocumentId) || null
}

export const useProjectDocuments = (projectId: string | null) => {
  const documents = useAppStore(state => state.documents)
  return projectId ? documents.filter(d => d.projectId === projectId) : []
}
