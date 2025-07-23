/// BedrockProvider Implementation - Task 2.2.3
/// 
/// This module implements the BedrockProvider struct that conforms to the AiProvider trait,
/// using aws-sdk-bedrockruntime for API calls and integrating with the credential_manager
/// module to retrieve AWS credentials from the OS keychain.

use crate::application::ai_provider::{
    AiProvider, AiProviderError, AiProviderFactory, ConversationContext, Message, MessageRole,
    ModelConfig, ProviderCapabilities, ProviderInfo, StreamChunk,
};
use crate::infrastructure::credential_manager::CredentialManager;
use async_trait::async_trait;
use aws_config::{BehaviorVersion, Region};
use aws_sdk_bedrockruntime::{
    config::Credentials,
    primitives::Blob,
    Client as BedrockClient,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use tauri::AppHandle;
use tokio_stream::StreamExt;
use tracing::{debug, error, info, warn};

/// Configuration for the BedrockProvider
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BedrockProviderConfig {
    /// AWS region for Bedrock API calls
    pub region: String,
    /// Default model to use for completions
    pub default_model: String,
    /// Maximum timeout for API requests (seconds)
    pub request_timeout: u64,
    /// Maximum number of retries for failed requests
    pub max_retries: u32,
    /// Whether to use streaming by default
    pub enable_streaming: bool,
}

impl Default for BedrockProviderConfig {
    fn default() -> Self {
        Self {
            region: "us-east-1".to_string(),
            default_model: "anthropic.claude-3-sonnet-20240229-v1:0".to_string(),
            request_timeout: 60,
            max_retries: 3,
            enable_streaming: true,
        }
    }
}

/// BedrockProvider struct implementing the AiProvider trait
pub struct BedrockProvider {
    /// Bedrock client instance
    client: Option<BedrockClient>,
    /// Provider configuration
    config: BedrockProviderConfig,
    /// Credential manager for AWS credentials
    credential_manager: CredentialManager,
    /// Provider capabilities
    capabilities: ProviderCapabilities,
}

impl BedrockProvider {
    /// Create a new BedrockProvider with default configuration
    pub fn new() -> Self {
        Self::with_config(BedrockProviderConfig::default())
    }

    /// Create a new BedrockProvider with custom configuration
    pub fn with_config(config: BedrockProviderConfig) -> Self {
        let capabilities = ProviderCapabilities {
            supports_streaming: config.enable_streaming,
            supports_functions: false,
            supports_images: true,
            supports_system_messages: true,
            max_context_length: Some(200000), // Claude 3 max context
        };

        Self {
            client: None,
            config,
            credential_manager: CredentialManager::new(),
            capabilities,
        }
    }

    /// Initialize the Bedrock client with credentials from keychain
    async fn initialize_client(&mut self) -> Result<(), AiProviderError> {
        if self.client.is_some() {
            return Ok(());
        }

        // Retrieve AWS credentials from keychain
        let (access_key_id, secret_access_key, region) = self
            .credential_manager
            .retrieve_aws_bedrock_credentials()
            .map_err(|e| {
                error!("Failed to retrieve AWS Bedrock credentials: {}", e);
                AiProviderError::AuthenticationError(format!(
                    "Failed to retrieve AWS credentials: {}",
                    e
                ))
            })?;

        // Use region from credentials if available, otherwise use config
        let effective_region = if !region.is_empty() {
            region
        } else {
            self.config.region.clone()
        };

        // Create AWS credentials
        let credentials = Credentials::new(
            access_key_id,
            secret_access_key,
            None, // session token
            None, // expiration
            "bedrock-provider",
        );

        // Build AWS config
        let aws_config = aws_config::defaults(BehaviorVersion::latest())
            .region(Region::new(effective_region))
            .credentials_provider(credentials)
            .load()
            .await;

        // Create Bedrock client
        self.client = Some(BedrockClient::new(&aws_config));

        info!("BedrockProvider: Client initialized successfully");
        Ok(())
    }

    /// Get the Bedrock client, initializing if necessary
    async fn get_client(&mut self) -> Result<&BedrockClient, AiProviderError> {
        self.initialize_client().await?;
        self.client.as_ref().ok_or_else(|| {
            AiProviderError::ConfigurationError("Failed to initialize Bedrock client".to_string())
        })
    }

    /// Convert conversation context to Claude model payload format
    fn context_to_claude_payload(&self, context: &ConversationContext) -> Result<Value, AiProviderError> {
        let mut messages = Vec::new();
        let mut system_prompt = None;

        // Process messages
        for message in &context.messages {
            match message.role {
                MessageRole::System => {
                    system_prompt = Some(message.content.clone());
                }
                MessageRole::User => {
                    messages.push(json!({
                        "role": "user",
                        "content": message.content
                    }));
                }
                MessageRole::Assistant => {
                    messages.push(json!({
                        "role": "assistant",
                        "content": message.content
                    }));
                }
                MessageRole::Function => {
                    // Convert function messages to user messages for Claude
                    messages.push(json!({
                        "role": "user",
                        "content": format!("Function result: {}", message.content)
                    }));
                }
            }
        }

        // Use system prompt from context or messages
        let effective_system = system_prompt
            .or_else(|| context.system_prompt.clone())
            .unwrap_or_else(|| "You are a helpful AI assistant.".to_string());

        let mut payload = json!({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": context.config.max_tokens.unwrap_or(4096),
            "messages": messages,
            "system": effective_system
        });

        // Add optional parameters
        if let Some(temperature) = context.config.temperature {
            payload["temperature"] = json!(temperature);
        }
        if let Some(top_p) = context.config.top_p {
            payload["top_p"] = json!(top_p);
        }
        if let Some(stop_sequences) = &context.config.stop_sequences {
            payload["stop_sequences"] = json!(stop_sequences);
        }

        Ok(payload)
    }

    /// Parse Claude response from Bedrock
    fn parse_claude_response(&self, response_body: &[u8]) -> Result<String, AiProviderError> {
        let response_json: Value = serde_json::from_slice(response_body).map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to parse response JSON: {}", e))
        })?;

        if let Some(content) = response_json["content"].as_array() {
            if let Some(first_content) = content.first() {
                if let Some(text) = first_content["text"].as_str() {
                    return Ok(text.to_string());
                }
            }
        }
        Err(AiProviderError::ProviderError(
            "Invalid Claude response format".to_string(),
        ))
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
                metadata.insert("provider".to_string(), serde_json::Value::String("bedrock".to_string()));
                metadata.insert("model".to_string(), serde_json::Value::String(self.config.default_model.clone()));
                metadata.insert("region".to_string(), serde_json::Value::String(self.config.region.clone()));
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
impl AiProvider for BedrockProvider {
    async fn get_provider_info(&self) -> ProviderInfo {
        // Check if credentials are available
        let is_available = self
            .credential_manager
            .retrieve_aws_bedrock_credentials()
            .is_ok();

        let supported_models = vec![
            "anthropic.claude-3-sonnet-20240229-v1:0".to_string(),
            "anthropic.claude-3-haiku-20240307-v1:0".to_string(),
            "anthropic.claude-3-opus-20240229-v1:0".to_string(),
        ];

        ProviderInfo {
            name: "bedrock".to_string(),
            display_name: "AWS Bedrock".to_string(),
            description: "AWS Bedrock foundation models (Claude, Llama, Titan)".to_string(),
            is_available,
            supported_models,
            capabilities: self.capabilities.clone(),
        }
    }

    async fn validate_configuration(&self) -> Result<bool, AiProviderError> {
        // Check if credentials are available
        let _credentials = self
            .credential_manager
            .retrieve_aws_bedrock_credentials()
            .map_err(|e| {
                AiProviderError::AuthenticationError(format!(
                    "AWS Bedrock credentials not found: {}",
                    e
                ))
            })?;

        // Try to create a client and make a simple test call
        let mut test_provider = self.clone();
        let client = test_provider.get_client().await?;

        // Test with a minimal request to verify credentials and permissions
        let test_payload = json!({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10,
            "messages": [{"role": "user", "content": "Hi"}],
            "system": "Respond with just 'Hello'"
        });

        let payload_blob = Blob::new(serde_json::to_vec(&test_payload).map_err(|e| {
            AiProviderError::ConfigurationError(format!("Failed to serialize test payload: {}", e))
        })?);

        match client
            .invoke_model()
            .model_id(&self.config.default_model)
            .body(payload_blob)
            .send()
            .await
        {
            Ok(_) => Ok(true),
            Err(e) => {
                error!("Bedrock configuration validation failed: {}", e);
                Err(AiProviderError::ConfigurationError(format!(
                    "Bedrock API test failed: {}",
                    e
                )))
            }
        }
    }

    async fn invoke_model_stream(
        &self,
        context: ConversationContext,
        app_handle: &AppHandle,
    ) -> Result<(), AiProviderError> {
        debug!("BedrockProvider: Starting streaming completion");

        let mut provider = self.clone();
        let client = provider.get_client().await?;

        let model_id = &self.config.default_model;
        let payload = self.context_to_claude_payload(&context)?;

        let payload_blob = Blob::new(serde_json::to_vec(&payload).map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to serialize payload: {}", e))
        })?);

        // Use streaming API
        let response = client
            .invoke_model_with_response_stream()
            .model_id(model_id)
            .body(payload_blob)
            .send()
            .await
            .map_err(|e| {
                error!("BedrockProvider: Streaming request failed: {}", e);
                AiProviderError::ProviderError(format!("Bedrock streaming request failed: {}", e))
            })?;

        // Process the response stream
        let mut stream = response.body;
        while let Some(event) = stream.next().await {
            match event {
                Ok(event) => {
                    if let Some(chunk) = event.chunk {
                        // Parse Claude streaming format
                        if let Ok(chunk_json) = serde_json::from_slice::<Value>(&chunk.bytes) {
                            if let Some(delta) = chunk_json["delta"].as_object() {
                                if let Some(text) = delta["text"].as_str() {
                                    if !text.is_empty() {
                                        self.send_stream_chunk(app_handle, text.to_string(), false).await?;
                                    }
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    error!("BedrockProvider: Stream error: {}", e);
                    return Err(AiProviderError::ProviderError(format!(
                        "Streaming error: {}",
                        e
                    )));
                }
            }
        }

        // Send final chunk
        self.send_stream_chunk(app_handle, "".to_string(), true).await?;

        info!("BedrockProvider: Streaming completion successful");
        Ok(())
    }

    async fn invoke_model(&self, context: ConversationContext) -> Result<String, AiProviderError> {
        debug!("BedrockProvider: Starting non-streaming completion");

        let mut provider = self.clone();
        let client = provider.get_client().await?;

        let model_id = &self.config.default_model;
        let payload = self.context_to_claude_payload(&context)?;

        let payload_blob = Blob::new(serde_json::to_vec(&payload).map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to serialize payload: {}", e))
        })?);

        let response = client
            .invoke_model()
            .model_id(model_id)
            .body(payload_blob)
            .send()
            .await
            .map_err(|e| {
                error!("BedrockProvider: Request failed: {}", e);
                AiProviderError::ProviderError(format!("Bedrock request failed: {}", e))
            })?;

        let response_body = response.body.as_ref();
        let result = self.parse_claude_response(response_body)?;

        info!("BedrockProvider: Non-streaming completion successful");
        Ok(result)
    }

    async fn get_available_models(&self) -> Result<Vec<String>, AiProviderError> {
        Ok(vec![
            "anthropic.claude-3-sonnet-20240229-v1:0".to_string(),
            "anthropic.claude-3-haiku-20240307-v1:0".to_string(),
            "anthropic.claude-3-opus-20240229-v1:0".to_string(),
        ])
    }

    async fn test_connection(&self) -> Result<bool, AiProviderError> {
        self.validate_configuration().await
    }

    fn get_config_schema(&self) -> serde_json::Value {
        serde_json::json!({
            "type": "object",
            "properties": {
                "region": {
                    "type": "string",
                    "description": "AWS region for Bedrock API calls",
                    "default": "us-east-1"
                },
                "default_model": {
                    "type": "string",
                    "description": "Default model to use for completions",
                    "default": "anthropic.claude-3-sonnet-20240229-v1:0"
                },
                "request_timeout": {
                    "type": "integer",
                    "description": "Maximum timeout for API requests in seconds",
                    "default": 60
                },
                "enable_streaming": {
                    "type": "boolean",
                    "description": "Whether to use streaming by default",
                    "default": true
                }
            },
            "required": ["region", "default_model"]
        })
    }

    fn clone_provider(&self) -> Box<dyn AiProvider> {
        Box::new(self.clone())
    }
}

impl Clone for BedrockProvider {
    fn clone(&self) -> Self {
        Self {
            client: None, // Client will be re-initialized when needed
            config: self.config.clone(),
            credential_manager: CredentialManager::new(),
            capabilities: self.capabilities.clone(),
        }
    }
}

/// Factory for creating BedrockProvider instances
pub struct BedrockProviderFactory;

impl AiProviderFactory for BedrockProviderFactory {
    fn create_provider(&self, config: serde_json::Value) -> Result<Box<dyn AiProvider>, AiProviderError> {
        let provider_config: BedrockProviderConfig = serde_json::from_value(config)
            .map_err(|e| AiProviderError::ConfigurationError(format!("Invalid configuration: {}", e)))?;
        
        Ok(Box::new(BedrockProvider::with_config(provider_config)))
    }

    fn provider_type(&self) -> &'static str {
        "bedrock"
    }

    fn config_schema(&self) -> serde_json::Value {
        BedrockProvider::new().get_config_schema()
    }
}

impl Default for BedrockProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application::ai_provider::utils;

    #[test]
    fn test_bedrock_provider_creation() {
        let provider = BedrockProvider::new();
        let info = tokio_test::block_on(provider.get_provider_info());
        
        assert_eq!(info.name, "bedrock");
        assert_eq!(info.display_name, "AWS Bedrock");
        assert!(info.capabilities.supports_streaming);
        assert!(info.capabilities.supports_system_messages);
        assert!(info.capabilities.supports_images);
    }

    #[test]
    fn test_bedrock_provider_config() {
        let config = BedrockProviderConfig {
            region: "us-west-2".to_string(),
            default_model: "anthropic.claude-3-haiku-20240307-v1:0".to_string(),
            request_timeout: 120,
            enable_streaming: false,
            ..Default::default()
        };

        let provider = BedrockProvider::with_config(config.clone());
        assert_eq!(provider.config.region, "us-west-2");
        assert_eq!(provider.config.default_model, "anthropic.claude-3-haiku-20240307-v1:0");
        assert_eq!(provider.config.request_timeout, 120);
        assert!(!provider.config.enable_streaming);
    }

    #[test]
    fn test_context_to_claude_payload() {
        let provider = BedrockProvider::new();
        let context = utils::create_simple_context(
            "Hello, Claude!".to_string(),
            Some("You are helpful.".to_string()),
        );

        let payload = provider.context_to_claude_payload(&context).unwrap();
        
        assert_eq!(payload["anthropic_version"], "bedrock-2023-05-31");
        assert_eq!(payload["system"], "You are helpful.");
        assert!(payload["messages"].as_array().unwrap().len() > 0);
        assert_eq!(payload["messages"][0]["role"], "user");
        assert_eq!(payload["messages"][0]["content"], "Hello, Claude!");
    }

    #[test]
    fn test_factory_creation() {
        let factory = BedrockProviderFactory;
        assert_eq!(factory.provider_type(), "bedrock");
        
        let config = serde_json::json!({
            "region": "eu-west-1",
            "default_model": "anthropic.claude-3-opus-20240229-v1:0",
            "enable_streaming": false
        });
        
        let provider = factory.create_provider(config).unwrap();
        let info = tokio_test::block_on(provider.get_provider_info());
        assert_eq!(info.name, "bedrock");
    }

    #[test]
    fn test_config_schema() {
        let provider = BedrockProvider::new();
        let schema = provider.get_config_schema();
        
        assert_eq!(schema["type"], "object");
        assert!(schema["properties"]["region"].is_object());
        assert!(schema["properties"]["default_model"].is_object());
        assert!(schema["required"].as_array().unwrap().contains(&serde_json::Value::String("region".to_string())));
    }
}
