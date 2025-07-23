// Hybrid RAG Tauri Commands for Task 2.3.6
// Implements the @ context command for the frontend

use crate::application::hybrid_rag_service::{HybridRagService, HybridRagConfig, ContextAssembly};
use crate::infrastructure::db_layer::DatabaseConnection;
use serde::{Deserialize, Serialize};
use tauri::State;
use tracing::{info, error};

/// Request structure for context retrieval
#[derive(Debug, Deserialize)]
pub struct ContextRequest {
    pub query: String,
    pub config: Option<HybridRagConfig>,
}

/// Response structure for context retrieval
#[derive(Debug, Serialize)]
pub struct ContextResponse {
    pub success: bool,
    pub context: Option<ContextAssembly>,
    pub error: Option<String>,
}

/// Tauri command to retrieve context using hybrid RAG
/// This implements the backend logic for the @ context command
#[tauri::command]
pub async fn retrieve_context(
    request: ContextRequest,
    db_state: State<'_, DatabaseConnection>,
) -> Result<ContextResponse, String> {
    info!("Received context retrieval request for query: '{}'", request.query);

    if request.query.trim().is_empty() {
        return Ok(ContextResponse {
            success: false,
            context: None,
            error: Some("Query cannot be empty".to_string()),
        });
    }

    // Create hybrid RAG service
    let service = if let Some(config) = request.config {
        HybridRagService::with_config(&db_state, config)
    } else {
        HybridRagService::new(&db_state)
    };

    // Perform hybrid RAG retrieval
    match service.retrieve_context(&request.query) {
        Ok(context_assembly) => {
            info!("Context retrieval successful. Context length: {} characters", 
                  context_assembly.total_length);
            
            Ok(ContextResponse {
                success: true,
                context: Some(context_assembly),
                error: None,
            })
        }
        Err(e) => {
            error!("Context retrieval failed: {}", e);
            Ok(ContextResponse {
                success: false,
                context: None,
                error: Some(e),
            })
        }
    }
}

/// Tauri command to test hybrid RAG functionality
#[tauri::command]
pub async fn test_hybrid_rag(
    db_state: State<'_, DatabaseConnection>,
) -> Result<bool, String> {
    info!("Testing hybrid RAG functionality");

    let service = HybridRagService::new(&db_state);
    
    match service.test_retrieval() {
        Ok(is_working) => {
            if is_working {
                info!("Hybrid RAG test passed");
            } else {
                info!("Hybrid RAG test failed - system not ready");
            }
            Ok(is_working)
        }
        Err(e) => {
            error!("Hybrid RAG test error: {}", e);
            Err(e)
        }
    }
}

/// Tauri command to get hybrid RAG configuration
#[tauri::command]
pub async fn get_hybrid_rag_config() -> Result<HybridRagConfig, String> {
    Ok(HybridRagConfig::default())
}

/// Tauri command to validate hybrid RAG configuration
#[tauri::command]
pub async fn validate_hybrid_rag_config(
    config: HybridRagConfig,
) -> Result<bool, String> {
    // Validate configuration parameters
    if config.max_candidates <= 0 || config.max_candidates > 1000 {
        return Err("max_candidates must be between 1 and 1000".to_string());
    }
    
    if config.max_results <= 0 || config.max_results > config.max_candidates {
        return Err("max_results must be between 1 and max_candidates".to_string());
    }
    
    if config.similarity_threshold < 0.0 || config.similarity_threshold > 1.0 {
        return Err("similarity_threshold must be between 0.0 and 1.0".to_string());
    }
    
    if config.lexical_weight < 0.0 || config.lexical_weight > 1.0 {
        return Err("lexical_weight must be between 0.0 and 1.0".to_string());
    }
    
    if config.vector_weight < 0.0 || config.vector_weight > 1.0 {
        return Err("vector_weight must be between 0.0 and 1.0".to_string());
    }
    
    if (config.lexical_weight + config.vector_weight - 1.0).abs() > 0.001 {
        return Err("lexical_weight + vector_weight must equal 1.0".to_string());
    }
    
    if config.max_context_length == 0 || config.max_context_length > 50000 {
        return Err("max_context_length must be between 1 and 50000".to_string());
    }
    
    Ok(true)
}

/// Tauri command to get hybrid RAG statistics
#[tauri::command]
pub async fn get_hybrid_rag_stats(
    db_state: State<'_, DatabaseConnection>,
) -> Result<HybridRagStats, String> {
    info!("Getting hybrid RAG statistics");

    let service = HybridRagService::new(&db_state);
    
    // Get FTS5 statistics
    let fts5_available = service.test_retrieval().unwrap_or(false);
    
    // Get document counts (simplified for now)
    let stats = HybridRagStats {
        fts5_available,
        total_documents: 0, // Would query document count
        indexed_documents: 0, // Would query FTS5 count
        vector_embeddings: 0, // Would query vector index count
        last_updated: chrono::Utc::now().timestamp() as u64,
    };
    
    Ok(stats)
}

/// Statistics for hybrid RAG system
#[derive(Debug, Serialize)]
pub struct HybridRagStats {
    pub fts5_available: bool,
    pub total_documents: i64,
    pub indexed_documents: i64,
    pub vector_embeddings: i64,
    pub last_updated: u64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::db_layer::{DatabaseConnection, MigrationManager};
    use tempfile::NamedTempFile;

    fn create_test_db() -> DatabaseConnection {
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        let db_path = temp_file.path().to_str().expect("Invalid path");
        let db = DatabaseConnection::new(db_path).expect("Failed to create database connection");
        
        let migration_manager = MigrationManager::new(&db);
        migration_manager.migrate().expect("Failed to run migrations");
        
        // Keep temp file alive
        std::mem::forget(temp_file);
        
        db
    }

    #[tokio::test]
    async fn test_retrieve_context_command() {
        let db = create_test_db();
        let db_state = tauri::State::from(&db);
        
        let request = ContextRequest {
            query: "test query".to_string(),
            config: None,
        };
        
        let response = retrieve_context(request, db_state).await.expect("Command failed");
        
        // Should succeed even with no documents
        assert!(response.success);
        assert!(response.context.is_some());
    }

    #[tokio::test]
    async fn test_empty_query() {
        let db = create_test_db();
        let db_state = tauri::State::from(&db);
        
        let request = ContextRequest {
            query: "".to_string(),
            config: None,
        };
        
        let response = retrieve_context(request, db_state).await.expect("Command failed");
        
        assert!(!response.success);
        assert!(response.error.is_some());
    }

    #[tokio::test]
    async fn test_config_validation() {
        let valid_config = HybridRagConfig {
            max_candidates: 20,
            max_results: 10,
            similarity_threshold: 0.5,
            lexical_weight: 0.4,
            vector_weight: 0.6,
            max_context_length: 4000,
        };
        
        let result = validate_hybrid_rag_config(valid_config).await;
        assert!(result.is_ok());
        assert!(result.unwrap());
        
        // Test invalid config
        let invalid_config = HybridRagConfig {
            max_candidates: -1,
            max_results: 10,
            similarity_threshold: 0.5,
            lexical_weight: 0.4,
            vector_weight: 0.6,
            max_context_length: 4000,
        };
        
        let result = validate_hybrid_rag_config(invalid_config).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_hybrid_rag_test_command() {
        let db = create_test_db();
        let db_state = tauri::State::from(&db);
        
        let result = test_hybrid_rag(db_state).await;
        assert!(result.is_ok());
    }
}
