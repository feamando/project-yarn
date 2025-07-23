import { spawn } from 'child_process';
import { join } from 'path';
import { platform } from 'os';

export const config = {
    //
    // ====================
    // Runner Configuration
    // ====================
    runner: 'local',
    
    //
    // ==================
    // Specify Test Files
    // ==================
    specs: [
        './tests/e2e/**/*.test.js'
    ],
    
    // Patterns to exclude.
    exclude: [
        // 'path/to/excluded/files'
    ],
    
    //
    // ============
    // Capabilities
    // ============
    maxInstances: 1,
    capabilities: [{
        'tauri:options': {
            application: getTauriApplicationPath()
        }
    }],
    
    //
    // ===================
    // Test Configurations
    // ===================
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    
    //
    // Test runner services
    services: [
        ['tauri', {
            tauriDriverPath: getTauriDriverPath(),
            beforeSession: () => {
                // Build the Tauri application before starting tests
                return buildTauriApp();
            }
        }],
        ['visual', {
            // Visual regression testing configuration
            compare: {
                // Level of difference allowed (0-1)
                misMatchThreshold: 0.01,
                // Ignore anti-aliasing differences
                ignoreAntialiasing: true,
                // Ignore colors
                ignoreColors: false,
                // Ignore less significant differences
                ignoreLess: true,
                // Ignore nothing
                ignoreNothing: false,
                // Ignore transparency
                ignoreTransparentPixel: false
            },
            viewportChangePause: 300,
            viewports: [
                { width: 1280, height: 800 },
                { width: 1920, height: 1080 }
            ],
            orientations: ['landscape']
        }]
    ],
    
    //
    // Framework Configuration
    framework: 'mocha',
    reporters: [
        'spec',
        ['json', {
            outputDir: './tests/e2e/reports',
            outputFileFormat: function(options) {
                return `results-${options.cid}.json`;
            }
        }],
        ['junit', {
            outputDir: './tests/e2e/reports',
            outputFileFormat: function(options) {
                return `results-${options.cid}.xml`;
            }
        }]
    ],
    
    //
    // Options to be passed to Mocha
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        require: ['./tests/e2e/helpers/setup.js']
    },
    
    //
    // Test Suites
    suites: {
        smoke: [
            './tests/e2e/smoke/**/*.test.js'
        ],
        core: [
            './tests/e2e/core/**/*.test.js'
        ],
        visual: [
            './tests/e2e/visual/**/*.test.js'
        ],
        baseline: [
            './tests/visual/baseline-capture.test.js'
        ],
        full: [
            './tests/e2e/**/*.test.js'
        ]
    },
    
    //
    // =====
    // Hooks
    // =====
    onPrepare: function (config, capabilities) {
        console.log('🚀 Starting E2E test suite...');
        console.log(`Platform: ${platform()}`);
        console.log(`Tauri app: ${getTauriApplicationPath()}`);
    },
    
    beforeSession: function (config, capabilities, specs) {
        console.log('📱 Initializing Tauri application...');
    },
    
    before: function (capabilities, specs) {
        // Set up global test helpers
        global.expect = require('chai').expect;
        
        // Add custom commands
        browser.addCommand('waitForTauriWindow', async function () {
            await browser.waitUntil(async () => {
                const windows = await browser.getWindowHandles();
                return windows.length > 0;
            }, {
                timeout: 30000,
                timeoutMsg: 'Tauri window did not appear within 30 seconds'
            });
        });
        
        browser.addCommand('takeScreenshotWithRetry', async function (name, options = {}) {
            const maxRetries = 3;
            let lastError;
            
            for (let i = 0; i < maxRetries; i++) {
                try {
                    await browser.pause(500); // Wait for UI to stabilize
                    return await browser.saveScreenshot(`./tests/e2e/screenshots/${name}-${Date.now()}.png`);
                } catch (error) {
                    lastError = error;
                    console.log(`Screenshot attempt ${i + 1} failed:`, error.message);
                    if (i < maxRetries - 1) {
                        await browser.pause(1000);
                    }
                }
            }
            throw lastError;
        });
    },
    
    beforeTest: function (test, context) {
        console.log(`🧪 Starting test: ${test.title}`);
    },
    
    afterTest: function(test, context, { error, result, duration, passed, retries }) {
        if (error) {
            console.log(`❌ Test failed: ${test.title}`);
            // Take screenshot on failure
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotPath = `./tests/e2e/screenshots/failure-${test.title.replace(/\s+/g, '-')}-${timestamp}.png`;
            try {
                browser.saveScreenshot(screenshotPath);
                console.log(`📸 Failure screenshot saved: ${screenshotPath}`);
            } catch (screenshotError) {
                console.log('Failed to take failure screenshot:', screenshotError.message);
            }
        } else {
            console.log(`✅ Test passed: ${test.title} (${duration}ms)`);
        }
    },
    
    after: function (result, capabilities, specs) {
        console.log('🧹 Cleaning up after tests...');
    },
    
    afterSession: function (config, capabilities, specs) {
        console.log('📱 Tauri application session ended');
    },
    
    onComplete: function(exitCode, config, capabilities, results) {
        console.log('🏁 E2E test suite completed');
        console.log(`Exit code: ${exitCode}`);
        
        if (results) {
            const { passed, failed } = results;
            console.log(`Results: ${passed} passed, ${failed} failed`);
        }
    }
};

/**
 * Get the path to the Tauri application executable
 */
function getTauriApplicationPath() {
    const currentPlatform = platform();
    const projectRoot = process.cwd();
    
    switch (currentPlatform) {
        case 'win32':
            return join(projectRoot, 'src-tauri', 'target', 'debug', 'project-yarn.exe');
        case 'darwin':
            return join(projectRoot, 'src-tauri', 'target', 'debug', 'bundle', 'macos', 'Project Yarn.app', 'Contents', 'MacOS', 'Project Yarn');
        case 'linux':
            return join(projectRoot, 'src-tauri', 'target', 'debug', 'project-yarn');
        default:
            throw new Error(`Unsupported platform: ${currentPlatform}`);
    }
}

/**
 * Get the path to the tauri-driver executable
 */
function getTauriDriverPath() {
    const currentPlatform = platform();
    const driverName = currentPlatform === 'win32' ? 'tauri-driver.exe' : 'tauri-driver';
    
    // Try to find tauri-driver in node_modules or global installation
    const localPath = join(process.cwd(), 'node_modules', '.bin', driverName);
    return localPath;
}

/**
 * Build the Tauri application before running tests
 */
function buildTauriApp() {
    return new Promise((resolve, reject) => {
        console.log('🔨 Building Tauri application for E2E tests...');
        
        const buildProcess = spawn('npm', ['run', 'tauri', 'build', '--debug'], {
            stdio: 'inherit',
            shell: true
        });
        
        buildProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Tauri application built successfully');
                resolve();
            } else {
                console.error(`❌ Tauri build failed with exit code ${code}`);
                reject(new Error(`Build failed with exit code ${code}`));
            }
        });
        
        buildProcess.on('error', (error) => {
            console.error('❌ Failed to start build process:', error);
            reject(error);
        });
    });
}
