// Hybrid RAG Service for Task 2.3.6
// Implements the backend logic for the @ context command
// Orchestrates the two-step retrieval process: FTS5 lexical search + vector similarity search

use crate::infrastructure::db_layer::{
    DatabaseConnection, FTS5Repository, VectorIndexRepository, DocumentRepository,
    FTS5SearchResult, VectorIndex, Document
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{info, warn, error, debug};

/// Configuration for hybrid RAG retrieval
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HybridRagConfig {
    /// Maximum number of candidate documents from FTS5 search
    pub max_candidates: i32,
    /// Maximum number of final results after vector similarity
    pub max_results: i32,
    /// Minimum similarity threshold for vector search (0.0 to 1.0)
    pub similarity_threshold: f32,
    /// Weight for lexical search score (0.0 to 1.0)
    pub lexical_weight: f32,
    /// Weight for vector similarity score (0.0 to 1.0)
    pub vector_weight: f32,
    /// Maximum context length in characters
    pub max_context_length: usize,
}

impl Default for HybridRagConfig {
    fn default() -> Self {
        Self {
            max_candidates: 50,
            max_results: 10,
            similarity_threshold: 0.3,
            lexical_weight: 0.4,
            vector_weight: 0.6,
            max_context_length: 8000,
        }
    }
}

/// Result from hybrid RAG retrieval
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HybridRagResult {
    pub document_id: i64,
    pub title: String,
    pub content: String,
    pub lexical_score: f64,
    pub vector_similarity: Option<f32>,
    pub combined_score: f64,
    pub snippet: Option<String>,
}

/// Context assembly result for AI provider
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextAssembly {
    pub context_text: String,
    pub source_documents: Vec<HybridRagResult>,
    pub total_length: usize,
    pub truncated: bool,
}

/// Hybrid RAG Service for orchestrating retrieval
pub struct HybridRagService<'a> {
    db: &'a DatabaseConnection,
    fts5_repo: FTS5Repository<'a>,
    vector_repo: VectorIndexRepository<'a>,
    doc_repo: DocumentRepository<'a>,
    config: HybridRagConfig,
}

impl<'a> HybridRagService<'a> {
    /// Create new hybrid RAG service
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self {
            db,
            fts5_repo: FTS5Repository::new(db),
            vector_repo: VectorIndexRepository::new(db),
            doc_repo: DocumentRepository::new(db),
            config: HybridRagConfig::default(),
        }
    }

    /// Create hybrid RAG service with custom configuration
    pub fn with_config(db: &'a DatabaseConnection, config: HybridRagConfig) -> Self {
        Self {
            db,
            fts5_repo: FTS5Repository::new(db),
            vector_repo: VectorIndexRepository::new(db),
            doc_repo: DocumentRepository::new(db),
            config,
        }
    }

    /// Main hybrid RAG retrieval function - implements the @ context command logic
    /// This orchestrates the two-step retrieval process as specified in Task 2.3.6
    pub fn retrieve_context(&self, query: &str) -> Result<ContextAssembly, String> {
        info!("Starting hybrid RAG retrieval for query: '{}'", query);

        // Step 1: Perform fast lexical search using FTS5 to get candidate documents
        let candidates = self.get_lexical_candidates(query)?;
        if candidates.is_empty() {
            warn!("No candidates found from lexical search for query: '{}'", query);
            return Ok(ContextAssembly {
                context_text: String::new(),
                source_documents: Vec::new(),
                total_length: 0,
                truncated: false,
            });
        }

        info!("Found {} candidates from lexical search", candidates.len());

        // Step 2: Perform vector similarity search on candidate documents
        let vector_results = self.perform_vector_similarity_search(query, &candidates)?;
        
        // Step 3: Combine and rank results using hybrid scoring
        let hybrid_results = self.combine_and_rank_results(candidates, vector_results)?;

        // Step 4: Assemble context string for AI provider
        let context_assembly = self.assemble_context(hybrid_results)?;

        info!("Hybrid RAG retrieval completed. Context length: {} characters", 
              context_assembly.total_length);

        Ok(context_assembly)
    }

    /// Step 1: Get candidate documents using FTS5 lexical search
    fn get_lexical_candidates(&self, query: &str) -> Result<Vec<FTS5SearchResult>, String> {
        debug!("Performing FTS5 lexical search for candidates");
        
        // Use FTS5 search with snippets for better context
        let candidates = self.fts5_repo.search_with_snippets(
            query, 
            Some(self.config.max_candidates)
        )?;

        debug!("FTS5 search returned {} candidates", candidates.len());
        Ok(candidates)
    }

    /// Step 2: Perform vector similarity search on candidate documents
    fn perform_vector_similarity_search(
        &self, 
        query: &str, 
        candidates: &[FTS5SearchResult]
    ) -> Result<HashMap<i64, f32>, String> {
        debug!("Performing vector similarity search on {} candidates", candidates.len());

        // For now, we'll use a placeholder embedding for the query
        // In a full implementation, this would generate an actual embedding
        let query_embedding = self.generate_query_embedding(query)?;

        // Get vector similarities for candidate documents
        let mut similarities = HashMap::new();
        
        for candidate in candidates {
            if let Ok(Some(vector_index)) = self.vector_repo.get_by_document_id(candidate.document_id) {
                // Calculate cosine similarity between query and document embeddings
                let similarity = self.vector_repo.cosine_similarity(&query_embedding, &vector_index.embedding);
                
                // Only include results above threshold
                if similarity >= self.config.similarity_threshold {
                    similarities.insert(candidate.document_id, similarity);
                }
            }
        }

        debug!("Vector similarity search found {} matches above threshold", similarities.len());
        Ok(similarities)
    }

    /// Step 3: Combine lexical and vector results with hybrid scoring
    fn combine_and_rank_results(
        &self,
        lexical_results: Vec<FTS5SearchResult>,
        vector_similarities: HashMap<i64, f32>,
    ) -> Result<Vec<HybridRagResult>, String> {
        debug!("Combining and ranking lexical and vector results");

        let mut hybrid_results = Vec::new();

        for lexical_result in lexical_results {
            let vector_similarity = vector_similarities.get(&lexical_result.document_id).copied();
            
            // Calculate combined score using weighted combination
            let combined_score = self.calculate_combined_score(
                lexical_result.rank,
                vector_similarity,
            );

            let hybrid_result = HybridRagResult {
                document_id: lexical_result.document_id,
                title: lexical_result.title,
                content: lexical_result.content,
                lexical_score: lexical_result.rank,
                vector_similarity,
                combined_score,
                snippet: lexical_result.snippet,
            };

            hybrid_results.push(hybrid_result);
        }

        // Sort by combined score (ascending - lower is better for BM25)
        hybrid_results.sort_by(|a, b| a.combined_score.partial_cmp(&b.combined_score).unwrap());

        // Limit to max results
        hybrid_results.truncate(self.config.max_results as usize);

        debug!("Final hybrid results: {} documents", hybrid_results.len());
        Ok(hybrid_results)
    }

    /// Step 4: Assemble retrieved text into context string for AI provider
    fn assemble_context(&self, results: Vec<HybridRagResult>) -> Result<ContextAssembly, String> {
        debug!("Assembling context from {} results", results.len());

        let mut context_parts = Vec::new();
        let mut total_length = 0;
        let mut truncated = false;

        for (index, result) in results.iter().enumerate() {
            // Create context entry with document metadata
            let context_entry = if let Some(snippet) = &result.snippet {
                format!(
                    "Document {}: {}\n{}\n---\n",
                    index + 1,
                    result.title,
                    snippet.replace("<mark>", "**").replace("</mark>", "**")
                )
            } else {
                // Use truncated content if no snippet available
                let content = if result.content.len() > 500 {
                    format!("{}...", &result.content[..500])
                } else {
                    result.content.clone()
                };
                
                format!(
                    "Document {}: {}\n{}\n---\n",
                    index + 1,
                    result.title,
                    content
                )
            };

            // Check if adding this entry would exceed max context length
            if total_length + context_entry.len() > self.config.max_context_length {
                truncated = true;
                break;
            }

            context_parts.push(context_entry);
            total_length += context_parts.last().unwrap().len();
        }

        let context_text = if context_parts.is_empty() {
            String::new()
        } else {
            format!(
                "Retrieved Context:\n\n{}\n\nEnd of Context\n",
                context_parts.join("\n")
            )
        };

        Ok(ContextAssembly {
            context_text,
            source_documents: results,
            total_length,
            truncated,
        })
    }

    /// Calculate combined score from lexical and vector components
    fn calculate_combined_score(&self, lexical_rank: f64, vector_similarity: Option<f32>) -> f64 {
        match vector_similarity {
            Some(similarity) => {
                // Normalize BM25 rank (lower is better) to 0-1 scale
                let normalized_lexical = 1.0 / (1.0 + lexical_rank);
                
                // Vector similarity is already 0-1 (higher is better)
                let normalized_vector = similarity as f64;
                
                // Weighted combination (lower combined score is better)
                let combined = (self.config.lexical_weight as f64 * (1.0 - normalized_lexical)) +
                              (self.config.vector_weight as f64 * (1.0 - normalized_vector));
                
                combined
            }
            None => {
                // Only lexical score available
                lexical_rank
            }
        }
    }

    /// Generate query embedding (placeholder implementation)
    /// In a full implementation, this would use the embedding model
    fn generate_query_embedding(&self, query: &str) -> Result<Vec<f32>, String> {
        debug!("Generating query embedding for: '{}'", query);
        
        // Placeholder: Generate a deterministic embedding based on query
        // In production, this would call the embedding model sidecar
        let mut embedding = vec![0.0f32; 384]; // all-MiniLM-L6-v2 dimension
        
        // Simple hash-based embedding for testing
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        query.hash(&mut hasher);
        let hash = hasher.finish();
        
        for (i, val) in embedding.iter_mut().enumerate() {
            *val = ((hash.wrapping_add(i as u64) % 1000) as f32 - 500.0) / 500.0;
        }
        
        // Normalize the embedding
        let magnitude: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        if magnitude > 0.0 {
            for val in embedding.iter_mut() {
                *val /= magnitude;
            }
        }
        
        Ok(embedding)
    }

    /// Update configuration
    pub fn update_config(&mut self, config: HybridRagConfig) {
        self.config = config;
    }

    /// Get current configuration
    pub fn get_config(&self) -> &HybridRagConfig {
        &self.config
    }

    /// Test hybrid RAG functionality
    pub fn test_retrieval(&self) -> Result<bool, String> {
        // Test FTS5 availability
        if !self.fts5_repo.test_fts5()? {
            return Ok(false);
        }

        // Test basic retrieval with a simple query
        let test_result = self.retrieve_context("test");
        match test_result {
            Ok(_) => Ok(true),
            Err(e) => {
                error!("Hybrid RAG test failed: {}", e);
                Ok(false)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::db_layer::{DatabaseConnection, MigrationManager};
    use tempfile::NamedTempFile;

    fn create_test_db() -> (NamedTempFile, DatabaseConnection) {
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        let db_path = temp_file.path().to_str().expect("Invalid path");
        let db = DatabaseConnection::new(db_path).expect("Failed to create database connection");
        
        let migration_manager = MigrationManager::new(&db);
        migration_manager.migrate().expect("Failed to run migrations");
        
        (temp_file, db)
    }

    #[test]
    fn test_hybrid_rag_service_creation() {
        let (_temp_file, db) = create_test_db();
        let service = HybridRagService::new(&db);
        
        assert_eq!(service.config.max_candidates, 50);
        assert_eq!(service.config.max_results, 10);
    }

    #[test]
    fn test_hybrid_rag_config() {
        let config = HybridRagConfig {
            max_candidates: 20,
            max_results: 5,
            similarity_threshold: 0.5,
            lexical_weight: 0.3,
            vector_weight: 0.7,
            max_context_length: 4000,
        };

        let (_temp_file, db) = create_test_db();
        let service = HybridRagService::with_config(&db, config.clone());
        
        assert_eq!(service.config.max_candidates, 20);
        assert_eq!(service.config.similarity_threshold, 0.5);
    }

    #[test]
    fn test_query_embedding_generation() {
        let (_temp_file, db) = create_test_db();
        let service = HybridRagService::new(&db);
        
        let embedding = service.generate_query_embedding("test query").expect("Failed to generate embedding");
        
        assert_eq!(embedding.len(), 384);
        
        // Test that embedding is normalized
        let magnitude: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((magnitude - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_combined_score_calculation() {
        let (_temp_file, db) = create_test_db();
        let service = HybridRagService::new(&db);
        
        // Test with both lexical and vector scores
        let combined_score = service.calculate_combined_score(2.5, Some(0.8));
        assert!(combined_score > 0.0);
        
        // Test with only lexical score
        let lexical_only_score = service.calculate_combined_score(2.5, None);
        assert_eq!(lexical_only_score, 2.5);
    }
}
