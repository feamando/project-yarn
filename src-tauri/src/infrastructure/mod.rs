// Infrastructure/Adapter Layer
// This layer contains implementations that interact with external systems,
// databases, file systems, and other infrastructure concerns.

pub mod database;
pub mod filesystem;
pub mod credential_manager;
pub mod db_layer;

// Re-export commonly used types
pub use database::*;
pub use filesystem::*;
pub use credential_manager::*;
pub use db_layer::*;
