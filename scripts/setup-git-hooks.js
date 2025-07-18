#!/usr/bin/env node

/**
 * Git Hooks Setup Script for Project Yarn
 * 
 * This script sets up git hooks to prevent accidental commits of large AI model files
 * and ensures proper .gitignore validation.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class GitHooksSetup {
    constructor() {
        this.projectRoot = process.cwd();
        this.hooksDir = path.join(this.projectRoot, '.git', 'hooks');
        this.scriptsDir = path.join(this.projectRoot, 'scripts');
    }

    async setup() {
        console.log('🔧 Setting up Git Hooks for Project Yarn...\n');

        try {
            // Check if we're in a git repository
            await this.checkGitRepository();
            
            // Ensure hooks directory exists
            await this.ensureHooksDirectory();
            
            // Install pre-commit hook
            await this.installPreCommitHook();
            
            // Install pre-push hook
            await this.installPrePushHook();
            
            // Install commit-msg hook
            await this.installCommitMsgHook();
            
            // Validate installation
            await this.validateInstallation();
            
            console.log('✅ Git hooks setup completed successfully!\n');
            this.printUsageInstructions();
            
        } catch (error) {
            console.error(`❌ Setup failed: ${error.message}`);
            process.exit(1);
        }
    }

    async checkGitRepository() {
        try {
            execSync('git rev-parse --git-dir', { 
                cwd: this.projectRoot, 
                stdio: 'pipe' 
            });
            console.log('✅ Git repository detected');
        } catch {
            throw new Error('Not a git repository. Please run "git init" first.');
        }
    }

    async ensureHooksDirectory() {
        try {
            await fs.access(this.hooksDir);
            console.log('✅ Git hooks directory exists');
        } catch {
            await fs.mkdir(this.hooksDir, { recursive: true });
            console.log('✅ Created git hooks directory');
        }
    }

    async installPreCommitHook() {
        const hookPath = path.join(this.hooksDir, 'pre-commit');
        const hookContent = `#!/bin/sh
#
# Project Yarn Pre-commit Hook
# Prevents committing large AI model files and validates .gitignore
#

echo "🔍 Running Project Yarn pre-commit validation..."

# Run the pre-commit validation script
node scripts/pre-commit-hook.js

# Exit with the same code as the validation script
exit $?
`;

        await fs.writeFile(hookPath, hookContent);
        await this.makeExecutable(hookPath);
        console.log('✅ Pre-commit hook installed');
    }

    async installPrePushHook() {
        const hookPath = path.join(this.hooksDir, 'pre-push');
        const hookContent = `#!/bin/sh
#
# Project Yarn Pre-push Hook
# Final validation before pushing to remote repository
#

echo "🚀 Running Project Yarn pre-push validation..."

# Check for large files in the repository
echo "📏 Checking repository size..."
REPO_SIZE=$(git count-objects -vH | grep "size-pack" | awk '{print $2 $3}')
echo "Repository size: $REPO_SIZE"

# Run gitignore validation
echo "🔍 Validating .gitignore..."
node scripts/validate-gitignore.js --quiet

if [ $? -ne 0 ]; then
    echo "❌ .gitignore validation failed"
    echo "Please fix the issues and try again"
    exit 1
fi

# Check for model files in the repository
echo "🔍 Scanning for model files..."
MODEL_FILES=$(git ls-files | grep -E "\\.(onnx|bin|safetensors|pt|pth|model|weights)$" | head -5)

if [ ! -z "$MODEL_FILES" ]; then
    echo "❌ Model files found in repository:"
    echo "$MODEL_FILES"
    echo ""
    echo "Model files should not be committed to git."
    echo "Please remove them and use the model management scripts instead."
    echo ""
    echo "To remove from git: git rm --cached <file>"
    echo "To setup models: npm run setup-models"
    exit 1
fi

echo "✅ Pre-push validation passed"
exit 0
`;

        await fs.writeFile(hookPath, hookContent);
        await this.makeExecutable(hookPath);
        console.log('✅ Pre-push hook installed');
    }

    async installCommitMsgHook() {
        const hookPath = path.join(this.hooksDir, 'commit-msg');
        const hookContent = `#!/bin/sh
#
# Project Yarn Commit Message Hook
# Validates commit messages and adds warnings for model-related commits
#

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat $COMMIT_MSG_FILE)

# Check if commit message mentions models
if echo "$COMMIT_MSG" | grep -qi "model\\|onnx\\|bin\\|weights"; then
    echo "⚠️  Commit message mentions models"
    echo "Please ensure no large model files are being committed"
    echo "Use 'git status' to verify staged files"
fi

# Check for conventional commit format (optional)
if ! echo "$COMMIT_MSG" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\\(.+\\))?: .+"; then
    echo "💡 Consider using conventional commit format:"
    echo "   feat: add new feature"
    echo "   fix: fix bug"
    echo "   docs: update documentation"
    echo "   etc."
fi

exit 0
`;

        await fs.writeFile(hookPath, hookContent);
        await this.makeExecutable(hookPath);
        console.log('✅ Commit message hook installed');
    }

    async makeExecutable(filePath) {
        try {
            await fs.chmod(filePath, '755');
        } catch (error) {
            console.warn(`⚠️  Could not make ${path.basename(filePath)} executable: ${error.message}`);
        }
    }

    async validateInstallation() {
        console.log('🔍 Validating hook installation...');

        const hooks = ['pre-commit', 'pre-push', 'commit-msg'];
        
        for (const hook of hooks) {
            const hookPath = path.join(this.hooksDir, hook);
            try {
                await fs.access(hookPath);
                const stats = await fs.stat(hookPath);
                const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
                
                if (isExecutable) {
                    console.log(`✅ ${hook} hook is installed and executable`);
                } else {
                    console.log(`⚠️  ${hook} hook is installed but not executable`);
                }
            } catch {
                console.log(`❌ ${hook} hook is not installed`);
            }
        }
    }

    printUsageInstructions() {
        console.log('📋 Git Hooks Usage Instructions');
        console.log('================================');
        console.log('');
        console.log('The following hooks are now active:');
        console.log('');
        console.log('🔍 Pre-commit Hook:');
        console.log('   • Runs before each commit');
        console.log('   • Prevents committing large model files');
        console.log('   • Validates .gitignore configuration');
        console.log('   • Checks staged file sizes');
        console.log('');
        console.log('🚀 Pre-push Hook:');
        console.log('   • Runs before pushing to remote');
        console.log('   • Final validation of repository state');
        console.log('   • Scans for any model files in git');
        console.log('   • Reports repository size');
        console.log('');
        console.log('💬 Commit Message Hook:');
        console.log('   • Validates commit messages');
        console.log('   • Warns about model-related commits');
        console.log('   • Suggests conventional commit format');
        console.log('');
        console.log('🛠️  Manual Commands:');
        console.log('   npm run validate-gitignore  # Validate .gitignore');
        console.log('   npm run models:check        # Check model status');
        console.log('   npm run git:validate        # Full git validation');
        console.log('');
        console.log('🔧 To disable hooks temporarily:');
        console.log('   git commit --no-verify      # Skip pre-commit hook');
        console.log('   git push --no-verify        # Skip pre-push hook');
        console.log('');
        console.log('⚠️  Note: Hooks only prevent accidents, not malicious commits.');
        console.log('   Always review your changes before committing.');
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log('Project Yarn Git Hooks Setup Script');
        console.log('Usage: node setup-git-hooks.js [options]');
        console.log('Options:');
        console.log('  --uninstall      Remove all git hooks');
        console.log('  --validate       Validate current hook installation');
        console.log('  --help, -h       Show this help message');
        return;
    }

    if (args.includes('--uninstall')) {
        await uninstallHooks();
        return;
    }

    if (args.includes('--validate')) {
        const setup = new GitHooksSetup();
        await setup.validateInstallation();
        return;
    }

    const setup = new GitHooksSetup();
    await setup.setup();
}

async function uninstallHooks() {
    console.log('🗑️  Uninstalling git hooks...');
    
    const hooksDir = path.join(process.cwd(), '.git', 'hooks');
    const hooks = ['pre-commit', 'pre-push', 'commit-msg'];
    
    for (const hook of hooks) {
        const hookPath = path.join(hooksDir, hook);
        try {
            await fs.unlink(hookPath);
            console.log(`✅ Removed ${hook} hook`);
        } catch {
            console.log(`⚠️  ${hook} hook was not installed`);
        }
    }
    
    console.log('✅ Git hooks uninstalled');
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { GitHooksSetup };
