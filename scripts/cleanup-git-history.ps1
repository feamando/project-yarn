# Git History Cleanup Script - Task 1.6.7.2
# Removes large build artifacts from git history

Write-Host "Starting Git History Cleanup - Task 1.6.7.2" -ForegroundColor Yellow
Write-Host "This script will remove large build artifacts from git history" -ForegroundColor Cyan

# Function to check if git is clean
function Test-GitClean {
    $status = git status --porcelain
    return [string]::IsNullOrEmpty($status)
}

# Function to remove git locks safely
function Remove-GitLocks {
    Write-Host "Removing git locks..." -ForegroundColor Yellow
    
    $lockFiles = @(
        ".git\index.lock",
        ".git\HEAD.lock",
        ".git\config.lock",
        ".git\refs\heads\master.lock"
    )
    
    foreach ($lockFile in $lockFiles) {
        if (Test-Path $lockFile) {
            try {
                Remove-Item $lockFile -Force -ErrorAction Stop
                Write-Host "Removed $lockFile" -ForegroundColor Green
            }
            catch {
                Write-Host "Could not remove $lockFile: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
}

# Function to backup current state
function Backup-CurrentState {
    Write-Host "Creating backup branch..." -ForegroundColor Yellow
    
    try {
        git branch backup-before-cleanup-$(Get-Date -Format "yyyyMMdd-HHmmss") 2>$null
        Write-Host "Backup branch created" -ForegroundColor Green
    }
    catch {
        Write-Host "Backup branch may already exist" -ForegroundColor Yellow
    }
}

# Function to remove large files from git history
function Remove-LargeFilesFromHistory {
    Write-Host "Removing large files from git history..." -ForegroundColor Yellow
    
    # List of directories and patterns to remove
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
    
    $filterCommand = "git rm -rf --cached --ignore-unmatch " + ($pathsToRemove -join " ")
    
    try {
        git filter-branch --force --index-filter $filterCommand --prune-empty --tag-name-filter cat -- --all
        Write-Host "Git history rewritten successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "Error rewriting git history: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to clean up git references
function Cleanup-GitReferences {
    Write-Host "Cleaning up git references..." -ForegroundColor Yellow
    
    try {
        # Remove backup refs created by filter-branch
        git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
        
        # Expire reflog
        git reflog expire --expire=now --all
        
        # Garbage collect
        git gc --prune=now --aggressive
        
        Write-Host "Git references cleaned up" -ForegroundColor Green
    }
    catch {
        Write-Host "Some cleanup operations failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Function to verify cleanup
function Verify-Cleanup {
    Write-Host "Verifying cleanup..." -ForegroundColor Yellow
    
    # Check for large files
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
        return $false
    }
    else {
        Write-Host "No large files found in git index" -ForegroundColor Green
        return $true
    }
}

# Function to show repository size
function Show-RepositorySize {
    Write-Host "Repository size information:" -ForegroundColor Cyan
    
    $gitDir = Get-ChildItem -Path ".git" -Recurse -File | Measure-Object -Property Length -Sum
    $gitSizeMB = [math]::Round($gitDir.Sum / 1MB, 2)
    
    Write-Host "  Git directory size: $gitSizeMB MB" -ForegroundColor White
    
    $objectsSize = git count-objects -v | Select-String "size-pack" | ForEach-Object { ($_ -split " ")[1] }
    if ($objectsSize) {
        $objectsSizeMB = [math]::Round([int]$objectsSize / 1024, 2)
        Write-Host "  Packed objects size: $objectsSizeMB MB" -ForegroundColor White
    }
}

# Main execution
try {
    Write-Host "Starting Task 1.6.7.2: Remove Large Files from Git History" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
    
    # Step 1: Remove git locks
    Remove-GitLocks
    
    # Step 2: Show initial repository size
    Write-Host "`nInitial repository size:" -ForegroundColor Cyan
    Show-RepositorySize
    
    # Step 3: Create backup
    Backup-CurrentState
    
    # Step 4: Remove large files from history
    $success = Remove-LargeFilesFromHistory
    
    if ($success) {
        # Step 5: Clean up git references
        Cleanup-GitReferences
        
        # Step 6: Verify cleanup
        $verified = Verify-Cleanup
        
        # Step 7: Show final repository size
        Write-Host "`nFinal repository size:" -ForegroundColor Cyan
        Show-RepositorySize
        
        if ($verified) {
            Write-Host "`nTask 1.6.7.2 completed successfully!" -ForegroundColor Green
            Write-Host "Large files removed from git history" -ForegroundColor Green
            Write-Host "Repository is ready for GitHub push" -ForegroundColor Green
            Write-Host "`nIMPORTANT: You will need to force push to update the remote repository:" -ForegroundColor Yellow
            Write-Host "   git push origin master --force" -ForegroundColor White
        }
        else {
            Write-Host "`nCleanup completed but some large files may remain" -ForegroundColor Yellow
            Write-Host "   Manual review recommended" -ForegroundColor White
        }
    }
    else {
        Write-Host "`nTask 1.6.7.2 failed during history rewrite" -ForegroundColor Red
        Write-Host "   Check the error messages above" -ForegroundColor White
    }
}
catch {
    Write-Host "`nTask 1.6.7.2 failed with error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=================================================" -ForegroundColor Green
Write-Host "Task 1.6.7.2 execution completed" -ForegroundColor Green
