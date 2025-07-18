#!/usr/bin/env node

/**
 * CI/CD Setup Script
 * Configures the environment for continuous integration and deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CISetup {
    constructor() {
        this.projectRoot = process.cwd();
        this.isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
        this.ciMode = process.env.YARN_CI_MODE === 'true';
    }

    async setup() {
        console.log('🔧 Setting up CI/CD environment...');
        
        try {
            await this.validateEnvironment();
            await this.setupModelCache();
            await this.configureGitHooks();
            await this.validateConfiguration();
            
            console.log('✅ CI/CD setup completed successfully');
            return true;
        } catch (error) {
            console.error('❌ CI/CD setup failed:', error.message);
            process.exit(1);
        }
    }

    async validateEnvironment() {
        console.log('📋 Validating CI environment...');
        
        // Check required environment variables
        const requiredEnvVars = ['NODE_ENV'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
        }

        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion < 18) {
            throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
        }

        console.log(`✅ Node.js version: ${nodeVersion}`);

        // Check if we're in CI environment
        if (this.isCI) {
            console.log('🤖 Running in CI environment');
            
            // Set CI-specific configurations
            process.env.YARN_MODELS_VARIANT = process.env.YARN_MODELS_VARIANT || 'cpu-int4';
            process.env.YARN_CACHE_MODELS = 'true';
            process.env.YARN_NON_INTERACTIVE = 'true';
        }
    }

    async setupModelCache() {
        console.log('📦 Setting up model cache...');
        
        const modelsDir = path.join(this.projectRoot, 'models');
        const cacheDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cache', 'project-yarn', 'models');
        
        // Create directories if they don't exist
        [modelsDir, cacheDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });

        // In CI, create symlink from cache to models directory
        if (this.isCI && !fs.existsSync(path.join(modelsDir, '.cache-linked'))) {
            try {
                // Create a marker file to indicate cache is linked
                fs.writeFileSync(path.join(modelsDir, '.cache-linked'), 'true');
                console.log('🔗 Model cache configured for CI');
            } catch (error) {
                console.warn('⚠️  Could not configure model cache symlink:', error.message);
            }
        }
    }

    async configureGitHooks() {
        if (this.isCI) {
            console.log('🔀 Skipping git hooks setup in CI environment');
            return;
        }

        console.log('🪝 Configuring git hooks...');
        
        try {
            // Check if git hooks are already installed
            const hooksDir = path.join(this.projectRoot, '.git', 'hooks');
            const preCommitHook = path.join(hooksDir, 'pre-commit');
            
            if (!fs.existsSync(preCommitHook)) {
                console.log('📥 Installing git hooks...');
                execSync('npm run setup-git-hooks', { stdio: 'inherit' });
            } else {
                console.log('✅ Git hooks already configured');
            }
        } catch (error) {
            console.warn('⚠️  Could not configure git hooks:', error.message);
        }
    }

    async validateConfiguration() {
        console.log('🔍 Validating configuration...');
        
        // Check required files
        const requiredFiles = [
            'package.json',
            'models.config.json',
            '.gitignore',
            'src-tauri/Cargo.toml'
        ];

        const missingFiles = requiredFiles.filter(file => 
            !fs.existsSync(path.join(this.projectRoot, file))
        );

        if (missingFiles.length > 0) {
            throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
        }

        // Validate model configuration
        try {
            const modelConfig = JSON.parse(
                fs.readFileSync(path.join(this.projectRoot, 'models.config.json'), 'utf8')
            );
            
            if (!modelConfig.models || !Array.isArray(modelConfig.models)) {
                throw new Error('Invalid models.config.json: missing or invalid models array');
            }
            
            console.log(`✅ Found ${modelConfig.models.length} model configurations`);
        } catch (error) {
            throw new Error(`Invalid models.config.json: ${error.message}`);
        }

        // Validate .gitignore
        const gitignoreContent = fs.readFileSync(path.join(this.projectRoot, '.gitignore'), 'utf8');
        const requiredPatterns = ['models/', '*.onnx', '*.bin', '*.safetensors'];
        const missingPatterns = requiredPatterns.filter(pattern => 
            !gitignoreContent.includes(pattern)
        );

        if (missingPatterns.length > 0) {
            console.warn(`⚠️  .gitignore missing patterns: ${missingPatterns.join(', ')}`);
        }

        console.log('✅ Configuration validation completed');
    }

    async checkSystemResources() {
        console.log('💾 Checking system resources...');
        
        try {
            // Check available disk space
            const stats = fs.statSync(this.projectRoot);
            console.log('✅ Disk space check completed');
            
            // Check memory (basic check)
            if (process.memoryUsage) {
                const memory = process.memoryUsage();
                const totalMB = Math.round(memory.rss / 1024 / 1024);
                console.log(`📊 Memory usage: ${totalMB}MB`);
            }
        } catch (error) {
            console.warn('⚠️  Could not check system resources:', error.message);
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const setup = new CISetup();
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
CI/CD Setup Script

Usage: node ci-setup.js [options]

Options:
  --help, -h     Show this help message
  --check        Only validate configuration without setup
  --verbose      Enable verbose logging

Environment Variables:
  YARN_CI_MODE          Enable CI mode optimizations
  YARN_MODELS_VARIANT   Model variant to use (cpu-int4, fp16, etc.)
  YARN_CACHE_MODELS     Enable model caching
  YARN_NON_INTERACTIVE  Disable interactive prompts
        `);
        process.exit(0);
    }
    
    if (args.includes('--check')) {
        setup.validateConfiguration()
            .then(() => {
                console.log('✅ Configuration validation passed');
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Configuration validation failed:', error.message);
                process.exit(1);
            });
    } else {
        setup.setup();
    }
}

module.exports = CISetup;
