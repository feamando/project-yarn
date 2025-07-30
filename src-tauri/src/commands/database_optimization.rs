// Tauri Commands for Database Optimization
// Task 3.1.4: Database Query Optimization
// 
// This module exposes database optimization functionality to the frontend
// through Tauri commands for performance monitoring and optimization.

use crate::services::database_optimization_service::*;
use crate::infrastructure::db_layer::query_optimizer::*;
use tauri::State;
use std::sync::Arc;

/// Tauri command to run comprehensive database optimization
#[tauri::command]
pub async fn optimize_database(
    optimization_service: State<'_, Arc<DatabaseOptimizationService>>,
) -> Result<OptimizationSummary, String> {
    optimization_service.optimize_database().await
}

/// Tauri command to analyze RAG system query performance
#[tauri::command]
pub async fn analyze_rag_performance(
    optimization_service: State<'_, Arc<DatabaseOptimizationService>>,
) -> Result<RagPerformanceReport, String> {
    optimization_service.analyze_rag_performance().await
}

/// Tauri command to get current database performance metrics
#[tauri::command]
pub async fn get_database_performance_metrics(
    optimization_service: State<'_, Arc<DatabaseOptimizationService>>,
) -> Result<DatabasePerformanceMetrics, String> {
    optimization_service.get_performance_metrics().await
}

/// Tauri command to apply specific index recommendations
#[tauri::command]
pub async fn apply_index_recommendations(
    optimization_service: State<'_, Arc<DatabaseOptimizationService>>,
    recommendations: Vec<IndexRecommendation>,
) -> Result<IndexApplicationResult, String> {
    optimization_service.apply_index_recommendations(recommendations).await
}

/// Tauri command to validate database health and integrity
#[tauri::command]
pub async fn validate_database_health(
    optimization_service: State<'_, Arc<DatabaseOptimizationService>>,
) -> Result<DatabaseHealthReport, String> {
    optimization_service.validate_database_health().await
}

/// Tauri command to get detailed query analysis for a specific query
#[tauri::command]
pub async fn analyze_specific_query(
    optimization_service: State<'_, Arc<DatabaseOptimizationService>>,
    query: String,
    description: Option<String>,
) -> Result<QueryAnalysisResult, String> {
    // This is a simplified implementation - in a real application you might want
    // to validate the query and provide more sophisticated parameter handling
    let db = &optimization_service.db;
    let optimizer = crate::infrastructure::db_layer::query_optimizer::QueryOptimizer::new(db);
    
    // For safety, we'll only allow SELECT queries and add LIMIT if needed
    if !query.trim().to_uppercase().starts_with("SELECT") {
        return Err("Only SELECT queries are allowed for analysis".to_string());
    }
    
    let limited_query = if !query.to_uppercase().contains("LIMIT") {
        format!("{} LIMIT 100", query)
    } else {
        query.clone()
    };
    
    let analysis = optimizer.analyze_query(&limited_query, &[])?;
    
    Ok(QueryAnalysisResult {
        query: query,
        description: description.unwrap_or_else(|| "User-provided query".to_string()),
        analysis,
        optimization_suggestions: generate_optimization_suggestions(&analysis),
    })
}

/// Tauri command to get database optimization history (placeholder for future implementation)
#[tauri::command]
pub async fn get_optimization_history(
    _optimization_service: State<'_, Arc<DatabaseOptimizationService>>,
) -> Result<Vec<OptimizationHistoryEntry>, String> {
    // Placeholder implementation - in a real application, you would store
    // optimization history in the database and retrieve it here
    Ok(vec![])
}

/// Generate optimization suggestions based on query analysis
fn generate_optimization_suggestions(analysis: &QueryAnalysis) -> Vec<String> {
    let mut suggestions = Vec::new();
    
    if !analysis.uses_index {
        suggestions.push("Consider adding an index to improve query performance".to_string());
    }
    
    if analysis.estimated_cost > 10.0 {
        suggestions.push("Query has high estimated cost - consider optimization".to_string());
    }
    
    if !analysis.table_scans.is_empty() {
        suggestions.push(format!(
            "Query performs table scans on: {} - consider adding indexes",
            analysis.table_scans.join(", ")
        ));
    }
    
    if analysis.execution_time_ms.unwrap_or(0.0) > 100.0 {
        suggestions.push("Query execution time is high - optimization recommended".to_string());
    }
    
    suggestions.extend(analysis.recommendations.clone());
    suggestions
}

/// Result of analyzing a specific query
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct QueryAnalysisResult {
    pub query: String,
    pub description: String,
    pub analysis: QueryAnalysis,
    pub optimization_suggestions: Vec<String>,
}

/// Optimization history entry (for future implementation)
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct OptimizationHistoryEntry {
    pub timestamp: u64,
    pub optimization_type: String,
    pub summary: String,
    pub performance_improvement: f64,
    pub indexes_created: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::db_layer::{DatabaseConnection, MigrationManager};
    use crate::services::database_optimization_service::DatabaseOptimizationService;
    use tempfile::NamedTempFile;
    use std::sync::Arc;

    async fn setup_test_service() -> Arc<DatabaseOptimizationService> {
        let temp_file = NamedTempFile::new().unwrap();
        let db_path = temp_file.path().to_str().unwrap();
        let db = Arc::new(DatabaseConnection::new(db_path).unwrap());
        
        // Run migrations
        let migration_manager = MigrationManager::new(&db);
        migration_manager.migrate().unwrap();
        
        Arc::new(DatabaseOptimizationService::new(db))
    }

    #[tokio::test]
    async fn test_optimize_database_command() {
        let service = setup_test_service().await;
        let state = tauri::State::from(service);
        
        let result = optimize_database(state).await;
        assert!(result.is_ok());
        
        let summary = result.unwrap();
        assert!(summary.total_queries_analyzed > 0);
    }

    #[tokio::test]
    async fn test_analyze_rag_performance_command() {
        let service = setup_test_service().await;
        let state = tauri::State::from(service);
        
        let result = analyze_rag_performance(state).await;
        assert!(result.is_ok());
        
        let report = result.unwrap();
        assert!(report.total_queries_analyzed > 0);
    }

    #[tokio::test]
    async fn test_get_performance_metrics_command() {
        let service = setup_test_service().await;
        let state = tauri::State::from(service);
        
        let result = get_database_performance_metrics(state).await;
        assert!(result.is_ok());
        
        let metrics = result.unwrap();
        assert!(metrics.database_size_mb >= 0.0);
    }

    #[tokio::test]
    async fn test_analyze_specific_query_command() {
        let service = setup_test_service().await;
        let state = tauri::State::from(service);
        
        let query = "SELECT id, project_id FROM documents WHERE project_id = 'test'".to_string();
        let result = analyze_specific_query(state, query.clone(), Some("Test query".to_string())).await;
        
        assert!(result.is_ok());
        let analysis_result = result.unwrap();
        assert_eq!(analysis_result.query, query);
        assert!(!analysis_result.optimization_suggestions.is_empty());
    }

    #[tokio::test]
    async fn test_validate_database_health_command() {
        let service = setup_test_service().await;
        let state = tauri::State::from(service);
        
        let result = validate_database_health(state).await;
        assert!(result.is_ok());
        
        let health = result.unwrap();
        assert!(health.health_score >= 0 && health.health_score <= 100);
    }

    #[test]
    fn test_generate_optimization_suggestions() {
        let analysis = QueryAnalysis {
            query: "SELECT * FROM documents".to_string(),
            execution_plan: vec![],
            estimated_cost: 15.0,
            uses_index: false,
            table_scans: vec!["documents".to_string()],
            recommendations: vec!["Add index on documents".to_string()],
            execution_time_ms: Some(150.0),
        };
        
        let suggestions = generate_optimization_suggestions(&analysis);
        
        assert!(!suggestions.is_empty());
        assert!(suggestions.iter().any(|s| s.contains("index")));
        assert!(suggestions.iter().any(|s| s.contains("high estimated cost")));
        assert!(suggestions.iter().any(|s| s.contains("table scans")));
        assert!(suggestions.iter().any(|s| s.contains("execution time is high")));
    }
}
