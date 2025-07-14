// Database Repositories
// Repository pattern implementations for data access

use crate::core::{Project, Document, DocumentState};
use crate::infrastructure::db_layer::DatabaseConnection;
use rusqlite::params;

/// Repository for Project entities
pub struct ProjectRepository<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> ProjectRepository<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    /// Insert a new project into the database
    pub fn create(&self, project: &Project) -> Result<(), String> {
        let sql = r#"
            INSERT INTO projects (id, name, path, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5)
        "#;

        self.db.execute(
            sql,
            params![
                &project.id,
                &project.name,
                &project.path,
                project.created_at as i64,
                project.updated_at as i64
            ],
        )?;

        Ok(())
    }

    /// Find a project by ID
    pub fn find_by_id(&self, id: &str) -> Result<Option<Project>, String> {
        let sql = r#"
            SELECT id, name, path, created_at, updated_at
            FROM projects
            WHERE id = ?1
        "#;

        match self.db.query_row(sql, params![id], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                created_at: row.get::<_, i64>(3)? as u64,
                updated_at: row.get::<_, i64>(4)? as u64,
            })
        }) {
            Ok(project) => Ok(Some(project)),
            Err(err) if err.contains("no rows returned") => Ok(None),
            Err(err) => Err(err),
        }
    }

    /// Find all projects
    pub fn find_all(&self) -> Result<Vec<Project>, String> {
        let sql = r#"
            SELECT id, name, path, created_at, updated_at
            FROM projects
            ORDER BY updated_at DESC
        "#;

        self.db.query_map(sql, &[], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                created_at: row.get::<_, i64>(3)? as u64,
                updated_at: row.get::<_, i64>(4)? as u64,
            })
        })
    }

    /// Update an existing project
    pub fn update(&self, project: &Project) -> Result<(), String> {
        let sql = r#"
            UPDATE projects
            SET name = ?1, path = ?2, updated_at = ?3
            WHERE id = ?4
        "#;

        let rows_affected = self.db.execute(
            sql,
            params![
                &project.name,
                &project.path,
                project.updated_at as i64,
                &project.id
            ],
        )?;

        if rows_affected == 0 {
            return Err(format!("Project with id '{}' not found", project.id));
        }

        Ok(())
    }

    /// Delete a project by ID
    pub fn delete(&self, id: &str) -> Result<(), String> {
        let sql = "DELETE FROM projects WHERE id = ?1";

        let rows_affected = self.db.execute(sql, params![id])?;

        if rows_affected == 0 {
            return Err(format!("Project with id '{}' not found", id));
        }

        Ok(())
    }
}

/// Repository for Document entities
pub struct DocumentRepository<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> DocumentRepository<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    /// Insert a new document into the database
    pub fn create(&self, document: &Document) -> Result<(), String> {
        let sql = r#"
            INSERT INTO documents (id, project_id, path, state, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        "#;

        self.db.execute(
            sql,
            params![
                &document.id,
                &document.project_id,
                &document.path,
                document.state.as_str(),
                document.created_at as i64,
                document.updated_at as i64
            ],
        )?;

        Ok(())
    }

    /// Find a document by ID
    pub fn find_by_id(&self, id: &str) -> Result<Option<Document>, String> {
        let sql = r#"
            SELECT id, project_id, path, state, created_at, updated_at
            FROM documents
            WHERE id = ?1
        "#;

        match self.db.query_row(sql, params![id], |row| {
            let state_str: String = row.get(3)?;
            let state = DocumentState::from_str(&state_str)
                .ok_or_else(|| rusqlite::Error::InvalidColumnType(3, "state".to_string(), rusqlite::types::Type::Text))?;

            Ok(Document {
                id: row.get(0)?,
                project_id: row.get(1)?,
                path: row.get(2)?,
                state,
                created_at: row.get::<_, i64>(4)? as u64,
                updated_at: row.get::<_, i64>(5)? as u64,
            })
        }) {
            Ok(document) => Ok(Some(document)),
            Err(err) if err.contains("no rows returned") => Ok(None),
            Err(err) => Err(err),
        }
    }

    /// Find all documents for a project
    pub fn find_by_project_id(&self, project_id: &str) -> Result<Vec<Document>, String> {
        let sql = r#"
            SELECT id, project_id, path, state, created_at, updated_at
            FROM documents
            WHERE project_id = ?1
            ORDER BY updated_at DESC
        "#;

        self.db.query_map(sql, params![project_id], |row| {
            let state_str: String = row.get(3)?;
            let state = DocumentState::from_str(&state_str)
                .ok_or_else(|| rusqlite::Error::InvalidColumnType(3, "state".to_string(), rusqlite::types::Type::Text))?;

            Ok(Document {
                id: row.get(0)?,
                project_id: row.get(1)?,
                path: row.get(2)?,
                state,
                created_at: row.get::<_, i64>(4)? as u64,
                updated_at: row.get::<_, i64>(5)? as u64,
            })
        })
    }

    /// Update an existing document
    pub fn update(&self, document: &Document) -> Result<(), String> {
        let sql = r#"
            UPDATE documents
            SET path = ?1, state = ?2, updated_at = ?3
            WHERE id = ?4
        "#;

        let rows_affected = self.db.execute(
            sql,
            params![
                &document.path,
                document.state.as_str(),
                document.updated_at as i64,
                &document.id
            ],
        )?;

        if rows_affected == 0 {
            return Err(format!("Document with id '{}' not found", document.id));
        }

        Ok(())
    }

    /// Delete a document by ID
    pub fn delete(&self, id: &str) -> Result<(), String> {
        let sql = "DELETE FROM documents WHERE id = ?1";

        let rows_affected = self.db.execute(sql, params![id])?;

        if rows_affected == 0 {
            return Err(format!("Document with id '{}' not found", id));
        }

        Ok(())
    }

    /// Find documents by state
    pub fn find_by_state(&self, state: &DocumentState) -> Result<Vec<Document>, String> {
        let sql = r#"
            SELECT id, project_id, path, state, created_at, updated_at
            FROM documents
            WHERE state = ?1
            ORDER BY updated_at DESC
        "#;

        self.db.query_map(sql, params![state.as_str()], |row| {
            let state_str: String = row.get(3)?;
            let state = DocumentState::from_str(&state_str)
                .ok_or_else(|| rusqlite::Error::InvalidColumnType(3, "state".to_string(), rusqlite::types::Type::Text))?;

            Ok(Document {
                id: row.get(0)?,
                project_id: row.get(1)?,
                path: row.get(2)?,
                state,
                created_at: row.get::<_, i64>(4)? as u64,
                updated_at: row.get::<_, i64>(5)? as u64,
            })
        })
    }
}
