# Advanced Model Setup Guide

This guide provides detailed information about setting up and configuring AI models for Project Yarn development and deployment.

## 📋 Table of Contents

- [Model Architecture Overview](#model-architecture-overview)
- [Supported Models](#supported-models)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Performance Optimization](#performance-optimization)
- [Custom Model Integration](#custom-model-integration)
- [Troubleshooting](#troubleshooting)

## 🏗️ Model Architecture Overview

Project Yarn uses a hybrid model management system:

```
┌─────────────────────────────────────────────────────────────┐
│                    Project Yarn Architecture                │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React/TypeScript)                               │
│  ├── Model Status UI                                       │
│  ├── Download Progress                                      │
│  └── Configuration Interface                               │
├─────────────────────────────────────────────────────────────┤
│  Backend (Rust/Tauri)                                      │
│  ├── ModelAssetManager                                     │
│  ├── Model Commands                                        │
│  └── Cache Management                                       │
├─────────────────────────────────────────────────────────────┤
│  Model Layer                                               │
│  ├── ONNX Runtime                                          │
│  ├── Model Cache                                           │
│  └── Inference Engine                                      │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                             │
│  ├── Local Model Files                                     │
│  ├── Configuration Files                                   │
│  └── Verification Data                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🤖 Supported Models

### Microsoft Phi-3 Mini Family

#### Phi-3 Mini 4K Instruct
- **Context Length**: 4,096 tokens
- **Parameters**: 3.8B
- **Use Case**: General text completion, code assistance
- **Variants**:
  - `cpu-int4`: 2GB, fastest inference
  - `cpu-fp16`: 7GB, highest quality

#### Phi-3 Mini 128K Instruct
- **Context Length**: 128,000 tokens
- **Parameters**: 3.8B
- **Use Case**: Long document processing, extended context
- **Variants**:
  - `cpu-int4`: 2GB, optimized for long context

### Model Specifications

| Model | Variant | Size | RAM Required | Inference Speed | Quality |
|-------|---------|------|--------------|-----------------|---------|
| Phi-3 Mini | cpu-int4 | 2GB | 4GB | Fast | Good |
| Phi-3 Mini | cpu-fp16 | 7GB | 8GB | Medium | Excellent |
| Phi-3 Mini 128K | cpu-int4 | 2GB | 6GB | Fast | Good |

## 🔧 Installation Methods

### Method 1: Interactive Setup (Recommended)

```bash
npm run setup-models
```

This launches an interactive CLI that guides you through:
1. System requirements check
2. Model selection
3. Download with progress tracking
4. Automatic verification
5. Configuration setup

### Method 2: Automated Installation

```bash
# Install all recommended models
npm run models:install

# Install specific model
node scripts/setup-models.js --model phi-3-mini --variant cpu-int4
```

### Method 3: Manual Configuration

1. **Create model directory**:
   ```bash
   mkdir -p models
   ```

2. **Download model manually**:
   ```bash
   # Example for Phi-3 Mini INT4
   curl -L -o models/phi-3-mini-cpu-int4.onnx \
     "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/phi3-mini-4k-instruct-cpu-int4-rtn-block-32-acc-level-4.onnx"
   ```

3. **Update configuration**:
   ```bash
   node scripts/setup-models.js --register-local models/phi-3-mini-cpu-int4.onnx
   ```

## ⚙️ Configuration

### Model Configuration File

The `models.config.json` file defines available models:

```json
{
  "models": {
    "phi-3-mini": {
      "id": "phi-3-mini",
      "name": "Microsoft Phi-3 Mini",
      "version": "1.0.0",
      "variants": {
        "cpu-int4": {
          "url": "https://huggingface.co/...",
          "size": 2147483648,
          "checksum": "sha256-hash",
          "requirements": {
            "ram": 4,
            "disk": 3,
            "cpu": "x86_64"
          }
        }
      },
      "defaultVariant": "cpu-int4"
    }
  }
}
```

### Local Model Status

The `local-models.json` file tracks installed models:

```json
{
  "installed": {
    "phi-3-mini-cpu-int4": {
      "installedAt": "2024-01-01T00:00:00.000Z",
      "version": "1.0.0",
      "path": "./models/phi-3-mini-cpu-int4.onnx",
      "size": 2147483648,
      "verified": true,
      "lastUsed": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Environment Variables

```bash
# Model cache directory (default: ./models)
YARN_MODELS_DIR=/path/to/models

# Maximum concurrent downloads (default: 2)
YARN_MAX_DOWNLOADS=3

# Enable debug logging
YARN_DEBUG_MODELS=true

# Custom model registry URL
YARN_MODEL_REGISTRY=https://custom-registry.com/models.json
```

## 🚀 Performance Optimization

### System Optimization

#### Memory Management
```bash
# Check available memory
npm run setup-models -- --check

# Monitor memory usage during inference
htop  # Linux/macOS
taskmgr  # Windows
```

#### CPU Optimization
- **Intel CPUs**: Enable AVX2 instructions
- **AMD CPUs**: Ensure latest microcode
- **ARM CPUs**: Use ARM64-optimized builds

#### Storage Optimization
```bash
# Use SSD for model storage
export YARN_MODELS_DIR=/path/to/ssd/models

# Enable compression for model cache
export YARN_COMPRESS_CACHE=true
```

### Model Selection Guidelines

#### For Development
- Use `cpu-int4` variants for faster iteration
- Smaller models for quick testing
- Local models to avoid network dependency

#### For Production
- Use `cpu-fp16` for best quality
- Consider model size vs. memory constraints
- Implement model caching strategies

#### For CI/CD
- Use smallest compatible models
- Cache models between builds
- Verify models before deployment

## 🔌 Custom Model Integration

### Adding New Models

1. **Update model configuration**:
   ```json
   {
     "models": {
       "custom-model": {
         "id": "custom-model",
         "name": "Custom Model",
         "version": "1.0.0",
         "variants": {
           "default": {
             "url": "https://example.com/model.onnx",
             "size": 1000000000,
             "checksum": "sha256-hash"
           }
         }
       }
     }
   }
   ```

2. **Test the model**:
   ```bash
   node scripts/setup-models.js --model custom-model
   npm run verify-models
   ```

3. **Update Rust backend** (if needed):
   ```rust
   // src-tauri/src/infrastructure/model_manager.rs
   pub fn load_custom_model(&self, model_id: &str) -> Result<()> {
       // Custom model loading logic
   }
   ```

### Model Format Support

Currently supported formats:
- **ONNX** (.onnx) - Primary format
- **SafeTensors** (.safetensors) - Experimental
- **PyTorch** (.pt, .pth) - Planned
- **TensorFlow** (.pb) - Planned

### Custom Model Requirements

- **Format**: ONNX format preferred
- **Input**: Text tokenization compatible
- **Output**: Logits or probability distributions
- **Size**: Under 10GB for practical use
- **License**: Compatible with project license

## 🛠️ Advanced Configuration

### Model Variants

Create custom variants for different use cases:

```json
{
  "variants": {
    "cpu-optimized": {
      "url": "https://example.com/model-cpu.onnx",
      "requirements": {
        "ram": 4,
        "cpu": "x86_64",
        "features": ["avx2"]
      }
    },
    "gpu-accelerated": {
      "url": "https://example.com/model-gpu.onnx",
      "requirements": {
        "ram": 8,
        "gpu": "cuda",
        "vram": 4
      }
    }
  }
}
```

### Batch Processing

Configure models for batch inference:

```bash
# Set batch size for inference
export YARN_BATCH_SIZE=4

# Enable batch processing
export YARN_ENABLE_BATCHING=true
```

### Model Quantization

Support for different quantization levels:

- **INT4**: 4-bit quantization, smallest size
- **INT8**: 8-bit quantization, balanced
- **FP16**: 16-bit floating point, high quality
- **FP32**: 32-bit floating point, best quality

## 📊 Monitoring and Metrics

### Model Performance Metrics

```bash
# Generate performance report
npm run verify-models -- --report

# Monitor inference speed
npm run benchmark-models
```

### Health Checks

```bash
# Basic health check
npm run models:check

# Comprehensive validation
npm run git:validate

# System resource check
npm run setup-models -- --check
```

### Logging

Model operations are logged to:
- `./logs/model-setup.log` - Setup operations
- `./logs/model-verification.log` - Verification results
- `./logs/model-inference.log` - Runtime inference logs

## 🔄 Model Updates and Versioning

### Automatic Updates

```bash
# Check for updates
npm run update-models -- --check

# Update all models
npm run update-models -- --update-all

# Update specific model
npm run update-models -- --model phi-3-mini
```

### Version Management

Models use semantic versioning:
- **Major**: Breaking changes in model architecture
- **Minor**: New features or improvements
- **Patch**: Bug fixes and optimizations

### Rollback Procedures

```bash
# Backup current models
npm run update-models -- --backup

# Rollback to previous version
npm run update-models -- --rollback

# Restore from backup
npm run update-models -- --restore
```

## 🔐 Security Considerations

### Model Verification

All models are verified using:
- **SHA256 checksums** - Integrity verification
- **Digital signatures** - Authenticity verification (planned)
- **Sandboxed execution** - Isolated model runtime

### Safe Downloads

- **HTTPS only** - Encrypted downloads
- **Trusted sources** - Microsoft, HuggingFace
- **Retry logic** - Handles network interruptions
- **Partial downloads** - Resume interrupted downloads

### Privacy Protection

- **Local inference** - No data sent to external services
- **Model isolation** - Sandboxed model execution
- **Data encryption** - Encrypted model cache (optional)

## 📈 Scaling Considerations

### Multi-Model Support

```bash
# Install multiple models
npm run models:install -- --all

# Load balance between models
export YARN_LOAD_BALANCE=true
```

### Distributed Deployment

For large-scale deployments:
- Use CDN for model distribution
- Implement model caching layers
- Consider model sharding for large models

### Resource Management

```bash
# Set resource limits
export YARN_MAX_MEMORY=8GB
export YARN_MAX_DISK=50GB
export YARN_MAX_MODELS=5
```

## 🧪 Testing Models

### Unit Tests

```bash
# Test model loading
cargo test model_loading

# Test inference
cargo test model_inference

# Test model management
npm test -- model
```

### Integration Tests

```bash
# End-to-end model test
npm run test:e2e:models

# Performance benchmarks
npm run benchmark:models
```

### Validation Scripts

```bash
# Validate model configuration
npm run validate-models

# Test model compatibility
npm run test-model-compatibility
```

## 📚 Additional Resources

### Documentation
- [ONNX Runtime Documentation](https://onnxruntime.ai/)
- [Microsoft Phi-3 Models](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct)
- [Tauri Model Integration](https://tauri.app/)

### Community
- [Project Yarn Discussions](https://github.com/feamando/project-yarn/discussions)
- [Model Issues](https://github.com/feamando/project-yarn/issues?q=label%3Amodel)

### Support
- Check existing issues before reporting
- Include system information and logs
- Provide steps to reproduce problems

---

This guide covers advanced model setup scenarios. For basic setup, see the main [CONTRIBUTING.md](../CONTRIBUTING.md) file.
