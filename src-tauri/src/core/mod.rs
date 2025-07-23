// Core/Domain Layer
// This layer contains the business logic and domain entities.
// It has no external dependencies and represents the core business rules.

pub mod entities;
pub mod value_objects;
pub mod local_ai_engine;
pub mod transitions;

// Re-export commonly used types
pub use entities::*;
pub use value_objects::*;
pub use local_ai_engine::*;
pub use transitions::*;
