// Credential Manager Infrastructure
// Handles secure storage and retrieval of credentials using OS-native keychains
// Provides secure abstraction over macOS Keychain and Windows Credential Manager

use keyring::Entry;

/// Service names for different credential types used by Project Yarn
pub mod service_names {
    pub const YARN_APP: &str = "project-yarn";
    pub const AWS_BEDROCK: &str = "project-yarn-aws-bedrock";
    pub const GOOGLE_GEMINI: &str = "project-yarn-gemini";
    pub const OPENAI_API: &str = "project-yarn-openai";
}

/// Credential manager for secure storage
/// Uses OS-native keychains (macOS Keychain, Windows Credential Manager)
pub struct CredentialManager;

impl CredentialManager {
    pub fn new() -> Self {
        Self
    }
    
    /// Store a credential securely in the OS keychain
    /// This is the mandated function signature as per Task 1.2.6
    pub fn store_credential(
        &self,
        service_name: &str,
        username: &str,
        secret: &str,
    ) -> Result<(), String> {
        if service_name.trim().is_empty() {
            return Err("Service name cannot be empty".to_string());
        }
        
        if username.trim().is_empty() {
            return Err("Username cannot be empty".to_string());
        }
        
        if secret.trim().is_empty() {
            return Err("Secret cannot be empty".to_string());
        }

        let entry = Entry::new(service_name, username)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        
        entry
            .set_password(secret)
            .map_err(|e| format!("Failed to store credential: {}", e))?;
        
        Ok(())
    }
    
    /// Retrieve a credential from the OS keychain
    /// This is the mandated function signature as per Task 1.2.6
    pub fn retrieve_credential(
        &self,
        service_name: &str,
        username: &str,
    ) -> Result<String, String> {
        if service_name.trim().is_empty() {
            return Err("Service name cannot be empty".to_string());
        }
        
        if username.trim().is_empty() {
            return Err("Username cannot be empty".to_string());
        }

        let entry = Entry::new(service_name, username)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        
        entry
            .get_password()
            .map_err(|e| format!("Failed to retrieve credential: {}", e))
    }
    
    /// Delete a credential from the OS keychain
    pub fn delete_credential(
        &self,
        service_name: &str,
        username: &str,
    ) -> Result<(), String> {
        if service_name.trim().is_empty() {
            return Err("Service name cannot be empty".to_string());
        }
        
        if username.trim().is_empty() {
            return Err("Username cannot be empty".to_string());
        }

        let entry = Entry::new(service_name, username)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        
        entry
            .delete_password()
            .map_err(|e| format!("Failed to delete credential: {}", e))?;
        
        Ok(())
    }
    
    /// Check if a credential exists in the keychain
    pub fn credential_exists(
        &self,
        service_name: &str,
        username: &str,
    ) -> bool {
        match self.retrieve_credential(service_name, username) {
            Ok(_) => true,
            Err(_) => false,
        }
    }
    
    /// Store AWS Bedrock API credentials
    pub fn store_aws_bedrock_credentials(
        &self,
        access_key_id: &str,
        secret_access_key: &str,
        region: &str,
    ) -> Result<(), String> {
        // Store access key ID
        self.store_credential(
            service_names::AWS_BEDROCK,
            "access_key_id",
            access_key_id,
        )?;
        
        // Store secret access key
        self.store_credential(
            service_names::AWS_BEDROCK,
            "secret_access_key",
            secret_access_key,
        )?;
        
        // Store region
        self.store_credential(
            service_names::AWS_BEDROCK,
            "region",
            region,
        )?;
        
        Ok(())
    }
    
    /// Retrieve AWS Bedrock API credentials
    pub fn retrieve_aws_bedrock_credentials(&self) -> Result<(String, String, String), String> {
        let access_key_id = self.retrieve_credential(
            service_names::AWS_BEDROCK,
            "access_key_id",
        )?;
        
        let secret_access_key = self.retrieve_credential(
            service_names::AWS_BEDROCK,
            "secret_access_key",
        )?;
        
        let region = self.retrieve_credential(
            service_names::AWS_BEDROCK,
            "region",
        )?;
        
        Ok((access_key_id, secret_access_key, region))
    }
    
    /// Store Google Gemini API credentials
    pub fn store_gemini_api_key(&self, api_key: &str) -> Result<(), String> {
        self.store_credential(
            service_names::GOOGLE_GEMINI,
            "api_key",
            api_key,
        )
    }
    
    /// Retrieve Google Gemini API credentials
    pub fn retrieve_gemini_api_key(&self) -> Result<String, String> {
        self.retrieve_credential(
            service_names::GOOGLE_GEMINI,
            "api_key",
        )
    }
    
    /// Store OpenAI API credentials (for fallback scenarios)
    pub fn store_openai_api_key(&self, api_key: &str) -> Result<(), String> {
        self.store_credential(
            service_names::OPENAI_API,
            "api_key",
            api_key,
        )
    }
    
    /// Retrieve OpenAI API credentials
    pub fn retrieve_openai_api_key(&self) -> Result<String, String> {
        self.retrieve_credential(
            service_names::OPENAI_API,
            "api_key",
        )
    }
    
    /// Get a list of all stored credential services for debugging/management
    pub fn list_credential_services(&self) -> Vec<&'static str> {
        vec![
            service_names::YARN_APP,
            service_names::AWS_BEDROCK,
            service_names::GOOGLE_GEMINI,
            service_names::OPENAI_API,
        ]
    }
    
    /// Clear all Project Yarn credentials (useful for reset/logout)
    pub fn clear_all_credentials(&self) -> Result<(), String> {
        let services = self.list_credential_services();
        let mut errors = Vec::new();
        
        for service in services {
            // Try to delete common usernames/keys for each service
            let common_keys = match service {
                service_names::AWS_BEDROCK => vec!["access_key_id", "secret_access_key", "region"],
                service_names::GOOGLE_GEMINI | service_names::OPENAI_API => vec!["api_key"],
                _ => vec!["default"],
            };
            
            for key in common_keys {
                if let Err(e) = self.delete_credential(service, key) {
                    // Only add to errors if it's not a "not found" error
                    if !e.contains("not found") && !e.contains("No such credential") {
                        errors.push(format!("Failed to delete {}/{}: {}", service, key, e));
                    }
                }
            }
        }
        
        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors.join("; "))
        }
    }
}

// Implement Default for CredentialManager
impl Default for CredentialManager {
    fn default() -> Self {
        Self::new()
    }
}
