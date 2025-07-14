// Database Connection Manager
// High-level database connection management with lifecycle handling

use crate::infrastructure::db_layer::{DatabaseConnection, MigrationManager};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

/// High-level database connection manager
/// Handles initialization, migration, and connection lifecycle
pub struct ConnectionManager {
    connection: Arc<Mutex<Option<DatabaseConnection>>>,
    database_path: Option<PathBuf>,
    is_initialized: bool,
}

impl ConnectionManager {
    /// Create a new connection manager
    pub fn new() -> Self {
        Self {
            connection: Arc::new(Mutex::new(None)),
            database_path: None,
            is_initialized: false,
        }
    }

    /// Initialize the database connection and run migrations
    pub async fn initialize<P: AsRef<Path>>(&mut self, db_path: P) -> Result<(), String> {
        let path = db_path.as_ref().to_path_buf();
        
        // Create database directory if it doesn't exist
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create database directory: {}", e))?;
        }

        // Initialize connection
        let mut db_connection = DatabaseConnection::new();
        db_connection.initialize(&path)
            .map_err(|e| format!("Failed to initialize database connection: {}", e))?;

        // Test connection
        db_connection.test_connection()
            .map_err(|e| format!("Database connection test failed: {}", e))?;

        // Run migrations
        let migration_manager = MigrationManager::new(&db_connection);
        migration_manager.migrate()
            .map_err(|e| format!("Database migration failed: {}", e))?;

        // Validate schema
        migration_manager.validate_schema()
            .map_err(|e| format!("Schema validation failed: {}", e))?;

        // Store the connection
        let mut connection_guard = self.connection.lock().unwrap();
        *connection_guard = Some(db_connection);
        self.database_path = Some(path);
        self.is_initialized = true;

        Ok(())
    }

    /// Get a reference to the database connection
    pub fn get_connection(&self) -> Result<Arc<Mutex<Option<DatabaseConnection>>>, String> {
        if !self.is_initialized {
            return Err("Database connection manager not initialized".to_string());
        }
        Ok(Arc::clone(&self.connection))
    }

    /// Execute a database operation with automatic connection handling
    pub fn with_connection<F, R>(&self, operation: F) -> Result<R, String>
    where
        F: FnOnce(&DatabaseConnection) -> Result<R, String>,
    {
        if !self.is_initialized {
            return Err("Database connection manager not initialized".to_string());
        }

        let connection_guard = self.connection.lock().unwrap();
        match connection_guard.as_ref() {
            Some(connection) => operation(connection),
            None => Err("Database connection not available".to_string()),
        }
    }

    /// Get database file path
    pub fn database_path(&self) -> Option<&Path> {
        self.database_path.as_deref()
    }

    /// Check if the connection manager is initialized
    pub fn is_initialized(&self) -> bool {
        self.is_initialized
    }

    /// Close the database connection
    pub fn close(&mut self) -> Result<(), String> {
        let mut connection_guard = self.connection.lock().unwrap();
        if let Some(mut connection) = connection_guard.take() {
            connection.close()?;
        }
        self.database_path = None;
        self.is_initialized = false;
        Ok(())
    }

    /// Get database statistics and health information
    pub fn get_database_info(&self) -> Result<DatabaseInfo, String> {
        if !self.is_initialized {
            return Err("Database connection manager not initialized".to_string());
        }

        self.with_connection(|connection| {
            // Get basic database info
            let db_size = self.get_database_size()?;
            let table_count = self.get_table_count(connection)?;
            let schema_version = self.get_schema_version(connection)?;
            
            Ok(DatabaseInfo {
                path: self.database_path.clone(),
                size_bytes: db_size,
                table_count,
                schema_version,
                is_healthy: true, // If we get here, connection is working
            })
        })
    }

    /// Get the size of the database file
    fn get_database_size(&self) -> Result<u64, String> {
        if let Some(path) = &self.database_path {
            std::fs::metadata(path)
                .map(|metadata| metadata.len())
                .map_err(|e| format!("Failed to get database file size: {}", e))
        } else {
            Ok(0)
        }
    }

    /// Get the number of tables in the database
    fn get_table_count(&self, connection: &DatabaseConnection) -> Result<usize, String> {
        let sql = r#"
            SELECT COUNT(*) 
            FROM sqlite_master 
            WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        "#;

        connection.query_row(sql, &[], |row| {
            Ok(row.get::<_, i32>(0)? as usize)
        })
    }

    /// Get the current schema version
    fn get_schema_version(&self, connection: &DatabaseConnection) -> Result<i32, String> {
        let sql = "SELECT MAX(version) FROM schema_version";
        
        match connection.query_row(sql, &[], |row| {
            Ok(row.get::<_, Option<i32>>(0)?.unwrap_or(0))
        }) {
            Ok(version) => Ok(version),
            Err(_) => Ok(0), // No schema version found
        }
    }

    /// Perform database maintenance operations
    pub fn maintenance(&self) -> Result<MaintenanceResult, String> {
        if !self.is_initialized {
            return Err("Database connection manager not initialized".to_string());
        }

        self.with_connection(|connection| {
            let mut result = MaintenanceResult::default();

            // Run VACUUM to reclaim space
            match connection.execute("VACUUM", &[]) {
                Ok(_) => result.vacuum_success = true,
                Err(e) => result.errors.push(format!("VACUUM failed: {}", e)),
            }

            // Analyze database statistics
            match connection.execute("ANALYZE", &[]) {
                Ok(_) => result.analyze_success = true,
                Err(e) => result.errors.push(format!("ANALYZE failed: {}", e)),
            }

            // Check integrity
            match connection.with_connection(|conn| {
                let mut stmt = conn.prepare("PRAGMA integrity_check")?;
                let rows: Vec<String> = stmt.query_map([], |row| {
                    Ok(row.get::<_, String>(0)?)
                })?.collect::<Result<Vec<_>, _>>()?;
                
                if rows.len() == 1 && rows[0] == "ok" {
                    Ok(())
                } else {
                    Err("Integrity check failed".to_string())
                }
            }) {
                Ok(_) => result.integrity_check_success = true,
                Err(e) => result.errors.push(format!("Integrity check failed: {}", e)),
            }

            Ok(result)
        })
    }

    /// Create a backup of the database
    pub fn backup<P: AsRef<Path>>(&self, backup_path: P) -> Result<(), String> {
        if !self.is_initialized {
            return Err("Database connection manager not initialized".to_string());
        }

        if let Some(source_path) = &self.database_path {
            std::fs::copy(source_path, backup_path)
                .map_err(|e| format!("Failed to create database backup: {}", e))?;
            Ok(())
        } else {
            Err("No database path available for backup".to_string())
        }
    }
}

/// Database information structure
#[derive(Debug, Clone)]
pub struct DatabaseInfo {
    pub path: Option<PathBuf>,
    pub size_bytes: u64,
    pub table_count: usize,
    pub schema_version: i32,
    pub is_healthy: bool,
}

/// Database maintenance result
#[derive(Debug, Clone, Default)]
pub struct MaintenanceResult {
    pub vacuum_success: bool,
    pub analyze_success: bool,
    pub integrity_check_success: bool,
    pub errors: Vec<String>,
}

impl MaintenanceResult {
    pub fn is_success(&self) -> bool {
        self.vacuum_success && self.analyze_success && self.integrity_check_success && self.errors.is_empty()
    }
}

// Implement Default for ConnectionManager
impl Default for ConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}
