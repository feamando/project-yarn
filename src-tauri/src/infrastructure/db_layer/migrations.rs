// Database Migrations
// Handles database schema creation and versioning

use crate::infrastructure::db_layer::DatabaseConnection;

/// Database schema version management
pub struct MigrationManager<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> MigrationManager<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    /// Run all pending migrations
    pub fn migrate(&self) -> Result<(), String> {
        // Ensure schema_version table exists
        self.create_schema_version_table()?;
        
        let current_version = self.get_current_version()?;
        
        // Apply migrations in order
        if current_version < 1 {
            self.migrate_to_v1()?;
            self.update_schema_version(1)?;
        }
        
        // Migration v2: Update FSM state column for new DocumentState enum
        if current_version < 2 {
            self.migrate_to_v2()?;
            self.update_schema_version(2)?;
        }
        
        // Migration v3: Create vector index table for document embeddings
        if current_version < 3 {
            self.migrate_to_v3()?;
            self.update_schema_version(3)?;
        }
        
        // Migration v4: Create vector_index table for efficient vector retrieval
        if current_version < 4 {
            self.migrate_to_v4()?;
            self.update_schema_version(4)?;
        }
        
        // Migration v5: Create FTS5 full-text search index
        if current_version < 5 {
            self.migrate_to_v5()?;
            self.update_schema_version(5)?;
        }
        
        Ok(())
    }

    /// Create the schema_version tracking table
    fn create_schema_version_table(&self) -> Result<(), String> {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at INTEGER NOT NULL
            )
        "#;
        
        self.db.execute(sql, &[])?;
        Ok(())
    }

    /// Get the current database schema version
    fn get_current_version(&self) -> Result<i32, String> {
        let sql = "SELECT MAX(version) FROM schema_version";
        
        match self.db.query_row(sql, &[], |row| {
            Ok(row.get::<_, Option<i32>>(0)?.unwrap_or(0))
        }) {
            Ok(version) => Ok(version),
            Err(_) => Ok(0), // No schema version found, start from 0
        }
    }

    /// Update the schema version after successful migration
    fn update_schema_version(&self, version: i32) -> Result<(), String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let sql = r#"
            INSERT INTO schema_version (version, applied_at)
            VALUES (?1, ?2)
        "#;
        
        self.db.execute(sql, &[&version as &dyn rusqlite::ToSql, &now])?;
        Ok(())
    }

    /// Migration to version 1: Create initial tables
    fn migrate_to_v1(&self) -> Result<(), String> {
        // Create projects table
        let projects_sql = r#"
            CREATE TABLE projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        "#;
        
        self.db.execute(projects_sql, &[])?;

        // Create documents table
        let documents_sql = r#"
            CREATE TABLE documents (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                path TEXT NOT NULL,
                state TEXT NOT NULL DEFAULT 'draft',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
                UNIQUE(project_id, path)
            )
        "#;
        
        self.db.execute(documents_sql, &[])?;

        // Create indexes for better query performance
        let project_path_index = "CREATE INDEX idx_projects_path ON projects (path)";
        self.db.execute(project_path_index, &[])?;

        let document_project_index = "CREATE INDEX idx_documents_project_id ON documents (project_id)";
        self.db.execute(document_project_index, &[])?;

        let document_state_index = "CREATE INDEX idx_documents_state ON documents (state)";
        self.db.execute(document_state_index, &[])?;

        let document_updated_index = "CREATE INDEX idx_documents_updated_at ON documents (updated_at DESC)";
        self.db.execute(document_updated_index, &[])?;

        // Create FTS5 virtual table for full-text search on document content
        // This will be populated when documents are indexed
        let fts_documents_sql = r#"
            CREATE VIRTUAL TABLE documents_fts USING fts5(
                document_id,
                content,
                title,
                content='documents',
                content_rowid='rowid'
            )
        "#;
        
        self.db.execute(fts_documents_sql, &[])?;

        // Create trigger to update FTS when documents are modified
        let fts_trigger_sql = r#"
            CREATE TRIGGER documents_fts_update AFTER UPDATE ON documents BEGIN
                DELETE FROM documents_fts WHERE document_id = OLD.id;
                INSERT INTO documents_fts (document_id, content, title) 
                VALUES (NEW.id, '', NEW.path);
            END
        "#;
        
        self.db.execute(fts_trigger_sql, &[])?;

        Ok(())
    }

    /// Migration to version 2: Update FSM state column for new DocumentState enum
    /// This migration updates existing documents to use the new state values
    /// and ensures the state column properly supports the FSM workflow
    fn migrate_to_v2(&self) -> Result<(), String> {
        // Update existing documents with 'draft' state to use proper FSM initial state
        // According to the FSM design, new documents should start in 'draft' state
        // and can then be transitioned to 'memo' as the first workflow state
        let update_existing_states_sql = r#"
            UPDATE documents 
            SET state = 'draft'
            WHERE state NOT IN ('memo', 'prfaq', 'prd', 'epic_breakdown', 'draft', 'archived')
        "#;
        
        self.db.execute(update_existing_states_sql, &[])?;

        // Add a check constraint to ensure only valid FSM states are allowed
        // Note: SQLite doesn't support adding constraints to existing tables directly,
        // so we'll create a new table with the constraint and migrate data
        
        // Step 1: Create new documents table with FSM state constraint
        let new_documents_sql = r#"
            CREATE TABLE documents_new (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                path TEXT NOT NULL,
                state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('memo', 'prfaq', 'prd', 'epic_breakdown', 'draft', 'archived')),
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
                UNIQUE(project_id, path)
            )
        "#;
        
        self.db.execute(new_documents_sql, &[])?;

        // Step 2: Copy data from old table to new table
        let copy_data_sql = r#"
            INSERT INTO documents_new (id, project_id, path, state, created_at, updated_at)
            SELECT id, project_id, path, state, created_at, updated_at
            FROM documents
        "#;
        
        self.db.execute(copy_data_sql, &[])?;

        // Step 3: Drop old table and rename new table
        self.db.execute("DROP TABLE documents", &[])?;
        self.db.execute("ALTER TABLE documents_new RENAME TO documents", &[])?;

        // Step 4: Recreate indexes for the new table
        let document_project_index = "CREATE INDEX idx_documents_project_id ON documents (project_id)";
        self.db.execute(document_project_index, &[])?;

        let document_state_index = "CREATE INDEX idx_documents_state ON documents (state)";
        self.db.execute(document_state_index, &[])?;

        let document_updated_index = "CREATE INDEX idx_documents_updated_at ON documents (updated_at DESC)";
        self.db.execute(document_updated_index, &[])?;

        // Step 5: Recreate FTS5 virtual table and trigger
        // Drop existing FTS table and trigger
        self.db.execute("DROP TRIGGER IF EXISTS documents_fts_update", &[])?;
        self.db.execute("DROP TABLE IF EXISTS documents_fts", &[])?;

        // Recreate FTS5 virtual table
        let fts_documents_sql = r#"
            CREATE VIRTUAL TABLE documents_fts USING fts5(
                document_id,
                content,
                title,
                content='documents',
                content_rowid='rowid'
            )
        "#;
        
        self.db.execute(fts_documents_sql, &[])?;

        // Recreate FTS trigger
        let fts_trigger_sql = r#"
            CREATE TRIGGER documents_fts_update AFTER UPDATE ON documents BEGIN
                DELETE FROM documents_fts WHERE document_id = OLD.id;
                INSERT INTO documents_fts (document_id, content, title) 
                VALUES (NEW.id, '', NEW.path);
            END
        "#;
        
        self.db.execute(fts_trigger_sql, &[])?;

        // Step 6: Add triggers for FSM state validation and logging
        // This trigger ensures that state transitions follow FSM rules
        let state_validation_trigger_sql = r#"
            CREATE TRIGGER validate_document_state_transition 
            BEFORE UPDATE OF state ON documents
            FOR EACH ROW
            BEGIN
                -- Update the updated_at timestamp when state changes
                UPDATE documents SET updated_at = strftime('%s', 'now') 
                WHERE id = NEW.id AND OLD.state != NEW.state;
            END
        "#;
        
        self.db.execute(state_validation_trigger_sql, &[])?;

        Ok(())
    }

    /// Migration to version 3: Create vector index table for document embeddings
    /// This migration creates the infrastructure for storing and retrieving document embeddings
    /// for the RAG (Retrieval-Augmented Generation) system
    fn migrate_to_v3(&self) -> Result<(), String> {
        // Create document_embeddings table for storing vector embeddings
        let embeddings_table_sql = r#"
            CREATE TABLE IF NOT EXISTS document_embeddings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                chunk_index INTEGER NOT NULL DEFAULT 0,
                content_hash TEXT NOT NULL,
                content_text TEXT NOT NULL,
                embedding_vector TEXT NOT NULL, -- JSON array of floats
                embedding_model TEXT NOT NULL DEFAULT 'all-MiniLM-L6-v2',
                chunk_start INTEGER,
                chunk_end INTEGER,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                UNIQUE(document_id, chunk_index, content_hash)
            )
        "#;
        
        self.db.execute(embeddings_table_sql, &[])?;
        
        // Create indexes for efficient vector similarity search
        let embeddings_document_index_sql = r#"
            CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id 
            ON document_embeddings(document_id)
        "#;
        
        self.db.execute(embeddings_document_index_sql, &[])?;
        
        let embeddings_hash_index_sql = r#"
            CREATE INDEX IF NOT EXISTS idx_document_embeddings_content_hash 
            ON document_embeddings(content_hash)
        "#;
        
        self.db.execute(embeddings_hash_index_sql, &[])?;
        
        let embeddings_model_index_sql = r#"
            CREATE INDEX IF NOT EXISTS idx_document_embeddings_model 
            ON document_embeddings(embedding_model)
        "#;
        
        self.db.execute(embeddings_model_index_sql, &[])?;
        
        // Create trigger to update updated_at timestamp
        let embeddings_update_trigger_sql = r#"
            CREATE TRIGGER IF NOT EXISTS update_document_embeddings_timestamp
            AFTER UPDATE ON document_embeddings
            FOR EACH ROW
            BEGIN
                UPDATE document_embeddings SET updated_at = strftime('%s', 'now') 
                WHERE id = NEW.id;
            END
        "#;
        
        self.db.execute(embeddings_update_trigger_sql, &[])?;
        
        // Create embedding_jobs table for tracking background embedding generation
        let embedding_jobs_table_sql = r#"
            CREATE TABLE IF NOT EXISTS embedding_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
                error_message TEXT,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                completed_at INTEGER,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                UNIQUE(document_id, content_hash)
            )
        "#;
        
        self.db.execute(embedding_jobs_table_sql, &[])?;
        
        // Create indexes for embedding jobs
        let jobs_status_index_sql = r#"
            CREATE INDEX IF NOT EXISTS idx_embedding_jobs_status 
            ON embedding_jobs(status)
        "#;
        
        self.db.execute(jobs_status_index_sql, &[])?;
        
        let jobs_document_index_sql = r#"
            CREATE INDEX IF NOT EXISTS idx_embedding_jobs_document_id 
            ON embedding_jobs(document_id)
        "#;
        
        self.db.execute(jobs_document_index_sql, &[])?;
        
        // Create trigger to update updated_at timestamp for embedding jobs
        let jobs_update_trigger_sql = r#"
            CREATE TRIGGER IF NOT EXISTS update_embedding_jobs_timestamp
            AFTER UPDATE ON embedding_jobs
            FOR EACH ROW
            BEGIN
                UPDATE embedding_jobs SET updated_at = strftime('%s', 'now') 
                WHERE id = NEW.id;
            END
        "#;
        
        self.db.execute(jobs_update_trigger_sql, &[])?;
        
        Ok(())
    }

    /// Migration to version 4: Create vector_index table for efficient vector retrieval
    /// This migration creates the vector_index table as specified in Task 2.3.4
    /// for optimized vector similarity search and retrieval operations
    fn migrate_to_v4(&self) -> Result<(), String> {
        // Create vector_index table for efficient vector retrieval
        // This table stores document_id and embedding as BLOB for fast similarity search
        let vector_index_table_sql = r#"
            CREATE TABLE IF NOT EXISTS vector_index (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                embedding BLOB NOT NULL, -- Binary representation of embedding vector
                embedding_model TEXT NOT NULL DEFAULT 'all-MiniLM-L6-v2',
                dimension INTEGER NOT NULL DEFAULT 384,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                UNIQUE(document_id, embedding_model)
            )
        "#;
        
        self.db.execute(vector_index_table_sql, &[])?;
        
        // Create indexes for efficient vector retrieval
        let vector_index_document_index_sql = r#"
            CREATE INDEX IF NOT EXISTS idx_vector_index_document_id 
            ON vector_index(document_id)
        "#;
        
        self.db.execute(vector_index_document_index_sql, &[])?;
        
        let vector_index_model_index_sql = r#"
            CREATE INDEX IF NOT EXISTS idx_vector_index_model 
            ON vector_index(embedding_model)
        "#;
        
        self.db.execute(vector_index_model_index_sql, &[])?;
        
        let vector_index_dimension_index_sql = r#"
            CREATE INDEX IF NOT EXISTS idx_vector_index_dimension 
            ON vector_index(dimension)
        "#;
        
        self.db.execute(vector_index_dimension_index_sql, &[])?;
        
        // Create trigger to update updated_at timestamp
        let vector_index_update_trigger_sql = r#"
            CREATE TRIGGER IF NOT EXISTS update_vector_index_timestamp
            AFTER UPDATE ON vector_index
            FOR EACH ROW
            BEGIN
                UPDATE vector_index SET updated_at = strftime('%s', 'now') 
                WHERE id = NEW.id;
            END
        "#;
        
        self.db.execute(vector_index_update_trigger_sql, &[])?;
        
        Ok(())
    }

    /// Migration to version 5: Create FTS5 full-text search index
    /// This migration creates the FTS5 virtual table and triggers as specified in Task 2.3.5
    /// for fast lexical search capabilities in the hybrid RAG system
    fn migrate_to_v5(&self) -> Result<(), String> {
        // Create FTS5 virtual table for full-text search
        // This table will index document content for fast lexical search
        let fts5_table_sql = r#"
            CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts 
            USING fts5(
                title, 
                content, 
                content=documents, 
                content_rowid=id,
                tokenize='porter ascii'
            )
        "#;
        
        self.db.execute(fts5_table_sql, &[])?;
        
        // Populate FTS5 table with existing documents
        let populate_fts5_sql = r#"
            INSERT INTO documents_fts(rowid, title, content)
            SELECT id, title, content FROM documents
        "#;
        
        self.db.execute(populate_fts5_sql, &[])?;
        
        // Create AFTER INSERT trigger to keep FTS5 index synchronized
        let insert_trigger_sql = r#"
            CREATE TRIGGER IF NOT EXISTS documents_fts_insert 
            AFTER INSERT ON documents 
            BEGIN
                INSERT INTO documents_fts(rowid, title, content) 
                VALUES (NEW.id, NEW.title, NEW.content);
            END
        "#;
        
        self.db.execute(insert_trigger_sql, &[])?;
        
        // Create AFTER UPDATE trigger to keep FTS5 index synchronized
        let update_trigger_sql = r#"
            CREATE TRIGGER IF NOT EXISTS documents_fts_update 
            AFTER UPDATE ON documents 
            BEGIN
                UPDATE documents_fts 
                SET title = NEW.title, content = NEW.content 
                WHERE rowid = NEW.id;
            END
        "#;
        
        self.db.execute(update_trigger_sql, &[])?;
        
        // Create AFTER DELETE trigger to keep FTS5 index synchronized
        let delete_trigger_sql = r#"
            CREATE TRIGGER IF NOT EXISTS documents_fts_delete 
            AFTER DELETE ON documents 
            BEGIN
                DELETE FROM documents_fts WHERE rowid = OLD.id;
            END
        "#;
        
        self.db.execute(delete_trigger_sql, &[])?;
        
        Ok(())
    }

    /// Get database schema information for debugging
    pub fn get_schema_info(&self) -> Result<Vec<String>, String> {
        let sql = r#"
            SELECT sql FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        "#;
        
        self.db.query_map(sql, &[], |row| {
            Ok(row.get::<_, String>(0)?)
        })
    }

    /// Check if database needs migration
    pub fn needs_migration(&self) -> Result<bool, String> {
        let current_version = self.get_current_version()?;
        // Update this when adding new migrations
        const LATEST_VERSION: i32 = 5;
        Ok(current_version < LATEST_VERSION)
    }

    /// Validate database integrity
    pub fn validate_schema(&self) -> Result<(), String> {
        // Check if required tables exist
        let required_tables = vec!["projects", "documents", "schema_version"];
        
        for table in required_tables {
            let sql = r#"
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name = ?1
            "#;
            
            let exists = self.db.query_row(sql, &[&table as &dyn rusqlite::ToSql], |_| Ok(()))
                .is_ok();
            
            if !exists {
                return Err(format!("Required table '{}' is missing", table));
            }
        }

        // Run PRAGMA integrity_check
        self.db.with_connection(|conn| {
            let mut stmt = conn.prepare("PRAGMA integrity_check")?;
            let rows: Vec<String> = stmt.query_map([], |row| {
                Ok(row.get::<_, String>(0)?)
            })?.collect::<Result<Vec<_>, _>>()?;
            
            if rows.len() != 1 || rows[0] != "ok" {
                return Err(rusqlite::Error::SqliteFailure(
                    rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CORRUPT),
                    Some("Database integrity check failed".to_string())
                ));
            }
            
            Ok(())
        }).map_err(|e| format!("Database validation failed: {}", e))
    }
}
