#!/usr/bin/env node

/**
 * Model Update Script for Project Yarn
 * 
 * This script handles updating AI models to newer versions, checking for updates,
 * and managing model version compatibility.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { ModelManager, Logger, SystemChecker } = require('./setup-models.js');

class ModelUpdater {
    constructor() {
        this.manager = new ModelManager();
        this.updateResults = {
            updated: [],
            skipped: [],
            failed: [],
            newModels: []
        };
    }

    async initialize() {
        await this.manager.initialize();
    }

    async checkForUpdates() {
        Logger.info('Checking for model updates...');
        
        const updates = [];
        const installedModels = await this.manager.getInstallationStatus();
        
        for (const modelStatus of installedModels.filter(m => m.installed)) {
            const model = this.manager.config.models[modelStatus.id];
            if (!model) continue;

            const currentVersion = modelStatus.version || '1.0.0';
            const availableVersion = model.version;

            if (this.isNewerVersion(availableVersion, currentVersion)) {
                updates.push({
                    id: model.id,
                    name: model.name,
                    currentVersion,
                    availableVersion,
                    size: model.variants[model.defaultVariant].size
                });
            }
        }

        return updates;
    }

    async checkForNewModels() {
        Logger.info('Checking for new models...');
        
        const newModels = [];
        const installedModels = await this.manager.getInstallationStatus();
        const installedIds = new Set(installedModels.filter(m => m.installed).map(m => m.id));

        for (const [modelId, model] of Object.entries(this.manager.config.models)) {
            if (!installedIds.has(modelId)) {
                newModels.push({
                    id: modelId,
                    name: model.name,
                    version: model.version,
                    description: model.description,
                    size: model.variants[model.defaultVariant].size,
                    priority: model.priority || 999
                });
            }
        }

        // Sort by priority
        newModels.sort((a, b) => a.priority - b.priority);
        return newModels;
    }

    isNewerVersion(available, current) {
        const parseVersion = (version) => {
            return version.split('.').map(num => parseInt(num, 10));
        };

        const availableParts = parseVersion(available);
        const currentParts = parseVersion(current);

        for (let i = 0; i < Math.max(availableParts.length, currentParts.length); i++) {
            const availablePart = availableParts[i] || 0;
            const currentPart = currentParts[i] || 0;

            if (availablePart > currentPart) return true;
            if (availablePart < currentPart) return false;
        }

        return false;
    }

    async updateModel(modelId, force = false) {
        const model = this.manager.config.models[modelId];
        if (!model) {
            throw new Error(`Model ${modelId} not found in configuration`);
        }

        Logger.info(`Updating ${model.name}...`);

        try {
            // Check if update is actually needed
            const isInstalled = await this.manager.isModelInstalled(modelId);
            if (isInstalled && !force) {
                const installInfo = this.manager.status.installed[`${modelId}-${model.defaultVariant}`];
                if (installInfo && installInfo.version === model.version) {
                    this.updateResults.skipped.push(`${model.name} is already up to date (${model.version})`);
                    return;
                }
            }

            // Backup current model if it exists
            const modelPath = path.join(process.cwd(), 'models', `${modelId}-${model.defaultVariant}.onnx`);
            const backupPath = `${modelPath}.backup`;

            if (isInstalled) {
                try {
                    await fs.copyFile(modelPath, backupPath);
                    Logger.info(`Created backup: ${path.basename(backupPath)}`);
                } catch (error) {
                    Logger.warn(`Failed to create backup: ${error.message}`);
                }
            }

            // Install/update the model
            await this.manager.installModel(modelId, null, true);

            // Remove backup if update was successful
            try {
                await fs.unlink(backupPath);
            } catch {
                // Backup might not exist, ignore
            }

            this.updateResults.updated.push(`${model.name} updated to ${model.version}`);
            Logger.success(`Successfully updated ${model.name}`);

        } catch (error) {
            // Restore backup if update failed
            const modelPath = path.join(process.cwd(), 'models', `${modelId}-${model.defaultVariant}.onnx`);
            const backupPath = `${modelPath}.backup`;

            try {
                await fs.access(backupPath);
                await fs.copyFile(backupPath, modelPath);
                await fs.unlink(backupPath);
                Logger.info(`Restored backup for ${model.name}`);
            } catch {
                // No backup to restore
            }

            this.updateResults.failed.push(`${model.name}: ${error.message}`);
            throw error;
        }
    }

    async updateAllModels(force = false) {
        Logger.info('Updating all models...');

        const updates = await this.checkForUpdates();
        const newModels = await this.checkForNewModels();

        if (updates.length === 0 && newModels.length === 0) {
            Logger.info('All models are up to date and no new models available');
            return;
        }

        // Update existing models
        for (const update of updates) {
            try {
                await this.updateModel(update.id, force);
            } catch (error) {
                Logger.error(`Failed to update ${update.name}: ${error.message}`);
            }
        }

        // Install new models (if requested)
        if (newModels.length > 0) {
            Logger.info(`Found ${newModels.length} new models available`);
            for (const newModel of newModels) {
                Logger.info(`  • ${newModel.name} (${Math.round(newModel.size / 1024 / 1024)}MB)`);
            }
        }
    }

    async cleanupOldVersions() {
        Logger.info('Cleaning up old model versions...');

        const modelsDir = path.join(process.cwd(), 'models');
        
        try {
            const files = await fs.readdir(modelsDir);
            const backupFiles = files.filter(file => file.endsWith('.backup'));

            for (const backupFile of backupFiles) {
                const backupPath = path.join(modelsDir, backupFile);
                await fs.unlink(backupPath);
                Logger.info(`Removed old backup: ${backupFile}`);
            }

            if (backupFiles.length === 0) {
                Logger.info('No old backups to clean up');
            }

        } catch (error) {
            Logger.warn(`Failed to clean up old versions: ${error.message}`);
        }
    }

    async refreshModelRegistry() {
        Logger.info('Refreshing model registry...');

        // In a real implementation, this would fetch the latest model registry
        // from a remote source. For now, we'll just validate the current configuration.

        try {
            // Validate current configuration
            const models = Object.values(this.manager.config.models);
            let validModels = 0;

            for (const model of models) {
                if (model.id && model.name && model.variants && model.defaultVariant) {
                    validModels++;
                } else {
                    Logger.warn(`Invalid model configuration: ${model.id || 'unknown'}`);
                }
            }

            Logger.success(`Validated ${validModels} models in registry`);

            // Save updated configuration
            await this.manager.saveConfiguration();

        } catch (error) {
            Logger.error(`Failed to refresh model registry: ${error.message}`);
            throw error;
        }
    }

    printUpdateSummary() {
        console.log('\n📊 Update Summary');
        console.log('==================');
        console.log(`✅ Updated: ${this.updateResults.updated.length}`);
        console.log(`⏭️  Skipped: ${this.updateResults.skipped.length}`);
        console.log(`❌ Failed: ${this.updateResults.failed.length}`);

        if (this.updateResults.updated.length > 0) {
            console.log('\n✅ Successfully Updated:');
            this.updateResults.updated.forEach(item => console.log(`  • ${item}`));
        }

        if (this.updateResults.skipped.length > 0) {
            console.log('\n⏭️  Skipped (Already Up to Date):');
            this.updateResults.skipped.forEach(item => console.log(`  • ${item}`));
        }

        if (this.updateResults.failed.length > 0) {
            console.log('\n❌ Failed Updates:');
            this.updateResults.failed.forEach(item => console.log(`  • ${item}`));
        }
    }
}

// CLI Interface
class UpdateCLI {
    static async showUpdateMenu() {
        console.log('\n🔄 Project Yarn - Model Updates');
        console.log('================================');
        console.log('1. Check for updates');
        console.log('2. Update all models');
        console.log('3. Update specific model');
        console.log('4. Install new models');
        console.log('5. Clean up old versions');
        console.log('6. Refresh model registry');
        console.log('7. Back to main menu');
        console.log('================================');
    }

    static async promptUser(question) {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            readline.question(question, (answer) => {
                readline.close();
                resolve(answer.trim());
            });
        });
    }

    static async run() {
        const updater = new ModelUpdater();
        await updater.initialize();

        while (true) {
            await this.showUpdateMenu();
            const choice = await this.promptUser('\nSelect an option (1-7): ');

            try {
                switch (choice) {
                    case '1':
                        const updates = await updater.checkForUpdates();
                        const newModels = await updater.checkForNewModels();
                        
                        console.log('\n📋 Available Updates:');
                        if (updates.length === 0) {
                            console.log('  No updates available for installed models');
                        } else {
                            updates.forEach(update => {
                                console.log(`  • ${update.name}: ${update.currentVersion} → ${update.availableVersion}`);
                            });
                        }

                        console.log('\n🆕 New Models Available:');
                        if (newModels.length === 0) {
                            console.log('  No new models available');
                        } else {
                            newModels.forEach(model => {
                                console.log(`  • ${model.name} (${Math.round(model.size / 1024 / 1024)}MB)`);
                            });
                        }
                        break;

                    case '2':
                        const forceAll = await this.promptUser('Force update all models? (y/N): ');
                        await updater.updateAllModels(forceAll.toLowerCase() === 'y');
                        updater.printUpdateSummary();
                        break;

                    case '3':
                        const installedModels = (await updater.manager.getInstallationStatus()).filter(m => m.installed);
                        if (installedModels.length === 0) {
                            Logger.info('No models are currently installed');
                            break;
                        }
                        console.log('\nInstalled Models:');
                        installedModels.forEach((model, index) => {
                            console.log(`${index + 1}. ${model.name}`);
                        });
                        const modelChoice = await this.promptUser('Enter model number to update: ');
                        const modelIndex = parseInt(modelChoice) - 1;
                        if (modelIndex >= 0 && modelIndex < installedModels.length) {
                            const force = await this.promptUser('Force update? (y/N): ');
                            await updater.updateModel(installedModels[modelIndex].id, force.toLowerCase() === 'y');
                            updater.printUpdateSummary();
                        } else {
                            Logger.error('Invalid model selection');
                        }
                        break;

                    case '4':
                        const availableNewModels = await updater.checkForNewModels();
                        if (availableNewModels.length === 0) {
                            Logger.info('No new models available to install');
                            break;
                        }
                        console.log('\nNew Models Available:');
                        availableNewModels.forEach((model, index) => {
                            console.log(`${index + 1}. ${model.name} (${Math.round(model.size / 1024 / 1024)}MB)`);
                            console.log(`   ${model.description}`);
                        });
                        const newModelChoice = await this.promptUser('Enter model number to install (or "all"): ');
                        
                        if (newModelChoice.toLowerCase() === 'all') {
                            for (const model of availableNewModels) {
                                try {
                                    await updater.manager.installModel(model.id);
                                    updater.updateResults.newModels.push(model.name);
                                } catch (error) {
                                    Logger.error(`Failed to install ${model.name}: ${error.message}`);
                                }
                            }
                        } else {
                            const newModelIndex = parseInt(newModelChoice) - 1;
                            if (newModelIndex >= 0 && newModelIndex < availableNewModels.length) {
                                await updater.manager.installModel(availableNewModels[newModelIndex].id);
                                updater.updateResults.newModels.push(availableNewModels[newModelIndex].name);
                            } else {
                                Logger.error('Invalid model selection');
                            }
                        }
                        break;

                    case '5':
                        await updater.cleanupOldVersions();
                        break;

                    case '6':
                        await updater.refreshModelRegistry();
                        break;

                    case '7':
                        return;

                    default:
                        Logger.error('Invalid option. Please select 1-7.');
                }
            } catch (error) {
                Logger.error(`Operation failed: ${error.message}`);
            }

            await this.promptUser('\nPress Enter to continue...');
        }
    }
}

// Main execution
async function main() {
    try {
        const args = process.argv.slice(2);
        
        if (args.includes('--help') || args.includes('-h')) {
            console.log('Project Yarn Model Update Script');
            console.log('Usage: node update-models.js [options]');
            console.log('Options:');
            console.log('  --check          Check for updates only');
            console.log('  --update-all     Update all models');
            console.log('  --force          Force update even if versions match');
            console.log('  --cleanup        Clean up old model versions');
            console.log('  --refresh        Refresh model registry');
            console.log('  --help, -h       Show this help message');
            return;
        }

        const updater = new ModelUpdater();
        await updater.initialize();

        if (args.includes('--check')) {
            const updates = await updater.checkForUpdates();
            const newModels = await updater.checkForNewModels();
            
            console.log('Available Updates:');
            if (updates.length === 0) {
                console.log('  No updates available');
            } else {
                updates.forEach(update => {
                    console.log(`  ${update.name}: ${update.currentVersion} → ${update.availableVersion}`);
                });
            }

            console.log('\nNew Models:');
            if (newModels.length === 0) {
                console.log('  No new models available');
            } else {
                newModels.forEach(model => {
                    console.log(`  ${model.name}`);
                });
            }
            return;
        }

        if (args.includes('--update-all')) {
            const force = args.includes('--force');
            await updater.updateAllModels(force);
            updater.printUpdateSummary();
            return;
        }

        if (args.includes('--cleanup')) {
            await updater.cleanupOldVersions();
            return;
        }

        if (args.includes('--refresh')) {
            await updater.refreshModelRegistry();
            return;
        }

        // Default: run interactive CLI
        await UpdateCLI.run();

    } catch (error) {
        Logger.error(`Update failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { ModelUpdater, UpdateCLI };
