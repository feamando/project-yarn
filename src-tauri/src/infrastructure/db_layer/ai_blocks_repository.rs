// AI Blocks Repository
// Task 3.3.1: Implement Reusable Prompts (AI Blocks)
// 
// This repository handles database operations for AI Blocks (reusable prompts)
// including CRUD operations, search, filtering, and usage analytics.

use crate::infrastructure::db_layer::DatabaseConnection;
use rusqlite::{params, Row};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{info, warn, error};

/// AI Block (reusable prompt) data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiBlock {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub prompt_template: String,
    pub category: String,
    pub tags: Vec<String>,
    pub is_system: bool,
    pub is_favorite: bool,
    pub usage_count: i32,
    pub created_at: u64,
    pub updated_at: u64,
    pub created_by: Option<String>,
    pub variables: Vec<PromptVariable>,
}

/// Variable definition for prompt templates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptVariable {
    pub name: String,
    pub var_type: String, // "text", "number", "boolean", "select"
    pub description: String,
    pub required: bool,
    pub default_value: Option<String>,
    pub options: Option<Vec<String>>, // For select type
}

/// Filter criteria for AI Blocks search
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiBlockFilter {
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_system: Option<bool>,
    pub is_favorite: Option<bool>,
    pub search_query: Option<String>,
}

/// Sort options for AI Blocks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AiBlockSortBy {
    Name,
    CreatedAt,
    UpdatedAt,
    UsageCount,
    Category,
}

/// Sort direction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SortDirection {
    Asc,
    Desc,
}

/// AI Blocks repository for database operations
pub struct AiBlocksRepository<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> AiBlocksRepository<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    /// Create a new AI Block
    pub fn create(&self, ai_block: &AiBlock) -> Result<(), String> {
        let tags_json = serde_json::to_string(&ai_block.tags)
            .map_err(|e| format!("Failed to serialize tags: {}", e))?;
        
        let variables_json = serde_json::to_string(&ai_block.variables)
            .map_err(|e| format!("Failed to serialize variables: {}", e))?;

        let sql = r#"
            INSERT INTO ai_blocks 
            (id, name, description, prompt_template, category, tags, is_system, is_favorite, 
             usage_count, created_at, updated_at, created_by, variables)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
        "#;

        self.db.execute(sql, params![
            ai_block.id,
            ai_block.name,
            ai_block.description,
            ai_block.prompt_template,
            ai_block.category,
            tags_json,
            ai_block.is_system,
            ai_block.is_favorite,
            ai_block.usage_count,
            ai_block.created_at as i64,
            ai_block.updated_at as i64,
            ai_block.created_by,
            variables_json
        ])?;

        info!("Created AI Block: {} ({})", ai_block.name, ai_block.id);
        Ok(())
    }

    /// Update an existing AI Block
    pub fn update(&self, ai_block: &AiBlock) -> Result<(), String> {
        let tags_json = serde_json::to_string(&ai_block.tags)
            .map_err(|e| format!("Failed to serialize tags: {}", e))?;
        
        let variables_json = serde_json::to_string(&ai_block.variables)
            .map_err(|e| format!("Failed to serialize variables: {}", e))?;

        let sql = r#"
            UPDATE ai_blocks 
            SET name = ?2, description = ?3, prompt_template = ?4, category = ?5, 
                tags = ?6, is_favorite = ?7, updated_at = ?8, variables = ?9
            WHERE id = ?1 AND is_system = FALSE
        "#;

        let rows_affected = self.db.execute(sql, params![
            ai_block.id,
            ai_block.name,
            ai_block.description,
            ai_block.prompt_template,
            ai_block.category,
            tags_json,
            ai_block.is_favorite,
            ai_block.updated_at as i64,
            variables_json
        ])?;

        if rows_affected == 0 {
            return Err("AI Block not found or is a system block (cannot be modified)".to_string());
        }

        info!("Updated AI Block: {} ({})", ai_block.name, ai_block.id);
        Ok(())
    }

    /// Delete an AI Block (only user-created blocks)
    pub fn delete(&self, id: &str) -> Result<(), String> {
        let sql = "DELETE FROM ai_blocks WHERE id = ?1 AND is_system = FALSE";
        
        let rows_affected = self.db.execute(sql, params![id])?;
        
        if rows_affected == 0 {
            return Err("AI Block not found or is a system block (cannot be deleted)".to_string());
        }

        info!("Deleted AI Block: {}", id);
        Ok(())
    }

    /// Find AI Block by ID
    pub fn find_by_id(&self, id: &str) -> Result<Option<AiBlock>, String> {
        let sql = r#"
            SELECT id, name, description, prompt_template, category, tags, is_system, 
                   is_favorite, usage_count, created_at, updated_at, created_by, variables
            FROM ai_blocks 
            WHERE id = ?1
        "#;

        match self.db.query_row(sql, params![id], |row| {
            self.row_to_ai_block(row)
        }) {
            Ok(ai_block) => Ok(Some(ai_block)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("Database error: {}", e)),
        }
    }

    /// Find all AI Blocks with optional filtering and sorting
    pub fn find_all(
        &self, 
        filter: Option<&AiBlockFilter>, 
        sort_by: Option<AiBlockSortBy>, 
        sort_direction: Option<SortDirection>,
        limit: Option<i32>
    ) -> Result<Vec<AiBlock>, String> {
        let mut sql = r#"
            SELECT id, name, description, prompt_template, category, tags, is_system, 
                   is_favorite, usage_count, created_at, updated_at, created_by, variables
            FROM ai_blocks 
            WHERE 1=1
        "#.to_string();

        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        let mut param_index = 1;

        // Apply filters
        if let Some(filter) = filter {
            if let Some(category) = &filter.category {
                sql.push_str(&format!(" AND category = ?{}", param_index));
                params.push(Box::new(category.clone()));
                param_index += 1;
            }

            if let Some(is_system) = filter.is_system {
                sql.push_str(&format!(" AND is_system = ?{}", param_index));
                params.push(Box::new(is_system));
                param_index += 1;
            }

            if let Some(is_favorite) = filter.is_favorite {
                sql.push_str(&format!(" AND is_favorite = ?{}", param_index));
                params.push(Box::new(is_favorite));
                param_index += 1;
            }

            if let Some(search_query) = &filter.search_query {
                if !search_query.trim().is_empty() {
                    sql.push_str(&format!(" AND (name LIKE ?{} OR description LIKE ?{} OR tags LIKE ?{})", 
                                        param_index, param_index + 1, param_index + 2));
                    let search_pattern = format!("%{}%", search_query);
                    params.push(Box::new(search_pattern.clone()));
                    params.push(Box::new(search_pattern.clone()));
                    params.push(Box::new(search_pattern));
                    param_index += 3;
                }
            }

            if let Some(tags) = &filter.tags {
                if !tags.is_empty() {
                    let tag_conditions: Vec<String> = tags.iter()
                        .map(|_| {
                            let condition = format!("tags LIKE ?{}", param_index);
                            param_index += 1;
                            condition
                        })
                        .collect();
                    
                    sql.push_str(&format!(" AND ({})", tag_conditions.join(" OR ")));
                    
                    for tag in tags {
                        params.push(Box::new(format!("%{}%", tag)));
                    }
                }
            }
        }

        // Apply sorting
        let sort_column = match sort_by.unwrap_or(AiBlockSortBy::UpdatedAt) {
            AiBlockSortBy::Name => "name",
            AiBlockSortBy::CreatedAt => "created_at",
            AiBlockSortBy::UpdatedAt => "updated_at",
            AiBlockSortBy::UsageCount => "usage_count",
            AiBlockSortBy::Category => "category",
        };

        let sort_dir = match sort_direction.unwrap_or(SortDirection::Desc) {
            SortDirection::Asc => "ASC",
            SortDirection::Desc => "DESC",
        };

        sql.push_str(&format!(" ORDER BY {} {}", sort_column, sort_dir));

        // Apply limit
        if let Some(limit) = limit {
            sql.push_str(&format!(" LIMIT {}", limit));
        }

        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

        self.db.query_map(&sql, &param_refs[..], |row| {
            self.row_to_ai_block(row)
        })
    }

    /// Search AI Blocks by text query
    pub fn search(&self, query: &str, limit: Option<i32>) -> Result<Vec<AiBlock>, String> {
        if query.trim().is_empty() {
            return self.find_all(None, None, None, limit);
        }

        let filter = AiBlockFilter {
            category: None,
            tags: None,
            is_system: None,
            is_favorite: None,
            search_query: Some(query.to_string()),
        };

        self.find_all(Some(&filter), Some(AiBlockSortBy::UsageCount), Some(SortDirection::Desc), limit)
    }

    /// Get AI Blocks by category
    pub fn find_by_category(&self, category: &str) -> Result<Vec<AiBlock>, String> {
        let filter = AiBlockFilter {
            category: Some(category.to_string()),
            tags: None,
            is_system: None,
            is_favorite: None,
            search_query: None,
        };

        self.find_all(Some(&filter), Some(AiBlockSortBy::Name), Some(SortDirection::Asc), None)
    }

    /// Get favorite AI Blocks
    pub fn find_favorites(&self) -> Result<Vec<AiBlock>, String> {
        let filter = AiBlockFilter {
            category: None,
            tags: None,
            is_system: None,
            is_favorite: Some(true),
            search_query: None,
        };

        self.find_all(Some(&filter), Some(AiBlockSortBy::UsageCount), Some(SortDirection::Desc), None)
    }

    /// Get most used AI Blocks
    pub fn find_most_used(&self, limit: Option<i32>) -> Result<Vec<AiBlock>, String> {
        self.find_all(None, Some(AiBlockSortBy::UsageCount), Some(SortDirection::Desc), limit)
    }

    /// Toggle favorite status
    pub fn toggle_favorite(&self, id: &str) -> Result<bool, String> {
        // First get current status
        let current_status = self.db.query_row(
            "SELECT is_favorite FROM ai_blocks WHERE id = ?1",
            params![id],
            |row| Ok(row.get::<_, bool>(0)?)
        ).map_err(|e| format!("Failed to get current favorite status: {}", e))?;

        let new_status = !current_status;
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let sql = "UPDATE ai_blocks SET is_favorite = ?1, updated_at = ?2 WHERE id = ?3";
        
        self.db.execute(sql, params![new_status, now, id])?;

        info!("Toggled favorite status for AI Block {}: {}", id, new_status);
        Ok(new_status)
    }

    /// Increment usage count
    pub fn increment_usage(&self, id: &str) -> Result<(), String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let sql = r#"
            UPDATE ai_blocks 
            SET usage_count = usage_count + 1, updated_at = ?1 
            WHERE id = ?2
        "#;
        
        self.db.execute(sql, params![now, id])?;

        info!("Incremented usage count for AI Block: {}", id);
        Ok(())
    }

    /// Get all categories
    pub fn get_categories(&self) -> Result<Vec<String>, String> {
        let sql = "SELECT DISTINCT category FROM ai_blocks ORDER BY category";
        
        self.db.query_map(sql, &[], |row| {
            Ok(row.get::<_, String>(0)?)
        })
    }

    /// Get usage statistics
    pub fn get_usage_stats(&self) -> Result<AiBlockUsageStats, String> {
        let total_blocks = self.db.query_row(
            "SELECT COUNT(*) FROM ai_blocks",
            &[],
            |row| Ok(row.get::<_, i32>(0)?)
        )?;

        let user_blocks = self.db.query_row(
            "SELECT COUNT(*) FROM ai_blocks WHERE is_system = FALSE",
            &[],
            |row| Ok(row.get::<_, i32>(0)?)
        )?;

        let system_blocks = self.db.query_row(
            "SELECT COUNT(*) FROM ai_blocks WHERE is_system = TRUE",
            &[],
            |row| Ok(row.get::<_, i32>(0)?)
        )?;

        let favorite_blocks = self.db.query_row(
            "SELECT COUNT(*) FROM ai_blocks WHERE is_favorite = TRUE",
            &[],
            |row| Ok(row.get::<_, i32>(0)?)
        )?;

        let total_usage = self.db.query_row(
            "SELECT SUM(usage_count) FROM ai_blocks",
            &[],
            |row| Ok(row.get::<_, Option<i32>>(0)?.unwrap_or(0))
        )?;

        let categories = self.get_categories()?;

        Ok(AiBlockUsageStats {
            total_blocks,
            user_blocks,
            system_blocks,
            favorite_blocks,
            total_usage,
            categories,
        })
    }

    /// Convert database row to AiBlock
    fn row_to_ai_block(&self, row: &Row) -> Result<AiBlock, rusqlite::Error> {
        let tags_json: String = row.get(5)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json)
            .unwrap_or_else(|_| {
                // Fallback: split by comma if JSON parsing fails
                tags_json.split(',').map(|s| s.trim().to_string()).collect()
            });

        let variables_json: String = row.get(12)?;
        let variables: Vec<PromptVariable> = serde_json::from_str(&variables_json)
            .unwrap_or_else(|_| Vec::new());

        Ok(AiBlock {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            prompt_template: row.get(3)?,
            category: row.get(4)?,
            tags,
            is_system: row.get(6)?,
            is_favorite: row.get(7)?,
            usage_count: row.get(8)?,
            created_at: row.get::<_, i64>(9)? as u64,
            updated_at: row.get::<_, i64>(10)? as u64,
            created_by: row.get(11)?,
            variables,
        })
    }
}

/// Usage statistics for AI Blocks
#[derive(Debug, Serialize, Deserialize)]
pub struct AiBlockUsageStats {
    pub total_blocks: i32,
    pub user_blocks: i32,
    pub system_blocks: i32,
    pub favorite_blocks: i32,
    pub total_usage: i32,
    pub categories: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::db_layer::{DatabaseConnection, MigrationManager};
    use tempfile::NamedTempFile;

    fn setup_test_db() -> DatabaseConnection {
        let temp_file = NamedTempFile::new().unwrap();
        let db_path = temp_file.path().to_str().unwrap();
        let db = DatabaseConnection::new(db_path).unwrap();
        
        // Run migrations including AI Blocks migration
        let migration_manager = MigrationManager::new(&db);
        migration_manager.migrate().unwrap();
        
        db
    }

    fn create_test_ai_block() -> AiBlock {
        AiBlock {
            id: "test-block".to_string(),
            name: "Test Block".to_string(),
            description: Some("A test AI block".to_string()),
            prompt_template: "Test prompt with {{variable}}".to_string(),
            category: "test".to_string(),
            tags: vec!["test".to_string(), "example".to_string()],
            is_system: false,
            is_favorite: false,
            usage_count: 0,
            created_at: 1000,
            updated_at: 1000,
            created_by: Some("test-user".to_string()),
            variables: vec![
                PromptVariable {
                    name: "variable".to_string(),
                    var_type: "text".to_string(),
                    description: "Test variable".to_string(),
                    required: true,
                    default_value: None,
                    options: None,
                }
            ],
        }
    }

    #[test]
    fn test_create_ai_block() {
        let db = setup_test_db();
        let repo = AiBlocksRepository::new(&db);
        let ai_block = create_test_ai_block();

        let result = repo.create(&ai_block);
        assert!(result.is_ok());

        let found = repo.find_by_id(&ai_block.id).unwrap();
        assert!(found.is_some());
        let found_block = found.unwrap();
        assert_eq!(found_block.name, ai_block.name);
        assert_eq!(found_block.prompt_template, ai_block.prompt_template);
    }

    #[test]
    fn test_update_ai_block() {
        let db = setup_test_db();
        let repo = AiBlocksRepository::new(&db);
        let mut ai_block = create_test_ai_block();

        repo.create(&ai_block).unwrap();

        ai_block.name = "Updated Test Block".to_string();
        ai_block.updated_at = 2000;

        let result = repo.update(&ai_block);
        assert!(result.is_ok());

        let found = repo.find_by_id(&ai_block.id).unwrap().unwrap();
        assert_eq!(found.name, "Updated Test Block");
    }

    #[test]
    fn test_delete_ai_block() {
        let db = setup_test_db();
        let repo = AiBlocksRepository::new(&db);
        let ai_block = create_test_ai_block();

        repo.create(&ai_block).unwrap();
        
        let result = repo.delete(&ai_block.id);
        assert!(result.is_ok());

        let found = repo.find_by_id(&ai_block.id).unwrap();
        assert!(found.is_none());
    }

    #[test]
    fn test_search_ai_blocks() {
        let db = setup_test_db();
        let repo = AiBlocksRepository::new(&db);
        let ai_block = create_test_ai_block();

        repo.create(&ai_block).unwrap();

        let results = repo.search("Test", Some(10)).unwrap();
        assert!(!results.is_empty());
        assert_eq!(results[0].name, ai_block.name);
    }

    #[test]
    fn test_toggle_favorite() {
        let db = setup_test_db();
        let repo = AiBlocksRepository::new(&db);
        let ai_block = create_test_ai_block();

        repo.create(&ai_block).unwrap();

        let new_status = repo.toggle_favorite(&ai_block.id).unwrap();
        assert!(new_status);

        let found = repo.find_by_id(&ai_block.id).unwrap().unwrap();
        assert!(found.is_favorite);
    }

    #[test]
    fn test_increment_usage() {
        let db = setup_test_db();
        let repo = AiBlocksRepository::new(&db);
        let ai_block = create_test_ai_block();

        repo.create(&ai_block).unwrap();

        repo.increment_usage(&ai_block.id).unwrap();

        let found = repo.find_by_id(&ai_block.id).unwrap().unwrap();
        assert_eq!(found.usage_count, 1);
    }

    #[test]
    fn test_get_usage_stats() {
        let db = setup_test_db();
        let repo = AiBlocksRepository::new(&db);

        let stats = repo.get_usage_stats().unwrap();
        
        // Should have system blocks from migration
        assert!(stats.system_blocks > 0);
        assert!(stats.total_blocks > 0);
        assert!(!stats.categories.is_empty());
    }
}
