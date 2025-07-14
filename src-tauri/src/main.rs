// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// Import the Clean Architecture modules
mod core;
mod application;
mod infrastructure;

// Import command handlers
use application::commands::{greet, create_project, get_project, get_autocomplete};
use application::services::{ProjectService, DocumentService, LocalAiService};
use infrastructure::{DatabaseManager, FilesystemManager, CredentialManager};
use std::sync::Arc;

// Initialize tracing for AI service logging
use tracing_subscriber;

fn main() {
    // Initialize tracing for comprehensive logging
    tracing_subscriber::fmt::init();
    
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            create_project,
            get_project,
            get_autocomplete
        ])
        .setup(|app| {
            // Initialize infrastructure managers
            let db_manager = Arc::new(DatabaseManager::new());
            let fs_manager = Arc::new(FilesystemManager::new());
            let credential_manager = Arc::new(CredentialManager::new());
            
            // Initialize services with dependencies
            let project_service = ProjectService::new(db_manager.clone(), fs_manager.clone());
            let document_service = DocumentService::new();
            let ai_service = LocalAiService::new();
            
            // Register all services and managers with Tauri
            app.manage(project_service);
            app.manage(document_service);
            app.manage(ai_service);
            app.manage(db_manager);
            app.manage(fs_manager);
            app.manage(credential_manager);
            
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
