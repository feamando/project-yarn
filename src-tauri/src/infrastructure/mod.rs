// Infrastructure/Adapter Layer
// This layer contains implementations that interact with external systems,
// databases, file systems, and other infrastructure concerns.

pub mod database;
pub mod filesystem;
pub mod credential_manager;
pub mod db_layer;
pub mod model_manager;
pub mod local_provider;
pub mod bedrock_provider;
pub mod gemini_provider;

// Re-export commonly used types
pub use database::*;
pub use filesystem::*;
pub use credential_manager::*;
pub use db_layer::*;
pub use model_manager::*;
pub use local_provider::*;
pub use bedrock_provider::*;
pub use gemini_provider::*;
