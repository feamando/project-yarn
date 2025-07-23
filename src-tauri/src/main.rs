// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// Import the Clean Architecture modules
mod core;
mod application;
mod infrastructure;

// Import command handlers
use application::commands::{greet, create_project, get_project, get_autocomplete};
use application::model_commands::{
    initialize_model_manager, download_model, is_model_ready, get_model_info,
    list_available_models, verify_model, remove_model, get_cache_info,
    clear_model_cache, get_model_path
};

// Import AI credential management commands
use application::ai_credential_commands::{
    set_bedrock_credentials, validate_bedrock_credentials,
    set_gemini_credentials, validate_gemini_credentials,
    select_active_provider, list_ai_providers, get_active_provider_info
};

// Import hybrid RAG commands
use commands::hybrid_rag::{
    retrieve_context, test_hybrid_rag, get_hybrid_rag_config,
    validate_hybrid_rag_config, get_hybrid_rag_stats
};

// Import updater commands
use commands::updater::{
    check_for_updates, install_update, get_app_version, restart_app
};

// Import AI provider manager
use application::ai_provider_manager::initialize_ai_provider_manager;

// Import model versioning commands
mod commands;
use commands::model_versioning::{
    check_model_updates, update_model, rollback_model, get_model_version_history,
    list_installed_models, get_model_registry, enable_auto_updates,
    ModelVersioningConfig
};

// Import models module
mod models;
use application::services::{ProjectService, DocumentService, LocalAiService};
use infrastructure::{DatabaseManager, FilesystemManager, CredentialManager};
use infrastructure::db_layer::DatabaseConnection;
use std::sync::Arc;

// Initialize tracing for AI service logging
use tracing_subscriber;

fn main() {
    // Initialize tracing for comprehensive logging
    tracing_subscriber::fmt::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_project,
            get_project,
            get_autocomplete,
            // Model management commands
            download_model,
            is_model_ready,
            get_model_info,
            list_available_models,
            verify_model,
            remove_model,
            get_cache_info,
            clear_model_cache,
            get_model_path,
            // Model versioning commands
            check_model_updates,
            update_model,
            rollback_model,
            get_model_version_history,
            list_installed_models,
            get_model_registry,
            enable_auto_updates,
            // AI credential management commands
            set_bedrock_credentials,
            validate_bedrock_credentials,
            set_gemini_credentials,
            validate_gemini_credentials,
            select_active_provider,
            list_ai_providers,
            get_active_provider_info,
            // Hybrid RAG commands
            retrieve_context,
            test_hybrid_rag,
            get_hybrid_rag_config,
            validate_hybrid_rag_config,
            get_hybrid_rag_stats,
            // Updater commands
            check_for_updates,
            install_update,
            get_app_version,
            restart_app
        ])
        .setup(|app| {
            // Initialize infrastructure managers
            let db_manager = Arc::new(DatabaseManager::new());
            let fs_manager = Arc::new(FilesystemManager::new());
            let credential_manager = Arc::new(CredentialManager::new());
            
            // Initialize database connection for hybrid RAG
            let db_path = "project_yarn.db"; // In production, this should be configurable
            let db_connection = DatabaseConnection::new(db_path)
                .expect("Failed to create database connection");
            
            // Run database migrations
            use infrastructure::db_layer::MigrationManager;
            let migration_manager = MigrationManager::new(&db_connection);
            if let Err(e) = migration_manager.migrate() {
                eprintln!("Failed to run database migrations: {}", e);
            }
            
            // Initialize services with dependencies
            let project_service = ProjectService::new(db_manager.clone(), fs_manager.clone());
            let document_service = DocumentService::new();
            let ai_service = LocalAiService::new();
            
            // Initialize and register model manager
            if let Err(e) = initialize_model_manager(app) {
                eprintln!("Failed to initialize model manager: {}", e);
            }
            
            // Initialize AI provider manager
            if let Err(e) = initialize_ai_provider_manager(app) {
                eprintln!("Failed to initialize AI provider manager: {}", e);
            }
            
            // Initialize model versioning configuration
            let models_dir = std::env::current_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."))
                .join("models")
                .to_string_lossy()
                .to_string();
            
            let app_version = env!("CARGO_PKG_VERSION").to_string();
            let versioning_config = ModelVersioningConfig {
                models_dir,
                app_version,
            };
            
            // Register all services and managers with Tauri
            app.manage(project_service);
            app.manage(document_service);
            app.manage(ai_service);
            app.manage(db_manager);
            app.manage(fs_manager);
            app.manage(credential_manager);
            app.manage(versioning_config);
            app.manage(db_connection);
            
            Ok(())
        })
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
