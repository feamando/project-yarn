# Project Yarn Model Management Scripts

This directory contains Node.js scripts for managing AI models used by Project Yarn. These scripts handle downloading, verifying, updating, and managing AI models while keeping them separate from the git repository.

## Overview

The model management system consists of three main scripts:

- **`setup-models.js`** - Download and install AI models
- **`verify-models.js`** - Verify model integrity and system compatibility
- **`update-models.js`** - Update models to newer versions and manage model lifecycle

## Quick Start

### 1. Install All Recommended Models
```bash
npm run setup-models
# or
npm run models:install
```

### 2. Verify Installation
```bash
npm run verify-models
# or
npm run models:check
```

### 3. Check Status
```bash
npm run models:status
```

## Detailed Usage

### Setup Models (`setup-models.js`)

Interactive model installation and management.

**Interactive Mode:**
```bash
npm run setup-models
```

**Command Line Options:**
```bash
# Install all recommended models
npm run setup-models -- --install-all

# Check system requirements
npm run setup-models -- --check

# Show installation status
npm run setup-models -- --status

# Show help
npm run setup-models -- --help
```

**Features:**
- ✅ Cross-platform compatibility (Windows, macOS, Linux)
- ✅ System requirements checking (RAM, disk space, Node.js version)
- ✅ Progress tracking with download speed
- ✅ Automatic retry on network failures
- ✅ SHA256 checksum verification
- ✅ Interactive CLI for model selection
- ✅ Fallback mechanisms for download failures

### Verify Models (`verify-models.js`)

Verify installed models for integrity and compatibility.

**Basic Verification:**
```bash
npm run verify-models
```

**Command Line Options:**
```bash
# Generate detailed JSON report
npm run verify-models -- --report

# Quiet mode (minimal output)
npm run verify-models -- --quiet

# Show help
npm run verify-models -- --help
```

**Verification Checks:**
- ✅ File existence and accessibility
- ✅ File size validation
- ✅ SHA256 checksum verification
- ✅ Basic model structure validation
- ✅ System compatibility checks
- ✅ Model loading capability tests

### Update Models (`update-models.js`)

Update models to newer versions and manage model lifecycle.

**Interactive Mode:**
```bash
npm run update-models
```

**Command Line Options:**
```bash
# Check for available updates
npm run update-models -- --check

# Update all models
npm run update-models -- --update-all

# Force update (even if versions match)
npm run update-models -- --update-all --force

# Clean up old model versions
npm run update-models -- --cleanup
# or
npm run models:clean

# Refresh model registry
npm run update-models -- --refresh

# Show help
npm run update-models -- --help
```

**Update Features:**
- ✅ Version comparison and update detection
- ✅ Automatic backup before updates
- ✅ Rollback on update failure
- ✅ New model discovery and installation
- ✅ Old version cleanup
- ✅ Model registry refresh

## Configuration Files

### `models.config.json`
Main configuration file defining available models, download URLs, and system requirements.

```json
{
  "models": {
    "phi-3-mini": {
      "id": "phi-3-mini",
      "name": "Microsoft Phi-3 Mini",
      "version": "1.0.0",
      "variants": {
        "cpu-int4": {
          "url": "https://...",
          "size": 2147483648,
          "checksum": "sha256-hash",
          "requirements": {
            "ram": 4,
            "disk": 3
          }
        }
      }
    }
  }
}
```

### `local-models.json`
Tracks locally installed models and their status.

```json
{
  "installed": {
    "phi-3-mini-cpu-int4": {
      "installedAt": "2024-01-01T00:00:00.000Z",
      "version": "1.0.0",
      "path": "./models/phi-3-mini-cpu-int4.onnx",
      "size": 2147483648
    }
  }
}
```

## NPM Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `setup-models` | `node scripts/setup-models.js` | Interactive model setup |
| `verify-models` | `node scripts/verify-models.js` | Verify model integrity |
| `update-models` | `node scripts/update-models.js` | Update models |
| `models:install` | `setup-models.js --install-all` | Install all models |
| `models:check` | `verify-models.js --quiet` | Quick verification |
| `models:status` | `setup-models.js --status` | Show status |
| `models:clean` | `update-models.js --cleanup` | Clean old versions |
| `verify-setup` | Combined verification | Full setup verification |

## System Requirements

### Minimum Requirements
- **Node.js**: 16.x or higher
- **RAM**: 4GB available
- **Disk Space**: 10GB free space
- **Network**: Stable internet connection for downloads

### Recommended Requirements
- **Node.js**: 18.x or higher
- **RAM**: 8GB or more
- **Disk Space**: 20GB free space
- **Network**: High-speed internet for faster downloads

## Troubleshooting

### Common Issues

**1. Download Failures**
```bash
# Check network connection
npm run setup-models -- --check

# Retry with force flag
npm run setup-models -- --install-all
```

**2. Checksum Verification Failures**
```bash
# Re-download the model
npm run update-models -- --update-all --force

# Verify after re-download
npm run verify-models
```

**3. Insufficient Disk Space**
```bash
# Clean up old versions
npm run models:clean

# Check current usage
npm run models:status
```

**4. Permission Issues (Linux/macOS)**
```bash
# Ensure scripts are executable
chmod +x scripts/*.js

# Run with proper permissions
sudo npm run setup-models
```

### Error Codes

| Exit Code | Description |
|-----------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Network error |
| 3 | Verification failure |
| 4 | Insufficient resources |

### Log Files

Scripts generate logs in the following locations:
- **Setup logs**: `./logs/setup-models.log`
- **Verification reports**: `./model-verification-report.json`
- **Update logs**: `./logs/update-models.log`

## Integration with Project Yarn

### Rust Backend Integration
The scripts work in conjunction with the Rust `ModelAssetManager` to provide seamless model management:

```rust
// Rust side - ModelAssetManager
let manager = ModelAssetManager::new(cache_dir)?;
let model_path = manager.get_model_path("phi-3-mini")?;
```

### Frontend Integration
The frontend can check model status and trigger downloads:

```typescript
// Frontend - Check model status
const isReady = await invoke('is_model_ready', { modelId: 'phi-3-mini' });

// Download model if needed
if (!isReady) {
  await invoke('download_model', { modelId: 'phi-3-mini' });
}
```

## Development

### Adding New Models

1. Update `models.config.json` with new model definition
2. Test download and verification
3. Update documentation

### Extending Scripts

The scripts are modular and can be extended:

```javascript
const { ModelManager, Logger } = require('./setup-models.js');

// Custom model management logic
const customManager = new ModelManager();
await customManager.initialize();
```

## Security Considerations

- ✅ SHA256 checksum verification for all downloads
- ✅ HTTPS-only download URLs
- ✅ No execution of downloaded model files
- ✅ Sandboxed model storage directory
- ✅ Input validation for all user inputs

## Performance Optimization

- ✅ Concurrent downloads (configurable limit)
- ✅ Resume interrupted downloads
- ✅ Efficient disk space usage
- ✅ Progress reporting and caching
- ✅ Automatic cleanup of temporary files

## Contributing

When contributing to the model management system:

1. Test all scripts on multiple platforms
2. Update documentation for new features
3. Ensure backward compatibility
4. Add appropriate error handling
5. Follow the existing code style

## License

These scripts are part of Project Yarn and follow the same license terms.
