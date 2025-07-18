# Git Hooks Setup Script - Task 1.6.7.5
# Sets up automated validation hooks to prevent large file commits
# Usage: Run once to install git hooks for the repository

param(
    [switch]$Force = $false,
    [switch]$Verbose = $false
)

Write-Host "Git Hooks Setup - Task 1.6.7.5" -ForegroundColor Yellow
Write-Host "Installing automated validation hooks..." -ForegroundColor Cyan

# Configuration
$gitHooksDir = ".git/hooks"
$scriptsDir = "scripts"

# Ensure we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository root directory." -ForegroundColor Red
    Write-Host "Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Ensure scripts directory exists
if (-not (Test-Path $scriptsDir)) {
    Write-Host "❌ Error: Scripts directory not found: $scriptsDir" -ForegroundColor Red
    exit 1
}

# Ensure validation script exists
$validationScript = Join-Path $scriptsDir "validate-commit.ps1"
if (-not (Test-Path $validationScript)) {
    Write-Host "❌ Error: Validation script not found: $validationScript" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Repository and scripts validated." -ForegroundColor Green

# Function to create or update a git hook
function Install-GitHook {
    param(
        [string]$HookName,
        [string]$HookContent,
        [string]$Description
    )
    
    $hookPath = Join-Path $gitHooksDir $HookName
    $hookExists = Test-Path $hookPath
    
    Write-Host "`nInstalling $HookName hook..." -ForegroundColor Cyan
    Write-Host "Purpose: $Description" -ForegroundColor Gray
    
    if ($hookExists -and -not $Force) {
        Write-Host "⚠️  Hook already exists: $hookPath" -ForegroundColor Yellow
        Write-Host "Use -Force to overwrite existing hooks." -ForegroundColor Yellow
        return $false
    }
    
    try {
        # Create the hook file
        $HookContent | Out-File -FilePath $hookPath -Encoding UTF8 -Force
        
        # Make executable (Windows doesn't need chmod, but we'll note it)
        if ($Verbose) {
            Write-Host "Created hook file: $hookPath" -ForegroundColor Gray
        }
        
        Write-Host "✅ $HookName hook installed successfully." -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to install $HookName hook: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Pre-commit hook content
$preCommitHook = @"
#!/bin/sh
# Pre-commit hook - Task 1.6.7.5
# Automatically validates commits to prevent large files and build artifacts

echo "Running pre-commit validation..."

# Try PowerShell first (Windows)
if command -v powershell >/dev/null 2>&1; then
    powershell -ExecutionPolicy Bypass -File scripts/validate-commit.ps1
    exit_code=`$?
elif command -v pwsh >/dev/null 2>&1; then
    pwsh -ExecutionPolicy Bypass -File scripts/validate-commit.ps1
    exit_code=`$?
# Fallback to bash script (Unix/Linux/macOS)
elif [ -f "scripts/validate-commit.sh" ]; then
    bash scripts/validate-commit.sh
    exit_code=`$?
else
    echo "❌ Error: No validation script available for this platform."
    echo "Please install PowerShell or ensure validate-commit.sh exists."
    exit 1
fi

if [ `$exit_code -ne 0 ]; then
    echo ""
    echo "❌ Pre-commit validation failed!"
    echo "Commit blocked to prevent large files or build artifacts."
    echo ""
    echo "To bypass this check (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

echo "✅ Pre-commit validation passed."
exit 0
"@

# Pre-push hook content
$prePushHook = @"
#!/bin/sh
# Pre-push hook - Task 1.6.7.5
# Additional validation before pushing to remote repository

echo "Running pre-push validation..."

# Check for any large files that might have slipped through
large_files=`$(git ls-files | xargs ls -la 2>/dev/null | awk '`$5 > 52428800 {print `$9, `$5}' | head -10)

if [ -n "`$large_files" ]; then
    echo "❌ Warning: Large files detected in repository:"
    echo "`$large_files"
    echo ""
    echo "These files may cause push failures on GitHub."
    echo "Consider using model management scripts or .gitignore exclusions."
    echo ""
    echo "To bypass this check (NOT RECOMMENDED):"
    echo "  git push --no-verify"
    echo ""
    exit 1
fi

echo "✅ Pre-push validation passed."
exit 0
"@

# Commit-msg hook content
$commitMsgHook = @"
#!/bin/sh
# Commit-msg hook - Task 1.6.7.5
# Validates commit messages and adds build artifact warnings

commit_file=`$1
commit_msg=`$(cat "`$commit_file")

# Check if commit involves build artifacts (warning only)
if git diff --cached --name-only | grep -E "(target/|\.rlib|\.rmeta|\.pdb|node_modules/)" >/dev/null 2>&1; then
    echo ""
    echo "⚠️  WARNING: This commit may include build artifacts."
    echo "Please verify that only necessary files are being committed."
    echo ""
fi

# Add validation marker to commit message if not present
if ! echo "`$commit_msg" | grep -q "\[validated\]"; then
    echo "`$commit_msg" > "`$commit_file"
    echo "" >> "`$commit_file"
    echo "[validated] Pre-commit checks passed" >> "`$commit_file"
fi

exit 0
"@

# Main installation process
Write-Host "`nStarting git hooks installation..." -ForegroundColor Cyan

$installCount = 0
$totalHooks = 3

# Install pre-commit hook
if (Install-GitHook "pre-commit" $preCommitHook "Validates files before commit to prevent large files and build artifacts") {
    $installCount++
}

# Install pre-push hook
if (Install-GitHook "pre-push" $prePushHook "Additional validation before pushing to remote repository") {
    $installCount++
}

# Install commit-msg hook
if (Install-GitHook "commit-msg" $commitMsgHook "Validates commit messages and adds build artifact warnings") {
    $installCount++
}

# Summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "GIT HOOKS INSTALLATION SUMMARY" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
Write-Host "Hooks installed: $installCount / $totalHooks" -ForegroundColor White
Write-Host "Hooks directory: $gitHooksDir" -ForegroundColor Gray

if ($installCount -eq $totalHooks) {
    Write-Host "`n✅ ALL HOOKS INSTALLED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "Your repository is now protected against large file commits." -ForegroundColor Green
    
    Write-Host "`nInstalled hooks:" -ForegroundColor Cyan
    Write-Host "• pre-commit: Validates files before each commit" -ForegroundColor White
    Write-Host "• pre-push: Additional validation before pushing" -ForegroundColor White
    Write-Host "• commit-msg: Validates and enhances commit messages" -ForegroundColor White
    
    Write-Host "`nTo test the hooks:" -ForegroundColor Yellow
    Write-Host "1. Try committing a large file or build artifact" -ForegroundColor Yellow
    Write-Host "2. The commit should be automatically blocked" -ForegroundColor Yellow
    Write-Host "3. Use 'git commit --no-verify' to bypass (not recommended)" -ForegroundColor Yellow
}
else {
    Write-Host "`n⚠️  PARTIAL INSTALLATION" -ForegroundColor Yellow
    Write-Host "Some hooks were not installed. Check errors above." -ForegroundColor Yellow
    Write-Host "Use -Force to overwrite existing hooks." -ForegroundColor Yellow
}

Write-Host "`nGit hooks setup completed." -ForegroundColor Cyan
