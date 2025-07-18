#!/bin/bash
# Pre-commit Validation Script - Task 1.6.7.4 (Bash version)
# Prevents large files and build artifacts from being committed to git
# Usage: Run automatically via git pre-commit hook or manually before commits

set -e

# Configuration
MAX_SIZE_MB=${1:-50}
VERBOSE=${VERBOSE:-false}
DRY_RUN=${DRY_RUN:-false}

echo "Pre-commit Validation - Task 1.6.7.4"
echo "Checking for large files and build artifacts..."

# Blocked patterns array
BLOCKED_PATTERNS=(
    # Build artifacts - Rust
    "target/*"
    "*.rlib"
    "*.rmeta"
    "*.pdb"
    "*.exe"
    "*.dll"
    "*.so"
    "*.dylib"
    "*.a"
    "*.lib"
    
    # Build artifacts - Tauri
    "src-tauri/target/*"
    "*.app"
    "*.dmg"
    "*.msi"
    "*.deb"
    "*.AppImage"
    "*.rpm"
    "*.pkg"
    
    # Build artifacts - Node.js
    "node_modules/*"
    "dist/*"
    "build/*"
    ".next/*"
    ".nuxt/*"
    ".output/*"
    ".vite/*"
    ".turbo/*"
    "*.tsbuildinfo"
    
    # AI Models (large files)
    "models/*"
    "*.bin"
    "*.onnx"
    "*.safetensors"
    "*.pt"
    "*.pth"
    "*.pytorch"
    "*.model"
    "*.weights"
    "*.h5"
    "*.pb"
    "*.tflite"
    "*.gguf"
    "*.ggml"
    
    # Temporary and cache files
    "*.tmp"
    "*.temp"
    "*.cache"
    ".cache/*"
    "temp/*"
    "tmp/*"
)

# Allowed large file patterns
ALLOWED_LARGE_PATTERNS=(
    "*.md"
    "*.json"
    "*.toml"
    "*.yml"
    "*.yaml"
)

# Function to check if file matches blocked patterns
check_blocked_pattern() {
    local file="$1"
    for pattern in "${BLOCKED_PATTERNS[@]}"; do
        if [[ "$file" == $pattern ]]; then
            return 0  # Match found
        fi
    done
    return 1  # No match
}

# Function to check if file is allowed to be large
check_allowed_large_file() {
    local file="$1"
    for pattern in "${ALLOWED_LARGE_PATTERNS[@]}"; do
        if [[ "$file" == $pattern ]]; then
            return 0  # Match found
        fi
    done
    return 1  # No match
}

# Function to format file size
format_file_size() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes} B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$(echo "scale=2; $bytes/1024" | bc) KB"
    elif [ $bytes -lt 1073741824 ]; then
        echo "$(echo "scale=2; $bytes/1048576" | bc) MB"
    else
        echo "$(echo "scale=2; $bytes/1073741824" | bc) GB"
    fi
}

# Main validation logic
main() {
    local has_errors=false
    local total_files=0
    local blocked_files=0
    local large_files=0
    
    # Get staged files for commit
    local staged_files
    if ! staged_files=$(git diff --cached --name-only 2>/dev/null); then
        echo "Warning: Could not get staged files from git."
        return 1
    fi
    
    if [ -z "$staged_files" ]; then
        echo "No files staged for commit."
        return 0
    fi
    
    local file_count=$(echo "$staged_files" | wc -l)
    echo "Validating $file_count staged files..."
    
    while IFS= read -r file; do
        [ -z "$file" ] && continue
        ((total_files++))
        
        if [ "$VERBOSE" = "true" ]; then
            echo "  Checking: $file"
        fi
        
        # Check if file exists (might be deleted)
        if [ ! -f "$file" ]; then
            if [ "$VERBOSE" = "true" ]; then
                echo "    File deleted, skipping size check"
            fi
            continue
        fi
        
        # Check against blocked patterns
        if check_blocked_pattern "$file"; then
            ((blocked_files++))
            echo "❌ BLOCKED: $file"
            echo "   Reason: Matches blocked pattern (build artifact)"
            has_errors=true
            continue
        fi
        
        # Check file size
        if [ -f "$file" ]; then
            local file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            local size_mb=$(echo "scale=2; $file_size/1048576" | bc)
            local size_formatted=$(format_file_size $file_size)
            
            if (( $(echo "$size_mb > $MAX_SIZE_MB" | bc -l) )); then
                # Check if it's an allowed large file type
                if check_allowed_large_file "$file"; then
                    echo "⚠️  LARGE (allowed): $file ($size_formatted)"
                    echo "   Reason: Large file but allowed file type"
                else
                    ((large_files++))
                    echo "❌ TOO LARGE: $file ($size_formatted)"
                    echo "   Reason: Exceeds $MAX_SIZE_MB MB size limit"
                    has_errors=true
                fi
            elif [ "$VERBOSE" = "true" ] && (( $(echo "$size_mb > 1" | bc -l) )); then
                echo "✅ OK: $file ($size_formatted)"
            fi
        fi
    done <<< "$staged_files"
    
    # Summary
    echo ""
    echo "============================================================"
    echo "VALIDATION SUMMARY"
    echo "============================================================"
    echo "Total files checked: $total_files"
    echo "Blocked files: $blocked_files"
    echo "Large files: $large_files"
    echo "Max file size limit: $MAX_SIZE_MB MB"
    
    if [ "$has_errors" = true ]; then
        echo ""
        echo "❌ COMMIT BLOCKED!"
        echo "Please resolve the issues above before committing."
        echo ""
        echo "To fix these issues:"
        echo "1. Remove or unstage blocked files: git reset HEAD <file>"
        echo "2. Add files to .gitignore if they should be excluded"
        echo "3. Reduce file sizes or split large files"
        echo "4. Use model management scripts for AI models"
        
        if [ "$DRY_RUN" != "true" ]; then
            exit 1
        fi
    else
        echo ""
        echo "✅ VALIDATION PASSED!"
        echo "All files are within size limits and no blocked patterns detected."
        
        if [ "$DRY_RUN" != "true" ]; then
            exit 0
        fi
    fi
    
    echo ""
    echo "Pre-commit validation completed."
}

# Check for required commands
if ! command -v bc &> /dev/null; then
    echo "Error: 'bc' command is required but not installed."
    exit 1
fi

# Run main function
main "$@"
