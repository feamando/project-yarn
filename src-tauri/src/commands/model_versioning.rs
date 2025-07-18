use crate::models::versioning::{ModelUpdateManager, ModelUpdate, ModelVersion, InstalledModel, VersioningError};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelVersioningConfig {
    pub models_dir: String,
    pub app_version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCheckResult {
    pub updates: Vec<ModelUpdate>,
    pub last_check: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelUpdateRequest {
    pub model_id: String,
    pub target_version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelRollbackRequest {
    pub model_id: String,
    pub target_version: Option<String>,
}

#[tauri::command]
pub async fn check_model_updates(
    config: State<'_, ModelVersioningConfig>,
) -> Result<UpdateCheckResult, String> {
    let registry_path = format!("{}/registry.json", config.models_dir);
    let local_state_path = format!("{}/local-state.json", config.models_dir);
    
    let manager = ModelUpdateManager::new(
        registry_path,
        local_state_path,
        config.models_dir.clone(),
        config.app_version.clone(),
    );

    match manager.check_for_updates().await {
        Ok(updates) => {
            let local_state = manager.load_local_state().await.map_err(|e| e.to_string())?;
            Ok(UpdateCheckResult {
                updates,
                last_check: local_state.last_check.to_rfc3339(),
            })
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn update_model(
    request: ModelUpdateRequest,
    config: State<'_, ModelVersioningConfig>,
) -> Result<String, String> {
    let registry_path = format!("{}/registry.json", config.models_dir);
    let local_state_path = format!("{}/local-state.json", config.models_dir);
    
    let manager = ModelUpdateManager::new(
        registry_path,
        local_state_path,
        config.models_dir.clone(),
        config.app_version.clone(),
    );

    match manager.update_model(&request.model_id).await {
        Ok(_) => Ok(format!("Successfully updated model: {}", request.model_id)),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn rollback_model(
    request: ModelRollbackRequest,
    config: State<'_, ModelVersioningConfig>,
) -> Result<String, String> {
    let registry_path = format!("{}/registry.json", config.models_dir);
    let local_state_path = format!("{}/local-state.json", config.models_dir);
    
    let manager = ModelUpdateManager::new(
        registry_path,
        local_state_path,
        config.models_dir.clone(),
        config.app_version.clone(),
    );

    match manager.rollback_model(&request.model_id, request.target_version).await {
        Ok(_) => Ok(format!("Successfully rolled back model: {}", request.model_id)),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_model_version_history(
    model_id: String,
    config: State<'_, ModelVersioningConfig>,
) -> Result<Vec<ModelVersion>, String> {
    let registry_path = format!("{}/registry.json", config.models_dir);
    let local_state_path = format!("{}/local-state.json", config.models_dir);
    
    let manager = ModelUpdateManager::new(
        registry_path,
        local_state_path,
        config.models_dir.clone(),
        config.app_version.clone(),
    );

    match manager.get_version_history(&model_id).await {
        Ok(history) => Ok(history),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn list_installed_models(
    config: State<'_, ModelVersioningConfig>,
) -> Result<Vec<InstalledModel>, String> {
    let registry_path = format!("{}/registry.json", config.models_dir);
    let local_state_path = format!("{}/local-state.json", config.models_dir);
    
    let manager = ModelUpdateManager::new(
        registry_path,
        local_state_path,
        config.models_dir.clone(),
        config.app_version.clone(),
    );

    match manager.load_local_state().await {
        Ok(local_state) => {
            let installed_models: Vec<InstalledModel> = local_state.installed_models.into_values().collect();
            Ok(installed_models)
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_model_registry(
    config: State<'_, ModelVersioningConfig>,
) -> Result<serde_json::Value, String> {
    let registry_path = format!("{}/registry.json", config.models_dir);
    let local_state_path = format!("{}/local-state.json", config.models_dir);
    
    let manager = ModelUpdateManager::new(
        registry_path,
        local_state_path,
        config.models_dir.clone(),
        config.app_version.clone(),
    );

    match manager.load_registry().await {
        Ok(registry) => {
            match serde_json::to_value(registry) {
                Ok(value) => Ok(value),
                Err(e) => Err(e.to_string()),
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn enable_auto_updates(
    enabled: bool,
    config: State<'_, ModelVersioningConfig>,
) -> Result<String, String> {
    let registry_path = format!("{}/registry.json", config.models_dir);
    let local_state_path = format!("{}/local-state.json", config.models_dir);
    
    let manager = ModelUpdateManager::new(
        registry_path,
        local_state_path,
        config.models_dir.clone(),
        config.app_version.clone(),
    );

    match manager.load_local_state().await {
        Ok(mut local_state) => {
            local_state.auto_update_enabled = enabled;
            match manager.save_local_state(&local_state).await {
                Ok(_) => Ok(format!("Auto-updates {}", if enabled { "enabled" } else { "disabled" })),
                Err(e) => Err(e.to_string()),
            }
        }
        Err(e) => Err(e.to_string()),
    }
}
