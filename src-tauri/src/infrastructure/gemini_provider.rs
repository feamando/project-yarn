/// GeminiProvider Implementation - Task 2.2.4
/// 
/// This module implements the GeminiProvider struct that conforms to the AiProvider trait,
/// using the gemini-rs crate for API calls and integrating with the credential_manager
/// module to retrieve Google Gemini API credentials from the OS keychain.
/// 
/// The GeminiProvider provides streaming and non-streaming interfaces for Google Gemini
/// models, supporting various Gemini model families like Gemini Pro and Gemini Pro Vision.

use crate::application::ai_provider::{
    AiProvider, AiProviderError, AiProviderFactory, ConversationContext, Message, MessageRole,
    ModelConfig, ProviderCapabilities, ProviderInfo, StreamChunk,
};
use crate::infrastructure::credential_manager::CredentialManager;
use async_trait::async_trait;
use reqwest::{Client, RequestBuilder};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use tauri::AppHandle;
use tokio::time::{sleep, Duration};
use tracing::{debug, error, info, warn};

/// Configuration for the GeminiProvider
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeminiProviderConfig {
    /// Default model to use for completions
    pub default_model: String,
    /// API endpoint base URL
    pub api_endpoint: String,
    /// Maximum timeout for API requests (seconds)
    pub request_timeout: u64,
    /// Maximum number of retries for failed requests
    pub max_retries: u32,
    /// Whether to use streaming by default
    pub enable_streaming: bool,
    /// Safety settings for content filtering
    pub safety_settings: GeminiSafetySettings,
}

impl Default for GeminiProviderConfig {
    fn default() -> Self {
        Self {
            default_model: "gemini-pro".to_string(),
            api_endpoint: "https://generativelanguage.googleapis.com".to_string(),
            request_timeout: 60,
            max_retries: 3,
            enable_streaming: true,
            safety_settings: GeminiSafetySettings::default(),
        }
    }
}

/// Safety settings for Gemini content filtering
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeminiSafetySettings {
    pub harassment: String,
    pub hate_speech: String,
    pub sexually_explicit: String,
    pub dangerous_content: String,
}

impl Default for GeminiSafetySettings {
    fn default() -> Self {
        Self {
            harassment: "BLOCK_MEDIUM_AND_ABOVE".to_string(),
            hate_speech: "BLOCK_MEDIUM_AND_ABOVE".to_string(),
            sexually_explicit: "BLOCK_MEDIUM_AND_ABOVE".to_string(),
            dangerous_content: "BLOCK_MEDIUM_AND_ABOVE".to_string(),
        }
    }
}

/// Supported Gemini model families and their configurations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GeminiModel {
    GeminiPro,
    GeminiProVision,
    Gemini15Pro,
    Gemini15Flash,
}

impl GeminiModel {
    /// Get the model ID for Gemini API calls
    pub fn model_id(&self) -> &'static str {
        match self {
            GeminiModel::GeminiPro => "gemini-pro",
            GeminiModel::GeminiProVision => "gemini-pro-vision",
            GeminiModel::Gemini15Pro => "gemini-1.5-pro",
            GeminiModel::Gemini15Flash => "gemini-1.5-flash",
        }
    }

    /// Get the display name for the model
    pub fn display_name(&self) -> &'static str {
        match self {
            GeminiModel::GeminiPro => "Gemini Pro",
            GeminiModel::GeminiProVision => "Gemini Pro Vision",
            GeminiModel::Gemini15Pro => "Gemini 1.5 Pro",
            GeminiModel::Gemini15Flash => "Gemini 1.5 Flash",
        }
    }

    /// Get maximum context length for the model
    pub fn max_context_length(&self) -> u32 {
        match self {
            GeminiModel::GeminiPro => 32768,
            GeminiModel::GeminiProVision => 16384,
            GeminiModel::Gemini15Pro => 2097152, // 2M tokens
            GeminiModel::Gemini15Flash => 1048576, // 1M tokens
        }
    }

    /// Check if the model supports streaming
    pub fn supports_streaming(&self) -> bool {
        match self {
            GeminiModel::GeminiPro => true,
            GeminiModel::GeminiProVision => false, // Vision models don't support streaming
            GeminiModel::Gemini15Pro => true,
            GeminiModel::Gemini15Flash => true,
        }
    }

    /// Check if the model supports images
    pub fn supports_images(&self) -> bool {
        match self {
            GeminiModel::GeminiPro => false,
            GeminiModel::GeminiProVision => true,
            GeminiModel::Gemini15Pro => true,
            GeminiModel::Gemini15Flash => true,
        }
    }
}

/// Gemini API response structure
#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Option<Vec<GeminiCandidate>>,
    #[serde(rename = "promptFeedback")]
    prompt_feedback: Option<GeminiPromptFeedback>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: Option<GeminiContent>,
    #[serde(rename = "finishReason")]
    finish_reason: Option<String>,
    #[serde(rename = "safetyRatings")]
    safety_ratings: Option<Vec<GeminiSafetyRating>>,
}

#[derive(Debug, Deserialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
    role: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GeminiPart {
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GeminiPromptFeedback {
    #[serde(rename = "blockReason")]
    block_reason: Option<String>,
    #[serde(rename = "safetyRatings")]
    safety_ratings: Option<Vec<GeminiSafetyRating>>,
}

#[derive(Debug, Deserialize)]
struct GeminiSafetyRating {
    category: String,
    probability: String,
}

/// GeminiProvider struct implementing the AiProvider trait
/// 
/// This provider manages communication with Google Gemini models,
/// providing both streaming and non-streaming interfaces with credential management.
pub struct GeminiProvider {
    /// HTTP client for API requests
    client: Client,
    /// Provider configuration
    config: GeminiProviderConfig,
    /// Credential manager for API key
    credential_manager: CredentialManager,
    /// Provider capabilities
    capabilities: ProviderCapabilities,
}

impl GeminiProvider {
    /// Create a new GeminiProvider with default configuration
    pub fn new() -> Self {
        Self::with_config(GeminiProviderConfig::default())
    }

    /// Create a new GeminiProvider with custom configuration
    pub fn with_config(config: GeminiProviderConfig) -> Self {
        let capabilities = ProviderCapabilities {
            supports_streaming: config.enable_streaming,
            supports_functions: false, // Not implemented in current version
            supports_images: true,     // Gemini Pro Vision and 1.5 models support images
            supports_system_messages: true,
            max_context_length: Some(2097152), // Gemini 1.5 Pro max context
        };

        let client = Client::builder()
            .timeout(Duration::from_secs(config.request_timeout))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            client,
            config,
            credential_manager: CredentialManager::new(),
            capabilities,
        }
    }

    /// Get API key from credential manager
    fn get_api_key(&self) -> Result<String, AiProviderError> {
        self.credential_manager
            .retrieve_gemini_api_key()
            .map_err(|e| {
                error!("Failed to retrieve Gemini API key: {}", e);
                AiProviderError::AuthenticationError(format!(
                    "Failed to retrieve Gemini API key: {}",
                    e
                ))
            })
    }

    /// Build API URL for the given model and endpoint
    fn build_api_url(&self, model_id: &str, endpoint: &str) -> String {
        format!(
            "{}/v1/models/{}:{}",
            self.config.api_endpoint, model_id, endpoint
        )
    }

    /// Convert conversation context to Gemini request payload
    fn context_to_gemini_payload(&self, context: &ConversationContext) -> Result<Value, AiProviderError> {
        let mut contents = Vec::new();
        let mut system_instruction = None;

        // Process messages
        for message in &context.messages {
            match message.role {
                MessageRole::System => {
                    system_instruction = Some(json!({
                        "parts": [{"text": message.content}]
                    }));
                }
                MessageRole::User => {
                    contents.push(json!({
                        "role": "user",
                        "parts": [{"text": message.content}]
                    }));
                }
                MessageRole::Assistant => {
                    contents.push(json!({
                        "role": "model",
                        "parts": [{"text": message.content}]
                    }));
                }
                MessageRole::Function => {
                    // Convert function messages to user messages for Gemini
                    contents.push(json!({
                        "role": "user",
                        "parts": [{"text": format!("Function result: {}", message.content)}]
                    }));
                }
            }
        }

        // Use system prompt from context or messages
        if system_instruction.is_none() {
            if let Some(system_prompt) = &context.system_prompt {
                system_instruction = Some(json!({
                    "parts": [{"text": system_prompt}]
                }));
            }
        }

        let mut payload = json!({
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": context.config.max_tokens.unwrap_or(2048),
            },
            "safetySettings": [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": self.config.safety_settings.harassment
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": self.config.safety_settings.hate_speech
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": self.config.safety_settings.sexually_explicit
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": self.config.safety_settings.dangerous_content
                }
            ]
        });

        // Add system instruction if present
        if let Some(system_inst) = system_instruction {
            payload["systemInstruction"] = system_inst;
        }

        // Add optional parameters to generationConfig
        if let Some(temperature) = context.config.temperature {
            payload["generationConfig"]["temperature"] = json!(temperature);
        }
        if let Some(top_p) = context.config.top_p {
            payload["generationConfig"]["topP"] = json!(top_p);
        }
        if let Some(stop_sequences) = &context.config.stop_sequences {
            payload["generationConfig"]["stopSequences"] = json!(stop_sequences);
        }

        Ok(payload)
    }

    /// Parse response from Gemini API
    fn parse_gemini_response(&self, response: &GeminiResponse) -> Result<String, AiProviderError> {
        // Check for prompt feedback issues
        if let Some(feedback) = &response.prompt_feedback {
            if let Some(block_reason) = &feedback.block_reason {
                return Err(AiProviderError::ProviderError(format!(
                    "Request blocked by safety filters: {}",
                    block_reason
                )));
            }
        }

        // Extract text from candidates
        if let Some(candidates) = &response.candidates {
            if let Some(candidate) = candidates.first() {
                // Check finish reason
                if let Some(finish_reason) = &candidate.finish_reason {
                    if finish_reason == "SAFETY" {
                        return Err(AiProviderError::ProviderError(
                            "Response blocked by safety filters".to_string(),
                        ));
                    }
                }

                // Extract text content
                if let Some(content) = &candidate.content {
                    let text_parts: Vec<String> = content
                        .parts
                        .iter()
                        .filter_map(|part| part.text.clone())
                        .collect();
                    
                    if !text_parts.is_empty() {
                        return Ok(text_parts.join(""));
                    }
                }
            }
        }

        Err(AiProviderError::ProviderError(
            "No valid response content found".to_string(),
        ))
    }

    /// Create authenticated request builder
    fn create_request(&self, url: &str) -> Result<RequestBuilder, AiProviderError> {
        let api_key = self.get_api_key()?;
        Ok(self
            .client
            .post(url)
            .header("Content-Type", "application/json")
            .query(&[("key", api_key)]))
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
                metadata.insert("provider".to_string(), serde_json::Value::String("gemini".to_string()));
                metadata.insert("model".to_string(), serde_json::Value::String(self.config.default_model.clone()));
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
impl AiProvider for GeminiProvider {
    async fn get_provider_info(&self) -> ProviderInfo {
        // Check if API key is available
        let is_available = self.credential_manager.retrieve_gemini_api_key().is_ok();

        let supported_models = vec![
            GeminiModel::GeminiPro.model_id().to_string(),
            GeminiModel::GeminiProVision.model_id().to_string(),
            GeminiModel::Gemini15Pro.model_id().to_string(),
            GeminiModel::Gemini15Flash.model_id().to_string(),
        ];

        ProviderInfo {
            name: "gemini".to_string(),
            display_name: "Google Gemini".to_string(),
            description: "Google Gemini foundation models (Pro, Pro Vision, 1.5 Pro, 1.5 Flash)".to_string(),
            is_available,
            supported_models,
            capabilities: self.capabilities.clone(),
        }
    }

    async fn validate_configuration(&self) -> Result<bool, AiProviderError> {
        // Check if API key is available
        let _api_key = self.get_api_key()?;

        // Test with a minimal request to verify API key
        let test_payload = json!({
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": "Hi"}]
                }
            ],
            "generationConfig": {
                "maxOutputTokens": 10
            }
        });

        let url = self.build_api_url(&self.config.default_model, "generateContent");
        let request = self.create_request(&url)?;

        match request.json(&test_payload).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    Ok(true)
                } else {
                    let status = response.status();
                    let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                    error!("Gemini configuration validation failed: {} - {}", status, error_text);
                    Err(AiProviderError::ConfigurationError(format!(
                        "Gemini API test failed: {} - {}",
                        status, error_text
                    )))
                }
            }
            Err(e) => {
                error!("Gemini configuration validation failed: {}", e);
                Err(AiProviderError::ConfigurationError(format!(
                    "Gemini API test failed: {}",
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
        debug!("GeminiProvider: Starting streaming completion");

        let model_id = &self.config.default_model;
        let payload = self.context_to_gemini_payload(&context)?;

        // Check if model supports streaming
        if !self.config.enable_streaming || model_id.contains("vision") {
            // Fall back to non-streaming for models that don't support it
            warn!("GeminiProvider: Model doesn't support streaming, using non-streaming mode");
            let response = self.invoke_model(context).await?;
            self.send_stream_chunk(app_handle, response, false).await?;
            self.send_stream_chunk(app_handle, "".to_string(), true).await?;
            return Ok(());
        }

        // Use streaming API
        let url = self.build_api_url(model_id, "streamGenerateContent");
        let request = self.create_request(&url)?;

        let response = request.json(&payload).send().await.map_err(|e| {
            error!("GeminiProvider: Streaming request failed: {}", e);
            AiProviderError::ProviderError(format!("Gemini streaming request failed: {}", e))
        })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            error!("GeminiProvider: Streaming request failed: {} - {}", status, error_text);
            return Err(AiProviderError::ProviderError(format!(
                "Gemini streaming request failed: {} - {}",
                status, error_text
            )));
        }

        // Process streaming response
        let response_text = response.text().await.map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to read streaming response: {}", e))
        })?;

        // Parse streaming response (Gemini returns newline-delimited JSON)
        for line in response_text.lines() {
            if line.trim().is_empty() {
                continue;
            }

            match serde_json::from_str::<GeminiResponse>(line) {
                Ok(chunk_response) => {
                    match self.parse_gemini_response(&chunk_response) {
                        Ok(text) => {
                            if !text.is_empty() {
                                self.send_stream_chunk(app_handle, text, false).await?;
                            }
                        }
                        Err(e) => {
                            warn!("GeminiProvider: Failed to parse chunk: {}", e);
                            // Continue processing other chunks
                        }
                    }
                }
                Err(e) => {
                    warn!("GeminiProvider: Failed to parse JSON chunk: {}", e);
                    // Continue processing other chunks
                }
            }
        }

        // Send final chunk
        self.send_stream_chunk(app_handle, "".to_string(), true).await?;

        info!("GeminiProvider: Streaming completion successful");
        Ok(())
    }

    async fn invoke_model(&self, context: ConversationContext) -> Result<String, AiProviderError> {
        debug!("GeminiProvider: Starting non-streaming completion");

        let model_id = &self.config.default_model;
        let payload = self.context_to_gemini_payload(&context)?;

        let url = self.build_api_url(model_id, "generateContent");
        let request = self.create_request(&url)?;

        let response = request.json(&payload).send().await.map_err(|e| {
            error!("GeminiProvider: Request failed: {}", e);
            AiProviderError::ProviderError(format!("Gemini request failed: {}", e))
        })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            error!("GeminiProvider: Request failed: {} - {}", status, error_text);
            return Err(AiProviderError::ProviderError(format!(
                "Gemini request failed: {} - {}",
                status, error_text
            )));
        }

        let gemini_response: GeminiResponse = response.json().await.map_err(|e| {
            AiProviderError::ProviderError(format!("Failed to parse response JSON: {}", e))
        })?;

        let result = self.parse_gemini_response(&gemini_response)?;

        info!("GeminiProvider: Non-streaming completion successful");
        Ok(result)
    }

    async fn get_available_models(&self) -> Result<Vec<String>, AiProviderError> {
        Ok(vec![
            GeminiModel::GeminiPro.model_id().to_string(),
            GeminiModel::GeminiProVision.model_id().to_string(),
            GeminiModel::Gemini15Pro.model_id().to_string(),
            GeminiModel::Gemini15Flash.model_id().to_string(),
        ])
    }

    async fn test_connection(&self) -> Result<bool, AiProviderError> {
        self.validate_configuration().await
    }

    fn get_config_schema(&self) -> serde_json::Value {
        serde_json::json!({
            "type": "object",
            "properties": {
                "default_model": {
                    "type": "string",
                    "description": "Default model to use for completions",
                    "default": "gemini-pro",
                    "enum": ["gemini-pro", "gemini-pro-vision", "gemini-1.5-pro", "gemini-1.5-flash"]
                },
                "api_endpoint": {
                    "type": "string",
                    "description": "API endpoint base URL",
                    "default": "https://generativelanguage.googleapis.com"
                },
                "request_timeout": {
                    "type": "integer",
                    "description": "Maximum timeout for API requests in seconds",
                    "default": 60,
                    "minimum": 10,
                    "maximum": 300
                },
                "max_retries": {
                    "type": "integer",
                    "description": "Maximum number of retries for failed requests",
                    "default": 3,
                    "minimum": 0,
                    "maximum": 10
                },
                "enable_streaming": {
                    "type": "boolean",
                    "description": "Whether to use streaming by default",
                    "default": true
                },
                "safety_settings": {
                    "type": "object",
                    "description": "Safety settings for content filtering",
                    "properties": {
                        "harassment": {"type": "string", "default": "BLOCK_MEDIUM_AND_ABOVE"},
                        "hate_speech": {"type": "string", "default": "BLOCK_MEDIUM_AND_ABOVE"},
                        "sexually_explicit": {"type": "string", "default": "BLOCK_MEDIUM_AND_ABOVE"},
                        "dangerous_content": {"type": "string", "default": "BLOCK_MEDIUM_AND_ABOVE"}
                    }
                }
            },
            "required": ["default_model"]
        })
    }

    fn clone_provider(&self) -> Box<dyn AiProvider> {
        Box::new(self.clone())
    }
}

impl Clone for GeminiProvider {
    fn clone(&self) -> Self {
        Self::with_config(self.config.clone())
    }
}

/// Factory for creating GeminiProvider instances
pub struct GeminiProviderFactory;

impl AiProviderFactory for GeminiProviderFactory {
    fn create_provider(&self, config: serde_json::Value) -> Result<Box<dyn AiProvider>, AiProviderError> {
        let provider_config: GeminiProviderConfig = serde_json::from_value(config)
            .map_err(|e| AiProviderError::ConfigurationError(format!("Invalid configuration: {}", e)))?;
        
        Ok(Box::new(GeminiProvider::with_config(provider_config)))
    }

    fn provider_type(&self) -> &'static str {
        "gemini"
    }

    fn config_schema(&self) -> serde_json::Value {
        GeminiProvider::new().get_config_schema()
    }
}

impl Default for GeminiProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application::ai_provider::utils;

    #[test]
    fn test_gemini_provider_creation() {
        let provider = GeminiProvider::new();
        let info = tokio_test::block_on(provider.get_provider_info());
        
        assert_eq!(info.name, "gemini");
        assert_eq!(info.display_name, "Google Gemini");
        assert!(info.capabilities.supports_streaming);
        assert!(info.capabilities.supports_system_messages);
        assert!(info.capabilities.supports_images);
    }

    #[test]
    fn test_gemini_provider_config() {
        let config = GeminiProviderConfig {
            default_model: "gemini-1.5-pro".to_string(),
            api_endpoint: "https://custom-endpoint.com".to_string(),
            request_timeout: 120,
            enable_streaming: false,
            ..Default::default()
        };

        let provider = GeminiProvider::with_config(config.clone());
        assert_eq!(provider.config.default_model, "gemini-1.5-pro");
        assert_eq!(provider.config.api_endpoint, "https://custom-endpoint.com");
        assert_eq!(provider.config.request_timeout, 120);
        assert!(!provider.config.enable_streaming);
    }

    #[test]
    fn test_context_to_gemini_payload() {
        let provider = GeminiProvider::new();
        let context = utils::create_simple_context(
            "Hello, Gemini!".to_string(),
            Some("You are helpful.".to_string()),
        );

        let payload = provider.context_to_gemini_payload(&context).unwrap();
        
        assert!(payload["systemInstruction"].is_object());
        assert!(payload["contents"].as_array().unwrap().len() > 0);
        assert_eq!(payload["contents"][0]["role"], "user");
        assert_eq!(payload["contents"][0]["parts"][0]["text"], "Hello, Gemini!");
        assert!(payload["safetySettings"].as_array().unwrap().len() == 4);
    }

    #[test]
    fn test_build_api_url() {
        let provider = GeminiProvider::new();
        let url = provider.build_api_url("gemini-pro", "generateContent");
        
        assert_eq!(url, "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent");
    }

    #[test]
    fn test_factory_creation() {
        let factory = GeminiProviderFactory;
        assert_eq!(factory.provider_type(), "gemini");
        
        let config = serde_json::json!({
            "default_model": "gemini-1.5-flash",
            "enable_streaming": false
        });
        
        let provider = factory.create_provider(config).unwrap();
        let info = tokio_test::block_on(provider.get_provider_info());
        assert_eq!(info.name, "gemini");
    }

    #[test]
    fn test_config_schema() {
        let provider = GeminiProvider::new();
        let schema = provider.get_config_schema();
        
        assert_eq!(schema["type"], "object");
        assert!(schema["properties"]["default_model"].is_object());
        assert!(schema["properties"]["safety_settings"].is_object());
        assert!(schema["required"].as_array().unwrap().contains(&serde_json::Value::String("default_model".to_string())));
    }

    #[test]
    fn test_gemini_model_properties() {
        assert_eq!(GeminiModel::GeminiPro.model_id(), "gemini-pro");
        assert_eq!(GeminiModel::Gemini15Pro.display_name(), "Gemini 1.5 Pro");
        assert_eq!(GeminiModel::Gemini15Pro.max_context_length(), 2097152);
        assert!(GeminiModel::GeminiPro.supports_streaming());
        assert!(!GeminiModel::GeminiPro.supports_images());
        assert!(GeminiModel::GeminiProVision.supports_images());
    }
}
