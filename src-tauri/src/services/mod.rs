// Services Layer
// This layer contains business logic and service implementations
// that coordinate between the domain layer and infrastructure layer.

pub mod database_optimization_service;
pub mod ai_blocks_service;

// Re-export commonly used types
pub use database_optimization_service::*;
pub use ai_blocks_service::*;
