#!/bin/bash

# Generate Tauri Signing Key Script
# This script generates a new Ed25519 key pair for signing Tauri updates

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔐 Generating Tauri signing key pair..."

# Create .tauri directory if it doesn't exist
mkdir -p "$HOME/.tauri"

# Generate private key
PRIVATE_KEY_PATH="$HOME/.tauri/signing-key"
PUBLIC_KEY_PATH="$HOME/.tauri/signing-key.pub"

if [ -f "$PRIVATE_KEY_PATH" ]; then
    echo "⚠️  Private key already exists at $PRIVATE_KEY_PATH"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Existing key preserved."
        exit 1
    fi
fi

# Generate Ed25519 key pair
echo "📝 Generating Ed25519 key pair..."
openssl genpkey -algorithm Ed25519 -out "$PRIVATE_KEY_PATH"

# Extract public key
openssl pkey -in "$PRIVATE_KEY_PATH" -pubout -out "$PUBLIC_KEY_PATH"

# Set proper permissions
chmod 600 "$PRIVATE_KEY_PATH"
chmod 644 "$PUBLIC_KEY_PATH"

echo "✅ Key pair generated successfully!"
echo "   Private key: $PRIVATE_KEY_PATH"
echo "   Public key: $PUBLIC_KEY_PATH"

# Extract public key in base64 format for Tauri config
PUBLIC_KEY_B64=$(openssl pkey -in "$PRIVATE_KEY_PATH" -pubout -outform DER | base64 -w 0)

echo ""
echo "📋 Configuration for tauri.conf.json:"
echo "   Add this to your updater configuration:"
echo "   \"pubkey\": \"$PUBLIC_KEY_B64\""

# Generate GitHub Actions secrets
echo ""
echo "🔧 GitHub Actions Secrets:"
echo "   Set the following secrets in your GitHub repository:"
echo ""
echo "   TAURI_PRIVATE_KEY:"
cat "$PRIVATE_KEY_PATH" | base64 -w 0
echo ""
echo ""
echo "   TAURI_KEY_PASSWORD: (leave empty if no password was set)"

# Update tauri.conf.json if it exists
TAURI_CONFIG="$PROJECT_ROOT/src-tauri/tauri.conf.json"
if [ -f "$TAURI_CONFIG" ]; then
    echo ""
    echo "🔄 Updating tauri.conf.json..."
    
    # Create backup
    cp "$TAURI_CONFIG" "$TAURI_CONFIG.backup"
    
    # Update public key in config (requires jq)
    if command -v jq &> /dev/null; then
        jq --arg pubkey "$PUBLIC_KEY_B64" '.tauri.updater.pubkey = $pubkey' "$TAURI_CONFIG" > "$TAURI_CONFIG.tmp"
        mv "$TAURI_CONFIG.tmp" "$TAURI_CONFIG"
        echo "✅ Updated tauri.conf.json with new public key"
    else
        echo "⚠️  jq not found. Please manually update the pubkey in tauri.conf.json"
        echo "   Replace the pubkey value with: $PUBLIC_KEY_B64"
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add the TAURI_PRIVATE_KEY secret to your GitHub repository"
echo "2. Commit and push your changes"
echo "3. Create a new tag to trigger a release: git tag v1.0.0 && git push origin v1.0.0"
echo ""
echo "⚠️  IMPORTANT: Keep your private key secure and never commit it to version control!"
