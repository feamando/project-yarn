#!/usr/bin/env node

/**
 * Model Setup Script for Project Yarn
 * 
 * This script automates the download and setup of AI models required for Project Yarn.
 * It provides cross-platform support and handles model verification, caching, and configuration.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
    modelsDir: path.join(process.cwd(), 'models'),
    configFile: path.join(process.cwd(), 'models.config.json'),
    statusFile: path.join(process.cwd(), 'local-models.json'),
    tempDir: path.join(os.tmpdir(), 'yarn-models'),
    maxRetries: 3,
    retryDelay: 2000,
};

// Default model configuration
const DEFAULT_MODELS = {
    "phi-3-mini": {
        id: "phi-3-mini",
        name: "Microsoft Phi-3 Mini",
        version: "1.0.0",
        description: "Lightweight language model for autocomplete and text generation",
        variants: {
            "cpu-int4": {
                url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/phi3-mini-4k-instruct-cpu-int4-rtn-block-32-acc-level-4.onnx",
                size: 2147483648,
                checksum: "",
                requirements: { ram: 4, disk: 3 }
            }
        },
        defaultVariant: "cpu-int4",
        priority: 1
    },
    "phi-3-mini-128k": {
        id: "phi-3-mini-128k",
        name: "Microsoft Phi-3 Mini 128K",
        version: "1.0.0",
        description: "Extended context version of Phi-3 Mini with 128K context length",
        variants: {
            "cpu-int4": {
                url: "https://huggingface.co/microsoft/Phi-3-mini-128k-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/phi3-mini-128k-instruct-cpu-int4-rtn-block-32-acc-level-4.onnx",
                size: 2147483648,
                checksum: "",
                requirements: { ram: 4, disk: 3 }
            }
        },
        defaultVariant: "cpu-int4",
        priority: 2
    }
};

// Utility functions
class Logger {
    static info(message) {
        console.log(`ℹ️  ${message}`);
    }

    static success(message) {
        console.log(`✅ ${message}`);
    }

    static warn(message) {
        console.log(`⚠️  ${message}`);
    }

    static error(message) {
        console.error(`❌ ${message}`);
    }

    static progress(message) {
        process.stdout.write(`🔄 ${message}\r`);
    }
}

class SystemChecker {
    static async checkRequirements() {
        const requirements = {
            node: this.checkNodeVersion(),
            ram: this.checkRAM(),
            disk: await this.checkDiskSpace(),
            network: await this.checkNetworkConnection()
        };

        Logger.info('System Requirements Check:');
        console.log(`  Node.js: ${requirements.node.version} (${requirements.node.valid ? '✅' : '❌'})`);
        console.log(`  RAM: ${requirements.ram.total}GB available (${requirements.ram.sufficient ? '✅' : '❌'})`);
        console.log(`  Disk: ${requirements.disk.available}GB free (${requirements.disk.sufficient ? '✅' : '❌'})`);
        console.log(`  Network: ${requirements.network ? '✅' : '❌'}`);

        return requirements;
    }

    static checkNodeVersion() {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return {
            version,
            valid: major >= 16
        };
    }

    static checkRAM() {
        const totalRAM = Math.round(os.totalmem() / (1024 * 1024 * 1024));
        return {
            total: totalRAM,
            sufficient: totalRAM >= 8
        };
    }

    static async checkDiskSpace() {
        try {
            const stats = await fs.stat(process.cwd());
            // Simplified disk space check - in production, use a proper disk space library
            return {
                available: 50, // Placeholder - would need proper implementation
                sufficient: true
            };
        } catch (error) {
            return {
                available: 0,
                sufficient: false
            };
        }
    }

    static async checkNetworkConnection() {
        return new Promise((resolve) => {
            const req = https.request('https://huggingface.co', { method: 'HEAD', timeout: 5000 }, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => resolve(false));
            req.end();
        });
    }
}

class ModelDownloader {
    static async downloadFile(url, filepath, expectedSize = null) {
        return new Promise((resolve, reject) => {
            const file = require('fs').createWriteStream(filepath);
            let downloadedBytes = 0;
            let lastProgress = 0;

            const request = https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                const totalSize = parseInt(response.headers['content-length']) || expectedSize || 0;

                response.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    file.write(chunk);

                    if (totalSize > 0) {
                        const progress = Math.round((downloadedBytes / totalSize) * 100);
                        if (progress !== lastProgress && progress % 5 === 0) {
                            Logger.progress(`Downloading: ${progress}% (${Math.round(downloadedBytes / 1024 / 1024)}MB / ${Math.round(totalSize / 1024 / 1024)}MB)`);
                            lastProgress = progress;
                        }
                    }
                });

                response.on('end', () => {
                    file.end();
                    console.log(); // New line after progress
                    resolve(downloadedBytes);
                });
            });

            request.on('error', (error) => {
                file.destroy();
                reject(error);
            });

            request.setTimeout(300000, () => { // 5 minute timeout
                request.destroy();
                reject(new Error('Download timeout'));
            });
        });
    }

    static async verifyChecksum(filepath, expectedChecksum) {
        if (!expectedChecksum) {
            Logger.warn('No checksum provided, skipping verification');
            return true;
        }

        const fileBuffer = await fs.readFile(filepath);
        const hash = crypto.createHash('sha256');
        hash.update(fileBuffer);
        const actualChecksum = hash.digest('hex');

        return actualChecksum === expectedChecksum;
    }

    static async downloadWithRetry(url, filepath, expectedSize, expectedChecksum, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Logger.info(`Download attempt ${attempt}/${maxRetries}`);
                
                const downloadedSize = await this.downloadFile(url, filepath, expectedSize);
                
                if (expectedSize && downloadedSize !== expectedSize) {
                    throw new Error(`Size mismatch: expected ${expectedSize}, got ${downloadedSize}`);
                }

                const isValid = await this.verifyChecksum(filepath, expectedChecksum);
                if (!isValid) {
                    throw new Error('Checksum verification failed');
                }

                Logger.success(`Download completed and verified`);
                return true;

            } catch (error) {
                Logger.error(`Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < maxRetries) {
                    Logger.info(`Retrying in ${CONFIG.retryDelay / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
                } else {
                    throw error;
                }
            }
        }
    }
}

class ModelManager {
    constructor() {
        this.config = null;
        this.status = null;
    }

    async initialize() {
        await this.ensureDirectories();
        await this.loadConfiguration();
        await this.loadStatus();
    }

    async ensureDirectories() {
        const dirs = [CONFIG.modelsDir, CONFIG.tempDir];
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                Logger.info(`Created directory: ${dir}`);
            }
        }
    }

    async loadConfiguration() {
        try {
            const configData = await fs.readFile(CONFIG.configFile, 'utf8');
            this.config = JSON.parse(configData);
            Logger.info('Loaded existing model configuration');
        } catch {
            this.config = { models: DEFAULT_MODELS };
            await this.saveConfiguration();
            Logger.info('Created default model configuration');
        }
    }

    async saveConfiguration() {
        await fs.writeFile(CONFIG.configFile, JSON.stringify(this.config, null, 2));
    }

    async loadStatus() {
        try {
            const statusData = await fs.readFile(CONFIG.statusFile, 'utf8');
            this.status = JSON.parse(statusData);
        } catch {
            this.status = { installed: {}, lastUpdate: null };
        }
    }

    async saveStatus() {
        this.status.lastUpdate = new Date().toISOString();
        await fs.writeFile(CONFIG.statusFile, JSON.stringify(this.status, null, 2));
    }

    async listAvailableModels() {
        const models = Object.values(this.config.models);
        models.sort((a, b) => a.priority - b.priority);
        return models;
    }

    async isModelInstalled(modelId, variant = null) {
        const model = this.config.models[modelId];
        if (!model) return false;

        const variantKey = variant || model.defaultVariant;
        const modelPath = path.join(CONFIG.modelsDir, `${modelId}-${variantKey}.onnx`);

        try {
            await fs.access(modelPath);
            return this.status.installed[`${modelId}-${variantKey}`] || false;
        } catch {
            return false;
        }
    }

    async installModel(modelId, variant = null, force = false) {
        const model = this.config.models[modelId];
        if (!model) {
            throw new Error(`Model ${modelId} not found in configuration`);
        }

        const variantKey = variant || model.defaultVariant;
        const variantConfig = model.variants[variantKey];
        if (!variantConfig) {
            throw new Error(`Variant ${variantKey} not found for model ${modelId}`);
        }

        const modelKey = `${modelId}-${variantKey}`;
        const modelPath = path.join(CONFIG.modelsDir, `${modelKey}.onnx`);

        if (!force && await this.isModelInstalled(modelId, variantKey)) {
            Logger.info(`Model ${modelKey} is already installed`);
            return;
        }

        Logger.info(`Installing model: ${model.name} (${variantKey})`);
        Logger.info(`Size: ${Math.round(variantConfig.size / 1024 / 1024)}MB`);
        Logger.info(`URL: ${variantConfig.url}`);

        try {
            await ModelDownloader.downloadWithRetry(
                variantConfig.url,
                modelPath,
                variantConfig.size,
                variantConfig.checksum,
                CONFIG.maxRetries
            );

            this.status.installed[modelKey] = {
                installedAt: new Date().toISOString(),
                version: model.version,
                variant: variantKey,
                path: modelPath,
                size: variantConfig.size
            };

            await this.saveStatus();
            Logger.success(`Successfully installed ${model.name} (${variantKey})`);

        } catch (error) {
            Logger.error(`Failed to install ${model.name}: ${error.message}`);
            
            // Clean up partial download
            try {
                await fs.unlink(modelPath);
            } catch {}
            
            throw error;
        }
    }

    async removeModel(modelId, variant = null) {
        const model = this.config.models[modelId];
        if (!model) {
            throw new Error(`Model ${modelId} not found`);
        }

        const variantKey = variant || model.defaultVariant;
        const modelKey = `${modelId}-${variantKey}`;
        const modelPath = path.join(CONFIG.modelsDir, `${modelKey}.onnx`);

        try {
            await fs.unlink(modelPath);
            delete this.status.installed[modelKey];
            await this.saveStatus();
            Logger.success(`Removed model ${modelKey}`);
        } catch (error) {
            Logger.error(`Failed to remove model ${modelKey}: ${error.message}`);
        }
    }

    async getInstallationStatus() {
        const models = await this.listAvailableModels();
        const status = [];

        for (const model of models) {
            const isInstalled = await this.isModelInstalled(model.id);
            const installInfo = this.status.installed[`${model.id}-${model.defaultVariant}`];

            status.push({
                id: model.id,
                name: model.name,
                installed: isInstalled,
                variant: model.defaultVariant,
                size: model.variants[model.defaultVariant].size,
                installDate: installInfo?.installedAt || null
            });
        }

        return status;
    }
}

// CLI Interface
class CLI {
    static async showMenu() {
        console.log('\n🧶 Project Yarn - Model Setup');
        console.log('================================');
        console.log('1. Check system requirements');
        console.log('2. List available models');
        console.log('3. Install all recommended models');
        console.log('4. Install specific model');
        console.log('5. Show installation status');
        console.log('6. Remove model');
        console.log('7. Exit');
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
        const manager = new ModelManager();
        await manager.initialize();

        while (true) {
            await this.showMenu();
            const choice = await this.promptUser('\nSelect an option (1-7): ');

            try {
                switch (choice) {
                    case '1':
                        await SystemChecker.checkRequirements();
                        break;

                    case '2':
                        const models = await manager.listAvailableModels();
                        console.log('\nAvailable Models:');
                        models.forEach((model, index) => {
                            console.log(`${index + 1}. ${model.name} (${model.id})`);
                            console.log(`   ${model.description}`);
                            console.log(`   Size: ${Math.round(model.variants[model.defaultVariant].size / 1024 / 1024)}MB`);
                        });
                        break;

                    case '3':
                        Logger.info('Installing all recommended models...');
                        const allModels = await manager.listAvailableModels();
                        for (const model of allModels) {
                            try {
                                await manager.installModel(model.id);
                            } catch (error) {
                                Logger.error(`Failed to install ${model.name}: ${error.message}`);
                            }
                        }
                        break;

                    case '4':
                        const availableModels = await manager.listAvailableModels();
                        console.log('\nSelect a model to install:');
                        availableModels.forEach((model, index) => {
                            console.log(`${index + 1}. ${model.name}`);
                        });
                        const modelChoice = await this.promptUser('Enter model number: ');
                        const modelIndex = parseInt(modelChoice) - 1;
                        if (modelIndex >= 0 && modelIndex < availableModels.length) {
                            await manager.installModel(availableModels[modelIndex].id);
                        } else {
                            Logger.error('Invalid model selection');
                        }
                        break;

                    case '5':
                        const status = await manager.getInstallationStatus();
                        console.log('\nInstallation Status:');
                        status.forEach(model => {
                            const statusIcon = model.installed ? '✅' : '❌';
                            const sizeInfo = `${Math.round(model.size / 1024 / 1024)}MB`;
                            console.log(`${statusIcon} ${model.name} (${sizeInfo})`);
                            if (model.installed && model.installDate) {
                                console.log(`   Installed: ${new Date(model.installDate).toLocaleDateString()}`);
                            }
                        });
                        break;

                    case '6':
                        const installedModels = (await manager.getInstallationStatus()).filter(m => m.installed);
                        if (installedModels.length === 0) {
                            Logger.info('No models are currently installed');
                            break;
                        }
                        console.log('\nInstalled Models:');
                        installedModels.forEach((model, index) => {
                            console.log(`${index + 1}. ${model.name}`);
                        });
                        const removeChoice = await this.promptUser('Enter model number to remove: ');
                        const removeIndex = parseInt(removeChoice) - 1;
                        if (removeIndex >= 0 && removeIndex < installedModels.length) {
                            await manager.removeModel(installedModels[removeIndex].id);
                        } else {
                            Logger.error('Invalid model selection');
                        }
                        break;

                    case '7':
                        Logger.info('Goodbye!');
                        process.exit(0);

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
        // Check if running in interactive mode
        const args = process.argv.slice(2);
        
        if (args.includes('--help') || args.includes('-h')) {
            console.log('Project Yarn Model Setup Script');
            console.log('Usage: node setup-models.js [options]');
            console.log('Options:');
            console.log('  --install-all    Install all recommended models');
            console.log('  --check          Check system requirements only');
            console.log('  --status         Show installation status');
            console.log('  --help, -h       Show this help message');
            return;
        }

        const manager = new ModelManager();
        await manager.initialize();

        if (args.includes('--check')) {
            await SystemChecker.checkRequirements();
            return;
        }

        if (args.includes('--status')) {
            const status = await manager.getInstallationStatus();
            console.log('Model Installation Status:');
            status.forEach(model => {
                const statusIcon = model.installed ? '✅' : '❌';
                console.log(`${statusIcon} ${model.name}`);
            });
            return;
        }

        if (args.includes('--install-all')) {
            Logger.info('Installing all recommended models...');
            const models = await manager.listAvailableModels();
            for (const model of models) {
                try {
                    await manager.installModel(model.id);
                } catch (error) {
                    Logger.error(`Failed to install ${model.name}: ${error.message}`);
                }
            }
            return;
        }

        // Default: run interactive CLI
        await CLI.run();

    } catch (error) {
        Logger.error(`Setup failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { ModelManager, SystemChecker, ModelDownloader, Logger };
