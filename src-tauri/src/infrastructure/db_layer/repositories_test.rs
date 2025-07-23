/// Unit tests for FSM database functions
/// Tests for Task 2.1.3: Database Functions for FSM

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{Document, DocumentState, Project};
    use crate::infrastructure::db_layer::{DatabaseConnection, MigrationManager};
    use tempfile::NamedTempFile;

    /// Helper function to create a test database with migrations applied
    fn create_test_db() -> (NamedTempFile, DatabaseConnection) {
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        let db_path = temp_file.path().to_str().expect("Invalid path");
        let db = DatabaseConnection::new(db_path).expect("Failed to create database connection");
        
        // Run migrations to set up the schema
        let migration_manager = MigrationManager::new(&db);
        migration_manager.migrate().expect("Failed to run migrations");
        
        (temp_file, db)
    }

    /// Helper function to create a test project
    fn create_test_project() -> Project {
        Project::new(
            "test-project-id".to_string(),
            "Test Project".to_string(),
            "/test/path".to_string(),
        )
    }

    /// Helper function to create a test document
    fn create_test_document(project_id: &str) -> Document {
        Document::new(
            "test-document-id".to_string(),
            project_id.to_string(),
            "test-document.md".to_string(),
        )
    }

    #[test]
    fn test_get_document_state_existing_document() {
        let (_temp_file, db) = create_test_db();
        let project_repo = ProjectRepository::new(&db);
        let doc_repo = DocumentRepository::new(&db);

        // Create test project and document
        let project = create_test_project();
        let document = create_test_document(&project.id);

        project_repo.create(&project).expect("Failed to create project");
        doc_repo.create(&document).expect("Failed to create document");

        // Test getting document state
        let state = doc_repo.get_document_state(&document.id)
            .expect("Failed to get document state");

        assert_eq!(state, Some(DocumentState::Draft));
    }

    #[test]
    fn test_get_document_state_nonexistent_document() {
        let (_temp_file, db) = create_test_db();
        let doc_repo = DocumentRepository::new(&db);

        // Test getting state for non-existent document
        let state = doc_repo.get_document_state("nonexistent-id")
            .expect("Failed to get document state");

        assert_eq!(state, None);
    }

    #[test]
    fn test_update_document_state_valid_transition() {
        let (_temp_file, db) = create_test_db();
        let project_repo = ProjectRepository::new(&db);
        let doc_repo = DocumentRepository::new(&db);

        // Create test project and document
        let project = create_test_project();
        let document = create_test_document(&project.id);

        project_repo.create(&project).expect("Failed to create project");
        doc_repo.create(&document).expect("Failed to create document");

        // Test valid state transition: Draft -> Memo
        let result = doc_repo.update_document_state(&document.id, &DocumentState::Memo)
            .expect("Failed to update document state");

        assert_eq!(result, true);

        // Verify the state was updated
        let new_state = doc_repo.get_document_state(&document.id)
            .expect("Failed to get document state");
        assert_eq!(new_state, Some(DocumentState::Memo));
    }

    #[test]
    fn test_update_document_state_invalid_transition() {
        let (_temp_file, db) = create_test_db();
        let project_repo = ProjectRepository::new(&db);
        let doc_repo = DocumentRepository::new(&db);

        // Create test project and document
        let project = create_test_project();
        let document = create_test_document(&project.id);

        project_repo.create(&project).expect("Failed to create project");
        doc_repo.create(&document).expect("Failed to create document");

        // Test invalid state transition: Draft -> EpicBreakdown (skipping states)
        let result = doc_repo.update_document_state(&document.id, &DocumentState::EpicBreakdown);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid state transition"));

        // Verify the state was not changed
        let state = doc_repo.get_document_state(&document.id)
            .expect("Failed to get document state");
        assert_eq!(state, Some(DocumentState::Draft));
    }

    #[test]
    fn test_update_document_state_nonexistent_document() {
        let (_temp_file, db) = create_test_db();
        let doc_repo = DocumentRepository::new(&db);

        // Test updating state for non-existent document
        let result = doc_repo.update_document_state("nonexistent-id", &DocumentState::Memo)
            .expect("Failed to update document state");

        assert_eq!(result, false);
    }

    #[test]
    fn test_update_document_state_unchecked() {
        let (_temp_file, db) = create_test_db();
        let project_repo = ProjectRepository::new(&db);
        let doc_repo = DocumentRepository::new(&db);

        // Create test project and document
        let project = create_test_project();
        let document = create_test_document(&project.id);

        project_repo.create(&project).expect("Failed to create project");
        doc_repo.create(&document).expect("Failed to create document");

        // Test unchecked state transition (bypasses FSM validation)
        let result = doc_repo.update_document_state_unchecked(&document.id, &DocumentState::EpicBreakdown)
            .expect("Failed to update document state");

        assert_eq!(result, true);

        // Verify the state was updated (even though it's an invalid transition)
        let new_state = doc_repo.get_document_state(&document.id)
            .expect("Failed to get document state");
        assert_eq!(new_state, Some(DocumentState::EpicBreakdown));
    }

    #[test]
    fn test_fsm_workflow_progression() {
        let (_temp_file, db) = create_test_db();
        let project_repo = ProjectRepository::new(&db);
        let doc_repo = DocumentRepository::new(&db);

        // Create test project and document
        let project = create_test_project();
        let document = create_test_document(&project.id);

        project_repo.create(&project).expect("Failed to create project");
        doc_repo.create(&document).expect("Failed to create document");

        // Test full workflow progression: Draft -> Memo -> PRFAQ -> PRD -> EpicBreakdown
        
        // Draft -> Memo
        assert!(doc_repo.update_document_state(&document.id, &DocumentState::Memo).unwrap());
        assert_eq!(doc_repo.get_document_state(&document.id).unwrap(), Some(DocumentState::Memo));

        // Memo -> PRFAQ
        assert!(doc_repo.update_document_state(&document.id, &DocumentState::PRFAQ).unwrap());
        assert_eq!(doc_repo.get_document_state(&document.id).unwrap(), Some(DocumentState::PRFAQ));

        // PRFAQ -> PRD
        assert!(doc_repo.update_document_state(&document.id, &DocumentState::PRD).unwrap());
        assert_eq!(doc_repo.get_document_state(&document.id).unwrap(), Some(DocumentState::PRD));

        // PRD -> EpicBreakdown
        assert!(doc_repo.update_document_state(&document.id, &DocumentState::EpicBreakdown).unwrap());
        assert_eq!(doc_repo.get_document_state(&document.id).unwrap(), Some(DocumentState::EpicBreakdown));
    }

    #[test]
    fn test_fsm_backward_transitions() {
        let (_temp_file, db) = create_test_db();
        let project_repo = ProjectRepository::new(&db);
        let doc_repo = DocumentRepository::new(&db);

        // Create test project and document
        let project = create_test_project();
        let document = create_test_document(&project.id);

        project_repo.create(&project).expect("Failed to create project");
        doc_repo.create(&document).expect("Failed to create document");

        // Progress to PRD state
        doc_repo.update_document_state_unchecked(&document.id, &DocumentState::PRD).unwrap();

        // Test backward transitions
        // PRD -> PRFAQ
        assert!(doc_repo.update_document_state(&document.id, &DocumentState::PRFAQ).unwrap());
        assert_eq!(doc_repo.get_document_state(&document.id).unwrap(), Some(DocumentState::PRFAQ));

        // PRFAQ -> Memo
        assert!(doc_repo.update_document_state(&document.id, &DocumentState::Memo).unwrap());
        assert_eq!(doc_repo.get_document_state(&document.id).unwrap(), Some(DocumentState::Memo));

        // Memo -> Draft
        assert!(doc_repo.update_document_state(&document.id, &DocumentState::Draft).unwrap());
        assert_eq!(doc_repo.get_document_state(&document.id).unwrap(), Some(DocumentState::Draft));
    }

    #[test]
    fn test_archive_and_reactivation() {
        let (_temp_file, db) = create_test_db();
        let project_repo = ProjectRepository::new(&db);
        let doc_repo = DocumentRepository::new(&db);

        // Create test project and document
        let project = create_test_project();
        let document = create_test_document(&project.id);

        project_repo.create(&project).expect("Failed to create project");
        doc_repo.create(&document).expect("Failed to create document");

        // Progress to Memo state
        doc_repo.update_document_state(&document.id, &DocumentState::Memo).unwrap();

        // Test archiving from any state
        assert!(doc_repo.update_document_state(&document.id, &DocumentState::Archived).unwrap());
        assert_eq!(doc_repo.get_document_state(&document.id).unwrap(), Some(DocumentState::Archived));

        // Test reactivation (Archived -> Draft only)
        assert!(doc_repo.update_document_state(&document.id, &DocumentState::Draft).unwrap());
        assert_eq!(doc_repo.get_document_state(&document.id).unwrap(), Some(DocumentState::Draft));

        // Test invalid reactivation (Archived -> Memo should fail)
        doc_repo.update_document_state_unchecked(&document.id, &DocumentState::Archived).unwrap();
        let result = doc_repo.update_document_state(&document.id, &DocumentState::Memo);
        assert!(result.is_err());
    }

    #[test]
    fn test_batch_update_document_states() {
        let (_temp_file, db) = create_test_db();
        let project_repo = ProjectRepository::new(&db);
        let doc_repo = DocumentRepository::new(&db);

        // Create test project and multiple documents
        let project = create_test_project();
        project_repo.create(&project).expect("Failed to create project");

        let doc_ids = vec![
            "doc1".to_string(),
            "doc2".to_string(),
            "doc3".to_string(),
        ];

        for doc_id in &doc_ids {
            let mut document = create_test_document(&project.id);
            document.id = doc_id.clone();
            doc_repo.create(&document).expect("Failed to create document");
        }

        // Test batch update
        let updated_count = doc_repo.batch_update_document_states(&doc_ids, &DocumentState::Archived)
            .expect("Failed to batch update document states");

        assert_eq!(updated_count, 3);

        // Verify all documents were updated
        for doc_id in &doc_ids {
            let state = doc_repo.get_document_state(doc_id)
                .expect("Failed to get document state");
            assert_eq!(state, Some(DocumentState::Archived));
        }
    }

    #[test]
    fn test_get_document_state_history() {
        let (_temp_file, db) = create_test_db();
        let project_repo = ProjectRepository::new(&db);
        let doc_repo = DocumentRepository::new(&db);

        // Create test project and document
        let project = create_test_project();
        let document = create_test_document(&project.id);

        project_repo.create(&project).expect("Failed to create project");
        doc_repo.create(&document).expect("Failed to create document");

        // Get state history
        let history = doc_repo.get_document_state_history(&document.id)
            .expect("Failed to get document state history");

        assert_eq!(history.len(), 1);
        assert_eq!(history[0].0, DocumentState::Draft);
        assert!(history[0].1 > 0); // timestamp should be set

        // Test for non-existent document
        let empty_history = doc_repo.get_document_state_history("nonexistent-id")
            .expect("Failed to get document state history");
        assert_eq!(empty_history.len(), 0);
    }

    #[test]
    fn test_batch_update_empty_list() {
        let (_temp_file, db) = create_test_db();
        let doc_repo = DocumentRepository::new(&db);

        // Test batch update with empty list
        let updated_count = doc_repo.batch_update_document_states(&[], &DocumentState::Archived)
            .expect("Failed to batch update document states");

        assert_eq!(updated_count, 0);
    }

    // ===== FTS5 Full-Text Search Tests (Task 2.3.5) =====

    /// Helper function to create test documents with content for FTS5 testing
    fn create_test_documents_with_content(db: &DatabaseConnection) -> Vec<i64> {
        let project_repo = ProjectRepository::new(db);
        let doc_repo = DocumentRepository::new(db);
        
        // Create test project
        let project = create_test_project();
        project_repo.create(&project).expect("Failed to create project");
        
        // Create test documents with different content
        let documents = vec![
            ("doc1", "Rust Programming", "Rust is a systems programming language that runs blazingly fast, prevents segfaults, and guarantees thread safety."),
            ("doc2", "JavaScript Guide", "JavaScript is a programming language that conforms to the ECMAScript specification. It is high-level, often just-in-time compiled."),
            ("doc3", "Python Tutorial", "Python is an interpreted, high-level and general-purpose programming language. Python's design philosophy emphasizes code readability."),
            ("doc4", "Machine Learning", "Machine learning is a method of data analysis that automates analytical model building using algorithms that iteratively learn from data."),
            ("doc5", "Database Systems", "A database is an organized collection of structured information, or data, typically stored electronically in a computer system."),
        ];
        
        let mut doc_ids = Vec::new();
        
        for (id, title, content) in documents {
            let mut doc = create_test_document(&project.id);
            doc.id = id.to_string();
            doc.title = title.to_string();
            doc.content = content.to_string();
            
            let doc_id = doc_repo.create(&doc).expect("Failed to create document");
            doc_ids.push(doc_id);
        }
        
        doc_ids
    }

    #[test]
    fn test_fts5_basic_search() {
        let (_temp_file, db) = create_test_db();
        let _doc_ids = create_test_documents_with_content(&db);
        let fts5_repo = FTS5Repository::new(&db);
        
        // Test basic search
        let results = fts5_repo.search("programming", Some(10)).expect("Search failed");
        assert!(results.len() >= 3); // Should find Rust, JavaScript, and Python docs
        
        // Results should be ranked by relevance
        assert!(results[0].rank <= results[1].rank); // Lower rank = more relevant in BM25
        
        // Test empty query
        let empty_results = fts5_repo.search("", Some(10)).expect("Empty search failed");
        assert_eq!(empty_results.len(), 0);
        
        // Test whitespace-only query
        let whitespace_results = fts5_repo.search("   ", Some(10)).expect("Whitespace search failed");
        assert_eq!(whitespace_results.len(), 0);
    }

    #[test]
    fn test_fts5_search_with_snippets() {
        let (_temp_file, db) = create_test_db();
        let _doc_ids = create_test_documents_with_content(&db);
        let fts5_repo = FTS5Repository::new(&db);
        
        // Test search with snippets
        let results = fts5_repo.search_with_snippets("programming", Some(5)).expect("Snippet search failed");
        assert!(results.len() > 0);
        
        // Check that snippets are present
        for result in &results {
            assert!(result.snippet.is_some());
            let snippet = result.snippet.as_ref().unwrap();
            assert!(snippet.contains("<mark>") && snippet.contains("</mark>"));
        }
    }

    #[test]
    fn test_fts5_get_candidates() {
        let (_temp_file, db) = create_test_db();
        let _doc_ids = create_test_documents_with_content(&db);
        let fts5_repo = FTS5Repository::new(&db);
        
        // Test getting candidate document IDs for hybrid RAG
        let candidates = fts5_repo.get_candidates("programming", Some(3)).expect("Get candidates failed");
        assert!(candidates.len() <= 3);
        assert!(candidates.len() > 0);
        
        // All candidates should be valid document IDs
        for doc_id in candidates {
            assert!(doc_id > 0);
        }
    }

    #[test]
    fn test_fts5_triggers_insert() {
        let (_temp_file, db) = create_test_db();
        let project_repo = ProjectRepository::new(&db);
        let doc_repo = DocumentRepository::new(&db);
        let fts5_repo = FTS5Repository::new(&db);
        
        // Create test project
        let project = create_test_project();
        project_repo.create(&project).expect("Failed to create project");
        
        // Create a new document
        let mut doc = create_test_document(&project.id);
        doc.title = "New Document".to_string();
        doc.content = "This is a new document for testing FTS5 triggers.".to_string();
        
        let doc_id = doc_repo.create(&doc).expect("Failed to create document");
        
        // Search for the new document - should be found due to INSERT trigger
        let results = fts5_repo.search("testing", Some(10)).expect("Search failed");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].document_id, doc_id);
        assert!(results[0].content.contains("testing"));
    }
}
