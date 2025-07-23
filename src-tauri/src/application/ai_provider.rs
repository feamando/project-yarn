/// AI Provider Trait - Task 2.2.1
/// 
/// This trait defines a unified contract for AI interaction, decoupling the application's
/// core logic from specific AI service implementation details. It serves as the lynchpin
/// for the entire Phase 2 AI integration system.
/// 
/// The trait is designed to support multiple AI providers (Local, Bedrock, Gemini) with
/// a consistent interface, enabling runtime provider switching and seamless integration.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Configuration parameters for AI model invocation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    /// Maximum number of tokens to generate
    pub max_tokens: Option<u32>,
    /// Temperature for response randomness (0.0 to 1.0)
    pub temperature: Option<f32>,
    /// Top-p sampling parameter
    pub top_p: Option<f32>,
    /// Stop sequences to halt generation
    pub stop_sequences: Option<Vec<String>>,
    /// Additional provider-specific parameters
    pub extra_params: HashMap<String, serde_json::Value>,
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            max_tokens: Some(4096),
            temperature: Some(0.7),
            top_p: Some(0.9),
            stop_sequences: None,
            extra_params: HashMap::new(),
        }
    }
}

/// Response chunk from streaming AI model invocation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChunk {
    /// Content text in this chunk
    pub content: String,
    /// Whether this is the final chunk in the stream
    pub is_final: bool,
    /// Optional metadata about the chunk
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Error types for AI provider operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AiProviderError {
    /// Authentication/credential errors
    AuthenticationError(String),
    /// Network/connectivity errors
    NetworkError(String),
    /// Rate limiting errors
    RateLimitError(String),
    /// Invalid request parameters
    InvalidRequest(String),
    /// Model/service unavailable
    ServiceUnavailable(String),
    /// Quota exceeded
    QuotaExceeded(String),
    /// Generic provider error
    ProviderError(String),
    /// Configuration error
    ConfigurationError(String),
}

impl std::fmt::Display for AiProviderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AiProviderError::AuthenticationError(msg) => write!(f, "Authentication error: {}", msg),
            AiProviderError::NetworkError(msg) => write!(f, "Network error: {}", msg),
            AiProviderError::RateLimitError(msg) => write!(f, "Rate limit error: {}", msg),
            AiProviderError::InvalidRequest(msg) => write!(f, "Invalid request: {}", msg),
            AiProviderError::ServiceUnavailable(msg) => write!(f, "Service unavailable: {}", msg),
            AiProviderError::QuotaExceeded(msg) => write!(f, "Quota exceeded: {}", msg),
            AiProviderError::ProviderError(msg) => write!(f, "Provider error: {}", msg),
            AiProviderError::ConfigurationError(msg) => write!(f, "Configuration error: {}", msg),
        }
    }
}

impl std::error::Error for AiProviderError {}

/// Provider information and capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderInfo {
    /// Provider name (e.g., "local", "bedrock", "gemini")
    pub name: String,
    /// Human-readable display name
    pub display_name: String,
    /// Provider description
    pub description: String,
    /// Whether the provider is currently available
    pub is_available: bool,
    /// Supported model names
    pub supported_models: Vec<String>,
    /// Provider capabilities
    pub capabilities: ProviderCapabilities,
}

/// Provider capability flags
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderCapabilities {
    /// Supports streaming responses
    pub supports_streaming: bool,
    /// Supports function calling
    pub supports_functions: bool,
    /// Supports image input
    pub supports_images: bool,
    /// Supports system messages
    pub supports_system_messages: bool,
    /// Maximum context length in tokens
    pub max_context_length: Option<u32>,
}

/// Message role in conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageRole {
    System,
    User,
    Assistant,
    Function,
}

/// Individual message in conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: MessageRole,
    pub content: String,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Conversation context for AI invocation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationContext {
    /// Messages in the conversation
    pub messages: Vec<Message>,
    /// System prompt/instructions
    pub system_prompt: Option<String>,
    /// Model configuration
    pub config: ModelConfig,
}

/// Unified AI Provider trait
/// 
/// This trait defines the contract that all AI providers must implement.
/// It uses Send + Sync bounds for multi-threaded safety and provides
/// both streaming and non-streaming interfaces.
#[async_trait]
pub trait AiProvider: Send + Sync {
    /// Get provider information and capabilities
    async fn get_provider_info(&self) -> ProviderInfo;

    /// Validate provider configuration and credentials
    async fn validate_configuration(&self) -> Result<bool, AiProviderError>;

    /// Primary streaming interface for AI model invocation
    /// 
    /// This method streams responses from the AI model, sending chunks
    /// through the provided Tauri app handle for real-time UI updates.
    /// 
    /// # Arguments
    /// * `context` - Conversation context including messages and configuration
    /// * `app_handle` - Tauri application handle for streaming responses to frontend
    /// 
    /// # Returns
    /// * `Ok(())` - Streaming completed successfully
    /// * `Err(AiProviderError)` - Provider-specific error occurred
    async fn invoke_model_stream(
        &self,
        context: ConversationContext,
        app_handle: &tauri::AppHandle,
    ) -> Result<(), AiProviderError>;

    /// Non-streaming interface for AI model invocation
    /// 
    /// This method returns the complete response as a single string.
    /// Useful for batch processing or when streaming is not required.
    /// 
    /// # Arguments
    /// * `context` - Conversation context including messages and configuration
    /// 
    /// # Returns
    /// * `Ok(String)` - Complete AI response
    /// * `Err(AiProviderError)` - Provider-specific error occurred
    async fn invoke_model(
        &self,
        context: ConversationContext,
    ) -> Result<String, AiProviderError>;

    /// Simple prompt interface for quick AI interactions
    /// 
    /// Convenience method for single-prompt interactions without conversation context.
    /// 
    /// # Arguments
    /// * `prompt` - User prompt/query
    /// * `config` - Optional model configuration (uses default if None)
    /// 
    /// # Returns
    /// * `Ok(String)` - AI response
    /// * `Err(AiProviderError)` - Provider-specific error occurred
    async fn invoke_simple(
        &self,
        prompt: String,
        config: Option<ModelConfig>,
    ) -> Result<String, AiProviderError> {
        let context = ConversationContext {
            messages: vec![Message {
                role: MessageRole::User,
                content: prompt,
                metadata: None,
            }],
            system_prompt: None,
            config: config.unwrap_or_default(),
        };
        
        self.invoke_model(context).await
    }

    /// Get list of available models for this provider
    async fn get_available_models(&self) -> Result<Vec<String>, AiProviderError>;

    /// Test connectivity to the AI service
    async fn test_connection(&self) -> Result<bool, AiProviderError>;

    /// Get provider-specific configuration schema
    /// 
    /// Returns a JSON schema describing the configuration parameters
    /// required for this provider (credentials, endpoints, etc.)
    fn get_config_schema(&self) -> serde_json::Value;

    /// Clone the provider for use in different contexts
    /// 
    /// This is required because trait objects cannot be cloned directly,
    /// but we need to be able to clone providers for state management.
    fn clone_provider(&self) -> Box<dyn AiProvider>;
}

/// Helper trait for provider registration and discovery
pub trait AiProviderFactory: Send + Sync {
    /// Create a new instance of the provider with given configuration
    fn create_provider(&self, config: serde_json::Value) -> Result<Box<dyn AiProvider>, AiProviderError>;
    
    /// Get the provider type name
    fn provider_type(&self) -> &'static str;
    
    /// Get the configuration schema for this provider type
    fn config_schema(&self) -> serde_json::Value;
}

/// Utility functions for working with AI providers
pub mod utils {
    use super::*;

    /// Create a simple user message
    pub fn create_user_message(content: String) -> Message {
        Message {
            role: MessageRole::User,
            content,
            metadata: None,
        }
    }

    /// Create a system message
    pub fn create_system_message(content: String) -> Message {
        Message {
            role: MessageRole::System,
            content,
            metadata: None,
        }
    }

    /// Create a conversation context from a simple prompt
    pub fn create_simple_context(prompt: String, system_prompt: Option<String>) -> ConversationContext {
        let mut messages = Vec::new();
        
        if let Some(system) = system_prompt {
            messages.push(create_system_message(system));
        }
        
        messages.push(create_user_message(prompt));
        
        ConversationContext {
            messages,
            system_prompt: None,
            config: ModelConfig::default(),
        }
    }

    /// Merge two model configurations, with the second taking precedence
    pub fn merge_configs(base: ModelConfig, override_config: ModelConfig) -> ModelConfig {
        ModelConfig {
            max_tokens: override_config.max_tokens.or(base.max_tokens),
            temperature: override_config.temperature.or(base.temperature),
            top_p: override_config.top_p.or(base.top_p),
            stop_sequences: override_config.stop_sequences.or(base.stop_sequences),
            extra_params: {
                let mut merged = base.extra_params;
                merged.extend(override_config.extra_params);
                merged
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_config_default() {
        let config = ModelConfig::default();
        assert_eq!(config.max_tokens, Some(4096));
        assert_eq!(config.temperature, Some(0.7));
        assert_eq!(config.top_p, Some(0.9));
        assert!(config.stop_sequences.is_none());
        assert!(config.extra_params.is_empty());
    }

    #[test]
    fn test_create_user_message() {
        let message = utils::create_user_message("Hello".to_string());
        assert!(matches!(message.role, MessageRole::User));
        assert_eq!(message.content, "Hello");
        assert!(message.metadata.is_none());
    }

    #[test]
    fn test_create_simple_context() {
        let context = utils::create_simple_context(
            "Hello".to_string(),
            Some("You are helpful".to_string())
        );
        
        assert_eq!(context.messages.len(), 2);
        assert!(matches!(context.messages[0].role, MessageRole::System));
        assert!(matches!(context.messages[1].role, MessageRole::User));
        assert_eq!(context.messages[1].content, "Hello");
    }

    #[test]
    fn test_merge_configs() {
        let base = ModelConfig {
            max_tokens: Some(1000),
            temperature: Some(0.5),
            top_p: Some(0.8),
            stop_sequences: None,
            extra_params: {
                let mut map = HashMap::new();
                map.insert("base_param".to_string(), serde_json::Value::String("base".to_string()));
                map
            },
        };

        let override_config = ModelConfig {
            max_tokens: Some(2000),
            temperature: None,
            top_p: Some(0.9),
            stop_sequences: Some(vec!["STOP".to_string()]),
            extra_params: {
                let mut map = HashMap::new();
                map.insert("override_param".to_string(), serde_json::Value::String("override".to_string()));
                map
            },
        };

        let merged = utils::merge_configs(base, override_config);
        
        assert_eq!(merged.max_tokens, Some(2000)); // overridden
        assert_eq!(merged.temperature, Some(0.5)); // from base
        assert_eq!(merged.top_p, Some(0.9)); // overridden
        assert_eq!(merged.stop_sequences, Some(vec!["STOP".to_string()])); // overridden
        assert_eq!(merged.extra_params.len(), 2); // merged
    }

    #[test]
    fn test_ai_provider_error_display() {
        let error = AiProviderError::AuthenticationError("Invalid API key".to_string());
        assert_eq!(error.to_string(), "Authentication error: Invalid API key");

        let error = AiProviderError::NetworkError("Connection timeout".to_string());
        assert_eq!(error.to_string(), "Network error: Connection timeout");
    }
}
