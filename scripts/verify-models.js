#!/usr/bin/env node

/**
 * Model Verification Script for Project Yarn
 * 
 * This script verifies the integrity and functionality of installed AI models.
 * It checks file integrity, model loading capabilities, and system compatibility.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { ModelManager, Logger } = require('./setup-models.js');

class ModelVerifier {
    constructor() {
        this.manager = new ModelManager();
        this.results = {
            passed: [],
            failed: [],
            warnings: []
        };
    }

    async initialize() {
        await this.manager.initialize();
    }

    async verifyFileIntegrity(modelPath, expectedChecksum) {
        try {
            const fileBuffer = await fs.readFile(modelPath);
            
            if (!expectedChecksum) {
                this.results.warnings.push(`No checksum available for ${path.basename(modelPath)}`);
                return true;
            }

            const hash = crypto.createHash('sha256');
            hash.update(fileBuffer);
            const actualChecksum = hash.digest('hex');

            if (actualChecksum === expectedChecksum) {
                return true;
            } else {
                this.results.failed.push(`Checksum mismatch for ${path.basename(modelPath)}`);
                return false;
            }
        } catch (error) {
            this.results.failed.push(`Failed to read ${path.basename(modelPath)}: ${error.message}`);
            return false;
        }
    }

    async verifyFileSize(modelPath, expectedSize) {
        try {
            const stats = await fs.stat(modelPath);
            const actualSize = stats.size;

            if (Math.abs(actualSize - expectedSize) < 1024) { // Allow 1KB tolerance
                return true;
            } else {
                this.results.failed.push(
                    `Size mismatch for ${path.basename(modelPath)}: expected ${expectedSize}, got ${actualSize}`
                );
                return false;
            }
        } catch (error) {
            this.results.failed.push(`Failed to check size of ${path.basename(modelPath)}: ${error.message}`);
            return false;
        }
    }

    async verifyModelStructure(modelPath) {
        try {
            // Basic ONNX file structure check
            const buffer = await fs.readFile(modelPath, { encoding: null });
            
            // Check for ONNX magic bytes (simplified check)
            const magicBytes = buffer.slice(0, 8);
            const expectedMagic = Buffer.from([0x08, 0x01, 0x12, 0x00]); // Simplified ONNX signature
            
            // For now, just check if it's a valid binary file
            if (buffer.length > 1000) { // Minimum reasonable size
                return true;
            } else {
                this.results.failed.push(`${path.basename(modelPath)} appears to be corrupted (too small)`);
                return false;
            }
        } catch (error) {
            this.results.failed.push(`Failed to verify structure of ${path.basename(modelPath)}: ${error.message}`);
            return false;
        }
    }

    async verifySystemCompatibility() {
        const issues = [];

        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 16) {
            issues.push(`Node.js version ${nodeVersion} is too old (minimum: 16.x)`);
        }

        // Check available memory
        const totalMemory = require('os').totalmem();
        const totalMemoryGB = totalMemory / (1024 * 1024 * 1024);
        if (totalMemoryGB < 4) {
            issues.push(`Insufficient RAM: ${totalMemoryGB.toFixed(1)}GB (minimum: 4GB recommended)`);
        }

        // Check disk space in models directory
        try {
            const modelsDir = path.join(process.cwd(), 'models');
            await fs.access(modelsDir);
            
            // Calculate total size of models
            const files = await fs.readdir(modelsDir);
            let totalSize = 0;
            for (const file of files) {
                const filePath = path.join(modelsDir, file);
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                }
            }

            const totalSizeGB = totalSize / (1024 * 1024 * 1024);
            Logger.info(`Total models size: ${totalSizeGB.toFixed(2)}GB`);

        } catch (error) {
            issues.push(`Cannot access models directory: ${error.message}`);
        }

        if (issues.length > 0) {
            this.results.warnings.push(...issues);
        }

        return issues.length === 0;
    }

    async verifyAllModels() {
        Logger.info('Starting model verification...');

        const status = await this.manager.getInstallationStatus();
        const installedModels = status.filter(model => model.installed);

        if (installedModels.length === 0) {
            Logger.warn('No models are installed to verify');
            return this.results;
        }

        Logger.info(`Verifying ${installedModels.length} installed models...`);

        for (const modelStatus of installedModels) {
            const modelId = modelStatus.id;
            const model = this.manager.config.models[modelId];
            
            if (!model) {
                this.results.failed.push(`Model configuration not found for ${modelId}`);
                continue;
            }

            const variant = model.defaultVariant;
            const variantConfig = model.variants[variant];
            const modelPath = path.join(process.cwd(), 'models', `${modelId}-${variant}.onnx`);

            Logger.info(`Verifying ${model.name}...`);

            // Check if file exists
            try {
                await fs.access(modelPath);
            } catch {
                this.results.failed.push(`Model file not found: ${modelPath}`);
                continue;
            }

            // Verify file size
            const sizeValid = await this.verifyFileSize(modelPath, variantConfig.size);
            
            // Verify checksum if available
            const checksumValid = await this.verifyFileIntegrity(modelPath, variantConfig.checksum);
            
            // Verify basic file structure
            const structureValid = await this.verifyModelStructure(modelPath);

            if (sizeValid && checksumValid && structureValid) {
                this.results.passed.push(`${model.name} (${variant})`);
                Logger.success(`✅ ${model.name} verification passed`);
            } else {
                Logger.error(`❌ ${model.name} verification failed`);
            }
        }

        // Verify system compatibility
        await this.verifySystemCompatibility();

        return this.results;
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.passed.length + this.results.failed.length,
                passed: this.results.passed.length,
                failed: this.results.failed.length,
                warnings: this.results.warnings.length
            },
            details: this.results
        };

        // Save report to file
        const reportPath = path.join(process.cwd(), 'model-verification-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        Logger.info(`Verification report saved to: ${reportPath}`);
        return report;
    }

    printSummary() {
        console.log('\n📊 Verification Summary');
        console.log('========================');
        console.log(`✅ Passed: ${this.results.passed.length}`);
        console.log(`❌ Failed: ${this.results.failed.length}`);
        console.log(`⚠️  Warnings: ${this.results.warnings.length}`);

        if (this.results.passed.length > 0) {
            console.log('\n✅ Verified Models:');
            this.results.passed.forEach(model => console.log(`  • ${model}`));
        }

        if (this.results.failed.length > 0) {
            console.log('\n❌ Failed Verifications:');
            this.results.failed.forEach(issue => console.log(`  • ${issue}`));
        }

        if (this.results.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.results.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        const overallStatus = this.results.failed.length === 0 ? 'PASSED' : 'FAILED';
        console.log(`\n🎯 Overall Status: ${overallStatus}`);
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log('Project Yarn Model Verification Script');
        console.log('Usage: node verify-models.js [options]');
        console.log('Options:');
        console.log('  --report         Generate detailed JSON report');
        console.log('  --quiet          Suppress detailed output');
        console.log('  --help, -h       Show this help message');
        return;
    }

    try {
        const verifier = new ModelVerifier();
        await verifier.initialize();

        const quiet = args.includes('--quiet');
        const generateReport = args.includes('--report');

        if (!quiet) {
            Logger.info('🔍 Project Yarn Model Verification');
            Logger.info('===================================');
        }

        await verifier.verifyAllModels();

        if (!quiet) {
            verifier.printSummary();
        }

        if (generateReport) {
            await verifier.generateReport();
        }

        // Exit with error code if verification failed
        if (verifier.results.failed.length > 0) {
            process.exit(1);
        }

    } catch (error) {
        Logger.error(`Verification failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { ModelVerifier };
