# Git History Cleanup Script - Task 1.6.7.2
# Removes large build artifacts from git history

Write-Host "Starting Git History Cleanup - Task 1.6.7.2" -ForegroundColor Yellow
Write-Host "This script will remove large build artifacts from git history" -ForegroundColor Cyan

# Remove git locks
Write-Host "Removing git locks..." -ForegroundColor Yellow
$lockFiles = @(".git\index.lock", ".git\HEAD.lock", ".git\config.lock")
foreach ($lockFile in $lockFiles) {
    if (Test-Path $lockFile) {
        try {
            Remove-Item $lockFile -Force -ErrorAction Stop
            Write-Host "Removed $lockFile" -ForegroundColor Green
        }
        catch {
            Write-Host "Could not remove $lockFile" -ForegroundColor Yellow
        }
    }
}

# Create backup branch
Write-Host "Creating backup branch..." -ForegroundColor Yellow
try {
    git branch backup-before-cleanup-$(Get-Date -Format "yyyyMMdd-HHmmss") 2>$null
    Write-Host "Backup branch created" -ForegroundColor Green
}
catch {
    Write-Host "Backup branch may already exist" -ForegroundColor Yellow
}

# Show initial repository size
Write-Host "Initial repository size:" -ForegroundColor Cyan
$gitDir = Get-ChildItem -Path ".git" -Recurse -File | Measure-Object -Property Length -Sum
$gitSizeMB = [math]::Round($gitDir.Sum / 1MB, 2)
Write-Host "  Git directory size: $gitSizeMB MB" -ForegroundColor White

# Remove large files from git history
Write-Host "Removing large files from git history..." -ForegroundColor Yellow

# List of paths to remove
$pathsToRemove = @(
    "target/",
    "src-tauri/target/",
    "*.rlib",
    "*.rmeta",
    "*.pdb"
)

Write-Host "Files/directories to remove:" -ForegroundColor Cyan
foreach ($path in $pathsToRemove) {
    Write-Host "  - $path" -ForegroundColor White
}

# Remove from current index first
Write-Host "Removing from current index..." -ForegroundColor Yellow
foreach ($path in $pathsToRemove) {
    try {
        git rm -r --cached $path --ignore-unmatch 2>$null
        Write-Host "Removed $path from index" -ForegroundColor Green
    }
    catch {
        Write-Host "$path not in index or already removed" -ForegroundColor Yellow
    }
}

# Use git filter-branch to remove from history
Write-Host "Rewriting git history (this may take several minutes)..." -ForegroundColor Yellow

$filterCommand = "git rm -rf --cached --ignore-unmatch target src-tauri/target"

try {
    git filter-branch --force --index-filter $filterCommand --prune-empty --tag-name-filter cat -- --all
    Write-Host "Git history rewritten successfully" -ForegroundColor Green
    
    # Clean up git references
    Write-Host "Cleaning up git references..." -ForegroundColor Yellow
    
    # Remove backup refs created by filter-branch
    git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
    
    # Expire reflog
    git reflog expire --expire=now --all
    
    # Garbage collect
    git gc --prune=now --aggressive
    
    Write-Host "Git references cleaned up" -ForegroundColor Green
    
    # Show final repository size
    Write-Host "Final repository size:" -ForegroundColor Cyan
    $gitDirFinal = Get-ChildItem -Path ".git" -Recurse -File | Measure-Object -Property Length -Sum
    $gitSizeFinalMB = [math]::Round($gitDirFinal.Sum / 1MB, 2)
    Write-Host "  Git directory size: $gitSizeFinalMB MB" -ForegroundColor White
    
    $sizeSavedMB = $gitSizeMB - $gitSizeFinalMB
    Write-Host "  Size saved: $sizeSavedMB MB" -ForegroundColor Green
    
    # Verify cleanup
    Write-Host "Verifying cleanup..." -ForegroundColor Yellow
    $largeFiles = git ls-files | Where-Object { 
        if (Test-Path $_) {
            $size = (Get-Item $_).Length
            $size -gt 50MB
        }
    }
    
    if ($largeFiles) {
        Write-Host "Large files still present:" -ForegroundColor Yellow
        foreach ($file in $largeFiles) {
            $size = [math]::Round((Get-Item $file).Length / 1MB, 2)
            Write-Host "  - $file ($size MB)" -ForegroundColor White
        }
    }
    else {
        Write-Host "No large files found in git index" -ForegroundColor Green
    }
    
    Write-Host "Task 1.6.7.2 completed successfully!" -ForegroundColor Green
    Write-Host "Large files removed from git history" -ForegroundColor Green
    Write-Host "Repository is ready for GitHub push" -ForegroundColor Green
    Write-Host "IMPORTANT: You will need to force push to update the remote repository:" -ForegroundColor Yellow
    Write-Host "   git push origin master --force" -ForegroundColor White
}
catch {
    Write-Host "Error rewriting git history: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Task 1.6.7.2 failed during history rewrite" -ForegroundColor Red
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host "Task 1.6.7.2 execution completed" -ForegroundColor Green
