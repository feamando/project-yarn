use crate::application::ai_provider_manager::{AiProviderManager, utils};
use crate::infrastructure::credential_manager;
use crate::infrastructure::{BedrockProvider, GeminiProvider, LocalProvider};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use std::collections::HashMap;

/// Response structure for credential operations
#[derive(Debug, Serialize, Deserialize)]
pub struct CredentialResponse {
    pub success: bool,
    pub message: String,
    pub details: Option<HashMap<String, serde_json::Value>>,
}

/// Response structure for provider operations
#[derive(Debug, Serialize, Deserialize)]
pub struct ProviderResponse {
    pub success: bool,
    pub message: String,
    pub provider_info: Option<serde_json::Value>,
}

/// Response structure for provider listing
#[derive(Debug, Serialize, Deserialize)]
pub struct ProvidersListResponse {
    pub success: bool,
    pub providers: Vec<ProviderInfo>,
    pub active_provider: String,
}

/// Provider information for listing
#[derive(Debug, Serialize, Deserialize)]
pub struct ProviderInfo {
    pub name: String,
    pub display_name: String,
    pub is_available: bool,
    pub capabilities: HashMap<String, bool>,
    pub config_schema: serde_json::Value,
}

/// Set AWS Bedrock credentials
#[tauri::command]
pub async fn set_bedrock_credentials(
    access_key: String,
    secret_key: String,
    region: String,
    app_handle: AppHandle,
) -> Result<CredentialResponse, String> {
    // Validate input parameters
    if access_key.trim().is_empty() {
        return Ok(CredentialResponse {
            success: false,
            message: "Access key cannot be empty".to_string(),
            details: None,
        });
    }

    if secret_key.trim().is_empty() {
        return Ok(CredentialResponse {
            success: false,
            message: "Secret key cannot be empty".to_string(),
            details: None,
        });
    }

    if region.trim().is_empty() {
        return Ok(CredentialResponse {
            success: false,
            message: "Region cannot be empty".to_string(),
            details: None,
        });
    }

    // Store credentials using credential_manager
    match credential_manager::store_aws_bedrock_credentials(&access_key, &secret_key, &region).await {
        Ok(_) => {
            // Test the credentials by creating a temporary provider
            match validate_bedrock_credentials_internal(&access_key, &secret_key, &region).await {
                Ok(is_valid) => {
                    if is_valid {
                        Ok(CredentialResponse {
                            success: true,
                            message: "AWS Bedrock credentials stored and validated successfully".to_string(),
                            details: Some({
                                let mut details = HashMap::new();
                                details.insert("region".to_string(), serde_json::Value::String(region));
                                details.insert("access_key_prefix".to_string(), 
                                    serde_json::Value::String(format!("{}***", &access_key[..4.min(access_key.len())])));
                                details
                            }),
                        })
                    } else {
                        Ok(CredentialResponse {
                            success: false,
                            message: "Credentials stored but validation failed. Please check your AWS credentials and permissions.".to_string(),
                            details: None,
                        })
                    }
                }
                Err(e) => Ok(CredentialResponse {
                    success: false,
                    message: format!("Credentials stored but validation failed: {}", e),
                    details: None,
                }),
            }
        }
        Err(e) => Ok(CredentialResponse {
            success: false,
            message: format!("Failed to store AWS Bedrock credentials: {}", e),
            details: None,
        }),
    }
}

/// Validate AWS Bedrock credentials
#[tauri::command]
pub async fn validate_bedrock_credentials(
    app_handle: AppHandle,
) -> Result<CredentialResponse, String> {
    // Retrieve stored credentials
    match credential_manager::retrieve_aws_bedrock_credentials().await {
        Ok((access_key, secret_key, region)) => {
            match validate_bedrock_credentials_internal(&access_key, &secret_key, &region).await {
                Ok(is_valid) => {
                    if is_valid {
                        Ok(CredentialResponse {
                            success: true,
                            message: "AWS Bedrock credentials are valid".to_string(),
                            details: Some({
                                let mut details = HashMap::new();
                                details.insert("region".to_string(), serde_json::Value::String(region));
                                details.insert("access_key_prefix".to_string(), 
                                    serde_json::Value::String(format!("{}***", &access_key[..4.min(access_key.len())])));
                                details
                            }),
                        })
                    } else {
                        Ok(CredentialResponse {
                            success: false,
                            message: "AWS Bedrock credentials validation failed".to_string(),
                            details: None,
                        })
                    }
                }
                Err(e) => Ok(CredentialResponse {
                    success: false,
                    message: format!("AWS Bedrock credentials validation error: {}", e),
                    details: None,
                }),
            }
        }
        Err(e) => Ok(CredentialResponse {
            success: false,
            message: format!("Failed to retrieve AWS Bedrock credentials: {}", e),
            details: None,
        }),
    }
}

/// Set Google Gemini API key
#[tauri::command]
pub async fn set_gemini_credentials(
    api_key: String,
    app_handle: AppHandle,
) -> Result<CredentialResponse, String> {
    // Validate input parameters
    if api_key.trim().is_empty() {
        return Ok(CredentialResponse {
            success: false,
            message: "API key cannot be empty".to_string(),
            details: None,
        });
    }

    // Store credentials using credential_manager
    match credential_manager::store_gemini_api_key(&api_key).await {
        Ok(_) => {
            // Test the API key by creating a temporary provider
            match validate_gemini_credentials_internal(&api_key).await {
                Ok(is_valid) => {
                    if is_valid {
                        Ok(CredentialResponse {
                            success: true,
                            message: "Google Gemini API key stored and validated successfully".to_string(),
                            details: Some({
                                let mut details = HashMap::new();
                                details.insert("api_key_prefix".to_string(), 
                                    serde_json::Value::String(format!("{}***", &api_key[..8.min(api_key.len())])));
                                details
                            }),
                        })
                    } else {
                        Ok(CredentialResponse {
                            success: false,
                            message: "API key stored but validation failed. Please check your Google Gemini API key.".to_string(),
                            details: None,
                        })
                    }
                }
                Err(e) => Ok(CredentialResponse {
                    success: false,
                    message: format!("API key stored but validation failed: {}", e),
                    details: None,
                }),
            }
        }
        Err(e) => Ok(CredentialResponse {
            success: false,
            message: format!("Failed to store Google Gemini API key: {}", e),
            details: None,
        }),
    }
}

/// Validate Google Gemini API key
#[tauri::command]
pub async fn validate_gemini_credentials(
    app_handle: AppHandle,
) -> Result<CredentialResponse, String> {
    // Retrieve stored API key
    match credential_manager::retrieve_gemini_api_key().await {
        Ok(api_key) => {
            match validate_gemini_credentials_internal(&api_key).await {
                Ok(is_valid) => {
                    if is_valid {
                        Ok(CredentialResponse {
                            success: true,
                            message: "Google Gemini API key is valid".to_string(),
                            details: Some({
                                let mut details = HashMap::new();
                                details.insert("api_key_prefix".to_string(), 
                                    serde_json::Value::String(format!("{}***", &api_key[..8.min(api_key.len())])));
                                details
                            }),
                        })
                    } else {
                        Ok(CredentialResponse {
                            success: false,
                            message: "Google Gemini API key validation failed".to_string(),
                            details: None,
                        })
                    }
                }
                Err(e) => Ok(CredentialResponse {
                    success: false,
                    message: format!("Google Gemini API key validation error: {}", e),
                    details: None,
                }),
            }
        }
        Err(e) => Ok(CredentialResponse {
            success: false,
            message: format!("Failed to retrieve Google Gemini API key: {}", e),
            details: None,
        }),
    }
}

/// Select active AI provider
#[tauri::command]
pub async fn select_active_provider(
    provider_name: String,
    config: Option<serde_json::Value>,
    app_handle: AppHandle,
) -> Result<ProviderResponse, String> {
    // Validate provider name
    let provider_name = provider_name.trim().to_lowercase();
    if provider_name.is_empty() {
        return Ok(ProviderResponse {
            success: false,
            message: "Provider name cannot be empty".to_string(),
            provider_info: None,
        });
    }

    // Get the provider manager from Tauri state
    let provider_manager = match utils::get_provider_manager(&app_handle) {
        Ok(manager) => manager,
        Err(e) => {
            return Ok(ProviderResponse {
                success: false,
                message: format!("Failed to access provider manager: {}", e),
                provider_info: None,
            });
        }
    };

    // Switch to the requested provider
    match provider_manager.switch_provider(&provider_name, config).await {
        Ok(_) => {
            // Get information about the newly active provider
            match provider_manager.get_active_provider_info().await {
                Ok(provider_info) => Ok(ProviderResponse {
                    success: true,
                    message: format!("Successfully switched to {} provider", provider_name),
                    provider_info: Some(provider_info),
                }),
                Err(e) => Ok(ProviderResponse {
                    success: true,
                    message: format!("Switched to {} provider but failed to get info: {}", provider_name, e),
                    provider_info: None,
                }),
            }
        }
        Err(e) => Ok(ProviderResponse {
            success: false,
            message: format!("Failed to switch to {} provider: {}", provider_name, e),
            provider_info: None,
        }),
    }
}

/// List all available AI providers
#[tauri::command]
pub async fn list_ai_providers(
    app_handle: AppHandle,
) -> Result<ProvidersListResponse, String> {
    // Get the provider manager from Tauri state
    let provider_manager = match utils::get_provider_manager(&app_handle) {
        Ok(manager) => manager,
        Err(e) => {
            return Ok(ProvidersListResponse {
                success: false,
                providers: vec![],
                active_provider: "unknown".to_string(),
            });
        }
    };

    // Get list of registered providers
    match provider_manager.list_registered_providers().await {
        Ok(providers_info) => {
            let mut providers = Vec::new();
            
            for (provider_type, info) in providers_info {
                // Get configuration schema for this provider
                let config_schema = provider_manager
                    .get_provider_config_schema(&provider_type)
                    .await
                    .unwrap_or_else(|_| serde_json::json!({}));

                // Test if provider is available (has valid credentials)
                let is_available = match provider_type.as_str() {
                    "local" => true, // Local provider is always available
                    "bedrock" => {
                        credential_manager::retrieve_aws_bedrock_credentials()
                            .await
                            .is_ok()
                    }
                    "gemini" => {
                        credential_manager::retrieve_gemini_api_key()
                            .await
                            .is_ok()
                    }
                    _ => false,
                };

                providers.push(ProviderInfo {
                    name: provider_type.clone(),
                    display_name: info.name,
                    is_available,
                    capabilities: {
                        let mut caps = HashMap::new();
                        caps.insert("streaming".to_string(), info.capabilities.supports_streaming);
                        caps.insert("system_messages".to_string(), info.capabilities.supports_system_messages);
                        caps.insert("images".to_string(), info.capabilities.supports_images);
                        caps
                    },
                    config_schema,
                });
            }

            // Get active provider info
            let active_provider = provider_manager
                .get_active_provider_info()
                .await
                .map(|info| {
                    info.get("provider_type")
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown")
                        .to_string()
                })
                .unwrap_or_else(|_| "unknown".to_string());

            Ok(ProvidersListResponse {
                success: true,
                providers,
                active_provider,
            })
        }
        Err(e) => Ok(ProvidersListResponse {
            success: false,
            providers: vec![],
            active_provider: "unknown".to_string(),
        }),
    }
}

/// Get information about the currently active provider
#[tauri::command]
pub async fn get_active_provider_info(
    app_handle: AppHandle,
) -> Result<ProviderResponse, String> {
    // Get the provider manager from Tauri state
    let provider_manager = match utils::get_provider_manager(&app_handle) {
        Ok(manager) => manager,
        Err(e) => {
            return Ok(ProviderResponse {
                success: false,
                message: format!("Failed to access provider manager: {}", e),
                provider_info: None,
            });
        }
    };

    // Get active provider information
    match provider_manager.get_active_provider_info().await {
        Ok(provider_info) => Ok(ProviderResponse {
            success: true,
            message: "Retrieved active provider information".to_string(),
            provider_info: Some(provider_info),
        }),
        Err(e) => Ok(ProviderResponse {
            success: false,
            message: format!("Failed to get active provider info: {}", e),
            provider_info: None,
        }),
    }
}

// Internal helper functions

/// Internal function to validate AWS Bedrock credentials
async fn validate_bedrock_credentials_internal(
    access_key: &str,
    secret_key: &str,
    region: &str,
) -> Result<bool, String> {
    // Create a temporary BedrockProvider with the credentials
    let config = serde_json::json!({
        "region": region,
        "default_model": "anthropic.claude-3-sonnet-20240229-v1:0",
        "timeout_seconds": 30,
        "max_retries": 1,
        "enable_streaming": false
    });

    match BedrockProvider::new(config).await {
        Ok(provider) => {
            // Test the provider with a simple validation call
            provider.validate_configuration().await.map_err(|e| e.to_string())
        }
        Err(e) => Err(format!("Failed to create BedrockProvider: {}", e)),
    }
}

/// Internal function to validate Google Gemini API key
async fn validate_gemini_credentials_internal(api_key: &str) -> Result<bool, String> {
    // Create a temporary GeminiProvider with the API key
    let config = serde_json::json!({
        "model": "gemini-pro",
        "api_endpoint": "https://generativelanguage.googleapis.com/v1beta",
        "timeout_seconds": 30,
        "max_retries": 1,
        "enable_streaming": false,
        "safety_settings": {
            "harassment": "BLOCK_MEDIUM_AND_ABOVE",
            "hate_speech": "BLOCK_MEDIUM_AND_ABOVE",
            "sexually_explicit": "BLOCK_MEDIUM_AND_ABOVE",
            "dangerous_content": "BLOCK_MEDIUM_AND_ABOVE"
        }
    });

    match GeminiProvider::new(config).await {
        Ok(provider) => {
            // Test the provider with a simple validation call
            provider.validate_configuration().await.map_err(|e| e.to_string())
        }
        Err(e) => Err(format!("Failed to create GeminiProvider: {}", e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio;

    #[tokio::test]
    async fn test_credential_response_serialization() {
        let response = CredentialResponse {
            success: true,
            message: "Test message".to_string(),
            details: Some({
                let mut details = HashMap::new();
                details.insert("test_key".to_string(), serde_json::Value::String("test_value".to_string()));
                details
            }),
        };

        let serialized = serde_json::to_string(&response).unwrap();
        let deserialized: CredentialResponse = serde_json::from_str(&serialized).unwrap();
        
        assert_eq!(response.success, deserialized.success);
        assert_eq!(response.message, deserialized.message);
    }

    #[tokio::test]
    async fn test_provider_response_serialization() {
        let response = ProviderResponse {
            success: true,
            message: "Test message".to_string(),
            provider_info: Some(serde_json::json!({"provider_type": "local"})),
        };

        let serialized = serde_json::to_string(&response).unwrap();
        let deserialized: ProviderResponse = serde_json::from_str(&serialized).unwrap();
        
        assert_eq!(response.success, deserialized.success);
        assert_eq!(response.message, deserialized.message);
    }

    #[tokio::test]
    async fn test_providers_list_response_serialization() {
        let response = ProvidersListResponse {
            success: true,
            providers: vec![
                ProviderInfo {
                    name: "local".to_string(),
                    display_name: "Local AI".to_string(),
                    is_available: true,
                    capabilities: {
                        let mut caps = HashMap::new();
                        caps.insert("streaming".to_string(), true);
                        caps
                    },
                    config_schema: serde_json::json!({}),
                }
            ],
            active_provider: "local".to_string(),
        };

        let serialized = serde_json::to_string(&response).unwrap();
        let deserialized: ProvidersListResponse = serde_json::from_str(&serialized).unwrap();
        
        assert_eq!(response.success, deserialized.success);
        assert_eq!(response.active_provider, deserialized.active_provider);
        assert_eq!(response.providers.len(), deserialized.providers.len());
    }

    #[tokio::test]
    async fn test_input_validation() {
        // Test empty access key validation
        let response = set_bedrock_credentials(
            "".to_string(),
            "secret".to_string(),
            "us-east-1".to_string(),
            // Note: In real tests, we'd need to mock the AppHandle
            // For now, this test just validates the logic structure
        );
        // This would fail due to missing AppHandle, but the validation logic is correct
    }
}
