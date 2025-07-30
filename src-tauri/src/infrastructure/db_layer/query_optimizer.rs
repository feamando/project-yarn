// Database Query Optimizer
// Task 3.1.4: Database Query Optimization
// 
// This module provides tools for analyzing and optimizing critical database queries
// using EXPLAIN QUERY PLAN in SQLite and implementing performance improvements.

use crate::infrastructure::db_layer::DatabaseConnection;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{info, warn, error};

/// Query performance analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryAnalysis {
    pub query: String,
    pub execution_plan: Vec<ExecutionStep>,
    pub estimated_cost: f64,
    pub uses_index: bool,
    pub table_scans: Vec<String>,
    pub recommendations: Vec<String>,
    pub execution_time_ms: Option<f64>,
}

/// Individual step in query execution plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionStep {
    pub step_id: i32,
    pub parent_id: i32,
    pub detail: String,
    pub uses_index: bool,
    pub table_name: Option<String>,
    pub index_name: Option<String>,
}

/// Index recommendation for query optimization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexRecommendation {
    pub table_name: String,
    pub columns: Vec<String>,
    pub index_name: String,
    pub reason: String,
    pub estimated_improvement: String,
    pub sql: String,
}

/// Database query optimizer
pub struct QueryOptimizer<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> QueryOptimizer<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    /// Analyze a query's execution plan using EXPLAIN QUERY PLAN
    pub fn analyze_query(&self, query: &str, params: &[&dyn rusqlite::ToSql]) -> Result<QueryAnalysis, String> {
        let explain_query = format!("EXPLAIN QUERY PLAN {}", query);
        
        let start_time = std::time::Instant::now();
        
        // Get execution plan
        let execution_plan = self.get_execution_plan(&explain_query)?;
        
        // Execute query to measure time (with LIMIT to avoid large result sets)
        let limited_query = self.add_limit_if_needed(query);
        let execution_time = self.measure_query_time(&limited_query, params)?;
        
        let elapsed = start_time.elapsed();
        
        // Analyze the plan
        let uses_index = execution_plan.iter().any(|step| step.uses_index);
        let table_scans = self.find_table_scans(&execution_plan);
        let estimated_cost = self.estimate_query_cost(&execution_plan);
        let recommendations = self.generate_recommendations(&execution_plan, query);

        Ok(QueryAnalysis {
            query: query.to_string(),
            execution_plan,
            estimated_cost,
            uses_index,
            table_scans,
            recommendations,
            execution_time_ms: Some(execution_time),
        })
    }

    /// Get detailed execution plan from EXPLAIN QUERY PLAN
    fn get_execution_plan(&self, explain_query: &str) -> Result<Vec<ExecutionStep>, String> {
        let mut steps = Vec::new();
        
        self.db.query_map(explain_query, &[], |row| {
            let detail: String = row.get(3)?;
            let uses_index = detail.to_lowercase().contains("index") && 
                            !detail.to_lowercase().contains("without rowid");
            
            // Extract table name from detail
            let table_name = self.extract_table_name(&detail);
            let index_name = self.extract_index_name(&detail);
            
            Ok(ExecutionStep {
                step_id: row.get(0)?,
                parent_id: row.get(1)?,
                detail,
                uses_index,
                table_name,
                index_name,
            })
        }).map_err(|e| format!("Failed to get execution plan: {}", e))?
        .into_iter()
        .for_each(|step| {
            if let Ok(step) = step {
                steps.push(step);
            }
        });

        Ok(steps)
    }

    /// Extract table name from execution plan detail
    fn extract_table_name(&self, detail: &str) -> Option<String> {
        // Common patterns: "SCAN TABLE tablename", "SEARCH TABLE tablename"
        let patterns = ["SCAN TABLE ", "SEARCH TABLE ", "USING INDEX ", "TABLE "];
        
        for pattern in &patterns {
            if let Some(start) = detail.find(pattern) {
                let after_pattern = &detail[start + pattern.len()..];
                if let Some(end) = after_pattern.find(' ') {
                    return Some(after_pattern[..end].to_string());
                } else {
                    return Some(after_pattern.to_string());
                }
            }
        }
        None
    }

    /// Extract index name from execution plan detail
    fn extract_index_name(&self, detail: &str) -> Option<String> {
        if let Some(start) = detail.find("USING INDEX ") {
            let after_using = &detail[start + 12..]; // "USING INDEX ".len() = 12
            if let Some(end) = after_using.find(' ') {
                return Some(after_using[..end].to_string());
            } else {
                return Some(after_using.to_string());
            }
        }
        None
    }

    /// Find table scans in execution plan
    fn find_table_scans(&self, execution_plan: &[ExecutionStep]) -> Vec<String> {
        execution_plan
            .iter()
            .filter(|step| step.detail.contains("SCAN TABLE") && !step.uses_index)
            .filter_map(|step| step.table_name.clone())
            .collect()
    }

    /// Estimate query cost based on execution plan
    fn estimate_query_cost(&self, execution_plan: &[ExecutionStep]) -> f64 {
        let mut cost = 0.0;
        
        for step in execution_plan {
            if step.detail.contains("SCAN TABLE") {
                cost += if step.uses_index { 1.0 } else { 10.0 }; // Table scan is expensive
            } else if step.detail.contains("SEARCH TABLE") {
                cost += if step.uses_index { 0.5 } else { 5.0 }; // Search with index is cheap
            } else if step.detail.contains("SORT") {
                cost += 2.0; // Sorting adds cost
            } else if step.detail.contains("TEMP B-TREE") {
                cost += 3.0; // Temporary structures are expensive
            }
        }
        
        cost
    }

    /// Generate optimization recommendations
    fn generate_recommendations(&self, execution_plan: &[ExecutionStep], query: &str) -> Vec<String> {
        let mut recommendations = Vec::new();
        
        // Check for table scans
        for step in execution_plan {
            if step.detail.contains("SCAN TABLE") && !step.uses_index {
                if let Some(table_name) = &step.table_name {
                    recommendations.push(format!(
                        "Consider adding an index to table '{}' for better performance", 
                        table_name
                    ));
                }
            }
        }
        
        // Check for sorting without index
        if execution_plan.iter().any(|step| step.detail.contains("SORT")) {
            recommendations.push("Consider adding an index on ORDER BY columns to avoid sorting".to_string());
        }
        
        // Check for temporary B-trees
        if execution_plan.iter().any(|step| step.detail.contains("TEMP B-TREE")) {
            recommendations.push("Query uses temporary B-tree structures - consider optimizing JOIN conditions or adding indexes".to_string());
        }
        
        // Check for missing WHERE clause indexes
        if query.to_uppercase().contains("WHERE") && 
           !execution_plan.iter().any(|step| step.uses_index && step.detail.contains("SEARCH")) {
            recommendations.push("WHERE clause may benefit from an index on the filtered columns".to_string());
        }
        
        recommendations
    }

    /// Add LIMIT clause to query if needed to avoid large result sets during analysis
    fn add_limit_if_needed(&self, query: &str) -> String {
        let upper_query = query.to_uppercase();
        if upper_query.contains("SELECT") && !upper_query.contains("LIMIT") && !upper_query.contains("COUNT") {
            format!("{} LIMIT 100", query)
        } else {
            query.to_string()
        }
    }

    /// Measure query execution time
    fn measure_query_time(&self, query: &str, params: &[&dyn rusqlite::ToSql]) -> Result<f64, String> {
        let start = std::time::Instant::now();
        
        // Execute query and consume results
        let mut row_count = 0;
        self.db.query_map(query, params, |_row| {
            row_count += 1;
            Ok(())
        }).map_err(|e| format!("Failed to execute query for timing: {}", e))?;
        
        let elapsed = start.elapsed();
        Ok(elapsed.as_secs_f64() * 1000.0) // Convert to milliseconds
    }

    /// Analyze critical RAG system queries
    pub fn analyze_rag_queries(&self) -> Result<Vec<QueryAnalysis>, String> {
        let mut analyses = Vec::new();
        
        // Critical RAG queries to analyze
        let rag_queries = vec![
            // FTS5 search queries
            (
                "SELECT d.id, d.title, d.content, bm25(documents_fts) as rank FROM documents_fts JOIN documents d ON documents_fts.rowid = d.id WHERE documents_fts MATCH ? ORDER BY rank",
                vec!["test query" as &dyn rusqlite::ToSql],
                "FTS5 full-text search"
            ),
            // Vector similarity queries
            (
                "SELECT id, document_id, embedding, embedding_model FROM vector_index WHERE embedding_model = ? ORDER BY document_id",
                vec!["test-model" as &dyn rusqlite::ToSql],
                "Vector index retrieval by model"
            ),
            // Document embeddings queries
            (
                "SELECT id, document_id, chunk_index, embedding_vector FROM document_embeddings WHERE document_id = ? ORDER BY chunk_index",
                vec![&1i64 as &dyn rusqlite::ToSql],
                "Document embeddings retrieval"
            ),
            // Project documents queries
            (
                "SELECT id, project_id, path, state, updated_at FROM documents WHERE project_id = ? ORDER BY updated_at DESC",
                vec!["test-project" as &dyn rusqlite::ToSql],
                "Project documents retrieval"
            ),
            // Document state queries
            (
                "SELECT id, project_id, state FROM documents WHERE state = ? ORDER BY updated_at DESC",
                vec!["draft" as &dyn rusqlite::ToSql],
                "Documents by state"
            ),
            // Embedding jobs queries
            (
                "SELECT id, document_id, status FROM embedding_jobs WHERE status = ? ORDER BY created_at",
                vec!["pending" as &dyn rusqlite::ToSql],
                "Pending embedding jobs"
            ),
        ];

        for (query, params, description) in rag_queries {
            info!("Analyzing query: {}", description);
            match self.analyze_query(query, &params) {
                Ok(analysis) => {
                    info!("Query analysis complete: {} ({}ms)", description, 
                          analysis.execution_time_ms.unwrap_or(0.0));
                    analyses.push(analysis);
                },
                Err(e) => {
                    warn!("Failed to analyze query '{}': {}", description, e);
                }
            }
        }

        Ok(analyses)
    }

    /// Generate index recommendations based on query analysis
    pub fn generate_index_recommendations(&self, analyses: &[QueryAnalysis]) -> Result<Vec<IndexRecommendation>, String> {
        let mut recommendations = Vec::new();
        
        // Analyze patterns across all queries
        let mut table_column_usage: HashMap<String, Vec<String>> = HashMap::new();
        
        for analysis in analyses {
            // Extract table and column usage patterns
            if analysis.query.contains("WHERE project_id") {
                table_column_usage.entry("documents".to_string())
                    .or_insert_with(Vec::new)
                    .push("project_id".to_string());
            }
            
            if analysis.query.contains("WHERE state") {
                table_column_usage.entry("documents".to_string())
                    .or_insert_with(Vec::new)
                    .push("state".to_string());
            }
            
            if analysis.query.contains("WHERE document_id") {
                if analysis.query.contains("document_embeddings") {
                    table_column_usage.entry("document_embeddings".to_string())
                        .or_insert_with(Vec::new)
                        .push("document_id".to_string());
                }
                if analysis.query.contains("vector_index") {
                    table_column_usage.entry("vector_index".to_string())
                        .or_insert_with(Vec::new)
                        .push("document_id".to_string());
                }
            }
            
            if analysis.query.contains("WHERE embedding_model") {
                table_column_usage.entry("vector_index".to_string())
                    .or_insert_with(Vec::new)
                    .push("embedding_model".to_string());
            }
            
            if analysis.query.contains("ORDER BY updated_at") {
                if analysis.query.contains("documents") {
                    table_column_usage.entry("documents".to_string())
                        .or_insert_with(Vec::new)
                        .push("updated_at".to_string());
                }
            }
        }

        // Generate specific recommendations
        for (table, columns) in table_column_usage {
            let unique_columns: Vec<String> = columns.into_iter().collect::<std::collections::HashSet<_>>().into_iter().collect();
            
            for column in &unique_columns {
                let index_name = format!("idx_{}_{}", table, column);
                let sql = format!("CREATE INDEX IF NOT EXISTS {} ON {}({})", index_name, table, column);
                
                recommendations.push(IndexRecommendation {
                    table_name: table.clone(),
                    columns: vec![column.clone()],
                    index_name: index_name.clone(),
                    reason: format!("Frequently queried column '{}' in table '{}'", column, table),
                    estimated_improvement: "10-100x faster lookups".to_string(),
                    sql,
                });
            }
            
            // Composite index recommendations
            if table == "documents" && unique_columns.contains(&"project_id".to_string()) && unique_columns.contains(&"state".to_string()) {
                let index_name = "idx_documents_project_state".to_string();
                let sql = "CREATE INDEX IF NOT EXISTS idx_documents_project_state ON documents(project_id, state)".to_string();
                
                recommendations.push(IndexRecommendation {
                    table_name: table.clone(),
                    columns: vec!["project_id".to_string(), "state".to_string()],
                    index_name,
                    reason: "Composite index for project + state filtering".to_string(),
                    estimated_improvement: "Significant improvement for filtered project queries".to_string(),
                    sql,
                });
            }
            
            if table == "documents" && unique_columns.contains(&"project_id".to_string()) && unique_columns.contains(&"updated_at".to_string()) {
                let index_name = "idx_documents_project_updated".to_string();
                let sql = "CREATE INDEX IF NOT EXISTS idx_documents_project_updated ON documents(project_id, updated_at DESC)".to_string();
                
                recommendations.push(IndexRecommendation {
                    table_name: table.clone(),
                    columns: vec!["project_id".to_string(), "updated_at".to_string()],
                    index_name,
                    reason: "Composite index for project + ordering by update time".to_string(),
                    estimated_improvement: "Eliminates sorting for project document lists".to_string(),
                    sql,
                });
            }
        }

        Ok(recommendations)
    }

    /// Apply index recommendations to the database
    pub fn apply_index_recommendations(&self, recommendations: &[IndexRecommendation]) -> Result<Vec<String>, String> {
        let mut applied = Vec::new();
        
        for recommendation in recommendations {
            info!("Applying index: {}", recommendation.index_name);
            
            match self.db.execute(&recommendation.sql, &[]) {
                Ok(_) => {
                    applied.push(recommendation.index_name.clone());
                    info!("Successfully created index: {}", recommendation.index_name);
                },
                Err(e) => {
                    warn!("Failed to create index {}: {}", recommendation.index_name, e);
                }
            }
        }
        
        Ok(applied)
    }

    /// Get database statistics for performance monitoring
    pub fn get_database_stats(&self) -> Result<DatabaseStats, String> {
        let mut stats = DatabaseStats::default();
        
        // Get table sizes
        let table_stats_query = r#"
            SELECT name, 
                   (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as table_count,
                   (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as index_count
            FROM sqlite_master m WHERE type='table' AND name NOT LIKE 'sqlite_%'
        "#;
        
        self.db.query_map(table_stats_query, &[], |row| {
            let table_name: String = row.get(0)?;
            let index_count: i32 = row.get(2)?;
            
            stats.table_index_counts.insert(table_name, index_count);
            Ok(())
        }).map_err(|e| format!("Failed to get table stats: {}", e))?;
        
        // Get database page size and count
        if let Ok(page_size) = self.db.query_row("PRAGMA page_size", &[], |row| row.get::<_, i32>(0)) {
            stats.page_size = page_size;
        }
        
        if let Ok(page_count) = self.db.query_row("PRAGMA page_count", &[], |row| row.get::<_, i32>(0)) {
            stats.page_count = page_count;
            stats.database_size_bytes = (page_size as i64) * (page_count as i64);
        }
        
        // Get cache statistics
        if let Ok(cache_size) = self.db.query_row("PRAGMA cache_size", &[], |row| row.get::<_, i32>(0)) {
            stats.cache_size = cache_size;
        }
        
        Ok(stats)
    }

    /// Run comprehensive database optimization
    pub fn optimize_database(&self) -> Result<OptimizationReport, String> {
        info!("Starting comprehensive database optimization");
        
        let start_time = std::time::Instant::now();
        
        // Step 1: Analyze critical queries
        let analyses = self.analyze_rag_queries()?;
        
        // Step 2: Generate index recommendations
        let recommendations = self.generate_index_recommendations(&analyses)?;
        
        // Step 3: Apply recommended indexes
        let applied_indexes = self.apply_index_recommendations(&recommendations)?;
        
        // Step 4: Run database maintenance
        self.run_database_maintenance()?;
        
        // Step 5: Get final statistics
        let final_stats = self.get_database_stats()?;
        
        let optimization_time = start_time.elapsed();
        
        Ok(OptimizationReport {
            query_analyses: analyses,
            index_recommendations: recommendations,
            applied_indexes,
            database_stats: final_stats,
            optimization_time_ms: optimization_time.as_millis() as f64,
            summary: format!(
                "Applied {} indexes, analyzed {} queries in {:.2}ms",
                applied_indexes.len(),
                analyses.len(),
                optimization_time.as_millis()
            ),
        })
    }

    /// Run database maintenance operations
    fn run_database_maintenance(&self) -> Result<(), String> {
        info!("Running database maintenance");
        
        // Analyze tables to update statistics
        self.db.execute("ANALYZE", &[])
            .map_err(|e| format!("Failed to analyze database: {}", e))?;
        
        // Optimize database (similar to VACUUM but less intensive)
        self.db.execute("PRAGMA optimize", &[])
            .map_err(|e| format!("Failed to optimize database: {}", e))?;
        
        // Rebuild FTS5 index if it exists
        if self.fts5_exists()? {
            self.db.execute("INSERT INTO documents_fts(documents_fts) VALUES('rebuild')", &[])
                .map_err(|e| format!("Failed to rebuild FTS5 index: {}", e))?;
        }
        
        info!("Database maintenance completed");
        Ok(())
    }

    /// Check if FTS5 index exists
    fn fts5_exists(&self) -> Result<bool, String> {
        let count: i32 = self.db.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='documents_fts'",
            &[],
            |row| row.get(0)
        ).map_err(|e| format!("Failed to check FTS5 existence: {}", e))?;
        
        Ok(count > 0)
    }
}

/// Database statistics for monitoring
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct DatabaseStats {
    pub page_size: i32,
    pub page_count: i32,
    pub database_size_bytes: i64,
    pub cache_size: i32,
    pub table_index_counts: HashMap<String, i32>,
}

/// Comprehensive optimization report
#[derive(Debug, Serialize, Deserialize)]
pub struct OptimizationReport {
    pub query_analyses: Vec<QueryAnalysis>,
    pub index_recommendations: Vec<IndexRecommendation>,
    pub applied_indexes: Vec<String>,
    pub database_stats: DatabaseStats,
    pub optimization_time_ms: f64,
    pub summary: String,
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
        
        // Run migrations
        let migration_manager = MigrationManager::new(&db);
        migration_manager.migrate().unwrap();
        
        db
    }

    #[test]
    fn test_query_analysis() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        let query = "SELECT id, project_id FROM documents WHERE project_id = ?";
        let params = vec!["test-project" as &dyn rusqlite::ToSql];
        
        let analysis = optimizer.analyze_query(query, &params).unwrap();
        
        assert_eq!(analysis.query, query);
        assert!(!analysis.execution_plan.is_empty());
        assert!(analysis.execution_time_ms.is_some());
    }

    #[test]
    fn test_index_recommendations() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        let analyses = optimizer.analyze_rag_queries().unwrap();
        let recommendations = optimizer.generate_index_recommendations(&analyses).unwrap();
        
        assert!(!recommendations.is_empty());
        assert!(recommendations.iter().any(|r| r.table_name == "documents"));
    }

    #[test]
    fn test_database_optimization() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        let report = optimizer.optimize_database().unwrap();
        
        assert!(!report.query_analyses.is_empty());
        assert!(!report.index_recommendations.is_empty());
        assert!(report.optimization_time_ms > 0.0);
    }
}
