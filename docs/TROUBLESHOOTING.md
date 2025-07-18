# Troubleshooting Guide

This guide helps you resolve common issues when setting up and using Project Yarn.

## 📋 Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Installation Issues](#installation-issues)
- [Model Setup Problems](#model-setup-problems)
- [Build and Runtime Errors](#build-and-runtime-errors)
- [Git and Repository Issues](#git-and-repository-issues)
- [Performance Problems](#performance-problems)
- [Platform-Specific Issues](#platform-specific-issues)
- [Getting Help](#getting-help)

## 🔍 Quick Diagnostics

Before diving into specific issues, run these diagnostic commands:

```bash
# Check system requirements
npm run setup-models -- --check

# Verify installation
npm run verify-setup

# Check git configuration
npm run validate-gitignore

# View system information
node -v && npm -v && rustc --version
```

## 🚨 Installation Issues

### Node.js Version Issues

**Problem**: "Node.js version too old" or compatibility errors

**Solution**:
```bash
# Check current version
node -v

# Install Node.js 18.x or higher
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

**Verification**:
```bash
node -v  # Should show 18.x or higher
npm -v   # Should show 9.x or higher
```

### Rust Installation Problems

**Problem**: "Rust not found" or "cargo command not found"

**Solution**:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows (PowerShell)
Invoke-WebRequest -Uri https://win.rustup.rs/ -OutFile rustup-init.exe
.\rustup-init.exe

# Reload environment
source ~/.cargo/env  # Linux/macOS
# Or restart terminal on Windows
```

**Verification**:
```bash
rustc --version  # Should show 1.70 or higher
cargo --version  # Should show corresponding version
```

### NPM Installation Failures

**Problem**: "npm install" fails with permission or network errors

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Fix permissions (Linux/macOS)
sudo chown -R $(whoami) ~/.npm

# Use different registry if needed
npm install --registry https://registry.npmjs.org/
```

## 🤖 Model Setup Problems

### Model Download Failures

**Problem**: Models fail to download or download is interrupted

**Symptoms**:
- "Download failed" errors
- Partial downloads
- Network timeout errors

**Solutions**:

1. **Check network connection**:
   ```bash
   # Test connectivity
   curl -I https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx
   ```

2. **Retry with different options**:
   ```bash
   # Retry with resume
   npm run setup-models -- --resume
   
   # Use different download method
   npm run setup-models -- --method wget
   ```

3. **Manual download**:
   ```bash
   # Download manually and register
   mkdir -p models
   # Download file to models/ directory
   npm run setup-models -- --register-local models/your-model.onnx
   ```

### Model Verification Failures

**Problem**: "Model verification failed" or checksum mismatch

**Symptoms**:
- SHA256 checksum errors
- Corrupted model files
- Verification timeouts

**Solutions**:

1. **Re-download the model**:
   ```bash
   # Force re-download
   npm run update-models -- --force --model phi-3-mini
   ```

2. **Check file integrity**:
   ```bash
   # Manual checksum verification
   sha256sum models/phi-3-mini-cpu-int4.onnx
   # Compare with expected checksum in models.config.json
   ```

3. **Clear cache and retry**:
   ```bash
   # Clear model cache
   npm run models:clean
   npm run setup-models
   ```

### Insufficient Disk Space

**Problem**: "Not enough disk space" during model download

**Solutions**:

1. **Check available space**:
   ```bash
   df -h .  # Linux/macOS
   dir    # Windows
   ```

2. **Clean up old models**:
   ```bash
   npm run models:clean
   ```

3. **Use different storage location**:
   ```bash
   # Set custom models directory
   export YARN_MODELS_DIR=/path/to/larger/drive/models
   npm run setup-models
   ```

### Memory Issues During Setup

**Problem**: System runs out of memory during model operations

**Solutions**:

1. **Check available memory**:
   ```bash
   free -h  # Linux
   vm_stat  # macOS
   # Task Manager on Windows
   ```

2. **Use smaller models**:
   ```bash
   # Install INT4 instead of FP16
   npm run setup-models -- --variant cpu-int4
   ```

3. **Close other applications**:
   - Close browsers and IDEs
   - Stop unnecessary services
   - Restart system if needed

## 🔨 Build and Runtime Errors

### Tauri Build Failures

**Problem**: "tauri build" or "tauri dev" fails

**Common Errors and Solutions**:

1. **"Could not find Rust"**:
   ```bash
   # Ensure Rust is in PATH
   source ~/.cargo/env
   rustc --version
   ```

2. **"WebView2 not found" (Windows)**:
   ```bash
   # Install WebView2 Runtime
   # Download from Microsoft website
   # Or install via winget
   winget install Microsoft.EdgeWebView2
   ```

3. **"Build dependencies missing"**:
   ```bash
   # Install build essentials
   # Ubuntu/Debian
   sudo apt-get install build-essential libssl-dev pkg-config
   
   # macOS
   xcode-select --install
   
   # Windows
   # Install Visual Studio Build Tools
   ```

4. **"Target directory locked"**:
   ```bash
   # Clean build directory
   rm -rf src-tauri/target
   npm run tauri build --debug
   ```

### Frontend Build Issues

**Problem**: React/Vite build fails

**Solutions**:

1. **TypeScript errors**:
   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit
   
   # Fix type errors in code
   # Update @types packages if needed
   ```

2. **Dependency conflicts**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Memory issues during build**:
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

### Runtime Errors

**Problem**: Application crashes or behaves unexpectedly

**Debugging Steps**:

1. **Check console logs**:
   - Open browser developer tools
   - Look for JavaScript errors
   - Check Tauri console output

2. **Enable debug logging**:
   ```bash
   export YARN_DEBUG=true
   npm run tauri dev
   ```

3. **Check model status**:
   ```bash
   npm run models:status
   npm run verify-models
   ```

## 📁 Git and Repository Issues

### Large Files in Git

**Problem**: "file too large" or push rejected due to large files

**Symptoms**:
- Git push fails with large file errors
- Repository size warnings
- Pre-commit hooks block commits

**Solutions**:

1. **Remove large files from git**:
   ```bash
   # Find large files
   git ls-files | xargs ls -la | sort -k5 -rn | head -10
   
   # Remove from git (keep locally)
   git rm --cached path/to/large/file
   git commit -m "remove large file from git"
   ```

2. **Clean git history**:
   ```bash
   # Remove file from entire history (DANGEROUS)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/large/file' \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Validate .gitignore**:
   ```bash
   npm run validate-gitignore
   npm run setup-git-hooks
   ```

### Git Hooks Issues

**Problem**: Pre-commit hooks fail or don't run

**Solutions**:

1. **Reinstall hooks**:
   ```bash
   npm run setup-git-hooks
   ```

2. **Check hook permissions**:
   ```bash
   # Make hooks executable
   chmod +x .git/hooks/pre-commit
   chmod +x .git/hooks/pre-push
   ```

3. **Bypass hooks temporarily** (if needed):
   ```bash
   git commit --no-verify
   git push --no-verify
   ```

### Repository Corruption

**Problem**: Git repository appears corrupted

**Solutions**:

1. **Check repository integrity**:
   ```bash
   git fsck --full
   ```

2. **Repair repository**:
   ```bash
   git gc --aggressive --prune=now
   ```

3. **Re-clone if necessary**:
   ```bash
   cd ..
   git clone https://github.com/feamando/project-yarn.git project-yarn-new
   # Copy your changes to new clone
   ```

## 🐌 Performance Problems

### Slow Model Loading

**Problem**: Models take too long to load

**Solutions**:

1. **Use faster storage**:
   - Move models to SSD
   - Use NVMe drives if available

2. **Optimize model selection**:
   ```bash
   # Use INT4 models for faster loading
   npm run setup-models -- --variant cpu-int4
   ```

3. **Enable model caching**:
   ```bash
   export YARN_CACHE_MODELS=true
   ```

### High Memory Usage

**Problem**: Application uses too much memory

**Solutions**:

1. **Monitor memory usage**:
   ```bash
   # Check memory usage
   npm run setup-models -- --check
   ```

2. **Use smaller models**:
   ```bash
   # Switch to INT4 variants
   npm run update-models -- --variant cpu-int4
   ```

3. **Optimize system settings**:
   - Close unnecessary applications
   - Increase virtual memory/swap
   - Use memory-efficient OS settings

### Slow Inference

**Problem**: AI model responses are slow

**Solutions**:

1. **Check CPU usage**:
   ```bash
   # Monitor during inference
   htop  # Linux/macOS
   # Task Manager on Windows
   ```

2. **Optimize model settings**:
   ```bash
   # Use optimized model variants
   npm run setup-models -- --variant cpu-optimized
   ```

3. **Hardware considerations**:
   - Use CPUs with AVX2 support
   - Ensure adequate cooling
   - Consider GPU acceleration (future)

## 💻 Platform-Specific Issues

### Windows Issues

**WebView2 Problems**:
```powershell
# Install WebView2 Runtime
winget install Microsoft.EdgeWebView2
```

**PowerShell Execution Policy**:
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Path Issues**:
```powershell
# Add to PATH
$env:PATH += ";C:\Users\YourUser\.cargo\bin"
```

### macOS Issues

**Xcode Command Line Tools**:
```bash
# Install if missing
xcode-select --install
```

**Homebrew Dependencies**:
```bash
# Install missing dependencies
brew install pkg-config openssl
```

**Permission Issues**:
```bash
# Fix npm permissions
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Linux Issues

**Missing Dependencies**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install build-essential libssl-dev pkg-config libgtk-3-dev

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install openssl-devel gtk3-devel
```

**AppImage Issues**:
```bash
# Make AppImage executable
chmod +x project-yarn.AppImage

# Install FUSE if needed
sudo apt-get install fuse
```

## 🔧 Advanced Troubleshooting

### Debug Mode

Enable comprehensive debugging:

```bash
# Enable all debug output
export YARN_DEBUG=true
export YARN_DEBUG_MODELS=true
export YARN_DEBUG_GIT=true
export RUST_LOG=debug

# Run with debug output
npm run tauri dev 2>&1 | tee debug.log
```

### Log Analysis

Check log files for issues:

```bash
# View recent logs
tail -f logs/model-setup.log
tail -f logs/application.log

# Search for errors
grep -i error logs/*.log
grep -i "failed" logs/*.log
```

### System Information Collection

Gather system info for bug reports:

```bash
# Create system report
npm run setup-models -- --system-info > system-report.txt

# Include in bug report:
# - Operating system and version
# - Node.js and npm versions
# - Rust and cargo versions
# - Available memory and disk space
# - Error messages and logs
```

## 🆘 Getting Help

### Before Asking for Help

1. **Search existing issues**: Check [GitHub Issues](https://github.com/feamando/project-yarn/issues)
2. **Try basic troubleshooting**: Run diagnostic commands
3. **Check documentation**: Review README and guides
4. **Gather information**: Collect error messages and system info

### How to Report Issues

1. **Use the issue template**
2. **Include system information**:
   ```bash
   npm run setup-models -- --system-info
   ```
3. **Provide error messages and logs**
4. **Describe steps to reproduce**
5. **Mention what you've already tried**

### Community Support

- **GitHub Discussions**: Ask questions and share solutions
- **GitHub Issues**: Report bugs and request features
- **Discord**: Real-time community chat (coming soon)

### Emergency Procedures

If the application is completely broken:

1. **Backup your work**:
   ```bash
   cp -r projects/ projects-backup/
   ```

2. **Reset to clean state**:
   ```bash
   # Clean everything
   rm -rf node_modules models .git/hooks
   npm install
   npm run setup-models
   npm run setup-git-hooks
   ```

3. **Re-clone repository if needed**:
   ```bash
   git clone https://github.com/feamando/project-yarn.git project-yarn-fresh
   ```

## 📊 Performance Monitoring

### Monitoring Commands

```bash
# Check system resources
npm run setup-models -- --check

# Monitor model performance
npm run verify-models -- --benchmark

# Check repository health
npm run git:validate
```

### Performance Metrics

Track these metrics for optimal performance:
- **Memory usage**: Should be under 80% of available RAM
- **Disk space**: Keep at least 10GB free
- **Model load time**: Should be under 30 seconds
- **Inference speed**: Varies by model and hardware

---

If you can't find a solution here, please check our [GitHub Issues](https://github.com/feamando/project-yarn/issues) or create a new issue with detailed information about your problem.
