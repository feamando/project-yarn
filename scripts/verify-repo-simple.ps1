# Simple Repository Verification Script - Task 1.6.7.7
# Verifies that the repository is clean and ready for deployment

Write-Host "Repository Verification - Task 1.6.7.7" -ForegroundColor Yellow
Write-Host "Verifying clean repository state..." -ForegroundColor Cyan

$testsPassed = 0
$totalTests = 6

# Test 1: Git Repository Status
Write-Host "`n1. Testing Git Repository Status..." -ForegroundColor Cyan
try {
    $gitStatus = git status --porcelain 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Git repository is accessible" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ❌ Git repository check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Git status check failed" -ForegroundColor Red
}

# Test 2: .gitignore File
Write-Host "`n2. Testing .gitignore Configuration..." -ForegroundColor Cyan
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $requiredPatterns = @("target/", "*.rlib", "*.rmeta", "*.bin", "*.onnx", "models/")
    $foundPatterns = 0
    
    foreach ($pattern in $requiredPatterns) {
        if ($gitignoreContent -match [regex]::Escape($pattern)) {
            $foundPatterns++
        }
    }
    
    if ($foundPatterns -eq $requiredPatterns.Count) {
        Write-Host "   ✅ .gitignore has all required patterns" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ❌ .gitignore missing some patterns ($foundPatterns/$($requiredPatterns.Count))" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .gitignore file not found" -ForegroundColor Red
}

# Test 3: Large Files Check
Write-Host "`n3. Testing for Large Files..." -ForegroundColor Cyan
try {
    $largeFiles = Get-ChildItem -Recurse -File | Where-Object { 
        $_.Length -gt (50 * 1MB) -and -not ($_.FullName -match '\.git\\')
    } | Select-Object -First 5
    
    if ($largeFiles.Count -eq 0) {
        Write-Host "   ✅ No large files found (>50MB)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ❌ Large files detected:" -ForegroundColor Red
        $largeFiles | ForEach-Object { Write-Host "      - $($_.Name)" -ForegroundColor Yellow }
    }
} catch {
    Write-Host "   ❌ Large files check failed" -ForegroundColor Red
}

# Test 4: Git Hooks
Write-Host "`n4. Testing Git Hooks Installation..." -ForegroundColor Cyan
$hooks = @("pre-commit", "pre-push", "commit-msg")
$installedHooks = 0

foreach ($hook in $hooks) {
    if (Test-Path ".git/hooks/$hook") {
        $installedHooks++
    }
}

if ($installedHooks -eq $hooks.Count) {
    Write-Host "   ✅ All git hooks installed ($installedHooks/$($hooks.Count))" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "   ❌ Some git hooks missing ($installedHooks/$($hooks.Count))" -ForegroundColor Red
}

# Test 5: Validation Scripts
Write-Host "`n5. Testing Validation Scripts..." -ForegroundColor Cyan
$scripts = @("scripts/validate-commit.ps1", "scripts/setup-git-hooks.ps1")
$foundScripts = 0

foreach ($script in $scripts) {
    if (Test-Path $script) {
        $foundScripts++
    }
}

if ($foundScripts -eq $scripts.Count) {
    Write-Host "   ✅ All validation scripts present ($foundScripts/$($scripts.Count))" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "   ❌ Some validation scripts missing ($foundScripts/$($scripts.Count))" -ForegroundColor Red
}

# Test 6: Documentation
Write-Host "`n6. Testing Documentation..." -ForegroundColor Cyan
if (Test-Path "CONTRIBUTING.md") {
    $contributingContent = Get-Content "CONTRIBUTING.md" -Raw
    if ($contributingContent -match "Repository Cleanup" -and $contributingContent -match "Large File Prevention") {
        Write-Host "   ✅ Documentation includes cleanup sections" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ❌ Documentation missing cleanup sections" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ CONTRIBUTING.md not found" -ForegroundColor Red
}

# Summary
Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "="*50 -ForegroundColor Cyan
Write-Host "Tests passed: $testsPassed / $totalTests" -ForegroundColor White

if ($testsPassed -eq $totalTests) {
    Write-Host "`n🎉 REPOSITORY VERIFICATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host "The repository is clean and ready for deployment." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Commit any remaining changes" -ForegroundColor White
    Write-Host "2. Push to GitHub: git push origin main" -ForegroundColor White
    Write-Host "3. Verify GitHub push succeeds" -ForegroundColor White
    exit 0
} else {
    Write-Host "`n⚠️  REPOSITORY VERIFICATION INCOMPLETE" -ForegroundColor Yellow
    Write-Host "Some tests failed. Please address the issues above." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nRepository verification completed." -ForegroundColor Cyan
