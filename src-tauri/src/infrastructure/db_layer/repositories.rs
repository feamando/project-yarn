// Database Repositories
// Repository pattern implementations for data access

use crate::core::{Project, Document, DocumentState};
use crate::infrastructure::db_layer::DatabaseConnection;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use sha2::{Sha256, Digest};

/// Document embedding representation for vector storage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentEmbedding {
    pub id: Option<i64>,
    pub document_id: i64,
    pub chunk_index: i32,
    pub content_hash: String,
    pub content_text: String,
    pub embedding_vector: Vec<f32>,
    pub embedding_model: String,
    pub chunk_start: Option<i32>,
    pub chunk_end: Option<i32>,
    pub created_at: u64,
    pub updated_at: u64,
}

/// Embedding job status for background processing
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EmbeddingJobStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

impl std::fmt::Display for EmbeddingJobStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EmbeddingJobStatus::Pending => write!(f, "pending"),
            EmbeddingJobStatus::Processing => write!(f, "processing"),
            EmbeddingJobStatus::Completed => write!(f, "completed"),
            EmbeddingJobStatus::Failed => write!(f, "failed"),
        }
    }
}

impl std::str::FromStr for EmbeddingJobStatus {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "pending" => Ok(EmbeddingJobStatus::Pending),
            "processing" => Ok(EmbeddingJobStatus::Processing),
            "completed" => Ok(EmbeddingJobStatus::Completed),
            "failed" => Ok(EmbeddingJobStatus::Failed),
            _ => Err(format!("Invalid embedding job status: {}", s)),
        }
    }
}

/// Embedding job for tracking background embedding generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddingJob {
    pub id: Option<i64>,
    pub document_id: i64,
    pub file_path: String,
    pub content_hash: String,
    pub status: EmbeddingJobStatus,
    pub error_message: Option<String>,
    pub created_at: u64,
    pub updated_at: u64,
    pub completed_at: Option<u64>,
}

/// Vector index entry for efficient vector retrieval
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorIndex {
    pub id: Option<i64>,
    pub document_id: i64,
    pub embedding: Vec<f32>,
    pub embedding_model: String,
    pub dimension: i32,
    pub created_at: u64,
    pub updated_at: u64,
}

/// FTS5 search result with relevance ranking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FTS5SearchResult {
    pub document_id: i64,
    pub title: String,
    pub content: String,
    pub rank: f64, // FTS5 BM25 ranking score
    pub snippet: Option<String>, // Highlighted snippet
}

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

    /// Get the current state of a document by ID
    /// This function is required by Task 2.1.3 for FSM support
    pub fn get_document_state(&self, document_id: &str) -> Result<Option<DocumentState>, String> {
        let sql = r#"
            SELECT state
            FROM documents
            WHERE id = ?1
        "#;

        match self.db.query_row(sql, params![document_id], |row| {
            let state_str: String = row.get(0)?;
            let state = DocumentState::from_str(&state_str)
                .ok_or_else(|| rusqlite::Error::InvalidColumnType(0, "state".to_string(), rusqlite::types::Type::Text))?;
            Ok(state)
        }) {
            Ok(state) => Ok(Some(state)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("Failed to get document state: {}", e)),
        }
    }

    /// Update the state of a document by ID
    /// This function is required by Task 2.1.3 for FSM support
    /// 
    /// # Arguments
    /// * `document_id` - The ID of the document to update
    /// * `new_state` - The new state to set for the document
    /// 
    /// # Returns
    /// * `Ok(true)` if the document was found and updated
    /// * `Ok(false)` if the document was not found
    /// * `Err(String)` if there was a database error
    pub fn update_document_state(&self, document_id: &str, new_state: &DocumentState) -> Result<bool, String> {
        // First, validate that the document exists and get its current state
        let current_state = match self.get_document_state(document_id)? {
            Some(state) => state,
            None => return Ok(false), // Document not found
        };

        // Validate the state transition using the FSM transitions module
        if !crate::core::transitions::DocumentTransitions::is_valid_transition(&current_state, new_state) {
            return Err(format!(
                "Invalid state transition: cannot transition from '{}' to '{}'",
                current_state.as_str(),
                new_state.as_str()
            ));
        }

        // Perform the state update
        let sql = r#"
            UPDATE documents 
            SET state = ?1, updated_at = ?2
            WHERE id = ?3
        "#;

        let updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let rows_affected = self.db.execute(
            sql,
            params![new_state.as_str(), updated_at, document_id],
        )?;

        Ok(rows_affected > 0)
    }

    /// Update the state of a document by ID without FSM validation
    /// This is a helper function for cases where FSM validation should be bypassed
    /// (e.g., during data migration or administrative operations)
    /// 
    /// # Arguments
    /// * `document_id` - The ID of the document to update
    /// * `new_state` - The new state to set for the document
    /// 
    /// # Returns
    /// * `Ok(true)` if the document was found and updated
    /// * `Ok(false)` if the document was not found
    /// * `Err(String)` if there was a database error
    pub fn update_document_state_unchecked(&self, document_id: &str, new_state: &DocumentState) -> Result<bool, String> {
        let sql = r#"
            UPDATE documents 
            SET state = ?1, updated_at = ?2
            WHERE id = ?3
        "#;

        let updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let rows_affected = self.db.execute(
            sql,
            params![new_state.as_str(), updated_at, document_id],
        )?;

        Ok(rows_affected > 0)
    }

    /// Get document state transition history (if audit logging is implemented)
    /// This is a helper function for future audit trail functionality
    pub fn get_document_state_history(&self, document_id: &str) -> Result<Vec<(DocumentState, u64)>, String> {
        // For now, we only return the current state and updated_at timestamp
        // In the future, this could be extended to return full audit history
        let sql = r#"
            SELECT state, updated_at
            FROM documents
            WHERE id = ?1
        "#;

        match self.db.query_row(sql, params![document_id], |row| {
            let state_str: String = row.get(0)?;
            let state = DocumentState::from_str(&state_str)
                .ok_or_else(|| rusqlite::Error::InvalidColumnType(0, "state".to_string(), rusqlite::types::Type::Text))?;
            let updated_at = row.get::<_, i64>(1)? as u64;
            Ok(vec![(state, updated_at)])
        }) {
            Ok(history) => Ok(history),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(vec![]),
            Err(e) => Err(format!("Failed to get document state history: {}", e)),
        }
    }

    /// Batch update multiple documents to a new state
    /// This is a helper function for bulk operations
    pub fn batch_update_document_states(&self, document_ids: &[String], new_state: &DocumentState) -> Result<usize, String> {
        if document_ids.is_empty() {
            return Ok(0);
        }

        // Create placeholders for the IN clause
        let placeholders: Vec<String> = document_ids.iter().map(|_| "?".to_string()).collect();
        let placeholders_str = placeholders.join(", ");

        let sql = format!(
            r#"
            UPDATE documents 
            SET state = ?1, updated_at = ?2
            WHERE id IN ({})
            "#,
            placeholders_str
        );

        let updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        // Build parameters: new_state, updated_at, then all document_ids
        let mut params_vec: Vec<&dyn rusqlite::ToSql> = vec![&new_state.as_str(), &updated_at];
        for id in document_ids {
            params_vec.push(id);
        }

        let rows_affected = self.db.execute(&sql, &params_vec[..])?;
        Ok(rows_affected)
    }
}

/// Repository for Document Embeddings and Embedding Jobs
/// Handles vector storage and background embedding generation tracking
pub struct EmbeddingRepository<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> EmbeddingRepository<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    /// Generate content hash for deduplication
    pub fn generate_content_hash(content: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Create or update document embedding
    pub fn upsert_embedding(&self, embedding: &DocumentEmbedding) -> Result<i64, String> {
        let embedding_vector_json = serde_json::to_string(&embedding.embedding_vector)
            .map_err(|e| format!("Failed to serialize embedding vector: {}", e))?;
        
        let sql = r#"
            INSERT INTO document_embeddings (
                document_id, chunk_index, content_hash, content_text, 
                embedding_vector, embedding_model, chunk_start, chunk_end
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            ON CONFLICT(document_id, chunk_index, content_hash) DO UPDATE SET
                content_text = excluded.content_text,
                embedding_vector = excluded.embedding_vector,
                embedding_model = excluded.embedding_model,
                chunk_start = excluded.chunk_start,
                chunk_end = excluded.chunk_end,
                updated_at = strftime('%s', 'now')
        "#;
        
        self.db.execute(
            sql,
            params![
                embedding.document_id,
                embedding.chunk_index,
                &embedding.content_hash,
                &embedding.content_text,
                &embedding_vector_json,
                &embedding.embedding_model,
                embedding.chunk_start,
                embedding.chunk_end
            ],
        )?;
        
        // Get the ID of the inserted/updated row
        let id_sql = "SELECT last_insert_rowid()";
        let id: i64 = self.db.query_row(id_sql, params![], |row| Ok(row.get(0)?))?
            .map_err(|e| format!("Failed to get embedding ID: {}", e))?;
        
        Ok(id)
    }

    /// Get embeddings for a document
    pub fn get_embeddings_for_document(&self, document_id: i64) -> Result<Vec<DocumentEmbedding>, String> {
        let sql = r#"
            SELECT id, document_id, chunk_index, content_hash, content_text,
                   embedding_vector, embedding_model, chunk_start, chunk_end,
                   created_at, updated_at
            FROM document_embeddings
            WHERE document_id = ?1
            ORDER BY chunk_index
        "#;
        
        self.db.query_map(sql, params![document_id], |row| {
            let embedding_vector_json: String = row.get(5)?;
            let embedding_vector: Vec<f32> = serde_json::from_str(&embedding_vector_json)
                .map_err(|e| rusqlite::Error::InvalidColumnType(5, "embedding_vector".to_string(), rusqlite::types::Type::Text))?;
            
            Ok(DocumentEmbedding {
                id: Some(row.get(0)?),
                document_id: row.get(1)?,
                chunk_index: row.get(2)?,
                content_hash: row.get(3)?,
                content_text: row.get(4)?,
                embedding_vector,
                embedding_model: row.get(6)?,
                chunk_start: row.get(7)?,
                chunk_end: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })
    }

    /// Delete embeddings for a document
    pub fn delete_embeddings_for_document(&self, document_id: i64) -> Result<usize, String> {
        let sql = "DELETE FROM document_embeddings WHERE document_id = ?1";
        let rows_affected = self.db.execute(sql, params![document_id])?;
        Ok(rows_affected)
    }

    /// Check if embeddings exist for document with specific content hash
    pub fn embeddings_exist_for_content(&self, document_id: i64, content_hash: &str) -> Result<bool, String> {
        let sql = r#"
            SELECT COUNT(*) FROM document_embeddings 
            WHERE document_id = ?1 AND content_hash = ?2
        "#;
        
        let count: i64 = self.db.query_row(sql, params![document_id, content_hash], |row| {
            Ok(row.get(0)?)
        }).map_err(|e| format!("Failed to check embedding existence: {}", e))?;
        
        Ok(count > 0)
    }

    /// Create embedding job
    pub fn create_embedding_job(&self, job: &EmbeddingJob) -> Result<i64, String> {
        let sql = r#"
            INSERT INTO embedding_jobs (
                document_id, file_path, content_hash, status, error_message
            ) VALUES (?1, ?2, ?3, ?4, ?5)
            ON CONFLICT(document_id, content_hash) DO UPDATE SET
                file_path = excluded.file_path,
                status = excluded.status,
                error_message = excluded.error_message,
                updated_at = strftime('%s', 'now')
        "#;
        
        self.db.execute(
            sql,
            params![
                job.document_id,
                &job.file_path,
                &job.content_hash,
                &job.status.to_string(),
                &job.error_message
            ],
        )?;
        
        // Get the ID of the inserted/updated row
        let id_sql = "SELECT last_insert_rowid()";
        let id: i64 = self.db.query_row(id_sql, params![], |row| Ok(row.get(0)?))?
            .map_err(|e| format!("Failed to get job ID: {}", e))?;
        
        Ok(id)
    }

    /// Update embedding job status
    pub fn update_job_status(&self, job_id: i64, status: EmbeddingJobStatus, error_message: Option<String>) -> Result<(), String> {
        let completed_at = if status == EmbeddingJobStatus::Completed || status == EmbeddingJobStatus::Failed {
            Some(SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs())
        } else {
            None
        };
        
        let sql = r#"
            UPDATE embedding_jobs 
            SET status = ?1, error_message = ?2, completed_at = ?3
            WHERE id = ?4
        "#;
        
        self.db.execute(
            sql,
            params![
                &status.to_string(),
                &error_message,
                completed_at.map(|t| t as i64),
                job_id
            ],
        )?;
        
        Ok(())
    }

    /// Get pending embedding jobs
    pub fn get_pending_jobs(&self, limit: Option<i32>) -> Result<Vec<EmbeddingJob>, String> {
        let sql = if let Some(limit) = limit {
            format!(r#"
                SELECT id, document_id, file_path, content_hash, status, error_message,
                       created_at, updated_at, completed_at
                FROM embedding_jobs
                WHERE status = 'pending'
                ORDER BY created_at
                LIMIT {}
            "#, limit)
        } else {
            r#"
                SELECT id, document_id, file_path, content_hash, status, error_message,
                       created_at, updated_at, completed_at
                FROM embedding_jobs
                WHERE status = 'pending'
                ORDER BY created_at
            "#.to_string()
        };
        
        self.db.query_map(&sql, params![], |row| {
            let status_str: String = row.get(4)?;
            let status = status_str.parse::<EmbeddingJobStatus>()
                .map_err(|e| rusqlite::Error::InvalidColumnType(4, "status".to_string(), rusqlite::types::Type::Text))?;
            
            Ok(EmbeddingJob {
                id: Some(row.get(0)?),
                document_id: row.get(1)?,
                file_path: row.get(2)?,
                content_hash: row.get(3)?,
                status,
                error_message: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
                completed_at: row.get(8)?,
            })
        })
    }

    /// Get embedding job by document ID and content hash
    pub fn get_job_by_document_and_hash(&self, document_id: i64, content_hash: &str) -> Result<Option<EmbeddingJob>, String> {
        let sql = r#"
            SELECT id, document_id, file_path, content_hash, status, error_message,
                   created_at, updated_at, completed_at
            FROM embedding_jobs
            WHERE document_id = ?1 AND content_hash = ?2
        "#;
        
        match self.db.query_row(sql, params![document_id, content_hash], |row| {
            let status_str: String = row.get(4)?;
            let status = status_str.parse::<EmbeddingJobStatus>()
                .map_err(|e| rusqlite::Error::InvalidColumnType(4, "status".to_string(), rusqlite::types::Type::Text))?;
            
            Ok(EmbeddingJob {
                id: Some(row.get(0)?),
                document_id: row.get(1)?,
                file_path: row.get(2)?,
                content_hash: row.get(3)?,
                status,
                error_message: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
                completed_at: row.get(8)?,
            })
        }) {
            Ok(job) => Ok(Some(job)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("Database error: {}", e)),
        }
    }

    /// Clean up old completed/failed jobs
    pub fn cleanup_old_jobs(&self, older_than_days: i32) -> Result<usize, String> {
        let cutoff_timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() - (older_than_days as u64 * 24 * 60 * 60);
        
        let sql = r#"
            DELETE FROM embedding_jobs 
            WHERE (status = 'completed' OR status = 'failed') 
            AND completed_at < ?1
        "#;
        
        let rows_affected = self.db.execute(sql, params![cutoff_timestamp as i64])?;
        Ok(rows_affected)
    }
}

/// Repository for Vector Index (Task 2.3.4)
/// Handles efficient vector storage and retrieval for similarity search
pub struct VectorIndexRepository<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> VectorIndexRepository<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    /// Insert a new vector index entry
    pub fn insert(&self, vector_index: &VectorIndex) -> Result<i64, String> {
        // Convert embedding vector to binary format for BLOB storage
        let embedding_blob = self.embedding_to_blob(&vector_index.embedding)?;
        
        let sql = r#"
            INSERT INTO vector_index (
                document_id, embedding, embedding_model, dimension
            ) VALUES (?1, ?2, ?3, ?4)
        "#;
        
        self.db.execute(
            sql,
            params![
                vector_index.document_id,
                &embedding_blob,
                &vector_index.embedding_model,
                vector_index.dimension
            ],
        )?;
        
        // Get the ID of the inserted row
        let id_sql = "SELECT last_insert_rowid()";
        let id: i64 = self.db.query_row(id_sql, params![], |row| Ok(row.get(0)?))?
            .map_err(|e| format!("Failed to get vector index ID: {}", e))?;
        
        Ok(id)
    }

    /// Update an existing vector index entry
    pub fn update(&self, vector_index: &VectorIndex) -> Result<bool, String> {
        let id = vector_index.id.ok_or("Vector index ID is required for update")?;
        
        // Convert embedding vector to binary format for BLOB storage
        let embedding_blob = self.embedding_to_blob(&vector_index.embedding)?;
        
        let sql = r#"
            UPDATE vector_index 
            SET embedding = ?1, embedding_model = ?2, dimension = ?3
            WHERE id = ?4
        "#;
        
        let rows_affected = self.db.execute(
            sql,
            params![
                &embedding_blob,
                &vector_index.embedding_model,
                vector_index.dimension,
                id
            ],
        )?;
        
        Ok(rows_affected > 0)
    }

    /// Upsert (insert or update) vector index entry by document_id and model
    pub fn upsert(&self, vector_index: &VectorIndex) -> Result<i64, String> {
        // Convert embedding vector to binary format for BLOB storage
        let embedding_blob = self.embedding_to_blob(&vector_index.embedding)?;
        
        let sql = r#"
            INSERT INTO vector_index (
                document_id, embedding, embedding_model, dimension
            ) VALUES (?1, ?2, ?3, ?4)
            ON CONFLICT(document_id, embedding_model) DO UPDATE SET
                embedding = excluded.embedding,
                dimension = excluded.dimension,
                updated_at = strftime('%s', 'now')
        "#;
        
        self.db.execute(
            sql,
            params![
                vector_index.document_id,
                &embedding_blob,
                &vector_index.embedding_model,
                vector_index.dimension
            ],
        )?;
        
        // Get the ID of the inserted/updated row
        let id_sql = "SELECT last_insert_rowid()";
        let id: i64 = self.db.query_row(id_sql, params![], |row| Ok(row.get(0)?))?
            .map_err(|e| format!("Failed to get vector index ID: {}", e))?;
        
        Ok(id)
    }

    /// Retrieve vector index entry by document_id
    pub fn get_by_document_id(&self, document_id: i64) -> Result<Option<VectorIndex>, String> {
        let sql = r#"
            SELECT id, document_id, embedding, embedding_model, dimension,
                   created_at, updated_at
            FROM vector_index
            WHERE document_id = ?1
        "#;
        
        match self.db.query_row(sql, params![document_id], |row| {
            let embedding_blob: Vec<u8> = row.get(2)?;
            let embedding = self.blob_to_embedding(&embedding_blob)
                .map_err(|e| rusqlite::Error::InvalidColumnType(2, "embedding".to_string(), rusqlite::types::Type::Blob))?;
            
            Ok(VectorIndex {
                id: Some(row.get(0)?),
                document_id: row.get(1)?,
                embedding,
                embedding_model: row.get(3)?,
                dimension: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        }) {
            Ok(vector_index) => Ok(Some(vector_index)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("Database error: {}", e)),
        }
    }

    /// Retrieve vector index entry by document_id and model
    pub fn get_by_document_and_model(&self, document_id: i64, model: &str) -> Result<Option<VectorIndex>, String> {
        let sql = r#"
            SELECT id, document_id, embedding, embedding_model, dimension,
                   created_at, updated_at
            FROM vector_index
            WHERE document_id = ?1 AND embedding_model = ?2
        "#;
        
        match self.db.query_row(sql, params![document_id, model], |row| {
            let embedding_blob: Vec<u8> = row.get(2)?;
            let embedding = self.blob_to_embedding(&embedding_blob)
                .map_err(|e| rusqlite::Error::InvalidColumnType(2, "embedding".to_string(), rusqlite::types::Type::Blob))?;
            
            Ok(VectorIndex {
                id: Some(row.get(0)?),
                document_id: row.get(1)?,
                embedding,
                embedding_model: row.get(3)?,
                dimension: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        }) {
            Ok(vector_index) => Ok(Some(vector_index)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("Database error: {}", e)),
        }
    }

    /// Retrieve all vector index entries for a specific model
    pub fn get_by_model(&self, model: &str) -> Result<Vec<VectorIndex>, String> {
        let sql = r#"
            SELECT id, document_id, embedding, embedding_model, dimension,
                   created_at, updated_at
            FROM vector_index
            WHERE embedding_model = ?1
            ORDER BY document_id
        "#;
        
        self.db.query_map(sql, params![model], |row| {
            let embedding_blob: Vec<u8> = row.get(2)?;
            let embedding = self.blob_to_embedding(&embedding_blob)
                .map_err(|e| rusqlite::Error::InvalidColumnType(2, "embedding".to_string(), rusqlite::types::Type::Blob))?;
            
            Ok(VectorIndex {
                id: Some(row.get(0)?),
                document_id: row.get(1)?,
                embedding,
                embedding_model: row.get(3)?,
                dimension: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
    }

    /// Delete vector index entry by document_id
    pub fn delete_by_document_id(&self, document_id: i64) -> Result<usize, String> {
        let sql = "DELETE FROM vector_index WHERE document_id = ?1";
        let rows_affected = self.db.execute(sql, params![document_id])?;
        Ok(rows_affected)
    }

    /// Delete vector index entry by document_id and model
    pub fn delete_by_document_and_model(&self, document_id: i64, model: &str) -> Result<usize, String> {
        let sql = "DELETE FROM vector_index WHERE document_id = ?1 AND embedding_model = ?2";
        let rows_affected = self.db.execute(sql, params![document_id, model])?;
        Ok(rows_affected)
    }

    /// Get all vector index entries (for similarity search)
    pub fn get_all(&self) -> Result<Vec<VectorIndex>, String> {
        let sql = r#"
            SELECT id, document_id, embedding, embedding_model, dimension,
                   created_at, updated_at
            FROM vector_index
            ORDER BY document_id
        "#;
        
        self.db.query_map(sql, params![], |row| {
            let embedding_blob: Vec<u8> = row.get(2)?;
            let embedding = self.blob_to_embedding(&embedding_blob)
                .map_err(|e| rusqlite::Error::InvalidColumnType(2, "embedding".to_string(), rusqlite::types::Type::Blob))?;
            
            Ok(VectorIndex {
                id: Some(row.get(0)?),
                document_id: row.get(1)?,
                embedding,
                embedding_model: row.get(3)?,
                dimension: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
    }

    /// Convert embedding vector to binary BLOB format
    fn embedding_to_blob(&self, embedding: &[f32]) -> Result<Vec<u8>, String> {
        // Convert f32 vector to bytes (little-endian)
        let mut blob = Vec::with_capacity(embedding.len() * 4);
        for &value in embedding {
            blob.extend_from_slice(&value.to_le_bytes());
        }
        Ok(blob)
    }

    /// Convert binary BLOB to embedding vector
    fn blob_to_embedding(&self, blob: &[u8]) -> Result<Vec<f32>, String> {
        if blob.len() % 4 != 0 {
            return Err("Invalid BLOB size for f32 vector".to_string());
        }
        
        let mut embedding = Vec::with_capacity(blob.len() / 4);
        for chunk in blob.chunks_exact(4) {
            let bytes: [u8; 4] = chunk.try_into()
                .map_err(|_| "Failed to convert chunk to f32 bytes")?;
            embedding.push(f32::from_le_bytes(bytes));
        }
        
        Ok(embedding)
    }

    /// Calculate cosine similarity between two embeddings
    pub fn cosine_similarity(a: &[f32], b: &[f32]) -> Result<f32, String> {
        if a.len() != b.len() {
            return Err("Embedding dimensions must match".to_string());
        }
        
        let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
        let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
        let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
        
        if norm_a == 0.0 || norm_b == 0.0 {
            return Ok(0.0);
        }
        
        Ok(dot_product / (norm_a * norm_b))
    }

    /// Find similar vectors using cosine similarity
    pub fn find_similar(&self, query_embedding: &[f32], limit: Option<i32>, threshold: Option<f32>) -> Result<Vec<(VectorIndex, f32)>, String> {
        let all_vectors = self.get_all()?;
        let threshold = threshold.unwrap_or(0.0);
        
        let mut similarities = Vec::new();
        
        for vector in all_vectors {
            let similarity = Self::cosine_similarity(query_embedding, &vector.embedding)?;
            if similarity >= threshold {
                similarities.push((vector, similarity));
            }
        }
        
        // Sort by similarity (descending)
        similarities.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // Apply limit if specified
        if let Some(limit) = limit {
            similarities.truncate(limit as usize);
        }
        
        Ok(similarities)
    }
}

/// Repository for FTS5 Full-Text Search (Task 2.3.5)
/// Handles fast lexical search for the hybrid RAG system
pub struct FTS5Repository<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> FTS5Repository<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    /// Perform full-text search using FTS5
    /// Returns documents ranked by relevance (BM25 scoring)
    pub fn search(&self, query: &str, limit: Option<i32>) -> Result<Vec<FTS5SearchResult>, String> {
        if query.trim().is_empty() {
            return Ok(Vec::new());
        }
        
        let limit_clause = if let Some(limit) = limit {
            format!("LIMIT {}", limit)
        } else {
            String::new()
        };
        
        let sql = format!(r#"
            SELECT 
                d.id as document_id,
                d.title,
                d.content,
                bm25(documents_fts) as rank
            FROM documents_fts 
            JOIN documents d ON documents_fts.rowid = d.id
            WHERE documents_fts MATCH ?
            ORDER BY rank
            {}
        "#, limit_clause);
        
        self.db.query_map(&sql, params![query], |row| {
            Ok(FTS5SearchResult {
                document_id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                rank: row.get(3)?,
                snippet: None, // Will be populated by snippet function if needed
            })
        })
    }

    /// Perform full-text search with highlighted snippets
    /// Returns documents with highlighted search terms in snippets
    pub fn search_with_snippets(&self, query: &str, limit: Option<i32>) -> Result<Vec<FTS5SearchResult>, String> {
        if query.trim().is_empty() {
            return Ok(Vec::new());
        }
        
        let limit_clause = if let Some(limit) = limit {
            format!("LIMIT {}", limit)
        } else {
            String::new()
        };
        
        let sql = format!(r#"
            SELECT 
                d.id as document_id,
                d.title,
                d.content,
                bm25(documents_fts) as rank,
                snippet(documents_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
            FROM documents_fts 
            JOIN documents d ON documents_fts.rowid = d.id
            WHERE documents_fts MATCH ?
            ORDER BY rank
            {}
        "#, limit_clause);
        
        self.db.query_map(&sql, params![query], |row| {
            Ok(FTS5SearchResult {
                document_id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                rank: row.get(3)?,
                snippet: Some(row.get(4)?),
            })
        })
    }

    /// Search in titles only
    pub fn search_titles(&self, query: &str, limit: Option<i32>) -> Result<Vec<FTS5SearchResult>, String> {
        if query.trim().is_empty() {
            return Ok(Vec::new());
        }
        
        let limit_clause = if let Some(limit) = limit {
            format!("LIMIT {}", limit)
        } else {
            String::new()
        };
        
        // Search only in title field
        let title_query = format!("title:{}", query);
        
        let sql = format!(r#"
            SELECT 
                d.id as document_id,
                d.title,
                d.content,
                bm25(documents_fts) as rank
            FROM documents_fts 
            JOIN documents d ON documents_fts.rowid = d.id
            WHERE documents_fts MATCH ?
            ORDER BY rank
            {}
        "#, limit_clause);
        
        self.db.query_map(&sql, params![title_query], |row| {
            Ok(FTS5SearchResult {
                document_id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                rank: row.get(3)?,
                snippet: None,
            })
        })
    }

    /// Search in content only
    pub fn search_content(&self, query: &str, limit: Option<i32>) -> Result<Vec<FTS5SearchResult>, String> {
        if query.trim().is_empty() {
            return Ok(Vec::new());
        }
        
        let limit_clause = if let Some(limit) = limit {
            format!("LIMIT {}", limit)
        } else {
            String::new()
        };
        
        // Search only in content field
        let content_query = format!("content:{}", query);
        
        let sql = format!(r#"
            SELECT 
                d.id as document_id,
                d.title,
                d.content,
                bm25(documents_fts) as rank
            FROM documents_fts 
            JOIN documents d ON documents_fts.rowid = d.id
            WHERE documents_fts MATCH ?
            ORDER BY rank
            {}
        "#, limit_clause);
        
        self.db.query_map(&sql, params![content_query], |row| {
            Ok(FTS5SearchResult {
                document_id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                rank: row.get(3)?,
                snippet: None,
            })
        })
    }

    /// Perform phrase search (exact phrase matching)
    pub fn search_phrase(&self, phrase: &str, limit: Option<i32>) -> Result<Vec<FTS5SearchResult>, String> {
        if phrase.trim().is_empty() {
            return Ok(Vec::new());
        }
        
        let limit_clause = if let Some(limit) = limit {
            format!("LIMIT {}", limit)
        } else {
            String::new()
        };
        
        // Wrap phrase in quotes for exact matching
        let phrase_query = format!("\"{}\"", phrase);
        
        let sql = format!(r#"
            SELECT 
                d.id as document_id,
                d.title,
                d.content,
                bm25(documents_fts) as rank
            FROM documents_fts 
            JOIN documents d ON documents_fts.rowid = d.id
            WHERE documents_fts MATCH ?
            ORDER BY rank
            {}
        "#, limit_clause);
        
        self.db.query_map(&sql, params![phrase_query], |row| {
            Ok(FTS5SearchResult {
                document_id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                rank: row.get(3)?,
                snippet: None,
            })
        })
    }

    /// Get candidate documents for hybrid RAG search
    /// This is the first step in the two-step retrieval process
    pub fn get_candidates(&self, query: &str, max_candidates: Option<i32>) -> Result<Vec<i64>, String> {
        let limit = max_candidates.unwrap_or(50); // Default to top 50 candidates
        
        let results = self.search(query, Some(limit))?;
        Ok(results.into_iter().map(|r| r.document_id).collect())
    }

    /// Rebuild FTS5 index (for maintenance)
    pub fn rebuild_index(&self) -> Result<(), String> {
        let sql = "INSERT INTO documents_fts(documents_fts) VALUES('rebuild')";
        self.db.execute(sql, params![])?;
        Ok(())
    }

    /// Optimize FTS5 index (for maintenance)
    pub fn optimize_index(&self) -> Result<(), String> {
        let sql = "INSERT INTO documents_fts(documents_fts) VALUES('optimize')";
        self.db.execute(sql, params![])?;
        Ok(())
    }

    /// Get FTS5 index statistics
    pub fn get_index_stats(&self) -> Result<String, String> {
        let sql = "SELECT * FROM documents_fts WHERE documents_fts MATCH 'vocab'";
        
        match self.db.query_row(sql, params![], |row| {
            Ok(format!("FTS5 Index Stats: {}", row.get::<_, String>(0)?))
        }) {
            Ok(stats) => Ok(stats),
            Err(_) => Ok("FTS5 index statistics not available".to_string()),
        }
    }

    /// Check if FTS5 is available and working
    pub fn test_fts5(&self) -> Result<bool, String> {
        let sql = "SELECT COUNT(*) FROM documents_fts";
        
        match self.db.query_row(sql, params![], |row| {
            Ok(row.get::<_, i64>(0)?)
        }) {
            Ok(_) => Ok(true),
            Err(e) => {
                if e.to_string().contains("no such table") {
                    Ok(false)
                } else {
                    Err(format!("FTS5 test failed: {}", e))
                }
            }
        }
    }

    /// Escape FTS5 special characters in query
    pub fn escape_query(query: &str) -> String {
        // Escape FTS5 special characters: " * ( ) [ ] { } ^ ~ :
        query
            .replace('"', '""')
            .replace('*', "\\*")
            .replace('(', "\\(")
            .replace(')', "\\)")
            .replace('[', "\\[")
            .replace(']', "\\]")
            .replace('{', "\\{")
            .replace('}', "\\}")
            .replace('^', "\\^")
            .replace('~', "\\~")
            .replace(':', "\\:")
    }
}

#[cfg(test)]
mod repositories_test;

#[cfg(test)]
use repositories_test::*;
