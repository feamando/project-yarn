// Tauri Command Handlers
// These are the entry points from the frontend to the backend services

use tauri::State;
use crate::application::services::{ProjectService, DocumentService, LocalAiService};
use tracing::{info, warn, error};

/// Create a new project
/// This is the direct backend implementation for User Story 2.2.1
#[tauri::command]
pub async fn create_project(
    name: String,
    project_service: State<'_, ProjectService>,
) -> Result<String, String> {
    info!("Received project creation request: {}", name);
    
    match project_service.create_project(name).await {
        Ok(project) => {
            info!("Project created successfully: {}", project.name);
            // Return project as JSON for frontend integration
            serde_json::to_string(&project)
                .map_err(|e| format!("Failed to serialize project: {}", e))
        },
        Err(e) => {
            error!("Project creation failed: {}", e);
            Err(e)
        }
    }
}

/// Get project information
#[tauri::command]
pub async fn get_project(
    id: String,
    project_service: State<'_, ProjectService>,
) -> Result<String, String> {
    // This will be implemented in later tasks
    Ok(format!("Project with id '{}' requested", id))
}

/// Get AI autocomplete suggestion for the given context
/// This is the direct backend implementation for User Story 5.2.1
#[tauri::command]
pub async fn get_autocomplete(
    context: String,
    ai_service: State<'_, LocalAiService>,
) -> Result<String, String> {
    info!("Received autocomplete request for context of length: {}", context.len());
    
    // Validate input
    if context.trim().is_empty() {
        warn!("Empty context provided for autocomplete");
        return Err("Context cannot be empty".to_string());
    }
    
    // Limit context size to prevent excessive processing
    let limited_context = if context.len() > 1000 {
        warn!("Context too long ({}), truncating to 1000 chars", context.len());
        context.chars().take(1000).collect::<String>()
    } else {
        context
    };
    
    // Request autocomplete from AI service
    match ai_service.get_autocomplete(limited_context).await {
        Ok(completion) => {
            info!("Autocomplete successful, completion length: {}", completion.len());
            Ok(completion)
        },
        Err(e) => {
            error!("Autocomplete failed: {}", e);
            Err(e)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::models::Project;
    use crate::application::services::ProjectService;
    use crate::infrastructure::{DatabaseManager, FilesystemManager};
    use std::sync::Arc;
    use std::path::PathBuf;
    use tempfile::TempDir;
    use tauri::test::{mock_builder, noop_assets};
    use tauri::{Manager, State};

    /// Helper function to create a test project service with temporary database and filesystem
    async fn create_test_project_service() -> (ProjectService, TempDir) {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let db_path = temp_dir.path().join("test.db");
        
        // Create test database manager
        let db_manager = Arc::new(
            DatabaseManager::new(db_path.to_str().unwrap())
                .await
                .expect("Failed to create test database")
        );
        
        // Create test filesystem manager with temp directory
        let fs_manager = Arc::new(
            FilesystemManager::new(temp_dir.path().to_path_buf())
        );
        
        let project_service = ProjectService::new(db_manager, fs_manager);
        
        (project_service, temp_dir)
    }

    #[tokio::test]
    async fn test_create_project_command_success() {
        // Create test project service
        let (project_service, _temp_dir) = create_test_project_service().await;
        
        // Create mock Tauri application
        let app = mock_builder()
            .manage(project_service)
            .build(tauri::generate_context!())
            .expect("Failed to build mock app");
        
        // Get the project service from app state
        let project_service_state: State<ProjectService> = app.state();
        
        // Test the create_project command
        let result = create_project(
            "Test Project".to_string(),
            project_service_state
        ).await;
        
        // Assert successful result
        assert!(result.is_ok(), "Project creation should succeed");
        
        let project_json = result.unwrap();
        let project: Project = serde_json::from_str(&project_json)
            .expect("Should be able to deserialize project JSON");
        
        // Verify project details
        assert_eq!(project.name, "Test Project");
        assert!(project.id.len() > 0, "Project should have a valid ID");
        assert!(project.path.contains("test-project"), "Project path should be sanitized");
        assert!(project.created_at > 0, "Project should have creation timestamp");
        assert!(project.updated_at > 0, "Project should have update timestamp");
    }

    #[tokio::test]
    async fn test_create_project_command_validation() {
        // Create test project service
        let (project_service, _temp_dir) = create_test_project_service().await;
        
        // Create mock Tauri application
        let app = mock_builder()
            .manage(project_service)
            .build(tauri::generate_context!())
            .expect("Failed to build mock app");
        
        let project_service_state: State<ProjectService> = app.state();
        
        // Test with empty project name
        let result = create_project(
            "".to_string(),
            project_service_state.clone()
        ).await;
        
        // Should fail validation
        assert!(result.is_err(), "Empty project name should fail validation");
        assert!(result.unwrap_err().contains("Project name cannot be empty"),
                "Error message should indicate empty name validation");
        
        // Test with whitespace-only project name
        let result = create_project(
            "   ".to_string(),
            project_service_state.clone()
        ).await;
        
        // Should fail validation
        assert!(result.is_err(), "Whitespace-only project name should fail validation");
    }

    #[tokio::test]
    async fn test_create_project_command_duplicate_names() {
        // Create test project service
        let (project_service, _temp_dir) = create_test_project_service().await;
        
        // Create mock Tauri application
        let app = mock_builder()
            .manage(project_service)
            .build(tauri::generate_context!())
            .expect("Failed to build mock app");
        
        let project_service_state: State<ProjectService> = app.state();
        
        // Create first project
        let result1 = create_project(
            "Duplicate Test".to_string(),
            project_service_state.clone()
        ).await;
        
        assert!(result1.is_ok(), "First project creation should succeed");
        
        // Try to create second project with same name
        let result2 = create_project(
            "Duplicate Test".to_string(),
            project_service_state.clone()
        ).await;
        
        // Second project should still succeed (UUID ensures uniqueness)
        // but should have different ID
        assert!(result2.is_ok(), "Second project creation should succeed with same name");
        
        let project1: Project = serde_json::from_str(&result1.unwrap()).unwrap();
        let project2: Project = serde_json::from_str(&result2.unwrap()).unwrap();
        
        // Projects should have different IDs even with same name
        assert_ne!(project1.id, project2.id, "Projects with same name should have different IDs");
        assert_eq!(project1.name, project2.name, "Both projects should have same name");
    }

    #[tokio::test]
    async fn test_create_project_command_name_sanitization() {
        // Create test project service
        let (project_service, _temp_dir) = create_test_project_service().await;
        
        // Create mock Tauri application
        let app = mock_builder()
            .manage(project_service)
            .build(tauri::generate_context!())
            .expect("Failed to build mock app");
        
        let project_service_state: State<ProjectService> = app.state();
        
        // Test project name with special characters and spaces
        let result = create_project(
            "  My Special@Project#123  ".to_string(),
            project_service_state
        ).await;
        
        assert!(result.is_ok(), "Project creation with special characters should succeed");
        
        let project: Project = serde_json::from_str(&result.unwrap()).unwrap();
        
        // Name should be trimmed but preserved
        assert_eq!(project.name, "My Special@Project#123");
        
        // Path should be sanitized for filesystem
        assert!(project.path.contains("my-special-project-123") || 
                project.path.contains("my_special_project_123"),
                "Project path should be sanitized: {}", project.path);
    }
}
