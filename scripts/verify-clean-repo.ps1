# Repository Verification Script - Task 1.6.7.7
# Verifies and tests that the repository is clean and ready for deployment
# Usage: Run after completing repository cleanup to validate all systems

param(
    [switch]$Verbose = $false,
    [switch]$SkipGitTests = $false,
    [switch]$SkipSizeTests = $false,
    [switch]$SkipHookTests = $false
)

Write-Host "Repository Verification - Task 1.6.7.7" -ForegroundColor Yellow
Write-Host "Verifying clean repository state..." -ForegroundColor Cyan

# Configuration
$maxRepoSizeMB = 500
$maxFileSizeMB = 50
$criticalFiles = @(
    ".gitignore",
    "scripts/validate-commit.ps1",
    "scripts/setup-git-hooks.ps1",
    "CONTRIBUTING.md"
)

# Test results tracking
$testResults = @{
    GitStatus = $false
    RepoSize = $false
    LargeFiles = $false
    GitIgnore = $false
    GitHooks = $false
    ValidationScripts = $false
    Documentation = $false
}

$totalTests = $testResults.Count
$passedTests = 0

# Function to run a test and track results
function Test-Condition {
    param(
        [string]$TestName,
        [scriptblock]$TestBlock,
        [string]$SuccessMessage,
        [string]$FailureMessage
    )
    
    Write-Host "`n🔍 Testing: $TestName" -ForegroundColor Cyan
    
    try {
        $result = & $TestBlock
        if ($result) {
            Write-Host "✅ PASS: $SuccessMessage" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FAIL: $FailureMessage" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to format file size
function Format-FileSize {
    param($bytes)
    
    if ($bytes -lt 1KB) { return "$bytes B" }
    elseif ($bytes -lt 1MB) { return "{0:N2} KB" -f ($bytes / 1KB) }
    elseif ($bytes -lt 1GB) { return "{0:N2} MB" -f ($bytes / 1MB) }
    else { return "{0:N2} GB" -f ($bytes / 1GB) }
}

Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "REPOSITORY VERIFICATION TESTS" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan

# Test 1: Git Status and History
if (-not $SkipGitTests) {
    $testResults.GitStatus = Test-Condition "Git Repository Status" {
        try {
            # Check if we're in a git repository
            $gitStatus = git status --porcelain 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Not a git repository or git not available" -ForegroundColor Red
                return $false
            }
            
            # Check for large files in git history
            $largeObjects = git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | Where-Object { $_ -match '^blob' } | ForEach-Object {
                $parts = $_ -split ' '
                if ($parts.Length -ge 3 -and [int64]$parts[2] -gt (50 * 1MB)) {
                    $parts[3..($parts.Length-1)] -join ' '
                }
            } | Select-Object -First 5
            
            if ($largeObjects) {
                Write-Host "Large objects found in git history:" -ForegroundColor Yellow
                $largeObjects | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
                return $false
            }
            
            return $true
        }
        catch {
            Write-Host "Git status check failed: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } "Git repository is clean with no large objects in history" "Git repository has issues or large objects in history"
    
    if ($testResults.GitStatus) { $passedTests++ }
}

# Test 2: Repository Size
if (-not $SkipSizeTests) {
    $testResults.RepoSize = Test-Condition "Repository Size" {
        try {
            # Get .git directory size
            $gitDirSize = (Get-ChildItem -Path ".git" -Recurse -File | Measure-Object -Property Length -Sum).Sum
            $gitSizeMB = $gitDirSize / 1MB
            
            Write-Host "Repository size: $(Format-FileSize $gitDirSize)" -ForegroundColor Gray
            
            if ($gitSizeMB -gt $maxRepoSizeMB) {
                Write-Host "Repository size exceeds $maxRepoSizeMB MB limit" -ForegroundColor Red
                return $false
            }
            
            return $true
        }
        catch {
            Write-Host "Repository size check failed: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } "Repository size is within acceptable limits" "Repository size exceeds limits"
    
    if ($testResults.RepoSize) { $passedTests++ }
}

# Test 3: Large Files Check
$testResults.LargeFiles = Test-Condition "Large Files Detection" {
    try {
        # Check for large files in working directory
        $largeFiles = Get-ChildItem -Recurse -File | Where-Object { 
            $_.Length -gt ($maxFileSizeMB * 1MB) -and 
            -not ($_.FullName -match '\.git\\') 
        } | Select-Object -First 10
        
        if ($largeFiles) {
            Write-Host "Large files found:" -ForegroundColor Yellow
            $largeFiles | ForEach-Object { 
                Write-Host "  - $($_.Name): $(Format-FileSize $_.Length)" -ForegroundColor Yellow 
            }
            return $false
        }
        
        return $true
    }
    catch {
        Write-Host "Large files check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
} "No large files detected in working directory" "Large files found in working directory"

if ($testResults.LargeFiles) { $passedTests++ }

# Test 4: .gitignore Effectiveness
$testResults.GitIgnore = Test-Condition ".gitignore Configuration" {
    try {
        # Check if .gitignore exists and has required patterns
        if (-not (Test-Path ".gitignore")) {
            Write-Host ".gitignore file not found" -ForegroundColor Red
            return $false
        }
        
        $gitignoreContent = Get-Content ".gitignore" -Raw
        $requiredPatterns = @(
            "target/",
            "*.rlib",
            "*.rmeta",
            "*.pdb",
            "node_modules/",
            "*.bin",
            "*.onnx",
            "models/"
        )
        
        $missingPatterns = @()
        foreach ($pattern in $requiredPatterns) {
            if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
                $missingPatterns += $pattern
            }
        }
        
        if ($missingPatterns.Count -gt 0) {
            Write-Host "Missing .gitignore patterns:" -ForegroundColor Yellow
            $missingPatterns | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
            return $false
        }
        
        # Test .gitignore effectiveness with sample files
        $testPatterns = @("target/test.rlib", "models/test.bin", "node_modules/test.js")
        foreach ($pattern in $testPatterns) {
            $checkResult = git check-ignore $pattern 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Pattern not ignored: $pattern" -ForegroundColor Yellow
            }
        }
        
        return $true
    }
    catch {
        Write-Host ".gitignore check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
} ".gitignore is properly configured with all required patterns" ".gitignore is missing required patterns"

if ($testResults.GitIgnore) { $passedTests++ }

# Test 5: Git Hooks Installation
if (-not $SkipHookTests) {
    $testResults.GitHooks = Test-Condition "Git Hooks Installation" {
        try {
            $requiredHooks = @("pre-commit", "pre-push", "commit-msg")
            $missingHooks = @()
            
            foreach ($hook in $requiredHooks) {
                $hookPath = ".git/hooks/$hook"
                if (-not (Test-Path $hookPath)) {
                    $missingHooks += $hook
                }
            }
            
            if ($missingHooks.Count -gt 0) {
                Write-Host "Missing git hooks:" -ForegroundColor Yellow
                $missingHooks | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
                return $false
            }
            
            return $true
        }
        catch {
            Write-Host "Git hooks check failed: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } "All required git hooks are installed" "Some git hooks are missing"
    
    if ($testResults.GitHooks) { $passedTests++ }
}

# Test 6: Validation Scripts
$testResults.ValidationScripts = Test-Condition "Validation Scripts" {
    try {
        $requiredScripts = @(
            "scripts/validate-commit.ps1",
            "scripts/setup-git-hooks.ps1",
            "scripts/force-cleanup-git.ps1"
        )
        
        $missingScripts = @()
        foreach ($script in $requiredScripts) {
            if (-not (Test-Path $script)) {
                $missingScripts += $script
            }
        }
        
        if ($missingScripts.Count -gt 0) {
            Write-Host "Missing validation scripts:" -ForegroundColor Yellow
            $missingScripts | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
            return $false
        }
        
        # Test validation script execution
        try {
            $validationResult = powershell -ExecutionPolicy Bypass -File "scripts/validate-commit.ps1" -DryRun 2>$null
            if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
                Write-Host "Validation script execution failed" -ForegroundColor Yellow
                return $false
            }
        }
        catch {
            Write-Host "Validation script test failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        return $true
    }
    catch {
        Write-Host "Validation scripts check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
} "All validation scripts are present and functional" "Some validation scripts are missing or non-functional"

if ($testResults.ValidationScripts) { $passedTests++ }

# Test 7: Documentation
$testResults.Documentation = Test-Condition "Documentation Updates" {
    try {
        # Check if CONTRIBUTING.md has cleanup documentation
        if (-not (Test-Path "CONTRIBUTING.md")) {
            Write-Host "CONTRIBUTING.md not found" -ForegroundColor Red
            return $false
        }
        
        $contributingContent = Get-Content "CONTRIBUTING.md" -Raw
        $requiredSections = @(
            "Repository Cleanup",
            "Large File Prevention",
            "Pre-commit Validation",
            "Git Hooks"
        )
        
        $missingSections = @()
        foreach ($section in $requiredSections) {
            if ($contributingContent -notmatch [regex]::Escape($section)) {
                $missingSections += $section
            }
        }
        
        if ($missingSections.Count -gt 0) {
            Write-Host "Missing documentation sections:" -ForegroundColor Yellow
            $missingSections | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
            return $false
        }
        
        return $true
    }
    catch {
        Write-Host "Documentation check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
} "Documentation is complete with all required sections" "Documentation is missing required sections"

if ($testResults.Documentation) { $passedTests++ }

# Final Summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan

Write-Host "Tests passed: $passedTests / $totalTests" -ForegroundColor White

# Detailed results
foreach ($test in $testResults.GetEnumerator()) {
    $status = if ($test.Value) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($test.Value) { "Green" } else { "Red" }
    Write-Host "$status $($test.Key)" -ForegroundColor $color
}

# Overall result
if ($passedTests -eq $totalTests) {
    Write-Host "`n🎉 REPOSITORY VERIFICATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host "The repository is clean and ready for deployment." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Commit any remaining changes" -ForegroundColor White
    Write-Host "2. Push to GitHub: git push origin main" -ForegroundColor White
    Write-Host "3. Verify GitHub push succeeds without file size errors" -ForegroundColor White
    
    exit 0
} else {
    Write-Host "`n⚠️  REPOSITORY VERIFICATION INCOMPLETE" -ForegroundColor Yellow
    Write-Host "Some tests failed. Please address the issues above." -ForegroundColor Yellow
    Write-Host "`nRecommended actions:" -ForegroundColor Cyan
    Write-Host "1. Review failed tests and fix issues" -ForegroundColor White
    Write-Host "2. Re-run verification: scripts/verify-clean-repo.ps1" -ForegroundColor White
    Write-Host "3. Contact maintainers if issues persist" -ForegroundColor White
    
    exit 1
}

Write-Host "`nRepository verification completed." -ForegroundColor Cyan
