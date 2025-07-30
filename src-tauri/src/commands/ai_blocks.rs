// Tauri Commands for AI Blocks
// Task 3.3.1: Implement Reusable Prompts (AI Blocks)
// 
// This module exposes AI Blocks functionality to the frontend
// through Tauri commands for managing reusable prompts.

use crate::services::ai_blocks_service::*;
use crate::infrastructure::db_layer::ai_blocks_repository::*;
use tauri::State;
use std::sync::Arc;
use std::collections::HashMap;

/// Tauri command to create a new AI Block
#[tauri::command]
pub async fn create_ai_block(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    request: CreateAiBlockRequest,
) -> Result<AiBlock, String> {
    ai_blocks_service.create_ai_block(request).await
}

/// Tauri command to update an existing AI Block
#[tauri::command]
pub async fn update_ai_block(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    id: String,
    request: UpdateAiBlockRequest,
) -> Result<AiBlock, String> {
    ai_blocks_service.update_ai_block(&id, request).await
}

/// Tauri command to delete an AI Block
#[tauri::command]
pub async fn delete_ai_block(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    id: String,
) -> Result<(), String> {
    ai_blocks_service.delete_ai_block(&id).await
}

/// Tauri command to get an AI Block by ID
#[tauri::command]
pub async fn get_ai_block(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    id: String,
) -> Result<Option<AiBlock>, String> {
    ai_blocks_service.get_ai_block(&id).await
}

/// Tauri command to get all AI Blocks with filtering and sorting
#[tauri::command]
pub async fn get_ai_blocks(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    filter: Option<AiBlockFilter>,
    sort_by: Option<AiBlockSortBy>,
    sort_direction: Option<SortDirection>,
    limit: Option<i32>,
) -> Result<Vec<AiBlock>, String> {
    ai_blocks_service.get_ai_blocks(filter, sort_by, sort_direction, limit).await
}

/// Tauri command to search AI Blocks
#[tauri::command]
pub async fn search_ai_blocks(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    query: String,
    limit: Option<i32>,
) -> Result<Vec<AiBlock>, String> {
    ai_blocks_service.search_ai_blocks(&query, limit).await
}

/// Tauri command to get AI Blocks by category
#[tauri::command]
pub async fn get_ai_blocks_by_category(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    category: String,
) -> Result<Vec<AiBlock>, String> {
    ai_blocks_service.get_ai_blocks_by_category(&category).await
}

/// Tauri command to get favorite AI Blocks
#[tauri::command]
pub async fn get_favorite_ai_blocks(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
) -> Result<Vec<AiBlock>, String> {
    ai_blocks_service.get_favorite_ai_blocks().await
}

/// Tauri command to get most used AI Blocks
#[tauri::command]
pub async fn get_most_used_ai_blocks(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    limit: Option<i32>,
) -> Result<Vec<AiBlock>, String> {
    ai_blocks_service.get_most_used_ai_blocks(limit).await
}

/// Tauri command to toggle favorite status
#[tauri::command]
pub async fn toggle_ai_block_favorite(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    id: String,
) -> Result<bool, String> {
    ai_blocks_service.toggle_favorite(&id).await
}

/// Tauri command to process AI Block template with variables
#[tauri::command]
pub async fn process_ai_block_template(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    id: String,
    variables: HashMap<String, String>,
) -> Result<ProcessedPrompt, String> {
    ai_blocks_service.process_template(&id, variables).await
}

/// Tauri command to get all categories
#[tauri::command]
pub async fn get_ai_block_categories(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
) -> Result<Vec<String>, String> {
    ai_blocks_service.get_categories().await
}

/// Tauri command to get usage statistics
#[tauri::command]
pub async fn get_ai_blocks_usage_stats(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
) -> Result<AiBlockUsageStats, String> {
    ai_blocks_service.get_usage_stats().await
}

/// Tauri command to duplicate an AI Block
#[tauri::command]
pub async fn duplicate_ai_block(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    id: String,
    new_name: Option<String>,
) -> Result<AiBlock, String> {
    ai_blocks_service.duplicate_ai_block(&id, new_name).await
}

/// Tauri command to export AI Blocks to JSON
#[tauri::command]
pub async fn export_ai_blocks(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    ids: Option<Vec<String>>,
) -> Result<String, String> {
    ai_blocks_service.export_ai_blocks(ids).await
}

/// Tauri command to import AI Blocks from JSON
#[tauri::command]
pub async fn import_ai_blocks(
    ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    json_data: String,
    overwrite_existing: bool,
) -> Result<AiBlocksImportResult, String> {
    ai_blocks_service.import_ai_blocks(&json_data, overwrite_existing).await
}

/// Tauri command to validate AI Block template
#[tauri::command]
pub async fn validate_ai_block_template(
    _ai_blocks_service: State<'_, Arc<AiBlocksService>>,
    template: String,
    variables: Vec<PromptVariable>,
) -> Result<TemplateValidationResult, String> {
    // Extract variables from template
    let re = regex::Regex::new(r"\{\{(\w+)\}\}")
        .map_err(|e| format!("Failed to create regex: {}", e))?;

    let template_vars: Vec<String> = re.captures_iter(&template)
        .map(|cap| cap[1].to_string())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

    let defined_vars: Vec<String> = variables.iter().map(|v| v.name.clone()).collect();

    // Find undefined variables
    let undefined_vars: Vec<String> = template_vars.iter()
        .filter(|var| !defined_vars.contains(var))
        .cloned()
        .collect();

    // Find unused variable definitions
    let unused_vars: Vec<String> = defined_vars.iter()
        .filter(|var| !template_vars.contains(var))
        .cloned()
        .collect();

    // Check for required variables
    let missing_required: Vec<String> = variables.iter()
        .filter(|var| var.required && !template_vars.contains(&var.name))
        .map(|var| var.name.clone())
        .collect();

    let is_valid = undefined_vars.is_empty() && missing_required.is_empty();

    Ok(TemplateValidationResult {
        is_valid,
        template_variables: template_vars,
        undefined_variables: undefined_vars,
        unused_variables: unused_vars,
        missing_required_variables: missing_required,
        warnings: generate_template_warnings(&template, &variables),
    })
}

/// Generate warnings for template validation
fn generate_template_warnings(template: &str, variables: &[PromptVariable]) -> Vec<String> {
    let mut warnings = Vec::new();

    if template.len() > 5000 {
        warnings.push("Template is very long (>5000 characters). Consider breaking it into smaller blocks.".to_string());
    }

    if template.lines().count() > 100 {
        warnings.push("Template has many lines (>100). Consider using shorter, more focused prompts.".to_string());
    }

    let variable_count = variables.len();
    if variable_count > 10 {
        warnings.push(format!("Template has many variables ({}). Consider simplifying or breaking into multiple blocks.", variable_count));
    }

    // Check for potentially problematic patterns
    if template.contains("{{{{") || template.contains("}}}}") {
        warnings.push("Template contains nested braces which may cause parsing issues.".to_string());
    }

    if template.matches("{{").count() != template.matches("}}").count() {
        warnings.push("Mismatched variable braces detected. Ensure all {{variable}} tags are properly closed.".to_string());
    }

    warnings
}

/// Template validation result
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct TemplateValidationResult {
    pub is_valid: bool,
    pub template_variables: Vec<String>,
    pub undefined_variables: Vec<String>,
    pub unused_variables: Vec<String>,
    pub missing_required_variables: Vec<String>,
    pub warnings: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::db_layer::{DatabaseConnection, MigrationManager};
    use crate::services::AiBlocksService;
    use tempfile::NamedTempFile;
    use std::sync::Arc;

    async fn setup_test_service() -> Arc<AiBlocksService> {
        let temp_file = NamedTempFile::new().unwrap();
        let db_path = temp_file.path().to_str().unwrap();
        let db = Arc::new(DatabaseConnection::new(db_path).unwrap());
        
        // Run migrations
        let migration_manager = MigrationManager::new(&db);
        migration_manager.migrate().unwrap();
        
        Arc::new(AiBlocksService::new(db))
    }

    #[tokio::test]
    async fn test_create_ai_block_command() {
        let service = setup_test_service().await;
        let state = tauri::State::from(service);
        
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

        let result = create_ai_block(state, request).await;
        assert!(result.is_ok());

        let ai_block = result.unwrap();
        assert_eq!(ai_block.name, "Test Block");
    }

    #[tokio::test]
    async fn test_search_ai_blocks_command() {
        let service = setup_test_service().await;
        let state = tauri::State::from(service);
        
        let result = search_ai_blocks(state, "summarize".to_string(), Some(10)).await;
        assert!(result.is_ok());
        
        let blocks = result.unwrap();
        assert!(!blocks.is_empty()); // Should find system blocks
    }

    #[tokio::test]
    async fn test_process_template_command() {
        let service = setup_test_service().await;
        let state = tauri::State::from(service.clone());
        
        let request = CreateAiBlockRequest {
            name: "Template Test".to_string(),
            description: None,
            prompt_template: "Hello {{name}}!".to_string(),
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
                }
            ]),
            created_by: None,
        };

        let ai_block = create_ai_block(state.clone(), request).await.unwrap();

        let mut variables = HashMap::new();
        variables.insert("name".to_string(), "Alice".to_string());

        let result = process_ai_block_template(state, ai_block.id, variables).await;
        assert!(result.is_ok());

        let processed = result.unwrap();
        assert_eq!(processed.processed_prompt, "Hello Alice!");
    }

    #[tokio::test]
    async fn test_validate_template_command() {
        let service = setup_test_service().await;
        let state = tauri::State::from(service);
        
        let template = "Hello {{name}}, you are {{age}} years old.".to_string();
        let variables = vec![
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
        ];

        let result = validate_ai_block_template(state, template, variables).await;
        assert!(result.is_ok());

        let validation = result.unwrap();
        assert!(validation.is_valid);
        assert_eq!(validation.template_variables.len(), 2);
        assert!(validation.template_variables.contains(&"name".to_string()));
        assert!(validation.template_variables.contains(&"age".to_string()));
    }

    #[tokio::test]
    async fn test_get_usage_stats_command() {
        let service = setup_test_service().await;
        let state = tauri::State::from(service);
        
        let result = get_ai_blocks_usage_stats(state).await;
        assert!(result.is_ok());

        let stats = result.unwrap();
        assert!(stats.system_blocks > 0); // Should have system blocks from migration
    }
}
