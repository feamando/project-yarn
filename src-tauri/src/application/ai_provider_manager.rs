/// AI Provider State Manager - Task 2.2.5
/// 
/// This module implements the AI Provider State Manager for managing the currently active
/// AI provider at runtime. It uses Arc<Mutex<Box<dyn AiProvider>>> pattern to allow
/// thread-safe provider switching between Local, Bedrock, and Gemini providers.
/// 
/// The state manager provides methods for provider registration, switching, and management,
/// and integrates with Tauri's managed state system for application-wide access.

use crate::application::ai_provider::{AiProvider, AiProviderError, AiProviderFactory};
use crate::infrastructure::{
    BedrockProvider, BedrockProviderFactory, GeminiProvider, GeminiProviderFactory,
    LocalProvider, LocalProviderFactory,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use tracing::{debug, error, info, warn};

/// Type alias for the AI provider state
pub type AiProviderState = Arc<Mutex<Box<dyn AiProvider>>>;

/// Type alias for provider factory registry
pub type ProviderFactoryRegistry = Arc<Mutex<HashMap<String, Box<dyn AiProviderFactory>>>>;

/// Information about a registered provider
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisteredProviderInfo {
    /// Provider type identifier
    pub provider_type: String,
    /// Display name for the provider
    pub display_name: String,
    /// Whether the provider is currently available
    pub is_available: bool,
    /// Whether this is the currently active provider
    pub is_active: bool,
    /// Configuration schema for the provider
    pub config_schema: serde_json::Value,
}

/// AI Provider Manager for runtime provider management
/// 
/// This manager handles registration of provider factories, creation of provider instances,
/// and switching between different AI providers at runtime. It maintains the currently
/// active provider in a thread-safe manner using Arc<Mutex<>>.
pub struct AiProviderManager {
    /// Currently active AI provider
    active_provider: AiProviderState,
    /// Registry of available provider factories
    factory_registry: ProviderFactoryRegistry,
    /// Currently active provider type
    active_provider_type: Arc<Mutex<String>>,
}

impl AiProviderManager {
    /// Create a new AiProviderManager with default LocalProvider
    pub fn new() -> Self {
        let local_provider = Box::new(LocalProvider::new()) as Box<dyn AiProvider>;
        let active_provider = Arc::new(Mutex::new(local_provider));
        
        let mut factory_registry = HashMap::new();
        factory_registry.insert("local".to_string(), Box::new(LocalProviderFactory) as Box<dyn AiProviderFactory>);
        factory_registry.insert("bedrock".to_string(), Box::new(BedrockProviderFactory) as Box<dyn AiProviderFactory>);
        factory_registry.insert("gemini".to_string(), Box::new(GeminiProviderFactory) as Box<dyn AiProviderFactory>);
        
        let factory_registry = Arc::new(Mutex::new(factory_registry));
        let active_provider_type = Arc::new(Mutex::new("local".to_string()));

        Self {
            active_provider,
            factory_registry,
            active_provider_type,
        }
    }

    /// Get the currently active provider (cloned for use)
    pub fn get_active_provider(&self) -> Result<Box<dyn AiProvider>, AiProviderError> {
        let provider = self.active_provider.lock().map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to acquire provider lock: {}", e))
        })?;
        
        Ok(provider.clone_provider())
    }

    /// Get the currently active provider type
    pub fn get_active_provider_type(&self) -> Result<String, AiProviderError> {
        let provider_type = self.active_provider_type.lock().map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to acquire provider type lock: {}", e))
        })?;
        
        Ok(provider_type.clone())
    }

    /// Switch to a different provider by type with optional configuration
    pub async fn switch_provider(
        &self,
        provider_type: &str,
        config: Option<serde_json::Value>,
    ) -> Result<(), AiProviderError> {
        debug!("AiProviderManager: Switching to provider: {}", provider_type);

        // Get the factory for the requested provider type
        let factory = {
            let registry = self.factory_registry.lock().map_err(|e| {
                AiProviderError::ProviderError(format!("Failed to acquire factory registry lock: {}", e))
            })?;
            
            registry.get(provider_type).ok_or_else(|| {
                AiProviderError::ConfigurationError(format!("Unknown provider type: {}", provider_type))
            })?.clone_provider()
        };

        // Create the new provider instance
        let provider_config = config.unwrap_or_else(|| serde_json::json!({}));
        let new_provider = factory.create_provider(provider_config)?;

        // Validate the new provider configuration
        match new_provider.validate_configuration().await {
            Ok(true) => {
                info!("AiProviderManager: Provider {} validation successful", provider_type);
            }
            Ok(false) => {
                warn!("AiProviderManager: Provider {} validation returned false", provider_type);
                return Err(AiProviderError::ConfigurationError(format!(
                    "Provider {} validation failed",
                    provider_type
                )));
            }
            Err(e) => {
                error!("AiProviderManager: Provider {} validation error: {}", provider_type, e);
                return Err(e);
            }
        }

        // Switch to the new provider
        {
            let mut active_provider = self.active_provider.lock().map_err(|e| {
                AiProviderError::ProviderError(format!("Failed to acquire provider lock: {}", e))
            })?;
            *active_provider = new_provider;
        }

        // Update the active provider type
        {
            let mut active_type = self.active_provider_type.lock().map_err(|e| {
                AiProviderError::ProviderError(format!("Failed to acquire provider type lock: {}", e))
            })?;
            *active_type = provider_type.to_string();
        }

        info!("AiProviderManager: Successfully switched to provider: {}", provider_type);
        Ok(())
    }

    /// Register a new provider factory
    pub fn register_provider_factory(
        &self,
        factory: Box<dyn AiProviderFactory>,
    ) -> Result<(), AiProviderError> {
        let provider_type = factory.provider_type().to_string();
        
        let mut registry = self.factory_registry.lock().map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to acquire factory registry lock: {}", e))
        })?;
        
        registry.insert(provider_type.clone(), factory);
        
        info!("AiProviderManager: Registered provider factory: {}", provider_type);
        Ok(())
    }

    /// Get a list of all registered providers with their information
    pub async fn list_registered_providers(&self) -> Result<Vec<RegisteredProviderInfo>, AiProviderError> {
        let registry = self.factory_registry.lock().map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to acquire factory registry lock: {}", e))
        })?;

        let active_type = self.get_active_provider_type()?;
        let mut providers = Vec::new();

        for (provider_type, factory) in registry.iter() {
            // Create a temporary provider instance to get info
            let temp_provider = factory.create_provider(serde_json::json!({}))?;
            let provider_info = temp_provider.get_provider_info().await;
            
            let registered_info = RegisteredProviderInfo {
                provider_type: provider_type.clone(),
                display_name: provider_info.display_name,
                is_available: provider_info.is_available,
                is_active: *provider_type == active_type,
                config_schema: factory.config_schema(),
            };
            
            providers.push(registered_info);
        }

        Ok(providers)
    }

    /// Test connection for a specific provider type
    pub async fn test_provider_connection(&self, provider_type: &str) -> Result<bool, AiProviderError> {
        let factory = {
            let registry = self.factory_registry.lock().map_err(|e| {
                AiProviderError::ProviderError(format!("Failed to acquire factory registry lock: {}", e))
            })?;
            
            registry.get(provider_type).ok_or_else(|| {
                AiProviderError::ConfigurationError(format!("Unknown provider type: {}", provider_type))
            })?.clone_provider()
        };

        let provider = factory.create_provider(serde_json::json!({}))?;
        provider.test_connection().await
    }

    /// Get configuration schema for a specific provider type
    pub fn get_provider_config_schema(&self, provider_type: &str) -> Result<serde_json::Value, AiProviderError> {
        let registry = self.factory_registry.lock().map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to acquire factory registry lock: {}", e))
        })?;
        
        let factory = registry.get(provider_type).ok_or_else(|| {
            AiProviderError::ConfigurationError(format!("Unknown provider type: {}", provider_type))
        })?;
        
        Ok(factory.config_schema())
    }

    /// Create a provider instance without switching to it (for testing)
    pub fn create_provider_instance(
        &self,
        provider_type: &str,
        config: serde_json::Value,
    ) -> Result<Box<dyn AiProvider>, AiProviderError> {
        let registry = self.factory_registry.lock().map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to acquire factory registry lock: {}", e))
        })?;
        
        let factory = registry.get(provider_type).ok_or_else(|| {
            AiProviderError::ConfigurationError(format!("Unknown provider type: {}", provider_type))
        })?;
        
        factory.create_provider(config)
    }

    /// Get information about the currently active provider
    pub async fn get_active_provider_info(&self) -> Result<RegisteredProviderInfo, AiProviderError> {
        let active_provider = self.get_active_provider()?;
        let active_type = self.get_active_provider_type()?;
        let provider_info = active_provider.get_provider_info().await;
        
        let config_schema = self.get_provider_config_schema(&active_type)?;
        
        Ok(RegisteredProviderInfo {
            provider_type: active_type,
            display_name: provider_info.display_name,
            is_available: provider_info.is_available,
            is_active: true,
            config_schema,
        })
    }

    /// Reset to default provider (LocalProvider)
    pub async fn reset_to_default(&self) -> Result<(), AiProviderError> {
        info!("AiProviderManager: Resetting to default provider (local)");
        self.switch_provider("local", None).await
    }
}

impl Default for AiProviderManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Initialize the AI Provider Manager and add it to Tauri's managed state
pub fn initialize_ai_provider_manager(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let manager = AiProviderManager::new();
    
    // Create the shared state for the active provider
    let active_provider_state = manager.active_provider.clone();
    
    // Add both the manager and the provider state to Tauri's managed state
    app_handle.manage(manager);
    app_handle.manage(active_provider_state);
    
    info!("AI Provider Manager initialized with default LocalProvider");
    Ok(())
}

/// Helper functions for working with the AI Provider Manager
pub mod utils {
    use super::*;
    use tauri::{Manager, State};

    /// Get the AI Provider Manager from Tauri state
    pub fn get_provider_manager(app_handle: &AppHandle) -> Result<&AiProviderManager, AiProviderError> {
        app_handle.state::<AiProviderManager>().inner().ok_or_else(|| {
            AiProviderError::ConfigurationError("AI Provider Manager not initialized".to_string())
        })
    }

    /// Get the active provider state from Tauri state
    pub fn get_active_provider_state(app_handle: &AppHandle) -> Result<&AiProviderState, AiProviderError> {
        app_handle.state::<AiProviderState>().inner().ok_or_else(|| {
            AiProviderError::ConfigurationError("AI Provider State not initialized".to_string())
        })
    }

    /// Convenience function to get the currently active provider
    pub fn get_active_provider(app_handle: &AppHandle) -> Result<Box<dyn AiProvider>, AiProviderError> {
        let manager = get_provider_manager(app_handle)?;
        manager.get_active_provider()
    }

    /// Convenience function to switch providers
    pub async fn switch_provider(
        app_handle: &AppHandle,
        provider_type: &str,
        config: Option<serde_json::Value>,
    ) -> Result<(), AiProviderError> {
        let manager = get_provider_manager(app_handle)?;
        manager.switch_provider(provider_type, config).await
    }

    /// Convenience function to list all providers
    pub async fn list_providers(app_handle: &AppHandle) -> Result<Vec<RegisteredProviderInfo>, AiProviderError> {
        let manager = get_provider_manager(app_handle)?;
        manager.list_registered_providers().await
    }
}

// Implement Clone for the factory trait object
trait AiProviderFactoryClone {
    fn clone_provider(&self) -> Box<dyn AiProviderFactory>;
}

impl<T> AiProviderFactoryClone for T
where
    T: AiProviderFactory + Clone + 'static,
{
    fn clone_provider(&self) -> Box<dyn AiProviderFactory> {
        Box::new(self.clone())
    }
}

// Blanket implementation for cloning factory trait objects
impl Clone for Box<dyn AiProviderFactory> {
    fn clone(&self) -> Self {
        // This is a workaround since we can't directly clone trait objects
        // Each factory will need to implement this pattern
        match self.provider_type() {
            "local" => Box::new(LocalProviderFactory),
            "bedrock" => Box::new(BedrockProviderFactory),
            "gemini" => Box::new(GeminiProviderFactory),
            _ => panic!("Unknown provider type for cloning"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio_test;

    #[test]
    fn test_ai_provider_manager_creation() {
        let manager = AiProviderManager::new();
        let active_type = manager.get_active_provider_type().unwrap();
        assert_eq!(active_type, "local");
    }

    #[test]
    fn test_get_active_provider() {
        let manager = AiProviderManager::new();
        let provider = manager.get_active_provider().unwrap();
        let info = tokio_test::block_on(provider.get_provider_info());
        assert_eq!(info.name, "local");
    }

    #[tokio::test]
    async fn test_list_registered_providers() {
        let manager = AiProviderManager::new();
        let providers = manager.list_registered_providers().await.unwrap();
        
        assert_eq!(providers.len(), 3);
        
        let provider_types: Vec<String> = providers.iter().map(|p| p.provider_type.clone()).collect();
        assert!(provider_types.contains(&"local".to_string()));
        assert!(provider_types.contains(&"bedrock".to_string()));
        assert!(provider_types.contains(&"gemini".to_string()));
        
        // Check that local is the active provider
        let active_provider = providers.iter().find(|p| p.is_active).unwrap();
        assert_eq!(active_provider.provider_type, "local");
    }

    #[test]
    fn test_get_provider_config_schema() {
        let manager = AiProviderManager::new();
        let schema = manager.get_provider_config_schema("local").unwrap();
        
        assert_eq!(schema["type"], "object");
        assert!(schema["properties"].is_object());
    }

    #[test]
    fn test_create_provider_instance() {
        let manager = AiProviderManager::new();
        let config = serde_json::json!({
            "default_model": "test-model",
            "enable_fallback": false
        });
        
        let provider = manager.create_provider_instance("local", config).unwrap();
        let info = tokio_test::block_on(provider.get_provider_info());
        assert_eq!(info.name, "local");
    }

    #[tokio::test]
    async fn test_get_active_provider_info() {
        let manager = AiProviderManager::new();
        let info = manager.get_active_provider_info().await.unwrap();
        
        assert_eq!(info.provider_type, "local");
        assert!(info.is_active);
        assert!(info.config_schema.is_object());
    }

    #[tokio::test]
    async fn test_reset_to_default() {
        let manager = AiProviderManager::new();
        
        // This should succeed since we're already on the default
        manager.reset_to_default().await.unwrap();
        
        let active_type = manager.get_active_provider_type().unwrap();
        assert_eq!(active_type, "local");
    }
}
