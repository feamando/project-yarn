# Update Pipeline Documentation

This document describes the automated update pipeline for Project Yarn, which generates cryptographically signed update artifacts and publishes them for auto-update functionality.

## Overview

The update pipeline is implemented using GitHub Actions and consists of several stages:

1. **Release Creation**: Creates a GitHub release with generated release notes
2. **Multi-Platform Build**: Builds and signs Tauri applications for all supported platforms
3. **Update Artifact Generation**: Creates the `latest.json` manifest file with signatures
4. **Release Publishing**: Publishes the release and makes it available for auto-updates

## Workflow Files

### `.github/workflows/release.yml`
The main release pipeline that:
- Triggers on version tags (`v*`) or manual workflow dispatch
- Builds for Windows, macOS (Intel & Apple Silicon), and Linux
- Generates cryptographically signed update artifacts
- Creates and uploads the `latest.json` manifest
- Publishes the release

### `.github/workflows/build-and-test.yml`
Development workflow that:
- Runs on push/PR to main/develop branches
- Tests Rust backend and React frontend
- Performs security audits
- Creates development builds for testing

## Supported Platforms

| Platform | Architecture | Output Format | Auto-Update Support |
|----------|-------------|---------------|-------------------|
| Windows | x64 | `.msi` | ✅ |
| macOS | Intel (x64) | `.dmg` / `.app.tar.gz` | ✅ |
| macOS | Apple Silicon (ARM64) | `.dmg` / `.app.tar.gz` | ✅ |
| Linux | x64 | `.deb` / `.AppImage` | ✅ |

## Setup Instructions

### 1. Generate Signing Keys

Run the key generation script:
```bash
chmod +x scripts/generate-signing-key.sh
./scripts/generate-signing-key.sh
```

This will:
- Generate an Ed25519 key pair for signing updates
- Update `tauri.conf.json` with the public key
- Provide the private key for GitHub Actions secrets

### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `TAURI_PRIVATE_KEY` | Base64-encoded private key for signing | ✅ |
| `TAURI_KEY_PASSWORD` | Password for the private key (if set) | Optional |

### 3. Update Configuration

Ensure your `tauri.conf.json` includes the updater configuration:

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/project-yarn/project-yarn/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

## Release Process

### Automatic Release (Recommended)

1. **Create and push a version tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Monitor the workflow:**
   - Go to GitHub Actions tab
   - Watch the "Release and Update Pipeline" workflow
   - Verify all jobs complete successfully

3. **Verify the release:**
   - Check the GitHub Releases page
   - Ensure `latest.json` is uploaded
   - Test auto-update functionality

### Manual Release

1. **Go to GitHub Actions tab**
2. **Select "Release and Update Pipeline"**
3. **Click "Run workflow"**
4. **Enter the version (e.g., v1.0.0)**
5. **Click "Run workflow"**

## Update Manifest Structure

The `latest.json` file contains update information for all platforms:

```json
{
  "version": "v1.0.0",
  "notes": "Release notes",
  "pub_date": "2024-01-01T00:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "SIGNATURE_HERE",
      "url": "https://github.com/project-yarn/project-yarn/releases/download/v1.0.0/Project-Yarn_v1.0.0_x64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "SIGNATURE_HERE", 
      "url": "https://github.com/project-yarn/project-yarn/releases/download/v1.0.0/Project-Yarn_v1.0.0_aarch64.app.tar.gz"
    },
    "linux-x86_64": {
      "signature": "SIGNATURE_HERE",
      "url": "https://github.com/project-yarn/project-yarn/releases/download/v1.0.0/project-yarn_v1.0.0_amd64.AppImage.tar.gz"
    },
    "windows-x86_64": {
      "signature": "SIGNATURE_HERE",
      "url": "https://github.com/project-yarn/project-yarn/releases/download/v1.0.0/Project-Yarn_v1.0.0_x64_en-US.msi.zip"
    }
  }
}
```

## Security Considerations

### Cryptographic Signing
- All update artifacts are signed using Ed25519 cryptography
- Signatures are verified by the Tauri updater before installation
- Private keys are stored securely in GitHub Actions secrets

### Secure Distribution
- Updates are distributed via HTTPS from GitHub Releases
- Manifest files include cryptographic signatures for verification
- No unsigned updates can be installed

### Key Management
- Private keys should never be committed to version control
- Use strong, unique passwords for key encryption (optional)
- Rotate keys periodically for enhanced security

## Troubleshooting

### Common Issues

**Build Failures:**
- Check platform-specific dependencies are installed
- Verify Rust toolchain is properly configured
- Ensure Node.js dependencies are up to date

**Signing Failures:**
- Verify `TAURI_PRIVATE_KEY` secret is correctly set
- Check that the public key in `tauri.conf.json` matches
- Ensure key format is correct (base64-encoded)

**Update Detection Issues:**
- Verify the updater endpoint URL is correct
- Check that `latest.json` is accessible and valid
- Ensure version numbers follow semantic versioning

### Debug Commands

**Test update manifest:**
```bash
curl -s https://github.com/project-yarn/project-yarn/releases/latest/download/latest.json | jq .
```

**Verify signature format:**
```bash
# Check if signature is valid base64
echo "SIGNATURE_HERE" | base64 -d > /dev/null && echo "Valid" || echo "Invalid"
```

**Test local build:**
```bash
npm run tauri build
```

## Monitoring and Analytics

### Release Metrics
- Monitor download counts in GitHub Releases
- Track update adoption rates through application telemetry
- Monitor build success rates in GitHub Actions

### Performance Monitoring
- Build time optimization for faster releases
- Artifact size monitoring for efficient downloads
- Update installation success rates

## Future Enhancements

### Planned Features
- **Delta Updates**: Only download changed files for faster updates
- **Staged Rollouts**: Gradual release to percentage of users
- **Rollback Capability**: Automatic rollback on update failures
- **Update Channels**: Beta, stable, and nightly release channels

### Integration Opportunities
- **Crash Reporting**: Integration with error tracking services
- **Usage Analytics**: Anonymous usage statistics collection
- **Feedback System**: User feedback collection for releases

## Support

For issues with the update pipeline:
1. Check the GitHub Actions logs for detailed error information
2. Review this documentation for configuration requirements
3. Open an issue in the project repository with relevant logs
4. Contact the development team for critical update failures

---

**Last Updated**: January 2024  
**Version**: 1.0.0
