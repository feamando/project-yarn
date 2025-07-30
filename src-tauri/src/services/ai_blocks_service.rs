// AI Blocks Service
// Task 3.3.1: Implement Reusable Prompts (AI Blocks)
// 
// This service provides high-level business logic for AI Blocks (reusable prompts)
// including template processing, variable substitution, and workflow management.

use crate::infrastructure::db_layer::{DatabaseConnection, ai_blocks_repository::*};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::collections::HashMap;
use tracing::{info, warn, error};
use uuid::Uuid;
use regex::Regex;

/// AI Blocks service for managing reusable prompts
pub struct AiBlocksService {
    db: Arc<DatabaseConnection>,
}

impl AiBlocksService {
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Create a new AI Block
    pub async fn create_ai_block(&self, request: CreateAiBlockRequest) -> Result<AiBlock, String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let ai_block = AiBlock {
            id: Uuid::new_v4().to_string(),
            name: request.name,
            description: request.description,
            prompt_template: request.prompt_template,
            category: request.category.unwrap_or_else(|| "general".to_string()),
            tags: request.tags.unwrap_or_default(),
            is_system: false, // User-created blocks are never system blocks
            is_favorite: false,
            usage_count: 0,
            created_at: now,
            updated_at: now,
            created_by: request.created_by,
            variables: request.variables.unwrap_or_default(),
        };

        // Validate the AI block
        self.validate_ai_block(&ai_block)?;

        let repo = AiBlocksRepository::new(&self.db);
        repo.create(&ai_block)?;

        info!("Created new AI Block: {} ({})", ai_block.name, ai_block.id);
        Ok(ai_block)
    }

    /// Update an existing AI Block
    pub async fn update_ai_block(&self, id: &str, request: UpdateAiBlockRequest) -> Result<AiBlock, String> {
        let repo = AiBlocksRepository::new(&self.db);
        
        let mut ai_block = repo.find_by_id(id)?
            .ok_or_else(|| "AI Block not found".to_string())?;

        if ai_block.is_system {
            return Err("Cannot modify system AI blocks".to_string());
        }

        // Update fields if provided
        if let Some(name) = request.name {
            ai_block.name = name;
        }
        if let Some(description) = request.description {
            ai_block.description = description;
        }
        if let Some(prompt_template) = request.prompt_template {
            ai_block.prompt_template = prompt_template;
        }
        if let Some(category) = request.category {
            ai_block.category = category;
        }
        if let Some(tags) = request.tags {
            ai_block.tags = tags;
        }
        if let Some(is_favorite) = request.is_favorite {
            ai_block.is_favorite = is_favorite;
        }
        if let Some(variables) = request.variables {
            ai_block.variables = variables;
        }

        ai_block.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        // Validate the updated AI block
        self.validate_ai_block(&ai_block)?;

        repo.update(&ai_block)?;

        info!("Updated AI Block: {} ({})", ai_block.name, ai_block.id);
        Ok(ai_block)
    }

    /// Delete an AI Block
    pub async fn delete_ai_block(&self, id: &str) -> Result<(), String> {
        let repo = AiBlocksRepository::new(&self.db);
        repo.delete(id)?;

        info!("Deleted AI Block: {}", id);
        Ok(())
    }

    /// Get AI Block by ID
    pub async fn get_ai_block(&self, id: &str) -> Result<Option<AiBlock>, String> {
        let repo = AiBlocksRepository::new(&self.db);
        repo.find_by_id(id)
    }

    /// Get all AI Blocks with filtering and sorting
    pub async fn get_ai_blocks(
        &self,
        filter: Option<AiBlockFilter>,
        sort_by: Option<AiBlockSortBy>,
        sort_direction: Option<SortDirection>,
        limit: Option<i32>
    ) -> Result<Vec<AiBlock>, String> {
        let repo = AiBlocksRepository::new(&self.db);
        repo.find_all(filter.as_ref(), sort_by, sort_direction, limit)
    }

    /// Search AI Blocks
    pub async fn search_ai_blocks(&self, query: &str, limit: Option<i32>) -> Result<Vec<AiBlock>, String> {
        let repo = AiBlocksRepository::new(&self.db);
        repo.search(query, limit)
    }

    /// Get AI Blocks by category
    pub async fn get_ai_blocks_by_category(&self, category: &str) -> Result<Vec<AiBlock>, String> {
        let repo = AiBlocksRepository::new(&self.db);
        repo.find_by_category(category)
    }

    /// Get favorite AI Blocks
    pub async fn get_favorite_ai_blocks(&self) -> Result<Vec<AiBlock>, String> {
        let repo = AiBlocksRepository::new(&self.db);
        repo.find_favorites()
    }

    /// Get most used AI Blocks
    pub async fn get_most_used_ai_blocks(&self, limit: Option<i32>) -> Result<Vec<AiBlock>, String> {
        let repo = AiBlocksRepository::new(&self.db);
        repo.find_most_used(limit)
    }

    /// Toggle favorite status
    pub async fn toggle_favorite(&self, id: &str) -> Result<bool, String> {
        let repo = AiBlocksRepository::new(&self.db);
        repo.toggle_favorite(id)
    }

    /// Process AI Block template with variables
    pub async fn process_template(&self, id: &str, variables: HashMap<String, String>) -> Result<ProcessedPrompt, String> {
        let repo = AiBlocksRepository::new(&self.db);
        
        let ai_block = repo.find_by_id(id)?
            .ok_or_else(|| "AI Block not found".to_string())?;

        // Increment usage count
        repo.increment_usage(id)?;

        // Process the template
        let processed_prompt = self.substitute_variables(&ai_block.prompt_template, &variables, &ai_block.variables)?;

        Ok(ProcessedPrompt {
            ai_block_id: ai_block.id,
            ai_block_name: ai_block.name,
            original_template: ai_block.prompt_template,
            processed_prompt,
            variables_used: variables,
            processing_timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        })
    }

    /// Get all categories
    pub async fn get_categories(&self) -> Result<Vec<String>, String> {
        let repo = AiBlocksRepository::new(&self.db);
        repo.get_categories()
    }

    /// Get usage statistics
    pub async fn get_usage_stats(&self) -> Result<AiBlockUsageStats, String> {
        let repo = AiBlocksRepository::new(&self.db);
        repo.get_usage_stats()
    }

    /// Validate AI Block data
    fn validate_ai_block(&self, ai_block: &AiBlock) -> Result<(), String> {
        if ai_block.name.trim().is_empty() {
            return Err("AI Block name cannot be empty".to_string());
        }

        if ai_block.name.len() > 100 {
            return Err("AI Block name cannot exceed 100 characters".to_string());
        }

        if ai_block.prompt_template.trim().is_empty() {
            return Err("Prompt template cannot be empty".to_string());
        }

        if ai_block.prompt_template.len() > 10000 {
            return Err("Prompt template cannot exceed 10,000 characters".to_string());
        }

        if let Some(description) = &ai_block.description {
            if description.len() > 500 {
                return Err("Description cannot exceed 500 characters".to_string());
            }
        }

        // Validate variables in template match defined variables
        let template_vars = self.extract_template_variables(&ai_block.prompt_template)?;
        let defined_vars: Vec<String> = ai_block.variables.iter().map(|v| v.name.clone()).collect();

        for template_var in &template_vars {
            if !defined_vars.contains(template_var) {
                warn!("Template variable '{}' not defined in variables list", template_var);
            }
        }

        Ok(())
    }

    /// Extract variable names from template
    fn extract_template_variables(&self, template: &str) -> Result<Vec<String>, String> {
        let re = Regex::new(r"\{\{(\w+)\}\}")
            .map_err(|e| format!("Failed to create regex: {}", e))?;

        let variables: Vec<String> = re.captures_iter(template)
            .map(|cap| cap[1].to_string())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        Ok(variables)
    }

    /// Substitute variables in template
    fn substitute_variables(
        &self,
        template: &str,
        variables: &HashMap<String, String>,
        variable_definitions: &[PromptVariable]
    ) -> Result<String, String> {
        let mut result = template.to_string();
        let template_vars = self.extract_template_variables(template)?;

        // Check for required variables
        for var_def in variable_definitions {
            if var_def.required && !variables.contains_key(&var_def.name) {
                return Err(format!("Required variable '{}' not provided", var_def.name));
            }
        }

        // Substitute variables
        for var_name in template_vars {
            let placeholder = format!("{{{{{}}}}}", var_name);
            
            if let Some(value) = variables.get(&var_name) {
                result = result.replace(&placeholder, value);
            } else {
                // Check if there's a default value
                if let Some(var_def) = variable_definitions.iter().find(|v| v.name == var_name) {
                    if let Some(default_value) = &var_def.default_value {
                        result = result.replace(&placeholder, default_value);
                    } else if var_def.required {
                        return Err(format!("Required variable '{}' not provided", var_name));
                    } else {
                        // Leave placeholder for optional variables without defaults
                        warn!("Optional variable '{}' not provided and has no default", var_name);
                    }
                }
            }
        }

        Ok(result)
    }

    /// Duplicate an AI Block (create a copy)
    pub async fn duplicate_ai_block(&self, id: &str, new_name: Option<String>) -> Result<AiBlock, String> {
        let repo = AiBlocksRepository::new(&self.db);
        
        let original = repo.find_by_id(id)?
            .ok_or_else(|| "AI Block not found".to_string())?;

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let mut duplicate = AiBlock {
            id: Uuid::new_v4().to_string(),
            name: new_name.unwrap_or_else(|| format!("{} (Copy)", original.name)),
            description: original.description.clone(),
            prompt_template: original.prompt_template.clone(),
            category: original.category.clone(),
            tags: original.tags.clone(),
            is_system: false, // Duplicates are never system blocks
            is_favorite: false,
            usage_count: 0,
            created_at: now,
            updated_at: now,
            created_by: None, // Could be set to current user if available
            variables: original.variables.clone(),
        };

        // Ensure the name is unique
        let mut counter = 1;
        let base_name = duplicate.name.clone();
        while repo.find_by_id(&duplicate.id).is_ok() {
            duplicate.name = format!("{} ({})", base_name, counter);
            counter += 1;
        }

        repo.create(&duplicate)?;

        info!("Duplicated AI Block: {} -> {} ({})", original.name, duplicate.name, duplicate.id);
        Ok(duplicate)
    }

    /// Export AI Blocks to JSON
    pub async fn export_ai_blocks(&self, ids: Option<Vec<String>>) -> Result<String, String> {
        let repo = AiBlocksRepository::new(&self.db);
        
        let ai_blocks = if let Some(ids) = ids {
            let mut blocks = Vec::new();
            for id in ids {
                if let Some(block) = repo.find_by_id(&id)? {
                    blocks.push(block);
                }
            }
            blocks
        } else {
            repo.find_all(None, None, None, None)?
        };

        let export_data = AiBlocksExport {
            version: "1.0".to_string(),
            exported_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            ai_blocks,
        };

        serde_json::to_string_pretty(&export_data)
            .map_err(|e| format!("Failed to serialize AI blocks: {}", e))
    }

    /// Import AI Blocks from JSON
    pub async fn import_ai_blocks(&self, json_data: &str, overwrite_existing: bool) -> Result<AiBlocksImportResult, String> {
        let import_data: AiBlocksExport = serde_json::from_str(json_data)
            .map_err(|e| format!("Failed to parse import data: {}", e))?;

        let repo = AiBlocksRepository::new(&self.db);
        let mut imported = 0;
        let mut skipped = 0;
        let mut errors = Vec::new();

        for mut ai_block in import_data.ai_blocks {
            // Generate new ID to avoid conflicts
            let original_id = ai_block.id.clone();
            ai_block.id = Uuid::new_v4().to_string();
            ai_block.is_system = false; // Imported blocks are never system blocks
            ai_block.usage_count = 0; // Reset usage count
            
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            ai_block.created_at = now;
            ai_block.updated_at = now;

            // Check if a block with the same name exists
            let existing_blocks = repo.search(&ai_block.name, None)?;
            let name_exists = existing_blocks.iter().any(|b| b.name == ai_block.name);

            if name_exists && !overwrite_existing {
                skipped += 1;
                continue;
            }

            if name_exists && overwrite_existing {
                // Find and update existing block
                if let Some(existing) = existing_blocks.iter().find(|b| b.name == ai_block.name) {
                    ai_block.id = existing.id.clone();
                    match repo.update(&ai_block) {
                        Ok(_) => imported += 1,
                        Err(e) => errors.push(format!("Failed to update '{}': {}", ai_block.name, e)),
                    }
                    continue;
                }
            }

            // Create new block
            match repo.create(&ai_block) {
                Ok(_) => imported += 1,
                Err(e) => errors.push(format!("Failed to import '{}': {}", ai_block.name, e)),
            }
        }

        Ok(AiBlocksImportResult {
            total_blocks: import_data.ai_blocks.len(),
            imported,
            skipped,
            errors,
        })
    }
}

/// Request to create a new AI Block
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAiBlockRequest {
    pub name: String,
    pub description: Option<String>,
    pub prompt_template: String,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub variables: Option<Vec<PromptVariable>>,
    pub created_by: Option<String>,
}

/// Request to update an AI Block
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAiBlockRequest {
    pub name: Option<String>,
    pub description: Option<Option<String>>,
    pub prompt_template: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub variables: Option<Vec<PromptVariable>>,
}

/// Processed prompt result
#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessedPrompt {
    pub ai_block_id: String,
    pub ai_block_name: String,
    pub original_template: String,
    pub processed_prompt: String,
    pub variables_used: HashMap<String, String>,
    pub processing_timestamp: u64,
}

/// AI Blocks export format
#[derive(Debug, Serialize, Deserialize)]
pub struct AiBlocksExport {
    pub version: String,
    pub exported_at: u64,
    pub ai_blocks: Vec<AiBlock>,
}

/// AI Blocks import result
#[derive(Debug, Serialize, Deserialize)]
pub struct AiBlocksImportResult {
    pub total_blocks: usize,
    pub imported: usize,
    pub skipped: usize,
    pub errors: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::db_layer::{DatabaseConnection, MigrationManager};
    use tempfile::NamedTempFile;
    use std::sync::Arc;

    async fn setup_test_service() -> AiBlocksService {
        let temp_file = NamedTempFile::new().unwrap();
        let db_path = temp_file.path().to_str().unwrap();
        let db = Arc::new(DatabaseConnection::new(db_path).unwrap());
        
        // Run migrations
        let migration_manager = MigrationManager::new(&db);
        migration_manager.migrate().unwrap();
        
        AiBlocksService::new(db)
    }

    #[tokio::test]
    async fn test_create_ai_block() {
        let service = setup_test_service().await;
        
        let request = CreateAiBlockRequest {
            name: "Test Block".to_string(),
            description: Some("A test block".to_string()),
            prompt_template: "Test prompt with {{variable}}".to_string(),
            category: Some("test".to_string()),
            tags: Some(vec!["test".to_string()]),
            variables: Some(vec![
                PromptVariable {
                    name: "variable".to_string(),
                    var_type: "text".to_string(),
                    description: "Test variable".to_string(),
                    required: true,
                    default_value: None,
                    options: None,
                }
            ]),
            created_by: Some("test-user".to_string()),
        };

        let result = service.create_ai_block(request).await;
        assert!(result.is_ok());

        let ai_block = result.unwrap();
        assert_eq!(ai_block.name, "Test Block");
        assert!(!ai_block.is_system);
    }

    #[tokio::test]
    async fn test_process_template() {
        let service = setup_test_service().await;
        
        let request = CreateAiBlockRequest {
            name: "Template Test".to_string(),
            description: None,
            prompt_template: "Hello {{name}}, you are {{age}} years old.".to_string(),
            category: None,
            tags: None,
            variables: Some(vec![
                PromptVariable {
                    name: "name".to_string(),
                    var_type: "text".to_string(),
                    description: "Person's name".to_string(),
                    required: true,
                    default_value: None,
                    options: None,
                },
                PromptVariable {
                    name: "age".to_string(),
                    var_type: "number".to_string(),
                    description: "Person's age".to_string(),
                    required: true,
                    default_value: None,
                    options: None,
                }
            ]),
            created_by: None,
        };

        let ai_block = service.create_ai_block(request).await.unwrap();

        let mut variables = HashMap::new();
        variables.insert("name".to_string(), "Alice".to_string());
        variables.insert("age".to_string(), "30".to_string());

        let result = service.process_template(&ai_block.id, variables).await;
        assert!(result.is_ok());

        let processed = result.unwrap();
        assert_eq!(processed.processed_prompt, "Hello Alice, you are 30 years old.");
    }

    #[tokio::test]
    async fn test_search_ai_blocks() {
        let service = setup_test_service().await;

        // Should find system blocks from migration
        let results = service.search_ai_blocks("summarize", Some(10)).await.unwrap();
        assert!(!results.is_empty());
    }

    #[tokio::test]
    async fn test_get_usage_stats() {
        let service = setup_test_service().await;

        let stats = service.get_usage_stats().await.unwrap();
        assert!(stats.system_blocks > 0); // Should have system blocks from migration
        assert!(stats.total_blocks > 0);
    }
}
