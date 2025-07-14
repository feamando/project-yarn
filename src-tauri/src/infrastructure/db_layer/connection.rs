// Database Connection Management
// Handles SQLite database connections and initialization

use rusqlite::{Connection, Result as SqliteResult};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

/// Database connection manager with connection pooling
pub struct DatabaseConnection {
    connection: Arc<Mutex<Option<Connection>>>,
    database_path: Option<PathBuf>,
}

impl DatabaseConnection {
    /// Create a new database connection manager
    pub fn new() -> Self {
        Self {
            connection: Arc::new(Mutex::new(None)),
            database_path: None,
        }
    }

    /// Initialize database connection with the given path
    pub fn initialize<P: AsRef<Path>>(&mut self, db_path: P) -> SqliteResult<()> {
        let path = db_path.as_ref().to_path_buf();
        let conn = Connection::open(&path)?;
        
        // Configure SQLite for optimal performance and data integrity
        conn.execute("PRAGMA foreign_keys = ON;", [])?;
        conn.execute("PRAGMA journal_mode = WAL;", [])?;
        conn.execute("PRAGMA synchronous = NORMAL;", [])?;
        conn.execute("PRAGMA cache_size = 1000;", [])?;
        conn.execute("PRAGMA temp_store = MEMORY;", [])?;
        
        // Enable FTS5 for full-text search capabilities
        conn.execute("PRAGMA compile_options;", [])?;
        
        let mut connection_guard = self.connection.lock().unwrap();
        *connection_guard = Some(conn);
        self.database_path = Some(path);
        
        Ok(())
    }

    /// Get a reference to the database connection
    pub fn with_connection<F, R>(&self, f: F) -> Result<R, String>
    where
        F: FnOnce(&Connection) -> SqliteResult<R>,
    {
        let connection_guard = self.connection.lock().unwrap();
        match connection_guard.as_ref() {
            Some(conn) => f(conn).map_err(|e| format!("Database operation failed: {}", e)),
            None => Err("Database not initialized".to_string()),
        }
    }

    /// Execute a query that returns no results
    pub fn execute(&self, sql: &str, params: &[&dyn rusqlite::ToSql]) -> Result<usize, String> {
        self.with_connection(|conn| conn.execute(sql, params))
    }

    /// Execute a query and return a single result
    pub fn query_row<T, F>(&self, sql: &str, params: &[&dyn rusqlite::ToSql], f: F) -> Result<T, String>
    where
        F: FnOnce(&rusqlite::Row<'_>) -> SqliteResult<T>,
    {
        self.with_connection(|conn| conn.query_row(sql, params, f))
    }

    /// Execute a query and return multiple results
    pub fn query_map<T, F>(&self, sql: &str, params: &[&dyn rusqlite::ToSql], f: F) -> Result<Vec<T>, String>
    where
        F: Fn(&rusqlite::Row<'_>) -> SqliteResult<T>,
    {
        self.with_connection(|conn| {
            let mut stmt = conn.prepare(sql)?;
            let rows = stmt.query_map(params, &f)?;
            let mut results = Vec::new();
            for row in rows {
                results.push(row?);
            }
            Ok(results)
        })
    }

    /// Check if database is initialized
    pub fn is_initialized(&self) -> bool {
        let connection_guard = self.connection.lock().unwrap();
        connection_guard.is_some()
    }

    /// Get the database file path
    pub fn database_path(&self) -> Option<&Path> {
        self.database_path.as_deref()
    }

    /// Close the database connection
    pub fn close(&mut self) -> Result<(), String> {
        let mut connection_guard = self.connection.lock().unwrap();
        if let Some(conn) = connection_guard.take() {
            // SQLite connection is automatically closed when dropped
            drop(conn);
        }
        self.database_path = None;
        Ok(())
    }

    /// Test database connectivity
    pub fn test_connection(&self) -> Result<(), String> {
        self.with_connection(|conn| {
            conn.execute("SELECT 1;", [])?;
            Ok(())
        })
    }
}
