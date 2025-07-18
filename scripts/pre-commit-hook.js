#!/usr/bin/env node

/**
 * Pre-commit Hook for Project Yarn
 * 
 * This script runs before each git commit to ensure no large AI model files
 * are accidentally committed to the repository.
 */

const { execSync } = require('child_process');
const { GitIgnoreValidator } = require('./validate-gitignore.js');

class PreCommitHook {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    async run() {
        console.log('🔍 Running pre-commit validation...\n');

        try {
            // Check staged files for model files
            await this.checkStagedFiles();
            
            // Validate .gitignore
            await this.validateGitIgnore();
            
            // Check file sizes
            await this.checkFileSizes();
            
            // Print results
            this.printResults();
            
            // Exit with error if there are blocking issues
            if (this.errors.length > 0) {
                console.log('\n❌ Commit blocked due to validation errors.');
                console.log('Please fix the issues above and try again.\n');
                process.exit(1);
            }
            
            console.log('✅ Pre-commit validation passed!\n');
            
        } catch (error) {
            console.error(`❌ Pre-commit hook failed: ${error.message}`);
            process.exit(1);
        }
    }

    async checkStagedFiles() {
        console.log('📋 Checking staged files...');
        
        try {
            const stagedFiles = execSync('git diff --cached --name-only', { 
                encoding: 'utf8' 
            }).trim().split('\n').filter(f => f);
            
            if (stagedFiles.length === 0) {
                this.warnings.push('No files staged for commit');
                return;
            }
            
            const modelExtensions = [
                '.onnx', '.bin', '.safetensors', '.pt', '.pth', '.pytorch',
                '.model', '.weights', '.h5', '.pb', '.tflite', '.mlmodel',
                '.coreml', '.ggml', '.gguf', '.q4_0', '.q4_1', '.q5_0',
                '.q5_1', '.q8_0', '.f16', '.f32'
            ];
            
            const modelFiles = stagedFiles.filter(file => {
                const ext = file.toLowerCase().substring(file.lastIndexOf('.'));
                return modelExtensions.includes(ext);
            });
            
            if (modelFiles.length > 0) {
                this.errors.push(`Attempting to commit model files: ${modelFiles.join(', ')}`);
                this.errors.push('Model files should not be committed to git. Use the model management scripts instead.');
            }
            
            // Check for large files
            const largeFiles = [];
            for (const file of stagedFiles) {
                try {
                    const size = execSync(`git cat-file -s :${file}`, { 
                        encoding: 'utf8' 
                    }).trim();
                    
                    const sizeBytes = parseInt(size);
                    const sizeMB = sizeBytes / (1024 * 1024);
                    
                    if (sizeMB > 50) { // Files larger than 50MB
                        largeFiles.push({ file, size: sizeMB });
                    }
                } catch {
                    // File might be new or deleted, skip size check
                }
            }
            
            if (largeFiles.length > 0) {
                largeFiles.forEach(({ file, size }) => {
                    this.errors.push(`Large file staged: ${file} (${size.toFixed(1)}MB)`);
                });
                this.errors.push('Large files should not be committed to git.');
            }
            
            console.log(`✅ Checked ${stagedFiles.length} staged files`);
            
        } catch (error) {
            this.warnings.push(`Could not check staged files: ${error.message}`);
        }
    }

    async validateGitIgnore() {
        console.log('🔍 Validating .gitignore...');
        
        try {
            const validator = new GitIgnoreValidator();
            const report = await validator.validateGitIgnore();
            
            if (report.status === 'FAILED') {
                this.errors.push('.gitignore validation failed');
                report.details.issues.forEach(issue => {
                    this.errors.push(`  • ${issue}`);
                });
            }
            
            // Add warnings from validator
            report.details.warnings.forEach(warning => {
                this.warnings.push(warning);
            });
            
            console.log(`✅ .gitignore validation: ${report.status}`);
            
        } catch (error) {
            this.warnings.push(`Could not validate .gitignore: ${error.message}`);
        }
    }

    async checkFileSizes() {
        console.log('📏 Checking repository size...');
        
        try {
            // Get repository size
            const repoSize = execSync('git count-objects -vH', { 
                encoding: 'utf8' 
            });
            
            const sizeMatch = repoSize.match(/size-pack (\d+(?:\.\d+)?)\s*(\w+)/);
            if (sizeMatch) {
                const [, size, unit] = sizeMatch;
                const sizeNum = parseFloat(size);
                
                if (unit === 'GiB' && sizeNum > 1) {
                    this.warnings.push(`Repository size is large: ${size} ${unit}`);
                    this.warnings.push('Consider using git filter-branch to remove large files from history');
                } else if (unit === 'MiB' && sizeNum > 500) {
                    this.warnings.push(`Repository size: ${size} ${unit} (approaching 1GB limit)`);
                }
            }
            
            console.log('✅ Repository size check completed');
            
        } catch (error) {
            this.warnings.push(`Could not check repository size: ${error.message}`);
        }
    }

    printResults() {
        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }
    }
}

// Install hook function
function installHook() {
    const fs = require('fs');
    const path = require('path');
    
    const hookPath = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');
    const hookContent = `#!/bin/sh
# Project Yarn Pre-commit Hook
node scripts/pre-commit-hook.js
`;
    
    try {
        fs.writeFileSync(hookPath, hookContent);
        fs.chmodSync(hookPath, '755');
        console.log('✅ Pre-commit hook installed successfully');
    } catch (error) {
        console.error(`❌ Failed to install pre-commit hook: ${error.message}`);
        process.exit(1);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--install')) {
        installHook();
        return;
    }
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('Project Yarn Pre-commit Hook');
        console.log('Usage: node pre-commit-hook.js [options]');
        console.log('Options:');
        console.log('  --install        Install the pre-commit hook');
        console.log('  --help, -h       Show this help message');
        return;
    }
    
    const hook = new PreCommitHook();
    await hook.run();
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { PreCommitHook };
