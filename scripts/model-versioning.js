#!/usr/bin/env node

/**
 * Model Versioning Management Script
 * Handles model version checking, updates, and rollbacks
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class ModelVersionManager {
    constructor() {
        this.projectRoot = process.cwd();
        this.modelsDir = path.join(this.projectRoot, 'models');
        this.registryPath = path.join(this.modelsDir, 'registry.json');
        this.localStatePath = path.join(this.modelsDir, 'local-state.json');
        this.backupDir = path.join(this.modelsDir, 'backups');
        this.appVersion = this.getAppVersion();
    }

    getAppVersion() {
        try {
            const packageJson = require(path.join(this.projectRoot, 'package.json'));
            return packageJson.version || '1.0.0';
        } catch (error) {
            console.warn('Could not read app version from package.json, using default');
            return '1.0.0';
        }
    }

    async ensureDirectories() {
        await fs.mkdir(this.modelsDir, { recursive: true });
        await fs.mkdir(this.backupDir, { recursive: true });
    }

    async loadRegistry() {
        try {
            const content = await fs.readFile(this.registryPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            // Create default registry if none exists
            const defaultRegistry = {
                models: {
                    'phi-3-mini': {
                        model_id: 'phi-3-mini',
                        name: 'Phi-3 Mini',
                        description: 'Microsoft Phi-3 Mini language model',
                        current_version: '1.0.0',
                        versions: {
                            '1.0.0': {
                                model_id: 'phi-3-mini',
                                version: '1.0.0',
                                checksum: 'sha256:placeholder_checksum',
                                download_url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/phi3-mini-4k-instruct-cpu-int4-rtn-block-32-acc-level-4.onnx',
                                size_bytes: 2147483648,
                                compatibility: ['>=1.0.0'],
                                release_date: new Date().toISOString(),
                                changelog: 'Initial release of Phi-3 Mini model',
                                deprecated: false,
                                minimum_ram_gb: 4,
                                recommended_ram_gb: 8,
                                variant: 'cpu-int4'
                            }
                        },
                        tags: ['language-model', 'microsoft', 'phi-3'],
                        category: 'language-model'
                    }
                },
                registry_version: '1.0.0',
                last_updated: new Date().toISOString()
            };
            await this.saveRegistry(defaultRegistry);
            return defaultRegistry;
        }
    }

    async saveRegistry(registry) {
        await fs.writeFile(this.registryPath, JSON.stringify(registry, null, 2));
    }

    async loadLocalState() {
        try {
            const content = await fs.readFile(this.localStatePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            const defaultState = {
                installed_models: {},
                last_check: new Date().toISOString(),
                auto_update_enabled: false
            };
            await this.saveLocalState(defaultState);
            return defaultState;
        }
    }

    async saveLocalState(state) {
        await fs.writeFile(this.localStatePath, JSON.stringify(state, null, 2));
    }

    async checkForUpdates() {
        console.log('🔍 Checking for model updates...');
        
        const registry = await this.loadRegistry();
        const localState = await this.loadLocalState();
        const updates = [];

        for (const [modelId, installedModel] of Object.entries(localState.installed_models)) {
            const modelInfo = registry.models[modelId];
            if (!modelInfo) {
                console.warn(`⚠️  Model ${modelId} not found in registry`);
                continue;
            }

            const currentVersion = installedModel.version;
            const latestVersion = modelInfo.current_version;

            if (currentVersion !== latestVersion) {
                const latestModelVersion = modelInfo.versions[latestVersion];
                if (latestModelVersion && this.isCompatible(latestModelVersion.compatibility)) {
                    const updateType = this.determineUpdateType(currentVersion, latestVersion);
                    
                    updates.push({
                        model_id: modelId,
                        current_version: currentVersion,
                        latest_version: latestVersion,
                        update_type: updateType,
                        changelog: latestModelVersion.changelog,
                        size_bytes: latestModelVersion.size_bytes,
                        breaking_changes: this.hasBreakingChanges(currentVersion, latestVersion)
                    });
                }
            }
        }

        // Update last check time
        localState.last_check = new Date().toISOString();
        await this.saveLocalState(localState);

        return updates;
    }

    async updateModel(modelId, targetVersion = null) {
        console.log(`🔄 Updating model: ${modelId}`);
        
        const registry = await this.loadRegistry();
        const localState = await this.loadLocalState();

        const modelInfo = registry.models[modelId];
        if (!modelInfo) {
            throw new Error(`Model ${modelId} not found in registry`);
        }

        const updateVersion = targetVersion || modelInfo.current_version;
        const modelVersion = modelInfo.versions[updateVersion];
        
        if (!modelVersion) {
            throw new Error(`Version ${updateVersion} not found for model ${modelId}`);
        }

        // Check compatibility
        if (!this.isCompatible(modelVersion.compatibility)) {
            throw new Error(`Model ${modelId}@${updateVersion} is not compatible with app version ${this.appVersion}`);
        }

        // Create backup of current model if it exists
        const installedModel = localState.installed_models[modelId];
        if (installedModel) {
            console.log(`📦 Creating backup of ${modelId}@${installedModel.version}`);
            await this.createBackup(modelId, installedModel.version, installedModel.file_path);
        }

        // Download and install the new version
        const fileName = `${modelId}-${updateVersion}.onnx`;
        const filePath = path.join(this.modelsDir, fileName);
        
        console.log(`⬇️  Downloading ${modelId}@${updateVersion}...`);
        await this.downloadModel(modelVersion.download_url, filePath);

        // Verify checksum
        console.log(`🔐 Verifying checksum...`);
        const actualChecksum = await this.calculateChecksum(filePath);
        const expectedChecksum = modelVersion.checksum.replace('sha256:', '');
        
        if (actualChecksum !== expectedChecksum) {
            await fs.unlink(filePath);
            throw new Error(`Checksum mismatch for ${modelId}@${updateVersion}`);
        }

        // Update local state
        localState.installed_models[modelId] = {
            model_id: modelId,
            version: updateVersion,
            installed_at: new Date().toISOString(),
            last_used: new Date().toISOString(),
            file_path: filePath,
            checksum: actualChecksum,
            size_bytes: modelVersion.size_bytes
        };

        await this.saveLocalState(localState);
        console.log(`✅ Successfully updated ${modelId} to version ${updateVersion}`);
    }

    async rollbackModel(modelId, targetVersion = null) {
        console.log(`⏪ Rolling back model: ${modelId}`);
        
        const registry = await this.loadRegistry();
        const localState = await this.loadLocalState();

        const modelInfo = registry.models[modelId];
        if (!modelInfo) {
            throw new Error(`Model ${modelId} not found in registry`);
        }

        const installedModel = localState.installed_models[modelId];
        if (!installedModel) {
            throw new Error(`Model ${modelId} is not installed`);
        }

        // Determine rollback version
        const rollbackVersion = targetVersion || this.findPreviousVersion(modelInfo, installedModel.version);
        const modelVersion = modelInfo.versions[rollbackVersion];
        
        if (!modelVersion) {
            throw new Error(`Version ${rollbackVersion} not found for model ${modelId}`);
        }

        // Check if backup exists
        const backupPath = path.join(this.backupDir, `${modelId}-${rollbackVersion}.onnx`);
        const targetPath = path.join(this.modelsDir, `${modelId}-${rollbackVersion}.onnx`);

        try {
            await fs.access(backupPath);
            console.log(`📦 Restoring from backup: ${rollbackVersion}`);
            await fs.copyFile(backupPath, targetPath);
        } catch (error) {
            console.log(`⬇️  Downloading rollback version: ${rollbackVersion}`);
            await this.downloadModel(modelVersion.download_url, targetPath);
        }

        // Update local state
        localState.installed_models[modelId] = {
            model_id: modelId,
            version: rollbackVersion,
            installed_at: new Date().toISOString(),
            last_used: new Date().toISOString(),
            file_path: targetPath,
            checksum: modelVersion.checksum.replace('sha256:', ''),
            size_bytes: modelVersion.size_bytes
        };

        await this.saveLocalState(localState);
        console.log(`✅ Successfully rolled back ${modelId} to version ${rollbackVersion}`);
    }

    async getVersionHistory(modelId) {
        const registry = await this.loadRegistry();
        const modelInfo = registry.models[modelId];
        
        if (!modelInfo) {
            throw new Error(`Model ${modelId} not found in registry`);
        }

        const versions = Object.values(modelInfo.versions)
            .sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
        
        return versions;
    }

    async listInstalledModels() {
        const localState = await this.loadLocalState();
        return Object.values(localState.installed_models);
    }

    async cleanupOldBackups(keepCount = 3) {
        console.log(`🧹 Cleaning up old backups (keeping ${keepCount} most recent)...`);
        
        try {
            const backupFiles = await fs.readdir(this.backupDir);
            const modelBackups = {};

            // Group backups by model
            for (const file of backupFiles) {
                const match = file.match(/^(.+)-(.+)\.onnx$/);
                if (match) {
                    const [, modelId, version] = match;
                    if (!modelBackups[modelId]) {
                        modelBackups[modelId] = [];
                    }
                    
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);
                    modelBackups[modelId].push({
                        file,
                        path: filePath,
                        version,
                        mtime: stats.mtime
                    });
                }
            }

            // Clean up old backups for each model
            for (const [modelId, backups] of Object.entries(modelBackups)) {
                backups.sort((a, b) => b.mtime - a.mtime);
                const toDelete = backups.slice(keepCount);
                
                for (const backup of toDelete) {
                    await fs.unlink(backup.path);
                    console.log(`🗑️  Deleted old backup: ${backup.file}`);
                }
            }
        } catch (error) {
            console.warn('Warning: Could not clean up backups:', error.message);
        }
    }

    // Helper methods
    isCompatible(compatibility) {
        for (const constraint of compatibility) {
            if (constraint.startsWith('>=')) {
                const minVersion = constraint.slice(2);
                if (this.compareVersions(this.appVersion, minVersion) >= 0) {
                    return true;
                }
            } else if (constraint === '*') {
                return true;
            }
        }
        return false;
    }

    determineUpdateType(current, latest) {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);

        if (currentParts[0] !== latestParts[0]) return 'major';
        if (currentParts[1] !== latestParts[1]) return 'minor';
        return 'patch';
    }

    hasBreakingChanges(current, latest) {
        return this.determineUpdateType(current, latest) === 'major';
    }

    findPreviousVersion(modelInfo, currentVersion) {
        const versions = Object.keys(modelInfo.versions).sort();
        const currentIndex = versions.indexOf(currentVersion);
        
        if (currentIndex > 0) {
            return versions[currentIndex - 1];
        }
        
        throw new Error(`No previous version found for ${modelInfo.model_id}@${currentVersion}`);
    }

    compareVersions(a, b) {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;
            
            if (aPart > bPart) return 1;
            if (aPart < bPart) return -1;
        }
        
        return 0;
    }

    async createBackup(modelId, version, sourcePath) {
        const backupPath = path.join(this.backupDir, `${modelId}-${version}.onnx`);
        
        try {
            await fs.access(sourcePath);
            await fs.copyFile(sourcePath, backupPath);
        } catch (error) {
            console.warn(`Warning: Could not create backup for ${modelId}@${version}:`, error.message);
        }
    }

    async downloadModel(url, filePath) {
        // Placeholder for actual download implementation
        // In production, use a proper HTTP client like axios or node-fetch
        console.log(`📥 Downloading from: ${url}`);
        console.log(`📁 Saving to: ${filePath}`);
        
        // For now, create a placeholder file
        await fs.writeFile(filePath, 'placeholder model data');
    }

    async calculateChecksum(filePath) {
        const fileBuffer = await fs.readFile(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    }
}

// CLI Interface
async function main() {
    const manager = new ModelVersionManager();
    await manager.ensureDirectories();

    const command = process.argv[2];
    const args = process.argv.slice(3);

    try {
        switch (command) {
            case 'check':
                const updates = await manager.checkForUpdates();
                if (updates.length === 0) {
                    console.log('✅ All models are up to date');
                } else {
                    console.log(`📋 Found ${updates.length} available updates:`);
                    for (const update of updates) {
                        console.log(`  • ${update.model_id}: ${update.current_version} → ${update.latest_version} (${update.update_type})`);
                        if (update.breaking_changes) {
                            console.log(`    ⚠️  Breaking changes detected`);
                        }
                    }
                }
                break;

            case 'update':
                const modelId = args[0];
                const targetVersion = args[1];
                if (!modelId) {
                    console.error('❌ Model ID is required');
                    process.exit(1);
                }
                await manager.updateModel(modelId, targetVersion);
                break;

            case 'rollback':
                const rollbackModelId = args[0];
                const rollbackVersion = args[1];
                if (!rollbackModelId) {
                    console.error('❌ Model ID is required');
                    process.exit(1);
                }
                await manager.rollbackModel(rollbackModelId, rollbackVersion);
                break;

            case 'history':
                const historyModelId = args[0];
                if (!historyModelId) {
                    console.error('❌ Model ID is required');
                    process.exit(1);
                }
                const history = await manager.getVersionHistory(historyModelId);
                console.log(`📜 Version history for ${historyModelId}:`);
                for (const version of history) {
                    console.log(`  • ${version.version} (${new Date(version.release_date).toLocaleDateString()})`);
                    console.log(`    ${version.changelog}`);
                }
                break;

            case 'list':
                const installed = await manager.listInstalledModels();
                if (installed.length === 0) {
                    console.log('📦 No models installed');
                } else {
                    console.log('📦 Installed models:');
                    for (const model of installed) {
                        console.log(`  • ${model.model_id}@${model.version} (${(model.size_bytes / 1024 / 1024 / 1024).toFixed(2)} GB)`);
                    }
                }
                break;

            case 'cleanup':
                const keepCount = parseInt(args[0]) || 3;
                await manager.cleanupOldBackups(keepCount);
                break;

            default:
                console.log('Model Versioning Management');
                console.log('');
                console.log('Usage:');
                console.log('  node model-versioning.js check                    - Check for updates');
                console.log('  node model-versioning.js update <model-id> [ver]  - Update model');
                console.log('  node model-versioning.js rollback <model-id> [ver]- Rollback model');
                console.log('  node model-versioning.js history <model-id>       - Show version history');
                console.log('  node model-versioning.js list                     - List installed models');
                console.log('  node model-versioning.js cleanup [keep-count]     - Clean old backups');
                break;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ModelVersionManager };
