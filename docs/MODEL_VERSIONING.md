# Model Versioning System

The Model Versioning System provides comprehensive management of AI model versions, updates, and rollbacks for Project Yarn. This system ensures reliable model lifecycle management with semantic versioning, compatibility checking, and automated update notifications.

## Overview

The model versioning system consists of several components:

- **Rust Backend**: Core versioning logic with `ModelUpdateManager`
- **JavaScript CLI**: Command-line interface for model management
- **Tauri Commands**: Frontend-backend integration
- **React Frontend**: User interface for model versioning
- **Configuration System**: Registry and local state management

## Features

### ✅ Semantic Versioning
- **Version Format**: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- **Update Types**: Major, Minor, Patch, Security
- **Breaking Changes**: Automatic detection for major version updates
- **Compatibility**: App version compatibility checking

### ✅ Model Registry
- **Centralized Registry**: JSON-based model registry with version metadata
- **Model Information**: Name, description, versions, compatibility, checksums
- **Version History**: Complete changelog and release information
- **Deprecation Support**: Mark old versions as deprecated

### ✅ Update Management
- **Update Detection**: Automatic checking for available updates
- **Compatibility Validation**: Ensures updates are compatible with app version
- **Progress Tracking**: Download progress and status reporting
- **Rollback Support**: Safe rollback to previous versions

### ✅ Local State Management
- **Installation Tracking**: Track installed models and versions
- **Usage Statistics**: Last used timestamps and access patterns
- **Auto-update Settings**: Configurable automatic update preferences
- **Backup Management**: Automatic backup creation before updates

## Architecture

### Rust Backend (`src-tauri/src/models/versioning.rs`)

```rust
pub struct ModelUpdateManager {
    registry_path: String,
    local_state_path: String,
    models_dir: String,
    app_version: String,
}

// Key methods:
impl ModelUpdateManager {
    pub async fn check_for_updates(&self) -> Result<Vec<ModelUpdate>, VersioningError>
    pub async fn update_model(&self, model_id: &str) -> Result<(), VersioningError>
    pub async fn rollback_model(&self, model_id: &str, target_version: Option<String>) -> Result<(), VersioningError>
    pub async fn get_version_history(&self, model_id: &str) -> Result<Vec<ModelVersion>, VersioningError>
}
```

### JavaScript CLI (`scripts/model-versioning.js`)

```bash
# Check for available updates
npm run models:version-check

# Update a specific model
npm run models:version-update <model-id> [version]

# Rollback to previous version
npm run models:version-rollback <model-id> [version]

# View version history
npm run models:version-history <model-id>

# List installed models
npm run models:version-list

# Clean up old backups
npm run models:version-cleanup [keep-count]
```

### Tauri Commands (`src-tauri/src/commands/model_versioning.rs`)

```rust
// Available Tauri commands for frontend integration:
- check_model_updates() -> UpdateCheckResult
- update_model(request: ModelUpdateRequest) -> String
- rollback_model(request: ModelRollbackRequest) -> String
- get_model_version_history(model_id: String) -> Vec<ModelVersion>
- list_installed_models() -> Vec<InstalledModel>
- get_model_registry() -> serde_json::Value
- enable_auto_updates(enabled: bool) -> String
```

### React Frontend (`src/components/ModelVersioning.tsx`)

The frontend provides a comprehensive UI with:
- **Update Dashboard**: View available updates with changelog
- **Installed Models**: Manage currently installed models
- **Version History**: Browse version history and changes
- **Auto-update Settings**: Configure automatic update preferences

## Configuration Files

### Model Registry (`models/registry.json`)

```json
{
  "models": {
    "phi-3-mini": {
      "model_id": "phi-3-mini",
      "name": "Phi-3 Mini",
      "description": "Microsoft Phi-3 Mini language model",
      "current_version": "1.0.0",
      "versions": {
        "1.0.0": {
          "model_id": "phi-3-mini",
          "version": "1.0.0",
          "checksum": "sha256:...",
          "download_url": "https://...",
          "size_bytes": 2147483648,
          "compatibility": [">=1.0.0"],
          "release_date": "2024-01-01T00:00:00Z",
          "changelog": "Initial release",
          "deprecated": false,
          "minimum_ram_gb": 4,
          "recommended_ram_gb": 8,
          "variant": "cpu-int4"
        }
      },
      "tags": ["language-model", "microsoft", "phi-3"],
      "category": "language-model"
    }
  },
  "registry_version": "1.0.0",
  "last_updated": "2024-01-01T00:00:00Z"
}
```

### Local State (`models/local-state.json`)

```json
{
  "installed_models": {
    "phi-3-mini": {
      "model_id": "phi-3-mini",
      "version": "1.0.0",
      "installed_at": "2024-01-01T00:00:00Z",
      "last_used": "2024-01-01T00:00:00Z",
      "file_path": "./models/phi-3-mini-1.0.0.onnx",
      "checksum": "sha256:...",
      "size_bytes": 2147483648
    }
  },
  "last_check": "2024-01-01T00:00:00Z",
  "auto_update_enabled": false
}
```

## Usage Examples

### CLI Usage

```bash
# Check for updates
$ npm run models:version-check
🔍 Checking for model updates...
📋 Found 1 available updates:
  • phi-3-mini: 1.0.0 → 1.1.0 (minor)

# Update a model
$ npm run models:version-update phi-3-mini
🔄 Updating model: phi-3-mini
📦 Creating backup of phi-3-mini@1.0.0
⬇️  Downloading phi-3-mini@1.1.0...
🔐 Verifying checksum...
✅ Successfully updated phi-3-mini to version 1.1.0

# Rollback a model
$ npm run models:version-rollback phi-3-mini
⏪ Rolling back model: phi-3-mini
📦 Restoring from backup: 1.0.0
✅ Successfully rolled back phi-3-mini to version 1.0.0
```

### Frontend Usage

The React frontend provides an intuitive interface for:

1. **Checking Updates**: View available updates with changelogs
2. **Managing Models**: Update, rollback, and configure models
3. **Version History**: Browse complete version history
4. **Auto-updates**: Enable/disable automatic updates

## Security Features

### ✅ Checksum Verification
- **SHA256 Checksums**: All model files verified with SHA256 hashes
- **Integrity Checks**: Automatic verification during download and installation
- **Corruption Detection**: Failed checksums trigger re-download

### ✅ Compatibility Validation
- **Version Constraints**: Semantic version range checking
- **App Compatibility**: Ensures model versions work with current app
- **Breaking Change Detection**: Warns about potentially breaking updates

### ✅ Backup Management
- **Automatic Backups**: Creates backups before updates
- **Rollback Safety**: Safe rollback to previous working versions
- **Storage Management**: Configurable backup retention policies

## Error Handling

The system provides comprehensive error handling for:

- **Network Failures**: Retry logic and fallback mechanisms
- **Checksum Mismatches**: Automatic re-download and verification
- **Compatibility Issues**: Clear error messages for incompatible versions
- **Storage Errors**: Graceful handling of disk space and permission issues

## Performance Optimizations

### ✅ Caching Strategy
- **Local Registry Cache**: Cached model registry for offline access
- **Incremental Updates**: Only download changed components when possible
- **Compression**: Efficient storage and transfer of model data

### ✅ Background Operations
- **Async Downloads**: Non-blocking model downloads
- **Progress Reporting**: Real-time download progress updates
- **Batch Operations**: Efficient handling of multiple model operations

## Integration with CI/CD

The model versioning system integrates with the CI/CD pipeline:

- **Automated Testing**: Version compatibility testing in CI
- **Cache Management**: Efficient model caching in CI environments
- **Registry Updates**: Automated registry updates for new releases
- **Validation**: Comprehensive validation of model versions and compatibility

## Troubleshooting

### Common Issues

1. **Update Failures**: Check network connectivity and disk space
2. **Checksum Errors**: Verify download integrity and retry
3. **Compatibility Issues**: Check app version requirements
4. **Permission Errors**: Ensure proper file system permissions

### Debug Commands

```bash
# Validate model registry
npm run models:version-check --verbose

# Check local state
npm run models:version-list --detailed

# Clean up corrupted state
npm run models:version-cleanup --force
```

## Future Enhancements

Planned improvements for the model versioning system:

- **Delta Updates**: Incremental model updates to reduce bandwidth
- **Model Variants**: Support for different model variants (CPU, GPU, quantized)
- **Registry Mirroring**: Multiple registry sources for reliability
- **Advanced Scheduling**: Scheduled updates and maintenance windows
- **Metrics Collection**: Usage analytics and performance metrics

## Conclusion

The Model Versioning System provides a robust, scalable foundation for managing AI model lifecycles in Project Yarn. With comprehensive version tracking, automated updates, and safe rollback capabilities, it ensures reliable model management while maintaining system stability and security.

For more information, see:
- [Model Setup Guide](MODEL_SETUP.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [CI/CD Documentation](CI_CD.md)
