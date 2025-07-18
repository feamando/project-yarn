use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use tokio::io::AsyncWriteExt;
use tracing::{error, info, warn};

/// Configuration for model management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    pub cache_dir: PathBuf,
    pub models: HashMap<String, ModelInfo>,
    pub registry_url: Option<String>,
}

/// Information about a specific model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub download_url: String,
    pub checksum: String,
    pub size_bytes: u64,
    pub format: ModelFormat,
    pub compatibility: Vec<String>,
}

/// Supported model formats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ModelFormat {
    ONNX,
    SafeTensors,
    PyTorch,
    Bin,
}

/// Model download progress information
#[derive(Debug, Clone)]
pub struct DownloadProgress {
    pub model_id: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub percentage: f64,
    pub speed_bps: u64,
}

/// Errors that can occur during model operations
#[derive(Debug, thiserror::Error)]
pub enum ModelError {
    #[error("Model not found: {0}")]
    ModelNotFound(String),
    #[error("Download failed: {0}")]
    DownloadFailed(String),
    #[error("Checksum verification failed for model: {0}")]
    ChecksumMismatch(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("HTTP error: {0}")]
    HttpError(#[from] reqwest::Error),
    #[error("Configuration error: {0}")]
    ConfigError(String),
}

/// Manager for AI model assets
pub struct ModelAssetManager {
    cache_dir: PathBuf,
    client: Client,
    config: ModelConfig,
}

impl ModelAssetManager {
    /// Create a new ModelAssetManager instance
    pub fn new(cache_dir: PathBuf) -> Result<Self> {
        // Create cache directory if it doesn't exist
        fs::create_dir_all(&cache_dir)
            .with_context(|| format!("Failed to create cache directory: {:?}", cache_dir))?;

        // Load configuration
        let config = Self::load_config(&cache_dir)?;

        // Create HTTP client with reasonable defaults
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(300)) // 5 minutes timeout
            .build()
            .context("Failed to create HTTP client")?;

        Ok(Self {
            cache_dir,
            client,
            config,
        })
    }

    /// Load model configuration from file or create default
    fn load_config(cache_dir: &Path) -> Result<ModelConfig> {
        let config_path = cache_dir.join("models.toml");
        
        if config_path.exists() {
            let config_content = fs::read_to_string(&config_path)
                .with_context(|| format!("Failed to read config file: {:?}", config_path))?;
            
            toml::from_str(&config_content)
                .with_context(|| "Failed to parse model configuration")
        } else {
            // Create default configuration
            let default_config = ModelConfig {
                cache_dir: cache_dir.to_path_buf(),
                models: Self::create_default_models(),
                registry_url: Some("https://huggingface.co".to_string()),
            };

            // Save default configuration
            let config_content = toml::to_string_pretty(&default_config)
                .context("Failed to serialize default configuration")?;
            
            fs::write(&config_path, config_content)
                .with_context(|| format!("Failed to write config file: {:?}", config_path))?;

            Ok(default_config)
        }
    }

    /// Create default model configurations
    fn create_default_models() -> HashMap<String, ModelInfo> {
        let mut models = HashMap::new();
        
        // Phi-3-mini model configuration
        models.insert("phi-3-mini".to_string(), ModelInfo {
            id: "phi-3-mini".to_string(),
            name: "Microsoft Phi-3 Mini".to_string(),
            version: "1.0.0".to_string(),
            description: "Lightweight language model for autocomplete and text generation".to_string(),
            download_url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/phi3-mini-4k-instruct-cpu-int4-rtn-block-32-acc-level-4.onnx".to_string(),
            checksum: "".to_string(), // Will be updated when we have actual checksums
            size_bytes: 2_147_483_648, // ~2GB
            format: ModelFormat::ONNX,
            compatibility: vec![">=0.1.0".to_string()],
        });

        models
    }

    /// Download a model by ID
    pub async fn download_model(&self, model_id: &str) -> Result<PathBuf, ModelError> {
        let model_info = self.config.models.get(model_id)
            .ok_or_else(|| ModelError::ModelNotFound(model_id.to_string()))?;

        let model_path = self.get_model_cache_path(model_id);
        
        // Check if model already exists and is valid
        if model_path.exists() {
            if self.verify_model(&model_path).await? {
                info!("Model {} already exists and is valid", model_id);
                return Ok(model_path);
            } else {
                warn!("Model {} exists but is invalid, re-downloading", model_id);
                fs::remove_file(&model_path)?;
            }
        }

        info!("Downloading model {} from {}", model_id, model_info.download_url);

        // Create parent directory if it doesn't exist
        if let Some(parent) = model_path.parent() {
            fs::create_dir_all(parent)?;
        }

        // Download the model
        let response = self.client
            .get(&model_info.download_url)
            .send()
            .await
            .map_err(|e| ModelError::DownloadFailed(format!("HTTP request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(ModelError::DownloadFailed(format!(
                "HTTP {} from {}",
                response.status(),
                model_info.download_url
            )));
        }

        // Create temporary file for download
        let temp_path = model_path.with_extension("tmp");
        let mut file = tokio::fs::File::create(&temp_path).await?;
        let mut downloaded = 0u64;
        let total_size = response.content_length().unwrap_or(model_info.size_bytes);

        // Stream download with progress reporting
        let mut stream = response.bytes_stream();
        use futures_util::StreamExt;

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| ModelError::DownloadFailed(format!("Stream error: {}", e)))?;
            file.write_all(&chunk).await?;
            downloaded += chunk.len() as u64;

            // Log progress every 100MB
            if downloaded % (100 * 1024 * 1024) == 0 {
                let percentage = (downloaded as f64 / total_size as f64) * 100.0;
                info!("Download progress for {}: {:.1}% ({}/{})", 
                      model_id, percentage, downloaded, total_size);
            }
        }

        file.flush().await?;
        drop(file);

        // Move temp file to final location
        fs::rename(&temp_path, &model_path)?;

        info!("Successfully downloaded model {} to {:?}", model_id, model_path);

        // Verify the downloaded model
        if !self.verify_model(&model_path).await? {
            fs::remove_file(&model_path)?;
            return Err(ModelError::ChecksumMismatch(model_id.to_string()));
        }

        Ok(model_path)
    }

    /// Verify model integrity using checksum
    pub async fn verify_model(&self, path: &PathBuf) -> Result<bool, ModelError> {
        if !path.exists() {
            return Ok(false);
        }

        // Extract model ID from path to get expected checksum
        let model_id = path.file_stem()
            .and_then(|s| s.to_str())
            .ok_or_else(|| ModelError::ConfigError("Invalid model path".to_string()))?;

        let model_info = self.config.models.get(model_id)
            .ok_or_else(|| ModelError::ModelNotFound(model_id.to_string()))?;

        // If no checksum is configured, skip verification
        if model_info.checksum.is_empty() {
            warn!("No checksum configured for model {}, skipping verification", model_id);
            return Ok(true);
        }

        // Calculate SHA256 checksum
        let file_content = tokio::fs::read(path).await?;
        let mut hasher = Sha256::new();
        hasher.update(&file_content);
        let calculated_checksum = hex::encode(hasher.finalize());

        let is_valid = calculated_checksum == model_info.checksum;
        
        if is_valid {
            info!("Model {} checksum verification passed", model_id);
        } else {
            error!("Model {} checksum verification failed. Expected: {}, Got: {}", 
                   model_id, model_info.checksum, calculated_checksum);
        }

        Ok(is_valid)
    }

    /// Get the path where a model should be cached
    pub fn get_model_path(&self, model_id: &str) -> Result<PathBuf, ModelError> {
        let model_info = self.config.models.get(model_id)
            .ok_or_else(|| ModelError::ModelNotFound(model_id.to_string()))?;

        let model_path = self.get_model_cache_path(model_id);
        
        if model_path.exists() {
            Ok(model_path)
        } else {
            Err(ModelError::ModelNotFound(format!("{} (not downloaded)", model_id)))
        }
    }

    /// Get the cache path for a model
    fn get_model_cache_path(&self, model_id: &str) -> PathBuf {
        self.cache_dir.join("models").join(format!("{}.onnx", model_id))
    }

    /// List all available models
    pub fn list_available_models(&self) -> Result<Vec<ModelInfo>, ModelError> {
        Ok(self.config.models.values().cloned().collect())
    }

    /// Check if a model is downloaded and ready
    pub async fn is_model_ready(&self, model_id: &str) -> Result<bool, ModelError> {
        let model_path = self.get_model_cache_path(model_id);
        
        if !model_path.exists() {
            return Ok(false);
        }

        self.verify_model(&model_path).await
    }

    /// Get model information
    pub fn get_model_info(&self, model_id: &str) -> Result<ModelInfo, ModelError> {
        self.config.models.get(model_id)
            .cloned()
            .ok_or_else(|| ModelError::ModelNotFound(model_id.to_string()))
    }

    /// Update model configuration
    pub fn update_config(&mut self, config: ModelConfig) -> Result<(), ModelError> {
        // Save configuration to file
        let config_path = self.cache_dir.join("models.toml");
        let config_content = toml::to_string_pretty(&config)
            .map_err(|e| ModelError::ConfigError(format!("Failed to serialize config: {}", e)))?;
        
        fs::write(&config_path, config_content)
            .map_err(|e| ModelError::ConfigError(format!("Failed to write config: {}", e)))?;

        self.config = config;
        Ok(())
    }

    /// Remove a downloaded model
    pub fn remove_model(&self, model_id: &str) -> Result<(), ModelError> {
        let model_path = self.get_model_cache_path(model_id);
        
        if model_path.exists() {
            fs::remove_file(&model_path)?;
            info!("Removed model {} from cache", model_id);
        }

        Ok(())
    }

    /// Get cache directory size
    pub fn get_cache_size(&self) -> Result<u64, ModelError> {
        let models_dir = self.cache_dir.join("models");
        
        if !models_dir.exists() {
            return Ok(0);
        }

        let mut total_size = 0u64;
        for entry in fs::read_dir(&models_dir)? {
            let entry = entry?;
            let metadata = entry.metadata()?;
            if metadata.is_file() {
                total_size += metadata.len();
            }
        }

        Ok(total_size)
    }

    /// Clear all cached models
    pub fn clear_cache(&self) -> Result<(), ModelError> {
        let models_dir = self.cache_dir.join("models");
        
        if models_dir.exists() {
            fs::remove_dir_all(&models_dir)?;
            fs::create_dir_all(&models_dir)?;
            info!("Cleared model cache");
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_model_manager_creation() {
        let temp_dir = TempDir::new().unwrap();
        let manager = ModelAssetManager::new(temp_dir.path().to_path_buf()).unwrap();
        
        assert!(manager.cache_dir.exists());
        assert!(!manager.config.models.is_empty());
    }

    #[tokio::test]
    async fn test_model_info_retrieval() {
        let temp_dir = TempDir::new().unwrap();
        let manager = ModelAssetManager::new(temp_dir.path().to_path_buf()).unwrap();
        
        let model_info = manager.get_model_info("phi-3-mini").unwrap();
        assert_eq!(model_info.id, "phi-3-mini");
        assert_eq!(model_info.name, "Microsoft Phi-3 Mini");
    }

    #[tokio::test]
    async fn test_list_available_models() {
        let temp_dir = TempDir::new().unwrap();
        let manager = ModelAssetManager::new(temp_dir.path().to_path_buf()).unwrap();
        
        let models = manager.list_available_models().unwrap();
        assert!(!models.is_empty());
        assert!(models.iter().any(|m| m.id == "phi-3-mini"));
    }

    #[test]
    fn test_cache_operations() {
        let temp_dir = TempDir::new().unwrap();
        let manager = ModelAssetManager::new(temp_dir.path().to_path_buf()).unwrap();
        
        // Test cache size calculation
        let size = manager.get_cache_size().unwrap();
        assert_eq!(size, 0); // Should be empty initially
        
        // Test cache clearing
        manager.clear_cache().unwrap();
        assert!(manager.cache_dir.join("models").exists());
    }
}
