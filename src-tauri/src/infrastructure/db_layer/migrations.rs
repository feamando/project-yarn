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
        
        // Future migrations will be added here
        // if current_version < 2 {
        //     self.migrate_to_v2()?;
        //     self.update_schema_version(2)?;
        // }
        
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
        const LATEST_VERSION: i32 = 1;
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
