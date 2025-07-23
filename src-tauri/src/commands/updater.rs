use tauri::{command, AppHandle, Manager};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub date: String,
    pub body: String,
    pub signature: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateStatus {
    pub available: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub update_info: Option<UpdateInfo>,
}

/// Check for available updates
#[command]
pub async fn check_for_updates(app: AppHandle) -> Result<UpdateStatus, String> {
    let current_version = app.package_info().version.to_string();
    
    match app.updater().check().await {
        Ok(update) => {
            if update.is_update_available() {
                let update_info = UpdateInfo {
                    version: update.latest_version().to_string(),
                    date: update.date().unwrap_or_default().to_string(),
                    body: update.body().unwrap_or_default().to_string(),
                    signature: update.signature().to_string(),
                    url: update.download_url().to_string(),
                };
                
                Ok(UpdateStatus {
                    available: true,
                    current_version,
                    latest_version: Some(update.latest_version().to_string()),
                    update_info: Some(update_info),
                })
            } else {
                Ok(UpdateStatus {
                    available: false,
                    current_version,
                    latest_version: None,
                    update_info: None,
                })
            }
        }
        Err(e) => {
            eprintln!("Failed to check for updates: {}", e);
            Err(format!("Failed to check for updates: {}", e))
        }
    }
}

/// Download and install available update
#[command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    match app.updater().check().await {
        Ok(update) => {
            if update.is_update_available() {
                // Emit update progress events
                let _ = app.emit_all("update_progress", "Downloading update...");
                
                match update.download_and_install().await {
                    Ok(_) => {
                        let _ = app.emit_all("update_progress", "Update installed successfully. Restart required.");
                        Ok(())
                    }
                    Err(e) => {
                        eprintln!("Failed to install update: {}", e);
                        let _ = app.emit_all("update_error", format!("Failed to install update: {}", e));
                        Err(format!("Failed to install update: {}", e))
                    }
                }
            } else {
                Err("No update available".to_string())
            }
        }
        Err(e) => {
            eprintln!("Failed to check for updates: {}", e);
            Err(format!("Failed to check for updates: {}", e))
        }
    }
}

/// Get current application version
#[command]
pub fn get_app_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

/// Restart the application (typically called after update installation)
#[command]
pub async fn restart_app(app: AppHandle) -> Result<(), String> {
    app.restart();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::test::{mock_app, MockRuntime};

    #[tokio::test]
    async fn test_get_app_version() {
        let app = mock_app();
        let version = get_app_version(app.handle());
        assert!(!version.is_empty());
    }

    #[tokio::test]
    async fn test_check_for_updates_structure() {
        // Test that the UpdateStatus structure is properly serializable
        let status = UpdateStatus {
            available: false,
            current_version: "0.1.0".to_string(),
            latest_version: None,
            update_info: None,
        };
        
        let serialized = serde_json::to_string(&status).unwrap();
        let deserialized: UpdateStatus = serde_json::from_str(&serialized).unwrap();
        
        assert_eq!(status.available, deserialized.available);
        assert_eq!(status.current_version, deserialized.current_version);
    }
}
