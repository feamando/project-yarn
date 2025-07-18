# Pre-commit Validation Script - Task 1.6.7.4
# Prevents large files and build artifacts from being committed to git
# Usage: Run automatically via git pre-commit hook or manually before commits

param(
    [int]$MaxSizeMB = 50,
    [switch]$Verbose = $false,
    [switch]$DryRun = $false
)

Write-Host "Pre-commit Validation - Task 1.6.7.4" -ForegroundColor Yellow
Write-Host "Checking for large files and build artifacts..." -ForegroundColor Cyan

# Configuration
$blockedPatterns = @(
    # Build artifacts - Rust
    "target/*",
    "*.rlib",
    "*.rmeta", 
    "*.pdb",
    "*.exe",
    "*.dll",
    "*.so",
    "*.dylib",
    "*.a",
    "*.lib",
    
    # Build artifacts - Tauri
    "src-tauri/target/*",
    "*.app",
    "*.dmg", 
    "*.msi",
    "*.deb",
    "*.AppImage",
    "*.rpm",
    "*.pkg",
    
    # Build artifacts - Node.js
    "node_modules/*",
    "dist/*",
    "build/*",
    ".next/*",
    ".nuxt/*",
    ".output/*",
    ".vite/*",
    ".turbo/*",
    "*.tsbuildinfo",
    
    # AI Models (large files)
    "models/*",
    "*.bin",
    "*.onnx",
    "*.safetensors",
    "*.pt",
    "*.pth",
    "*.pytorch",
    "*.model",
    "*.weights",
    "*.h5",
    "*.pb",
    "*.tflite",
    "*.gguf",
    "*.ggml",
    
    # Temporary and cache files
    "*.tmp",
    "*.temp",
    "*.cache",
    ".cache/*",
    "temp/*",
    "tmp/*"
)

$allowedLargeFiles = @(
    # Allow specific documentation or configuration files that might be large
    "*.md",
    "*.json",
    "*.toml",
    "*.yml",
    "*.yaml"
)

# Function to check if file matches blocked patterns
function Test-BlockedPattern {
    param($filePath)
    
    foreach ($pattern in $blockedPatterns) {
        if ($filePath -like $pattern) {
            return $true
        }
    }
    return $false
}

# Function to check if file is allowed to be large
function Test-AllowedLargeFile {
    param($filePath)
    
    foreach ($pattern in $allowedLargeFiles) {
        if ($filePath -like $pattern) {
            return $true
        }
    }
    return $false
}

# Function to format file size
function Format-FileSize {
    param($bytes)
    
    if ($bytes -lt 1KB) { return "$bytes B" }
    elseif ($bytes -lt 1MB) { return "{0:N2} KB" -f ($bytes / 1KB) }
    elseif ($bytes -lt 1GB) { return "{0:N2} MB" -f ($bytes / 1MB) }
    else { return "{0:N2} GB" -f ($bytes / 1GB) }
}

# Main validation logic
try {
    $hasErrors = $false
    $totalFiles = 0
    $blockedFiles = 0
    $largeFiles = 0
    
    # Get staged files for commit
    $stagedFiles = @()
    try {
        $gitOutput = git diff --cached --name-only 2>$null
        if ($LASTEXITCODE -eq 0 -and $gitOutput) {
            $stagedFiles = $gitOutput -split "`n" | Where-Object { $_.Trim() -ne "" }
        }
    }
    catch {
        Write-Host "Warning: Could not get staged files from git. Checking all files in current directory." -ForegroundColor Yellow
        $stagedFiles = Get-ChildItem -Recurse -File | ForEach-Object { $_.FullName.Substring((Get-Location).Path.Length + 1) }
    }
    
    if ($stagedFiles.Count -eq 0) {
        Write-Host "No files staged for commit." -ForegroundColor Green
        exit 0
    }
    
    Write-Host "Validating $($stagedFiles.Count) staged files..." -ForegroundColor Cyan
    
    foreach ($file in $stagedFiles) {
        $totalFiles++
        
        if ($Verbose) {
            Write-Host "  Checking: $file" -ForegroundColor Gray
        }
        
        # Check if file exists (might be deleted)
        if (-not (Test-Path $file)) {
            if ($Verbose) {
                Write-Host "    File deleted, skipping size check" -ForegroundColor Gray
            }
            continue
        }
        
        # Check against blocked patterns
        if (Test-BlockedPattern $file) {
            $blockedFiles++
            Write-Host "❌ BLOCKED: $file" -ForegroundColor Red
            Write-Host "   Reason: Matches blocked pattern (build artifact)" -ForegroundColor Red
            $hasErrors = $true
            continue
        }
        
        # Check file size
        try {
            $fileInfo = Get-Item $file
            $sizeMB = $fileInfo.Length / 1MB
            $sizeFormatted = Format-FileSize $fileInfo.Length
            
            if ($sizeMB -gt $MaxSizeMB) {
                # Check if it's an allowed large file type
                if (Test-AllowedLargeFile $file) {
                    Write-Host "⚠️  LARGE (allowed): $file ($sizeFormatted)" -ForegroundColor Yellow
                    Write-Host "   Reason: Large file but allowed file type" -ForegroundColor Yellow
                }
                else {
                    $largeFiles++
                    Write-Host "❌ TOO LARGE: $file ($sizeFormatted)" -ForegroundColor Red
                    Write-Host "   Reason: Exceeds $MaxSizeMB MB size limit" -ForegroundColor Red
                    $hasErrors = $true
                }
            }
            elseif ($Verbose -and $sizeMB -gt 1) {
                Write-Host "✅ OK: $file ($sizeFormatted)" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "⚠️  WARNING: Could not check size of $file" -ForegroundColor Yellow
        }
    }
    
    # Summary
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "VALIDATION SUMMARY" -ForegroundColor Cyan
    Write-Host "="*60 -ForegroundColor Cyan
    Write-Host "Total files checked: $totalFiles" -ForegroundColor White
    Write-Host "Blocked files: $blockedFiles" -ForegroundColor $(if ($blockedFiles -gt 0) { "Red" } else { "Green" })
    Write-Host "Large files: $largeFiles" -ForegroundColor $(if ($largeFiles -gt 0) { "Red" } else { "Green" })
    Write-Host "Max file size limit: $MaxSizeMB MB" -ForegroundColor White
    
    if ($hasErrors) {
        Write-Host "`n❌ COMMIT BLOCKED!" -ForegroundColor Red
        Write-Host "Please resolve the issues above before committing." -ForegroundColor Red
        Write-Host "`nTo fix these issues:" -ForegroundColor Yellow
        Write-Host "1. Remove or unstage blocked files: git reset HEAD <file>" -ForegroundColor Yellow
        Write-Host "2. Add files to .gitignore if they should be excluded" -ForegroundColor Yellow
        Write-Host "3. Reduce file sizes or split large files" -ForegroundColor Yellow
        Write-Host "4. Use model management scripts for AI models" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            exit 1
        }
    }
    else {
        Write-Host "`n✅ VALIDATION PASSED!" -ForegroundColor Green
        Write-Host "All files are within size limits and no blocked patterns detected." -ForegroundColor Green
        
        if (-not $DryRun) {
            exit 0
        }
    }
}
catch {
    Write-Host "`n❌ VALIDATION ERROR!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Gray
    
    if (-not $DryRun) {
        exit 1
    }
}

Write-Host "`nPre-commit validation completed." -ForegroundColor Cyan
