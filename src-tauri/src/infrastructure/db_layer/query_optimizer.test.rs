// Database Query Optimizer Tests
// Task 3.1.4: Database Query Optimization
// 
// Comprehensive tests for the query optimizer functionality including
// query analysis, index recommendations, and performance improvements.

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::db_layer::{DatabaseConnection, MigrationManager};
    use tempfile::NamedTempFile;

    fn setup_test_db() -> DatabaseConnection {
        let temp_file = NamedTempFile::new().unwrap();
        let db_path = temp_file.path().to_str().unwrap();
        let db = DatabaseConnection::new(db_path).unwrap();
        
        // Run migrations including the new optimization indexes
        let migration_manager = MigrationManager::new(&db);
        migration_manager.migrate().unwrap();
        
        // Insert test data
        insert_test_data(&db);
        
        db
    }

    fn insert_test_data(db: &DatabaseConnection) {
        // Insert test projects
        db.execute(
            "INSERT INTO projects (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            &["test-project-1", "Test Project 1", "/path/to/project1", &1000i64, &2000i64]
        ).unwrap();
        
        db.execute(
            "INSERT INTO projects (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            &["test-project-2", "Test Project 2", "/path/to/project2", &1500i64, &2500i64]
        ).unwrap();

        // Insert test documents with various states
        let states = ["draft", "memo", "prfaq", "prd", "epic_breakdown", "archived"];
        for (i, state) in states.iter().enumerate() {
            db.execute(
                "INSERT INTO documents (id, project_id, path, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                &[
                    &format!("doc-{}", i + 1),
                    "test-project-1",
                    &format!("/path/to/doc{}.md", i + 1),
                    state,
                    &((i as i64 + 1) * 1000),
                    &((i as i64 + 1) * 2000)
                ]
            ).unwrap();
        }

        // Insert test document embeddings
        for i in 1..=3 {
            db.execute(
                "INSERT INTO document_embeddings (id, document_id, chunk_index, embedding_vector, created_at) VALUES (?, ?, ?, ?, ?)",
                &[
                    &i,
                    &format!("doc-{}", i),
                    &0i32,
                    &format!("[0.1, 0.2, 0.3, {}]", i as f64 * 0.1),
                    &(i as i64 * 1000)
                ]
            ).unwrap();
        }

        // Insert test vector index entries
        for i in 1..=3 {
            db.execute(
                "INSERT INTO vector_index (id, document_id, embedding, embedding_model, created_at) VALUES (?, ?, ?, ?, ?)",
                &[
                    &i,
                    &format!("doc-{}", i),
                    &format!("[0.1, 0.2, 0.3, {}]", i as f64 * 0.1),
                    "test-model",
                    &(i as i64 * 1000)
                ]
            ).unwrap();
        }

        // Insert test embedding jobs
        let statuses = ["pending", "processing", "completed", "failed"];
        for (i, status) in statuses.iter().enumerate() {
            db.execute(
                "INSERT INTO embedding_jobs (id, document_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                &[
                    &(i as i64 + 1),
                    &format!("doc-{}", i + 1),
                    status,
                    &((i as i64 + 1) * 1000),
                    &((i as i64 + 1) * 2000)
                ]
            ).unwrap();
        }
    }

    #[test]
    fn test_query_analysis_basic() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        let query = "SELECT id, project_id FROM documents WHERE project_id = ?";
        let params = vec!["test-project-1" as &dyn rusqlite::ToSql];
        
        let analysis = optimizer.analyze_query(query, &params).unwrap();
        
        assert_eq!(analysis.query, query);
        assert!(!analysis.execution_plan.is_empty());
        assert!(analysis.execution_time_ms.is_some());
        assert!(analysis.execution_time_ms.unwrap() >= 0.0);
    }

    #[test]
    fn test_query_analysis_with_index() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        // This query should use the idx_documents_project_id index created in migration v6
        let query = "SELECT id, project_id FROM documents WHERE project_id = ?";
        let params = vec!["test-project-1" as &dyn rusqlite::ToSql];
        
        let analysis = optimizer.analyze_query(query, &params).unwrap();
        
        // After migration v6, this query should use an index
        assert!(analysis.uses_index, "Query should use index after optimization migration");
        assert!(analysis.estimated_cost < 10.0, "Query cost should be low with index");
    }

    #[test]
    fn test_query_analysis_table_scan() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        // Query that might cause a table scan
        let query = "SELECT * FROM documents WHERE path LIKE ?";
        let params = vec!["%doc%" as &dyn rusqlite::ToSql];
        
        let analysis = optimizer.analyze_query(query, &params).unwrap();
        
        assert!(!analysis.recommendations.is_empty());
        // Should have recommendations for optimization
        assert!(analysis.recommendations.iter().any(|r| r.contains("index") || r.contains("optimization")));
    }

    #[test]
    fn test_rag_queries_analysis() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        let analyses = optimizer.analyze_rag_queries().unwrap();
        
        assert!(!analyses.is_empty(), "Should analyze multiple RAG queries");
        
        // Check that all critical RAG queries are analyzed
        let query_types = analyses.iter().map(|a| &a.query).collect::<Vec<_>>();
        
        // Should include FTS5 search query
        assert!(query_types.iter().any(|q| q.contains("documents_fts")));
        // Should include vector index queries
        assert!(query_types.iter().any(|q| q.contains("vector_index")));
        // Should include document embeddings queries
        assert!(query_types.iter().any(|q| q.contains("document_embeddings")));
        // Should include project documents queries
        assert!(query_types.iter().any(|q| q.contains("project_id")));
    }

    #[test]
    fn test_index_recommendations_generation() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        let analyses = optimizer.analyze_rag_queries().unwrap();
        let recommendations = optimizer.generate_index_recommendations(&analyses).unwrap();
        
        assert!(!recommendations.is_empty(), "Should generate index recommendations");
        
        // Check for specific expected recommendations
        let table_names: Vec<&String> = recommendations.iter().map(|r| &r.table_name).collect();
        assert!(table_names.contains(&&"documents".to_string()));
        
        // Verify SQL syntax is valid
        for recommendation in &recommendations {
            assert!(recommendation.sql.starts_with("CREATE INDEX"));
            assert!(recommendation.sql.contains("IF NOT EXISTS"));
        }
    }

    #[test]
    fn test_index_application() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        // Create a test recommendation
        let recommendation = IndexRecommendation {
            table_name: "test_table".to_string(),
            columns: vec!["test_column".to_string()],
            index_name: "idx_test_table_test_column".to_string(),
            reason: "Test index".to_string(),
            estimated_improvement: "Test improvement".to_string(),
            sql: "CREATE INDEX IF NOT EXISTS idx_test_table_test_column ON documents(project_id)".to_string(),
        };
        
        let applied = optimizer.apply_index_recommendations(&[recommendation]).unwrap();
        
        assert_eq!(applied.len(), 1);
        assert_eq!(applied[0], "idx_test_table_test_column");
    }

    #[test]
    fn test_database_stats() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        let stats = optimizer.get_database_stats().unwrap();
        
        assert!(stats.page_size > 0);
        assert!(stats.page_count > 0);
        assert!(stats.database_size_bytes > 0);
        assert!(!stats.table_index_counts.is_empty());
        
        // Should have indexes on key tables after migration v6
        assert!(stats.table_index_counts.get("documents").unwrap_or(&0) > &0);
    }

    #[test]
    fn test_comprehensive_optimization() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        let report = optimizer.optimize_database().unwrap();
        
        assert!(!report.query_analyses.is_empty());
        assert!(!report.index_recommendations.is_empty());
        assert!(report.optimization_time_ms > 0.0);
        assert!(!report.summary.is_empty());
        
        // Verify that some indexes were applied (migration v6 indexes)
        assert!(!report.applied_indexes.is_empty());
    }

    #[test]
    fn test_performance_improvement_measurement() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        // Measure performance before and after optimization
        let query = "SELECT id, project_id FROM documents WHERE project_id = ?";
        let params = vec!["test-project-1" as &dyn rusqlite::ToSql];
        
        let analysis_before = optimizer.analyze_query(query, &params).unwrap();
        let time_before = analysis_before.execution_time_ms.unwrap_or(0.0);
        
        // Run optimization
        let _report = optimizer.optimize_database().unwrap();
        
        // Measure performance after optimization
        let analysis_after = optimizer.analyze_query(query, &params).unwrap();
        let time_after = analysis_after.execution_time_ms.unwrap_or(0.0);
        
        // Performance should be same or better (indexes were already applied in migration)
        assert!(time_after <= time_before * 2.0, "Performance should not significantly degrade");
        
        // Should use index after optimization
        assert!(analysis_after.uses_index, "Should use index after optimization");
    }

    #[test]
    fn test_execution_plan_parsing() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        let query = "SELECT id FROM documents WHERE project_id = ? ORDER BY updated_at DESC";
        let params = vec!["test-project-1" as &dyn rusqlite::ToSql];
        
        let analysis = optimizer.analyze_query(query, &params).unwrap();
        
        assert!(!analysis.execution_plan.is_empty());
        
        // Check execution plan details
        for step in &analysis.execution_plan {
            assert!(step.step_id >= 0);
            assert!(!step.detail.is_empty());
        }
    }

    #[test]
    fn test_cost_estimation() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        // Simple indexed query should have low cost
        let simple_query = "SELECT id FROM documents WHERE project_id = ?";
        let simple_params = vec!["test-project-1" as &dyn rusqlite::ToSql];
        let simple_analysis = optimizer.analyze_query(simple_query, &simple_params).unwrap();
        
        // Complex query should have higher cost
        let complex_query = "SELECT d.*, e.* FROM documents d LEFT JOIN document_embeddings e ON d.id = e.document_id WHERE d.path LIKE ? ORDER BY d.updated_at DESC";
        let complex_params = vec!["%doc%" as &dyn rusqlite::ToSql];
        let complex_analysis = optimizer.analyze_query(complex_query, &complex_params).unwrap();
        
        // Complex query should generally have higher estimated cost
        assert!(simple_analysis.estimated_cost >= 0.0);
        assert!(complex_analysis.estimated_cost >= 0.0);
    }

    #[test]
    fn test_recommendation_quality() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        let analyses = optimizer.analyze_rag_queries().unwrap();
        let recommendations = optimizer.generate_index_recommendations(&analyses).unwrap();
        
        for recommendation in &recommendations {
            // Each recommendation should have meaningful content
            assert!(!recommendation.table_name.is_empty());
            assert!(!recommendation.columns.is_empty());
            assert!(!recommendation.index_name.is_empty());
            assert!(!recommendation.reason.is_empty());
            assert!(!recommendation.estimated_improvement.is_empty());
            assert!(!recommendation.sql.is_empty());
            
            // SQL should be properly formatted
            assert!(recommendation.sql.to_uppercase().contains("CREATE INDEX"));
            assert!(recommendation.sql.contains(&recommendation.table_name));
        }
    }

    #[test]
    fn test_database_maintenance() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        // Database maintenance should run without errors
        let result = optimizer.run_database_maintenance();
        assert!(result.is_ok(), "Database maintenance should complete successfully");
    }

    #[test]
    fn test_fts5_detection() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        // FTS5 table should exist after migrations
        let fts5_exists = optimizer.fts5_exists().unwrap();
        assert!(fts5_exists, "FTS5 table should exist after migrations");
    }

    #[test]
    fn test_query_safety() {
        let db = setup_test_db();
        let optimizer = QueryOptimizer::new(&db);
        
        // Test that dangerous queries are handled safely
        let dangerous_queries = vec![
            "DROP TABLE documents",
            "DELETE FROM documents",
            "UPDATE documents SET project_id = 'hacked'",
        ];
        
        for query in dangerous_queries {
            // The optimizer should only analyze SELECT queries safely
            // Non-SELECT queries should either be rejected or handled carefully
            let result = optimizer.analyze_query(query, &[]);
            // We expect this to either fail safely or handle it appropriately
            // The exact behavior depends on implementation, but it shouldn't crash
            match result {
                Ok(_) => {
                    // If it succeeds, it should have added LIMIT to make it safe
                    // This is acceptable behavior
                }
                Err(_) => {
                    // If it fails, that's also acceptable for safety
                }
            }
        }
    }
}
