// Use Cases
// Application-specific business logic that coordinates domain objects and services

use crate::core::{Project, Document, EntityId, ProjectPath};

/// Use case for creating a new project
pub struct CreateProjectUseCase {
    // Repository dependencies will be injected here in later tasks
}

impl CreateProjectUseCase {
    pub fn new() -> Self {
        Self {}
    }
    
    pub async fn execute(&self, name: String, path: String) -> Result<Project, String> {
        // Validate inputs
        if name.trim().is_empty() {
            return Err("Project name cannot be empty".to_string());
        }
        
        if path.trim().is_empty() {
            return Err("Project path cannot be empty".to_string());
        }
        
        // This will be implemented when we add the database layer
        todo!("Create project use case to be implemented with database integration")
    }
}

/// Use case for managing document lifecycle
pub struct DocumentLifecycleUseCase {
    // Repository dependencies will be injected here
}

impl DocumentLifecycleUseCase {
    pub fn new() -> Self {
        Self {}
    }
    
    pub async fn create_document(&self, project_id: String, document_path: String) -> Result<Document, String> {
        // This will be implemented when we add the database layer
        todo!("Document creation use case to be implemented")
    }
}
