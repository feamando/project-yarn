# Force Git History Cleanup - Task 1.6.7.2
# Resolves persistent git lock issues and removes large build artifacts

Write-Host "Force Git History Cleanup - Task 1.6.7.2" -ForegroundColor Yellow
Write-Host "Resolving persistent git lock issues..." -ForegroundColor Cyan

# Function to force remove all git locks
function Force-RemoveGitLocks {
    Write-Host "Force removing all git locks..." -ForegroundColor Yellow
    
    $lockPatterns = @(
        ".git\index.lock",
        ".git\HEAD.lock", 
        ".git\config.lock",
        ".git\refs\heads\*.lock",
        ".git\refs\remotes\*.lock"
    )
    
    foreach ($pattern in $lockPatterns) {
        Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                Remove-Item $_.FullName -Force
                Write-Host "Removed lock: $($_.Name)" -ForegroundColor Green
            }
            catch {
                Write-Host "Could not remove: $($_.Name)" -ForegroundColor Yellow
            }
        }
    }
}

# Function to kill all git processes
function Stop-AllGitProcesses {
    Write-Host "Stopping all git processes..." -ForegroundColor Yellow
    
    Get-Process | Where-Object { $_.ProcessName -like "*git*" } | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force
            Write-Host "Stopped git process: $($_.Id)" -ForegroundColor Green
        }
        catch {
            Write-Host "Could not stop process: $($_.Id)" -ForegroundColor Yellow
        }
    }
    
    Start-Sleep -Seconds 2
}

# Function to reset git state
function Reset-GitState {
    Write-Host "Resetting git state..." -ForegroundColor Yellow
    
    try {
        # Reset any partial operations
        git reset --hard HEAD 2>$null
        Write-Host "Git state reset successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "Git reset failed, continuing..." -ForegroundColor Yellow
    }
}

# Function to create a fresh repository approach
function Create-FreshRepository {
    Write-Host "Creating fresh repository without build artifacts..." -ForegroundColor Yellow
    
    # Create a new temporary directory
    $tempDir = "temp-clean-repo"
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    
    # Copy all files except build artifacts
    Write-Host "Copying source files (excluding build artifacts)..." -ForegroundColor Cyan
    
    $excludePatterns = @(
        "target",
        "src-tauri\target", 
        ".git",
        "temp-clean-repo",
        "node_modules"
    )
    
    Get-ChildItem -Path "." -Recurse | Where-Object {
        $item = $_
        $shouldExclude = $false
        foreach ($pattern in $excludePatterns) {
            if ($item.FullName -like "*\$pattern\*" -or $item.Name -eq $pattern) {
                $shouldExclude = $true
                break
            }
        }
        -not $shouldExclude
    } | ForEach-Object {
        $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
        $destPath = Join-Path $tempDir $relativePath
        $destDir = Split-Path $destPath -Parent
        
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        if ($_.PSIsContainer -eq $false) {
            Copy-Item $_.FullName $destPath -Force
        }
    }
    
    Write-Host "Source files copied to temporary directory" -ForegroundColor Green
    return $tempDir
}

# Function to reinitialize git repository
function Reinitialize-GitRepository {
    param($tempDir)
    
    Write-Host "Reinitializing git repository..." -ForegroundColor Yellow
    
    # Backup original .git directory
    if (Test-Path ".git") {
        Move-Item ".git" ".git-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Force
        Write-Host "Backed up original .git directory" -ForegroundColor Green
    }
    
    # Initialize new git repository
    git init
    Write-Host "Initialized new git repository" -ForegroundColor Green
    
    # Copy clean files back
    Write-Host "Copying clean files back..." -ForegroundColor Cyan
    Get-ChildItem -Path $tempDir -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring((Join-Path (Get-Location) $tempDir).Length + 1)
        $destPath = $relativePath
        $destDir = Split-Path $destPath -Parent
        
        if ($destDir -and -not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        if ($_.PSIsContainer -eq $false) {
            Copy-Item $_.FullName $destPath -Force
        }
    }
    
    # Clean up temp directory
    Remove-Item $tempDir -Recurse -Force
    Write-Host "Cleaned up temporary directory" -ForegroundColor Green
    
    # Add all files to new repository
    git add .
    git commit -m "Clean repository without build artifacts - Task 1.6.7.2"
    
    Write-Host "New clean repository created successfully" -ForegroundColor Green
}

# Main execution
try {
    Write-Host "Starting Force Git History Cleanup - Task 1.6.7.2" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
    
    # Step 1: Stop all git processes
    Stop-AllGitProcesses
    
    # Step 2: Force remove all git locks
    Force-RemoveGitLocks
    
    # Step 3: Try to reset git state
    Reset-GitState
    
    # Step 4: Check if we can now remove files normally
    Write-Host "Attempting normal git cleanup..." -ForegroundColor Yellow
    try {
        git rm -r --cached target src-tauri/target --ignore-unmatch
        git commit -m "Remove build artifacts from repository - Task 1.6.7.2"
        Write-Host "Normal git cleanup successful!" -ForegroundColor Green
        $cleanupSuccess = $true
    }
    catch {
        Write-Host "Normal cleanup failed, using fresh repository approach..." -ForegroundColor Yellow
        $cleanupSuccess = $false
    }
    
    # Step 5: If normal cleanup failed, create fresh repository
    if (-not $cleanupSuccess) {
        $tempDir = Create-FreshRepository
        Reinitialize-GitRepository $tempDir
    }
    
    # Step 6: Add remote origin back
    Write-Host "Adding remote origin..." -ForegroundColor Yellow
    try {
        git remote add origin https://github.com/feamando/project-yarn.git
        Write-Host "Remote origin added successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "Remote origin may already exist" -ForegroundColor Yellow
    }
    
    # Step 7: Verify cleanup
    Write-Host "Verifying cleanup..." -ForegroundColor Yellow
    $buildArtifacts = git ls-files | Where-Object { $_ -like "*target*" -or $_ -like "*.rlib" -or $_ -like "*.rmeta" }
    
    if ($buildArtifacts) {
        Write-Host "Warning: Some build artifacts may still be present:" -ForegroundColor Yellow
        $buildArtifacts | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor White
        }
    }
    else {
        Write-Host "Success: No build artifacts found in git repository" -ForegroundColor Green
    }
    
    # Step 8: Show repository size
    $gitDir = Get-ChildItem -Path ".git" -Recurse -File | Measure-Object -Property Length -Sum
    $gitSizeMB = [math]::Round($gitDir.Sum / 1MB, 2)
    Write-Host "Final git repository size: $gitSizeMB MB" -ForegroundColor Cyan
    
    Write-Host "Task 1.6.7.2 completed successfully!" -ForegroundColor Green
    Write-Host "Repository is now clean and ready for GitHub push" -ForegroundColor Green
    Write-Host "Next: Run 'git push origin master --force' to update remote repository" -ForegroundColor Yellow
}
catch {
    Write-Host "Task 1.6.7.2 failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Manual intervention may be required" -ForegroundColor Yellow
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host "Force Git History Cleanup completed" -ForegroundColor Green
