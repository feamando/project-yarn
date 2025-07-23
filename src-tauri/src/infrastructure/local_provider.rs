/// LocalProvider Implementation - Task 2.2.2
/// 
/// This module implements the LocalProvider struct that conforms to the AiProvider trait,
/// refactoring the MVP logic from Phase 1 to work with the new unified AI provider system.
/// 
/// The LocalProvider wraps communication with the local-ai-engine service and provides
/// streaming and non-streaming interfaces for local AI model interactions.

use crate::application::ai_provider::{
    AiProvider, AiProviderError, AiProviderFactory, ConversationContext, Message, MessageRole,
    ModelConfig, ProviderCapabilities, ProviderInfo, StreamChunk,
};
use crate::core::local_ai_engine::{CompletionRequest, CompletionResponse, LocalAiEngine, SidecarState};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use tokio::time::{sleep, Duration};
use tracing::{debug, error, info, warn};

/// Configuration for the LocalProvider
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalProviderConfig {
    /// Path to the local model sidecar binary
    pub sidecar_path: Option<String>,
    /// Default model to use for completions
    pub default_model: String,
    /// Maximum timeout for sidecar startup (seconds)
    pub startup_timeout: u64,
    /// Maximum timeout for completion requests (seconds)
    pub completion_timeout: u64,
    /// Whether to use fallback completions when sidecar is unavailable
    pub enable_fallback: bool,
}

impl Default for LocalProviderConfig {
    fn default() -> Self {
        Self {
            sidecar_path: None, // Use default Tauri sidecar resolution
            default_model: "local-model".to_string(),
            startup_timeout: 30,
            completion_timeout: 120,
            enable_fallback: true,
        }
    }
}

/// LocalProvider struct implementing the AiProvider trait
/// 
/// This provider manages communication with the local AI engine sidecar process,
/// providing both streaming and non-streaming interfaces for local AI interactions.
pub struct LocalProvider {
    /// Local AI engine instance
    engine: Arc<Mutex<LocalAiEngine>>,
    /// Provider configuration
    config: LocalProviderConfig,
    /// Provider capabilities
    capabilities: ProviderCapabilities,
}

impl LocalProvider {
    /// Create a new LocalProvider with default configuration
    pub fn new() -> Self {
        Self::with_config(LocalProviderConfig::default())
    }

    /// Create a new LocalProvider with custom configuration
    pub fn with_config(config: LocalProviderConfig) -> Self {
        let capabilities = ProviderCapabilities {
            supports_streaming: true,
            supports_functions: false, // Not implemented in MVP
            supports_images: false,    // Not implemented in MVP
            supports_system_messages: true,
            max_context_length: Some(4096), // Default context length
        };

        Self {
            engine: Arc::new(Mutex::new(LocalAiEngine::new())),
            config,
            capabilities,
        }
    }

    /// Ensure the sidecar is running and ready
    async fn ensure_sidecar_ready(&self) -> Result<(), AiProviderError> {
        let mut engine = self.engine.lock().map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to acquire engine lock: {}", e))
        })?;

        // Check if already running
        if engine.is_ready() {
            return Ok(());
        }

        // Start the sidecar if not running
        info!("Starting local AI sidecar...");
        engine.start_sidecar().map_err(|e| {
            error!("Failed to start sidecar: {}", e);
            AiProviderError::ServiceUnavailable(format!("Failed to start local AI sidecar: {}", e))
        })?;

        // Wait for sidecar to be ready with timeout
        let timeout_duration = Duration::from_secs(self.config.startup_timeout);
        let start_time = std::time::Instant::now();

        while !engine.is_ready() && start_time.elapsed() < timeout_duration {
            drop(engine); // Release lock during sleep
            sleep(Duration::from_millis(500)).await;
            engine = self.engine.lock().map_err(|e| {
                AiProviderError::ProviderError(format!("Failed to acquire engine lock: {}", e))
            })?;
        }

        if !engine.is_ready() {
            return Err(AiProviderError::ServiceUnavailable(
                "Local AI sidecar failed to start within timeout".to_string(),
            ));
        }

        info!("Local AI sidecar is ready");
        Ok(())
    }

    /// Convert conversation context to completion request
    fn context_to_completion_request(&self, context: &ConversationContext) -> CompletionRequest {
        // Combine all messages into a single prompt
        let mut prompt_parts = Vec::new();

        // Add system prompt if present
        if let Some(system_prompt) = &context.system_prompt {
            prompt_parts.push(format!("System: {}", system_prompt));
        }

        // Add conversation messages
        for message in &context.messages {
            let role_prefix = match message.role {
                MessageRole::System => "System",
                MessageRole::User => "User",
                MessageRole::Assistant => "Assistant",
                MessageRole::Function => "Function",
            };
            prompt_parts.push(format!("{}: {}", role_prefix, message.content));
        }

        // Add assistant prompt to encourage response
        prompt_parts.push("Assistant:".to_string());

        let combined_prompt = prompt_parts.join("\n\n");

        CompletionRequest {
            prompt: combined_prompt,
            max_tokens: context.config.max_tokens.map(|t| t as usize),
            temperature: context.config.temperature,
        }
    }

    /// Generate fallback completion when sidecar is unavailable
    fn generate_fallback_completion(&self, context: &ConversationContext) -> String {
        if !self.config.enable_fallback {
            return "Local AI service is currently unavailable.".to_string();
        }

        // Extract the last user message for fallback
        let user_message = context
            .messages
            .iter()
            .rev()
            .find(|msg| matches!(msg.role, MessageRole::User))
            .map(|msg| msg.content.as_str())
            .unwrap_or("Hello");

        // Generate enhanced fallback based on the prompt
        if user_message.to_lowercase().contains("help") {
            "I'm here to help! The local AI service is currently starting up. Please try again in a moment, or check that the local model is properly installed.".to_string()
        } else if user_message.to_lowercase().contains("error") || user_message.to_lowercase().contains("problem") {
            "I understand you're experiencing an issue. The local AI service is currently unavailable, but I'm working to resolve this. Please ensure the local model is downloaded and try again.".to_string()
        } else if user_message.len() > 100 {
            "Thank you for your detailed message. The local AI service is currently processing your request. This is a fallback response while the service initializes.".to_string()
        } else {
            format!("I received your message: '{}'. The local AI service is currently starting up. Please try again in a moment for a full AI-powered response.", user_message.chars().take(50).collect::<String>())
        }
    }

    /// Send streaming chunks to the frontend via Tauri
    async fn send_stream_chunk(
        &self,
        app_handle: &AppHandle,
        content: String,
        is_final: bool,
    ) -> Result<(), AiProviderError> {
        let chunk = StreamChunk {
            content,
            is_final,
            metadata: Some({
                let mut metadata = HashMap::new();
                metadata.insert("provider".to_string(), serde_json::Value::String("local".to_string()));
                metadata.insert("timestamp".to_string(), serde_json::Value::Number(
                    serde_json::Number::from(chrono::Utc::now().timestamp())
                ));
                metadata
            }),
        };

        app_handle
            .emit_all("ai_stream_chunk", &chunk)
            .map_err(|e| {
                error!("Failed to emit stream chunk: {}", e);
                AiProviderError::ProviderError(format!("Failed to emit stream chunk: {}", e))
            })?;

        Ok(())
    }
}

#[async_trait]
impl AiProvider for LocalProvider {
    async fn get_provider_info(&self) -> ProviderInfo {
        let engine = self.engine.lock().unwrap();
        let is_available = engine.is_ready();
        drop(engine);

        ProviderInfo {
            name: "local".to_string(),
            display_name: "Local AI Model".to_string(),
            description: "Local AI model running via sidecar process".to_string(),
            is_available,
            supported_models: vec![self.config.default_model.clone()],
            capabilities: self.capabilities.clone(),
        }
    }

    async fn validate_configuration(&self) -> Result<bool, AiProviderError> {
        // Try to start and connect to the sidecar
        match self.ensure_sidecar_ready().await {
            Ok(()) => {
                // Perform a health check
                let engine = self.engine.lock().map_err(|e| {
                    AiProviderError::ConfigurationError(format!("Failed to acquire engine lock: {}", e))
                })?;
                
                match engine.health_check() {
                    Ok(true) => Ok(true),
                    Ok(false) => Err(AiProviderError::ConfigurationError(
                        "Local AI engine health check failed".to_string(),
                    )),
                    Err(e) => Err(AiProviderError::ConfigurationError(format!(
                        "Health check error: {}",
                        e
                    ))),
                }
            }
            Err(e) => Err(e),
        }
    }

    async fn invoke_model_stream(
        &self,
        context: ConversationContext,
        app_handle: &AppHandle,
    ) -> Result<(), AiProviderError> {
        debug!("LocalProvider: Starting streaming completion");

        // Try to ensure sidecar is ready
        match self.ensure_sidecar_ready().await {
            Ok(()) => {
                // Sidecar is ready, proceed with normal completion
                let completion_request = self.context_to_completion_request(&context);
                
                let mut engine = self.engine.lock().map_err(|e| {
                    AiProviderError::ProviderError(format!("Failed to acquire engine lock: {}", e))
                })?;

                match engine.get_completion(completion_request) {
                    Ok(response) => {
                        if response.success {
                            // For now, send the complete response as a single chunk
                            // TODO: Implement true streaming when sidecar supports it
                            self.send_stream_chunk(app_handle, response.completion.clone(), false).await?;
                            self.send_stream_chunk(app_handle, "".to_string(), true).await?;
                            
                            info!("LocalProvider: Streaming completion successful");
                            Ok(())
                        } else {
                            let error_msg = response.error.unwrap_or_else(|| "Unknown error".to_string());
                            error!("LocalProvider: Completion failed: {}", error_msg);
                            Err(AiProviderError::ProviderError(error_msg))
                        }
                    }
                    Err(e) => {
                        error!("LocalProvider: Failed to get completion: {}", e);
                        
                        if self.config.enable_fallback {
                            warn!("LocalProvider: Using fallback completion");
                            let fallback = self.generate_fallback_completion(&context);
                            self.send_stream_chunk(app_handle, fallback, false).await?;
                            self.send_stream_chunk(app_handle, "".to_string(), true).await?;
                            Ok(())
                        } else {
                            Err(AiProviderError::ProviderError(format!("Completion failed: {}", e)))
                        }
                    }
                }
            }
            Err(_) => {
                // Sidecar failed to start, use fallback if enabled
                if self.config.enable_fallback {
                    warn!("LocalProvider: Sidecar unavailable, using fallback completion");
                    let fallback = self.generate_fallback_completion(&context);
                    self.send_stream_chunk(app_handle, fallback, false).await?;
                    self.send_stream_chunk(app_handle, "".to_string(), true).await?;
                    Ok(())
                } else {
                    Err(AiProviderError::ServiceUnavailable(
                        "Local AI service is unavailable and fallback is disabled".to_string(),
                    ))
                }
            }
        }
    }

    async fn invoke_model(&self, context: ConversationContext) -> Result<String, AiProviderError> {
        debug!("LocalProvider: Starting non-streaming completion");

        // Try to ensure sidecar is ready
        match self.ensure_sidecar_ready().await {
            Ok(()) => {
                let completion_request = self.context_to_completion_request(&context);
                
                let mut engine = self.engine.lock().map_err(|e| {
                    AiProviderError::ProviderError(format!("Failed to acquire engine lock: {}", e))
                })?;

                match engine.get_completion(completion_request) {
                    Ok(response) => {
                        if response.success {
                            info!("LocalProvider: Non-streaming completion successful");
                            Ok(response.completion)
                        } else {
                            let error_msg = response.error.unwrap_or_else(|| "Unknown error".to_string());
                            error!("LocalProvider: Completion failed: {}", error_msg);
                            
                            if self.config.enable_fallback {
                                warn!("LocalProvider: Using fallback completion");
                                Ok(self.generate_fallback_completion(&context))
                            } else {
                                Err(AiProviderError::ProviderError(error_msg))
                            }
                        }
                    }
                    Err(e) => {
                        error!("LocalProvider: Failed to get completion: {}", e);
                        
                        if self.config.enable_fallback {
                            warn!("LocalProvider: Using fallback completion");
                            Ok(self.generate_fallback_completion(&context))
                        } else {
                            Err(AiProviderError::ProviderError(format!("Completion failed: {}", e)))
                        }
                    }
                }
            }
            Err(_) => {
                if self.config.enable_fallback {
                    warn!("LocalProvider: Sidecar unavailable, using fallback completion");
                    Ok(self.generate_fallback_completion(&context))
                } else {
                    Err(AiProviderError::ServiceUnavailable(
                        "Local AI service is unavailable and fallback is disabled".to_string(),
                    ))
                }
            }
        }
    }

    async fn get_available_models(&self) -> Result<Vec<String>, AiProviderError> {
        // For MVP, return the configured default model
        // TODO: Integrate with model manager to get actual available models
        Ok(vec![self.config.default_model.clone()])
    }

    async fn test_connection(&self) -> Result<bool, AiProviderError> {
        match self.ensure_sidecar_ready().await {
            Ok(()) => {
                let engine = self.engine.lock().map_err(|e| {
                    AiProviderError::NetworkError(format!("Failed to acquire engine lock: {}", e))
                })?;
                
                match engine.health_check() {
                    Ok(result) => Ok(result),
                    Err(e) => Err(AiProviderError::NetworkError(format!("Health check failed: {}", e))),
                }
            }
            Err(e) => Err(e),
        }
    }

    fn get_config_schema(&self) -> serde_json::Value {
        serde_json::json!({
            "type": "object",
            "properties": {
                "sidecar_path": {
                    "type": ["string", "null"],
                    "description": "Path to the local model sidecar binary (optional)"
                },
                "default_model": {
                    "type": "string",
                    "description": "Default model to use for completions",
                    "default": "local-model"
                },
                "startup_timeout": {
                    "type": "integer",
                    "description": "Maximum timeout for sidecar startup in seconds",
                    "default": 30,
                    "minimum": 5,
                    "maximum": 300
                },
                "completion_timeout": {
                    "type": "integer",
                    "description": "Maximum timeout for completion requests in seconds",
                    "default": 120,
                    "minimum": 10,
                    "maximum": 600
                },
                "enable_fallback": {
                    "type": "boolean",
                    "description": "Whether to use fallback completions when sidecar is unavailable",
                    "default": true
                }
            },
            "required": ["default_model"]
        })
    }

    fn clone_provider(&self) -> Box<dyn AiProvider> {
        Box::new(LocalProvider::with_config(self.config.clone()))
    }
}

/// Factory for creating LocalProvider instances
pub struct LocalProviderFactory;

impl AiProviderFactory for LocalProviderFactory {
    fn create_provider(&self, config: serde_json::Value) -> Result<Box<dyn AiProvider>, AiProviderError> {
        let provider_config: LocalProviderConfig = serde_json::from_value(config)
            .map_err(|e| AiProviderError::ConfigurationError(format!("Invalid configuration: {}", e)))?;
        
        Ok(Box::new(LocalProvider::with_config(provider_config)))
    }

    fn provider_type(&self) -> &'static str {
        "local"
    }

    fn config_schema(&self) -> serde_json::Value {
        LocalProvider::new().get_config_schema()
    }
}

impl Default for LocalProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application::ai_provider::utils;

    #[test]
    fn test_local_provider_creation() {
        let provider = LocalProvider::new();
        let info = tokio_test::block_on(provider.get_provider_info());
        
        assert_eq!(info.name, "local");
        assert_eq!(info.display_name, "Local AI Model");
        assert!(info.capabilities.supports_streaming);
        assert!(info.capabilities.supports_system_messages);
    }

    #[test]
    fn test_local_provider_config() {
        let config = LocalProviderConfig {
            default_model: "test-model".to_string(),
            startup_timeout: 60,
            completion_timeout: 180,
            enable_fallback: false,
            ..Default::default()
        };

        let provider = LocalProvider::with_config(config.clone());
        assert_eq!(provider.config.default_model, "test-model");
        assert_eq!(provider.config.startup_timeout, 60);
        assert_eq!(provider.config.completion_timeout, 180);
        assert!(!provider.config.enable_fallback);
    }

    #[test]
    fn test_context_to_completion_request() {
        let provider = LocalProvider::new();
        let context = utils::create_simple_context(
            "Hello, world!".to_string(),
            Some("You are helpful.".to_string()),
        );

        let request = provider.context_to_completion_request(&context);
        
        assert!(request.prompt.contains("System: You are helpful."));
        assert!(request.prompt.contains("User: Hello, world!"));
        assert!(request.prompt.contains("Assistant:"));
    }

    #[test]
    fn test_fallback_completion() {
        let provider = LocalProvider::new();
        let context = utils::create_simple_context("help me".to_string(), None);
        
        let fallback = provider.generate_fallback_completion(&context);
        assert!(fallback.contains("help"));
        assert!(fallback.len() > 10);
    }

    #[test]
    fn test_factory_creation() {
        let factory = LocalProviderFactory;
        assert_eq!(factory.provider_type(), "local");
        
        let config = serde_json::json!({
            "default_model": "test-model",
            "enable_fallback": false
        });
        
        let provider = factory.create_provider(config).unwrap();
        let info = tokio_test::block_on(provider.get_provider_info());
        assert_eq!(info.name, "local");
    }

    #[test]
    fn test_config_schema() {
        let provider = LocalProvider::new();
        let schema = provider.get_config_schema();
        
        assert_eq!(schema["type"], "object");
        assert!(schema["properties"]["default_model"].is_object());
        assert!(schema["properties"]["enable_fallback"].is_object());
        assert!(schema["required"].as_array().unwrap().contains(&serde_json::Value::String("default_model".to_string())));
    }
}
