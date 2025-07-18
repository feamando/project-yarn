use crate::infrastructure::model_manager::{ModelAssetManager, ModelError, ModelInfo};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;
use tracing::{error, info};

/// Shared state for the ModelAssetManager
pub type ModelManagerState = Arc<Mutex<ModelAssetManager>>;

/// Response structure for model operations
#[derive(Debug, Serialize, Deserialize)]
pub struct ModelResponse {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

/// Model download progress information for frontend
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelDownloadProgress {
    pub model_id: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub percentage: f64,
    pub status: String,
}

impl ModelResponse {
    pub fn success(message: &str, data: Option<serde_json::Value>) -> Self {
        Self {
            success: true,
            message: message.to_string(),
            data,
        }
    }

    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            message: message.to_string(),
            data: None,
        }
    }
}

/// Initialize the ModelAssetManager and add it to Tauri's managed state
pub fn initialize_model_manager(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    
    let models_cache_dir = app_data_dir.join("models");
    
    let model_manager = ModelAssetManager::new(models_cache_dir)?;
    let model_manager_state = Arc::new(Mutex::new(model_manager));
    
    app_handle.manage(model_manager_state);
    
    info!("ModelAssetManager initialized successfully");
    Ok(())
}

/// Download a model by ID
#[tauri::command]
pub async fn download_model(
    model_id: String,
    app_handle: AppHandle,
    model_manager: State<'_, ModelManagerState>,
) -> Result<ModelResponse, String> {
    info!("Starting download for model: {}", model_id);
    
    let manager = model_manager.lock().await;
    
    // Emit progress events during download
    let model_id_clone = model_id.clone();
    let app_handle_clone = app_handle.clone();
    
    // Start download in background and emit progress
    tokio::spawn(async move {
        let progress = ModelDownloadProgress {
            model_id: model_id_clone.clone(),
            downloaded_bytes: 0,
            total_bytes: 0,
            percentage: 0.0,
            status: "Starting download...".to_string(),
        };
        
        let _ = app_handle_clone.emit_all("model-download-progress", &progress);
    });
    
    match manager.download_model(&model_id).await {
        Ok(path) => {
            info!("Successfully downloaded model {} to {:?}", model_id, path);
            
            // Emit completion event
            let progress = ModelDownloadProgress {
                model_id: model_id.clone(),
                downloaded_bytes: 0,
                total_bytes: 0,
                percentage: 100.0,
                status: "Download completed".to_string(),
            };
            let _ = app_handle.emit_all("model-download-progress", &progress);
            
            Ok(ModelResponse::success(
                &format!("Model {} downloaded successfully", model_id),
                Some(serde_json::json!({ "path": path.to_string_lossy() })),
            ))
        }
        Err(e) => {
            error!("Failed to download model {}: {}", model_id, e);
            
            // Emit error event
            let progress = ModelDownloadProgress {
                model_id: model_id.clone(),
                downloaded_bytes: 0,
                total_bytes: 0,
                percentage: 0.0,
                status: format!("Download failed: {}", e),
            };
            let _ = app_handle.emit_all("model-download-progress", &progress);
            
            Ok(ModelResponse::error(&format!("Failed to download model {}: {}", model_id, e)))
        }
    }
}

/// Check if a model is ready (downloaded and verified)
#[tauri::command]
pub async fn is_model_ready(
    model_id: String,
    model_manager: State<'_, ModelManagerState>,
) -> Result<ModelResponse, String> {
    let manager = model_manager.lock().await;
    
    match manager.is_model_ready(&model_id).await {
        Ok(is_ready) => Ok(ModelResponse::success(
            &format!("Model {} ready status: {}", model_id, is_ready),
            Some(serde_json::json!({ "ready": is_ready })),
        )),
        Err(e) => {
            error!("Failed to check model readiness for {}: {}", model_id, e);
            Ok(ModelResponse::error(&format!("Failed to check model {}: {}", model_id, e)))
        }
    }
}

/// Get information about a specific model
#[tauri::command]
pub async fn get_model_info(
    model_id: String,
    model_manager: State<'_, ModelManagerState>,
) -> Result<ModelResponse, String> {
    let manager = model_manager.lock().await;
    
    match manager.get_model_info(&model_id) {
        Ok(model_info) => Ok(ModelResponse::success(
            &format!("Retrieved info for model {}", model_id),
            Some(serde_json::to_value(model_info).unwrap()),
        )),
        Err(e) => {
            error!("Failed to get model info for {}: {}", model_id, e);
            Ok(ModelResponse::error(&format!("Model {} not found: {}", model_id, e)))
        }
    }
}

/// List all available models
#[tauri::command]
pub async fn list_available_models(
    model_manager: State<'_, ModelManagerState>,
) -> Result<ModelResponse, String> {
    let manager = model_manager.lock().await;
    
    match manager.list_available_models() {
        Ok(models) => Ok(ModelResponse::success(
            &format!("Found {} available models", models.len()),
            Some(serde_json::to_value(models).unwrap()),
        )),
        Err(e) => {
            error!("Failed to list available models: {}", e);
            Ok(ModelResponse::error(&format!("Failed to list models: {}", e)))
        }
    }
}

/// Verify a model's integrity
#[tauri::command]
pub async fn verify_model(
    model_id: String,
    model_manager: State<'_, ModelManagerState>,
) -> Result<ModelResponse, String> {
    let manager = model_manager.lock().await;
    
    match manager.get_model_path(&model_id) {
        Ok(path) => {
            match manager.verify_model(&path).await {
                Ok(is_valid) => Ok(ModelResponse::success(
                    &format!("Model {} verification: {}", model_id, if is_valid { "passed" } else { "failed" }),
                    Some(serde_json::json!({ "valid": is_valid })),
                )),
                Err(e) => {
                    error!("Failed to verify model {}: {}", model_id, e);
                    Ok(ModelResponse::error(&format!("Verification failed for {}: {}", model_id, e)))
                }
            }
        }
        Err(e) => {
            error!("Model {} not found for verification: {}", model_id, e);
            Ok(ModelResponse::error(&format!("Model {} not found: {}", model_id, e)))
        }
    }
}

/// Remove a downloaded model
#[tauri::command]
pub async fn remove_model(
    model_id: String,
    model_manager: State<'_, ModelManagerState>,
) -> Result<ModelResponse, String> {
    let manager = model_manager.lock().await;
    
    match manager.remove_model(&model_id) {
        Ok(_) => Ok(ModelResponse::success(
            &format!("Model {} removed successfully", model_id),
            None,
        )),
        Err(e) => {
            error!("Failed to remove model {}: {}", model_id, e);
            Ok(ModelResponse::error(&format!("Failed to remove model {}: {}", model_id, e)))
        }
    }
}

/// Get cache size information
#[tauri::command]
pub async fn get_cache_info(
    model_manager: State<'_, ModelManagerState>,
) -> Result<ModelResponse, String> {
    let manager = model_manager.lock().await;
    
    match manager.get_cache_size() {
        Ok(size) => {
            let size_mb = size as f64 / (1024.0 * 1024.0);
            Ok(ModelResponse::success(
                &format!("Cache size: {:.2} MB", size_mb),
                Some(serde_json::json!({ 
                    "size_bytes": size,
                    "size_mb": size_mb 
                })),
            ))
        }
        Err(e) => {
            error!("Failed to get cache size: {}", e);
            Ok(ModelResponse::error(&format!("Failed to get cache info: {}", e)))
        }
    }
}

/// Clear all cached models
#[tauri::command]
pub async fn clear_model_cache(
    model_manager: State<'_, ModelManagerState>,
) -> Result<ModelResponse, String> {
    let manager = model_manager.lock().await;
    
    match manager.clear_cache() {
        Ok(_) => Ok(ModelResponse::success(
            "Model cache cleared successfully",
            None,
        )),
        Err(e) => {
            error!("Failed to clear cache: {}", e);
            Ok(ModelResponse::error(&format!("Failed to clear cache: {}", e)))
        }
    }
}

/// Get the path to a model file
#[tauri::command]
pub async fn get_model_path(
    model_id: String,
    model_manager: State<'_, ModelManagerState>,
) -> Result<ModelResponse, String> {
    let manager = model_manager.lock().await;
    
    match manager.get_model_path(&model_id) {
        Ok(path) => Ok(ModelResponse::success(
            &format!("Model {} path retrieved", model_id),
            Some(serde_json::json!({ "path": path.to_string_lossy() })),
        )),
        Err(e) => {
            error!("Failed to get path for model {}: {}", model_id, e);
            Ok(ModelResponse::error(&format!("Model {} not available: {}", model_id, e)))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_response_creation() {
        let success_response = ModelResponse::success("Test message", None);
        assert!(success_response.success);
        assert_eq!(success_response.message, "Test message");

        let error_response = ModelResponse::error("Error message");
        assert!(!error_response.success);
        assert_eq!(error_response.message, "Error message");
    }

    #[test]
    fn test_model_download_progress() {
        let progress = ModelDownloadProgress {
            model_id: "test-model".to_string(),
            downloaded_bytes: 1024,
            total_bytes: 2048,
            percentage: 50.0,
            status: "Downloading...".to_string(),
        };

        assert_eq!(progress.model_id, "test-model");
        assert_eq!(progress.percentage, 50.0);
    }
}
