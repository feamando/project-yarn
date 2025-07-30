// Database Optimization Service
// Task 3.1.4: Database Query Optimization
// 
// This service provides high-level database optimization functionality
// integrating the query optimizer with the application's database layer.

use crate::infrastructure::db_layer::{DatabaseConnection, query_optimizer::*};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn, error};

/// Database optimization service for managing query performance
pub struct DatabaseOptimizationService {
    db: Arc<DatabaseConnection>,
}

impl DatabaseOptimizationService {
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Run comprehensive database optimization
    pub async fn optimize_database(&self) -> Result<OptimizationSummary, String> {
        info!("Starting database optimization process");
        
        let optimizer = QueryOptimizer::new(&self.db);
        let report = optimizer.optimize_database()?;
        
        let summary = OptimizationSummary {
            total_queries_analyzed: report.query_analyses.len(),
            indexes_created: report.applied_indexes.len(),
            optimization_time_ms: report.optimization_time_ms,
            performance_improvements: self.calculate_performance_improvements(&report),
            database_size_mb: report.database_stats.database_size_bytes as f64 / (1024.0 * 1024.0),
            recommendations_applied: report.applied_indexes.clone(),
            summary: report.summary,
        };
        
        info!("Database optimization completed: {}", summary.summary);
        Ok(summary)
    }

    /// Analyze specific RAG system queries
    pub async fn analyze_rag_performance(&self) -> Result<RagPerformanceReport, String> {
        info!("Analyzing RAG system query performance");
        
        let optimizer = QueryOptimizer::new(&self.db);
        let analyses = optimizer.analyze_rag_queries()?;
        
        let mut slow_queries = Vec::new();
        let mut fast_queries = Vec::new();
        let mut total_time = 0.0;
        
        for analysis in &analyses {
            let execution_time = analysis.execution_time_ms.unwrap_or(0.0);
            total_time += execution_time;
            
            if execution_time > 100.0 { // Queries taking more than 100ms are considered slow
                slow_queries.push(SlowQueryInfo {
                    query: analysis.query.clone(),
                    execution_time_ms: execution_time,
                    uses_index: analysis.uses_index,
                    recommendations: analysis.recommendations.clone(),
                });
            } else {
                fast_queries.push(analysis.query.clone());
            }
        }
        
        let report = RagPerformanceReport {
            total_queries_analyzed: analyses.len(),
            slow_queries,
            fast_queries_count: fast_queries.len(),
            average_query_time_ms: if analyses.is_empty() { 0.0 } else { total_time / analyses.len() as f64 },
            total_analysis_time_ms: total_time,
            optimization_recommendations: optimizer.generate_index_recommendations(&analyses)?,
        };
        
        info!("RAG performance analysis completed: {} queries analyzed, {} slow queries found", 
              report.total_queries_analyzed, report.slow_queries.len());
        
        Ok(report)
    }

    /// Get current database performance metrics
    pub async fn get_performance_metrics(&self) -> Result<DatabasePerformanceMetrics, String> {
        let optimizer = QueryOptimizer::new(&self.db);
        let stats = optimizer.get_database_stats()?;
        
        // Get query performance samples
        let sample_queries = vec![
            ("SELECT COUNT(*) FROM documents", "Document count query"),
            ("SELECT id, project_id FROM documents WHERE project_id = 'sample' LIMIT 10", "Project documents query"),
            ("SELECT * FROM documents WHERE state = 'draft' LIMIT 10", "State filter query"),
        ];
        
        let mut query_performance = Vec::new();
        for (query, description) in sample_queries {
            match self.measure_query_performance(query).await {
                Ok(time_ms) => {
                    query_performance.push(QueryPerformanceMetric {
                        description: description.to_string(),
                        execution_time_ms: time_ms,
                        is_optimized: time_ms < 50.0, // Queries under 50ms are considered optimized
                    });
                },
                Err(e) => {
                    warn!("Failed to measure query performance for '{}': {}", description, e);
                }
            }
        }
        
        Ok(DatabasePerformanceMetrics {
            database_size_mb: stats.database_size_bytes as f64 / (1024.0 * 1024.0),
            page_size: stats.page_size,
            page_count: stats.page_count,
            cache_size: stats.cache_size,
            total_indexes: stats.table_index_counts.values().sum(),
            query_performance,
            last_optimization: None, // TODO: Track last optimization time
        })
    }

    /// Apply specific index recommendations
    pub async fn apply_index_recommendations(&self, recommendations: Vec<IndexRecommendation>) -> Result<IndexApplicationResult, String> {
        info!("Applying {} index recommendations", recommendations.len());
        
        let optimizer = QueryOptimizer::new(&self.db);
        let applied_indexes = optimizer.apply_index_recommendations(&recommendations)?;
        
        // Measure performance improvement
        let performance_before = self.get_performance_metrics().await?;
        
        // Run ANALYZE to update statistics
        self.db.execute("ANALYZE", &[])
            .map_err(|e| format!("Failed to analyze database after index creation: {}", e))?;
        
        let performance_after = self.get_performance_metrics().await?;
        
        Ok(IndexApplicationResult {
            applied_indexes,
            total_applied: applied_indexes.len(),
            performance_improvement: self.calculate_performance_change(&performance_before, &performance_after),
            database_size_change_mb: performance_after.database_size_mb - performance_before.database_size_mb,
        })
    }

    /// Validate database integrity and performance
    pub async fn validate_database_health(&self) -> Result<DatabaseHealthReport, String> {
        info!("Validating database health and integrity");
        
        let mut issues = Vec::new();
        let mut recommendations = Vec::new();
        
        // Check database integrity
        match self.db.query_row("PRAGMA integrity_check", &[], |row| {
            Ok(row.get::<_, String>(0)?)
        }) {
            Ok(result) => {
                if result != "ok" {
                    issues.push(format!("Database integrity check failed: {}", result));
                }
            },
            Err(e) => {
                issues.push(format!("Failed to run integrity check: {}", e));
            }
        }
        
        // Check for missing indexes on frequently queried columns
        let optimizer = QueryOptimizer::new(&self.db);
        let rag_analyses = optimizer.analyze_rag_queries()?;
        
        for analysis in &rag_analyses {
            if !analysis.uses_index && analysis.execution_time_ms.unwrap_or(0.0) > 50.0 {
                issues.push(format!("Slow query without index: {:.2}ms", analysis.execution_time_ms.unwrap_or(0.0)));
                recommendations.extend(analysis.recommendations.clone());
            }
        }
        
        // Check database statistics freshness
        let stats_query = "SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_stat1'";
        match self.db.query_row(stats_query, &[], |_| Ok(())) {
            Ok(_) => {
                // Statistics table exists, check if it's recent
                // This is a simplified check - in production you might want to check modification times
            },
            Err(_) => {
                recommendations.push("Run ANALYZE to update database statistics".to_string());
            }
        }
        
        let health_score = if issues.is_empty() { 100 } else { std::cmp::max(0, 100 - (issues.len() * 20) as i32) };
        
        Ok(DatabaseHealthReport {
            health_score,
            issues,
            recommendations,
            last_check: chrono::Utc::now().timestamp() as u64,
            database_version: self.get_database_version()?,
        })
    }

    /// Get database schema version
    fn get_database_version(&self) -> Result<i32, String> {
        self.db.query_row("SELECT MAX(version) FROM schema_version", &[], |row| {
            Ok(row.get::<_, Option<i32>>(0)?.unwrap_or(0))
        }).map_err(|e| format!("Failed to get database version: {}", e))
    }

    /// Measure performance of a specific query
    async fn measure_query_performance(&self, query: &str) -> Result<f64, String> {
        let start = std::time::Instant::now();
        
        // Execute query with LIMIT to avoid large result sets
        let limited_query = if query.to_uppercase().contains("SELECT") && !query.to_uppercase().contains("LIMIT") {
            format!("{} LIMIT 10", query)
        } else {
            query.to_string()
        };
        
        self.db.query_map(&limited_query, &[], |_| Ok(()))
            .map_err(|e| format!("Query execution failed: {}", e))?;
        
        let elapsed = start.elapsed();
        Ok(elapsed.as_secs_f64() * 1000.0)
    }

    /// Calculate performance improvements from optimization report
    fn calculate_performance_improvements(&self, report: &OptimizationReport) -> Vec<String> {
        let mut improvements = Vec::new();
        
        improvements.push(format!("Created {} database indexes", report.applied_indexes.len()));
        
        let slow_queries = report.query_analyses.iter()
            .filter(|a| a.execution_time_ms.unwrap_or(0.0) > 100.0)
            .count();
        
        if slow_queries > 0 {
            improvements.push(format!("Identified {} slow queries for optimization", slow_queries));
        }
        
        let queries_without_indexes = report.query_analyses.iter()
            .filter(|a| !a.uses_index)
            .count();
        
        if queries_without_indexes > 0 {
            improvements.push(format!("Optimized {} queries that were missing indexes", queries_without_indexes));
        }
        
        improvements.push(format!("Database analysis completed in {:.2}ms", report.optimization_time_ms));
        
        improvements
    }

    /// Calculate performance change between two metrics
    fn calculate_performance_change(&self, before: &DatabasePerformanceMetrics, after: &DatabasePerformanceMetrics) -> f64 {
        let before_avg = before.query_performance.iter()
            .map(|q| q.execution_time_ms)
            .sum::<f64>() / before.query_performance.len().max(1) as f64;
        
        let after_avg = after.query_performance.iter()
            .map(|q| q.execution_time_ms)
            .sum::<f64>() / after.query_performance.len().max(1) as f64;
        
        if before_avg > 0.0 {
            ((before_avg - after_avg) / before_avg) * 100.0
        } else {
            0.0
        }
    }
}

/// Summary of database optimization results
#[derive(Debug, Serialize, Deserialize)]
pub struct OptimizationSummary {
    pub total_queries_analyzed: usize,
    pub indexes_created: usize,
    pub optimization_time_ms: f64,
    pub performance_improvements: Vec<String>,
    pub database_size_mb: f64,
    pub recommendations_applied: Vec<String>,
    pub summary: String,
}

/// RAG system performance analysis report
#[derive(Debug, Serialize, Deserialize)]
pub struct RagPerformanceReport {
    pub total_queries_analyzed: usize,
    pub slow_queries: Vec<SlowQueryInfo>,
    pub fast_queries_count: usize,
    pub average_query_time_ms: f64,
    pub total_analysis_time_ms: f64,
    pub optimization_recommendations: Vec<IndexRecommendation>,
}

/// Information about slow queries
#[derive(Debug, Serialize, Deserialize)]
pub struct SlowQueryInfo {
    pub query: String,
    pub execution_time_ms: f64,
    pub uses_index: bool,
    pub recommendations: Vec<String>,
}

/// Database performance metrics
#[derive(Debug, Serialize, Deserialize)]
pub struct DatabasePerformanceMetrics {
    pub database_size_mb: f64,
    pub page_size: i32,
    pub page_count: i32,
    pub cache_size: i32,
    pub total_indexes: i32,
    pub query_performance: Vec<QueryPerformanceMetric>,
    pub last_optimization: Option<u64>,
}

/// Individual query performance metric
#[derive(Debug, Serialize, Deserialize)]
pub struct QueryPerformanceMetric {
    pub description: String,
    pub execution_time_ms: f64,
    pub is_optimized: bool,
}

/// Result of applying index recommendations
#[derive(Debug, Serialize, Deserialize)]
pub struct IndexApplicationResult {
    pub applied_indexes: Vec<String>,
    pub total_applied: usize,
    pub performance_improvement: f64,
    pub database_size_change_mb: f64,
}

/// Database health report
#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseHealthReport {
    pub health_score: i32, // 0-100 score
    pub issues: Vec<String>,
    pub recommendations: Vec<String>,
    pub last_check: u64,
    pub database_version: i32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::db_layer::{DatabaseConnection, MigrationManager};
    use tempfile::NamedTempFile;
    use std::sync::Arc;

    async fn setup_test_service() -> DatabaseOptimizationService {
        let temp_file = NamedTempFile::new().unwrap();
        let db_path = temp_file.path().to_str().unwrap();
        let db = Arc::new(DatabaseConnection::new(db_path).unwrap());
        
        // Run migrations
        let migration_manager = MigrationManager::new(&db);
        migration_manager.migrate().unwrap();
        
        DatabaseOptimizationService::new(db)
    }

    #[tokio::test]
    async fn test_database_optimization() {
        let service = setup_test_service().await;
        let result = service.optimize_database().await;
        
        assert!(result.is_ok());
        let summary = result.unwrap();
        assert!(summary.total_queries_analyzed > 0);
        assert!(summary.optimization_time_ms > 0.0);
    }

    #[tokio::test]
    async fn test_rag_performance_analysis() {
        let service = setup_test_service().await;
        let result = service.analyze_rag_performance().await;
        
        assert!(result.is_ok());
        let report = result.unwrap();
        assert!(report.total_queries_analyzed > 0);
    }

    #[tokio::test]
    async fn test_performance_metrics() {
        let service = setup_test_service().await;
        let result = service.get_performance_metrics().await;
        
        assert!(result.is_ok());
        let metrics = result.unwrap();
        assert!(metrics.database_size_mb >= 0.0);
        assert!(metrics.page_size > 0);
    }

    #[tokio::test]
    async fn test_database_health_validation() {
        let service = setup_test_service().await;
        let result = service.validate_database_health().await;
        
        assert!(result.is_ok());
        let health = result.unwrap();
        assert!(health.health_score >= 0 && health.health_score <= 100);
        assert!(health.database_version >= 0);
    }
}
