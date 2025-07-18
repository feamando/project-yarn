#!/usr/bin/env node

/**
 * GitIgnore Validation Script for Project Yarn
 * 
 * This script validates that the .gitignore file properly excludes all AI model files
 * and directories, ensuring no large model files are accidentally committed to git.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class GitIgnoreValidator {
    constructor() {
        this.projectRoot = process.cwd();
        this.gitignorePath = path.join(this.projectRoot, '.gitignore');
        this.issues = [];
        this.warnings = [];
        this.suggestions = [];
        
        // Critical patterns that must be in .gitignore
        this.criticalPatterns = [
            '*.onnx',
            '*.bin',
            '*.safetensors',
            '*.pt',
            '*.pth',
            '/models/',
            'local-models.json',
            '.huggingface/',
            '.transformers_cache/'
        ];

        // Model file extensions to check for
        this.modelExtensions = [
            '.onnx', '.bin', '.safetensors', '.pt', '.pth', '.pytorch',
            '.model', '.weights', '.h5', '.pb', '.tflite', '.mlmodel',
            '.coreml', '.ggml', '.gguf', '.q4_0', '.q4_1', '.q5_0',
            '.q5_1', '.q8_0', '.f16', '.f32'
        ];

        // Directories that should be excluded
        this.modelDirectories = [
            'models', 'local-models', 'ai-models', 'ml-models',
            'model-cache', 'model-assets', '.cache', '.huggingface',
            '.transformers_cache', 'temp', 'tmp', 'backups'
        ];
    }

    async validateGitIgnore() {
        console.log('🔍 Validating .gitignore for AI model exclusions...\n');

        try {
            // Check if .gitignore exists
            await this.checkGitIgnoreExists();
            
            // Read and parse .gitignore
            const gitignoreContent = await this.readGitIgnore();
            
            // Validate critical patterns
            await this.validateCriticalPatterns(gitignoreContent);
            
            // Check for existing model files that should be ignored
            await this.checkExistingModelFiles();
            
            // Validate git status
            await this.validateGitStatus();
            
            // Check for large files in git history
            await this.checkGitHistory();
            
            // Generate recommendations
            await this.generateRecommendations();
            
            return this.generateReport();
            
        } catch (error) {
            this.issues.push(`Validation failed: ${error.message}`);
            return this.generateReport();
        }
    }

    async checkGitIgnoreExists() {
        try {
            await fs.access(this.gitignorePath);
        } catch {
            this.issues.push('.gitignore file does not exist');
            throw new Error('.gitignore file not found');
        }
    }

    async readGitIgnore() {
        try {
            const content = await fs.readFile(this.gitignorePath, 'utf8');
            return content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
        } catch (error) {
            this.issues.push(`Failed to read .gitignore: ${error.message}`);
            throw error;
        }
    }

    async validateCriticalPatterns(gitignoreLines) {
        console.log('📋 Checking critical patterns...');
        
        const missingPatterns = [];
        
        for (const pattern of this.criticalPatterns) {
            const isPresent = gitignoreLines.some(line => 
                line === pattern || 
                line.includes(pattern) ||
                (pattern.startsWith('*.') && gitignoreLines.includes(pattern)) ||
                (pattern.startsWith('/') && gitignoreLines.includes(pattern.slice(1))) ||
                (pattern.endsWith('/') && gitignoreLines.includes(pattern))
            );
            
            if (!isPresent) {
                missingPatterns.push(pattern);
            }
        }
        
        if (missingPatterns.length > 0) {
            this.issues.push(`Missing critical patterns: ${missingPatterns.join(', ')}`);
        } else {
            console.log('✅ All critical patterns are present');
        }
    }

    async checkExistingModelFiles() {
        console.log('🔍 Scanning for existing model files...');
        
        const modelFiles = await this.findModelFiles(this.projectRoot);
        
        if (modelFiles.length > 0) {
            console.log(`⚠️  Found ${modelFiles.length} model files:`);
            
            for (const file of modelFiles) {
                const relativePath = path.relative(this.projectRoot, file.path);
                const sizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
                console.log(`   • ${relativePath} (${sizeGB}GB)`);
                
                // Check if file is tracked by git
                try {
                    execSync(`git ls-files --error-unmatch "${relativePath}"`, { 
                        cwd: this.projectRoot, 
                        stdio: 'pipe' 
                    });
                    this.issues.push(`Large model file is tracked by git: ${relativePath} (${sizeGB}GB)`);
                } catch {
                    // File is not tracked, which is good
                    this.warnings.push(`Model file exists but is properly ignored: ${relativePath}`);
                }
            }
        } else {
            console.log('✅ No model files found in repository');
        }
    }

    async findModelFiles(dir, files = []) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(this.projectRoot, fullPath);
                
                // Skip common ignore patterns
                if (this.shouldSkipPath(relativePath)) {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    await this.findModelFiles(fullPath, files);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (this.modelExtensions.includes(ext)) {
                        const stats = await fs.stat(fullPath);
                        files.push({
                            path: fullPath,
                            size: stats.size,
                            extension: ext
                        });
                    }
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
        
        return files;
    }

    shouldSkipPath(relativePath) {
        const skipPatterns = [
            'node_modules',
            '.git',
            'target',
            'dist',
            'build',
            '.cache',
            'temp',
            'tmp'
        ];
        
        return skipPatterns.some(pattern => relativePath.includes(pattern));
    }

    async validateGitStatus() {
        console.log('📊 Checking git status...');
        
        try {
            const status = execSync('git status --porcelain', { 
                cwd: this.projectRoot, 
                encoding: 'utf8' 
            });
            
            const lines = status.split('\n').filter(line => line.trim());
            const modelFiles = lines.filter(line => {
                const filename = line.substring(3);
                const ext = path.extname(filename).toLowerCase();
                return this.modelExtensions.includes(ext);
            });
            
            if (modelFiles.length > 0) {
                this.issues.push(`Model files in git status: ${modelFiles.map(f => f.substring(3)).join(', ')}`);
            } else {
                console.log('✅ No model files in git status');
            }
        } catch (error) {
            this.warnings.push(`Could not check git status: ${error.message}`);
        }
    }

    async checkGitHistory() {
        console.log('📚 Checking git history for large files...');
        
        try {
            // Find large files in git history (>50MB)
            const largeFiles = execSync(
                'git rev-list --objects --all | git cat-file --batch-check="%(objecttype) %(objectname) %(objectsize) %(rest)" | awk \'/^blob/ {if($3 > 52428800) print $3, $4}\' | sort -nr',
                { cwd: this.projectRoot, encoding: 'utf8' }
            );
            
            if (largeFiles.trim()) {
                const files = largeFiles.trim().split('\n');
                this.warnings.push(`Found ${files.length} large files in git history`);
                
                files.slice(0, 5).forEach(file => {
                    const [size, filename] = file.split(' ', 2);
                    const sizeGB = (parseInt(size) / (1024 * 1024 * 1024)).toFixed(2);
                    this.warnings.push(`  • ${filename || 'unknown'} (${sizeGB}GB)`);
                });
                
                if (files.length > 5) {
                    this.warnings.push(`  ... and ${files.length - 5} more files`);
                }
                
                this.suggestions.push('Consider using git filter-branch or BFG Repo-Cleaner to remove large files from history');
            } else {
                console.log('✅ No large files found in git history');
            }
        } catch (error) {
            this.warnings.push(`Could not check git history: ${error.message}`);
        }
    }

    async generateRecommendations() {
        // Check for model directories that should be excluded
        for (const dir of this.modelDirectories) {
            const dirPath = path.join(this.projectRoot, dir);
            try {
                await fs.access(dirPath);
                this.suggestions.push(`Consider adding /${dir}/ to .gitignore if not already present`);
            } catch {
                // Directory doesn't exist, which is fine
            }
        }

        // Suggest model management setup
        if (this.issues.length > 0) {
            this.suggestions.push('Run "npm run setup-models" to properly configure model management');
            this.suggestions.push('Use "npm run models:status" to check current model installation status');
        }

        // Suggest git cleanup if needed
        const hasLargeFiles = this.issues.some(issue => issue.includes('Large model file is tracked'));
        if (hasLargeFiles) {
            this.suggestions.push('Remove large model files from git tracking with: git rm --cached <file>');
            this.suggestions.push('Consider using git filter-branch to remove files from history');
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            status: this.issues.length === 0 ? 'PASSED' : 'FAILED',
            summary: {
                issues: this.issues.length,
                warnings: this.warnings.length,
                suggestions: this.suggestions.length
            },
            details: {
                issues: this.issues,
                warnings: this.warnings,
                suggestions: this.suggestions
            }
        };

        return report;
    }

    printReport(report) {
        console.log('\n📊 GitIgnore Validation Report');
        console.log('================================');
        console.log(`Status: ${report.status}`);
        console.log(`Issues: ${report.summary.issues}`);
        console.log(`Warnings: ${report.summary.warnings}`);
        console.log(`Suggestions: ${report.summary.suggestions}`);

        if (report.details.issues.length > 0) {
            console.log('\n❌ Issues Found:');
            report.details.issues.forEach(issue => console.log(`  • ${issue}`));
        }

        if (report.details.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            report.details.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        if (report.details.suggestions.length > 0) {
            console.log('\n💡 Suggestions:');
            report.details.suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
        }

        console.log(`\n🎯 Overall Status: ${report.status}`);
        
        if (report.status === 'PASSED') {
            console.log('✅ Your .gitignore is properly configured for AI model exclusion!');
        } else {
            console.log('❌ Please address the issues above to ensure proper model exclusion.');
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log('Project Yarn GitIgnore Validation Script');
        console.log('Usage: node validate-gitignore.js [options]');
        console.log('Options:');
        console.log('  --report         Generate detailed JSON report');
        console.log('  --fix            Attempt to fix common issues');
        console.log('  --quiet          Suppress detailed output');
        console.log('  --help, -h       Show this help message');
        return;
    }

    try {
        const validator = new GitIgnoreValidator();
        const report = await validator.validateGitIgnore();

        const quiet = args.includes('--quiet');
        const generateJsonReport = args.includes('--report');
        const attemptFix = args.includes('--fix');

        if (!quiet) {
            validator.printReport(report);
        }

        if (generateJsonReport) {
            const reportPath = path.join(process.cwd(), 'gitignore-validation-report.json');
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        }

        if (attemptFix && report.summary.issues > 0) {
            console.log('\n🔧 Attempting to fix issues...');
            // TODO: Implement automatic fixes
            console.log('⚠️  Automatic fixes not yet implemented. Please address issues manually.');
        }

        // Exit with error code if validation failed
        if (report.status === 'FAILED') {
            process.exit(1);
        }

    } catch (error) {
        console.error(`❌ Validation failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { GitIgnoreValidator };
