// Application Services
// Service layer that coordinates domain logic and infrastructure

use crate::core::{Project, Document, LocalAiEngine, CompletionRequest, CompletionResponse};
use crate::infrastructure::{DatabaseManager, FilesystemManager, ProjectRepository};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{info, warn, error};
use anyhow::Result;
use uuid::Uuid;

/// Service for managing projects
pub struct ProjectService {
    db_manager: Arc<DatabaseManager>,
    fs_manager: Arc<FilesystemManager>,
}

impl ProjectService {
    pub fn new(db_manager: Arc<DatabaseManager>, fs_manager: Arc<FilesystemManager>) -> Self {
        Self {
            db_manager,
            fs_manager,
        }
    }
    
    /// Create a new project
    pub async fn create_project(&self, name: String) -> Result<Project, String> {
        info!("Creating new project: {}", name);
        
        // Validate project name
        if name.trim().is_empty() {
            return Err("Project name cannot be empty".to_string());
        }
        
        // Generate unique ID and timestamps
        let project_id = Uuid::new_v4().to_string();
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("Time error: {}", e))?
            .as_secs();
        
        // Create project path (sanitized)
        let sanitized_name = name.trim().to_lowercase().replace(" ", "-");
        let project_path = format!("./projects/{}", sanitized_name);
        
        // Create project struct
        let project = Project {
            id: project_id,
            name: name.trim().to_string(),
            path: project_path.clone(),
            created_at: now,
            updated_at: now,
        };
        
        // Create project directory on filesystem
        self.fs_manager.create_directory(&project_path)
            .map_err(|e| format!("Failed to create project directory: {}", e))?;
        
        // Save project to database
        let db_conn = self.db_manager.get_connection()
            .map_err(|e| format!("Database connection error: {}", e))?;
        let project_repo = ProjectRepository::new(&db_conn);
        
        project_repo.create(&project)
            .map_err(|e| format!("Failed to save project to database: {}", e))?;
        
        info!("Successfully created project: {} at {}", project.name, project.path);
        Ok(project)
    }
    
    /// Get project by ID
    pub async fn get_project(&self, id: &str) -> Result<Option<Project>, String> {
        info!("Retrieving project: {}", id);
        
        let db_conn = self.db_manager.get_connection()
            .map_err(|e| format!("Database connection error: {}", e))?;
        let project_repo = ProjectRepository::new(&db_conn);
        
        project_repo.find_by_id(id)
            .map_err(|e| format!("Failed to retrieve project: {}", e))
    }
    
    /// Get all projects
    pub async fn get_all_projects(&self) -> Result<Vec<Project>, String> {
        info!("Retrieving all projects");
        
        let db_conn = self.db_manager.get_connection()
            .map_err(|e| format!("Database connection error: {}", e))?;
        let project_repo = ProjectRepository::new(&db_conn);
        
        project_repo.find_all()
            .map_err(|e| format!("Failed to retrieve projects: {}", e))
    }
}

/// Service for managing documents
pub struct DocumentService {
    // Dependencies will be injected here
}

impl DocumentService {
    pub fn new() -> Self {
        Self {}
    }
    
    /// Create a new document
    pub async fn create_document(&self, project_id: String, path: String) -> Result<Document, String> {
        // Implementation will be added in later tasks
        todo!("Document creation logic to be implemented")
    }
}

/// Service for managing local AI operations
pub struct LocalAiService {
    engine: Arc<Mutex<LocalAiEngine>>,
}

impl LocalAiService {
    pub fn new() -> Self {
        info!("Initializing Local AI Service");
        Self {
            engine: Arc::new(Mutex::new(LocalAiEngine::new())),
        }
    }
    
    /// Get AI autocomplete suggestion for the given context
    pub async fn get_autocomplete(&self, context: String) -> Result<String, String> {
        info!("Requesting autocomplete for context length: {}", context.len());
        
        // Create completion request
        let request = CompletionRequest {
            prompt: context,
            max_tokens: Some(100), // Reasonable limit for autocomplete
            temperature: Some(0.7), // Balanced creativity vs consistency
        };
        
        // Get the engine and request completion
        let response = {
            let mut engine = self.engine.lock().map_err(|e| {
                error!("Failed to acquire engine lock: {}", e);
                "Failed to access AI engine".to_string()
            })?;
            
            engine.get_completion(request).await.map_err(|e| {
                error!("AI completion error: {}", e);
                format!("AI completion failed: {}", e)
            })?
        };
        
        if response.success {
            info!("Autocomplete successful, response length: {}", response.completion.len());
            Ok(response.completion)
        } else {
            warn!("Autocomplete failed: {:?}", response.error);
            Err(response.error.unwrap_or_else(|| "Unknown AI error".to_string()))
        }
    }
    
    /// Check if the AI service is ready
    pub async fn is_ready(&self) -> bool {
        let engine = match self.engine.lock() {
            Ok(engine) => engine,
            Err(_) => {
                error!("Failed to acquire engine lock for readiness check");
                return false;
            }
        };
        
        engine.is_ready()
    }
    
    /// Start the AI engine if not already running
    pub async fn start(&self) -> Result<(), String> {
        info!("Starting AI service");
        
        let mut engine = self.engine.lock().map_err(|e| {
            error!("Failed to acquire engine lock for start: {}", e);
            "Failed to access AI engine".to_string()
        })?;
        
        engine.start_sidecar().await.map_err(|e| {
            error!("Failed to start AI sidecar: {}", e);
            format!("Failed to start AI sidecar: {}", e)
        })
    }
}
