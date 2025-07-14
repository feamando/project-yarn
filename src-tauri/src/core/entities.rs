// Domain Entities
// Pure business entities with zero external dependencies
// Using only standard library types to maintain purity

/// Represents a Project in the system
/// Contains fields as specified in the PRD: id, name, path
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Project {
    /// Unique identifier for the project
    pub id: String,
    /// Human-readable project name
    pub name: String,
    /// File system path where project files are stored
    pub path: String,
    /// Creation timestamp (Unix timestamp in seconds)
    pub created_at: u64,
    /// Last modification timestamp (Unix timestamp in seconds)
    pub updated_at: u64,
}

/// Represents a Document within a Project
/// Contains fields as specified in the PRD: id, project_id, path, state
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Document {
    /// Unique identifier for the document
    pub id: String,
    /// Reference to the parent project
    pub project_id: String,
    /// Relative path to the document file within the project
    pub path: String,
    /// Current state in the document lifecycle FSM
    pub state: DocumentState,
    /// Creation timestamp (Unix timestamp in seconds)
    pub created_at: u64,
    /// Last modification timestamp (Unix timestamp in seconds)
    pub updated_at: u64,
}

/// Document state as per the FSM design from the Technical Strategy
/// Represents the lifecycle states for structured document workflows
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DocumentState {
    /// Initial state - document is being drafted
    Draft,
    /// Document is under review
    InReview,
    /// Document has been published/finalized
    Published,
    /// Document has been archived
    Archived,
}

/// Implementation block for Project
impl Project {
    /// Create a new project with current timestamp
    pub fn new(id: String, name: String, path: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        Self {
            id,
            name,
            path,
            created_at: now,
            updated_at: now,
        }
    }
    
    /// Update the project's modified timestamp
    pub fn touch(&mut self) {
        self.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
    }
}

/// Implementation block for Document
impl Document {
    /// Create a new document with current timestamp
    pub fn new(id: String, project_id: String, path: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        Self {
            id,
            project_id,
            path,
            state: DocumentState::Draft,
            created_at: now,
            updated_at: now,
        }
    }
    
    /// Transition document to a new state
    pub fn transition_to(&mut self, new_state: DocumentState) {
        self.state = new_state;
        self.touch();
    }
    
    /// Update the document's modified timestamp
    pub fn touch(&mut self) {
        self.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
    }
    
    /// Check if document can transition to a given state
    pub fn can_transition_to(&self, target_state: &DocumentState) -> bool {
        match (&self.state, target_state) {
            // Draft can go to any state
            (DocumentState::Draft, _) => true,
            // InReview can go to Published or back to Draft
            (DocumentState::InReview, DocumentState::Published) => true,
            (DocumentState::InReview, DocumentState::Draft) => true,
            // Published can be archived or go back to draft for editing
            (DocumentState::Published, DocumentState::Archived) => true,
            (DocumentState::Published, DocumentState::Draft) => true,
            // Archived can be reactivated to draft
            (DocumentState::Archived, DocumentState::Draft) => true,
            // All other transitions are invalid
            _ => false,
        }
    }
}

/// Implementation for DocumentState
impl DocumentState {
    /// Get all possible next states from the current state
    pub fn possible_transitions(&self) -> Vec<DocumentState> {
        match self {
            DocumentState::Draft => vec![
                DocumentState::InReview,
                DocumentState::Published,
                DocumentState::Archived,
            ],
            DocumentState::InReview => vec![
                DocumentState::Draft,
                DocumentState::Published,
            ],
            DocumentState::Published => vec![
                DocumentState::Draft,
                DocumentState::Archived,
            ],
            DocumentState::Archived => vec![
                DocumentState::Draft,
            ],
        }
    }
    
    /// Get string representation of the state
    pub fn as_str(&self) -> &'static str {
        match self {
            DocumentState::Draft => "draft",
            DocumentState::InReview => "in_review",
            DocumentState::Published => "published",
            DocumentState::Archived => "archived",
        }
    }
    
    /// Create DocumentState from string
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "draft" => Some(DocumentState::Draft),
            "in_review" => Some(DocumentState::InReview),
            "published" => Some(DocumentState::Published),
            "archived" => Some(DocumentState::Archived),
            _ => None,
        }
    }
}
