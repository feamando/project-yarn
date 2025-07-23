import { TestUtils } from '../e2e/helpers/setup.js';
import { visualConfig, getPlatformConfig, getViewport, getScenario, getBaselineFilename } from './visual.config.js';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('Visual Baseline Capture', () => {
    let platformConfig;
    
    before(async () => {
        platformConfig = getPlatformConfig();
        console.log(`🖥️  Capturing baselines for platform: ${platformConfig.currentPlatform}`);
        
        // Ensure baseline directories exist
        if (!existsSync(platformConfig.baselineDir)) {
            mkdirSync(platformConfig.baselineDir, { recursive: true });
            console.log(`📁 Created baseline directory: ${platformConfig.baselineDir}`);
        }
        
        // Ensure screenshot directories exist
        Object.values(visualConfig.screenshotDir).forEach(dir => {
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
        });
    });
    
    beforeEach(async () => {
        await TestUtils.waitForApp();
        await TestUtils.clearAppState();
        
        // Wait for application to stabilize
        await browser.pause(1000);
    });
    
    afterEach(async () => {
        // Reset to default viewport
        await browser.setWindowSize(1280, 800);
    });
    
    describe('Main Application Views', () => {
        visualConfig.scenarios.forEach(scenario => {
            visualConfig.viewports.forEach(viewport => {
                it(`should capture baseline for ${scenario.name} at ${viewport.name} (${viewport.width}x${viewport.height})`, async () => {
                    console.log(`📸 Capturing: ${scenario.description} at ${viewport.description}`);
                    
                    // Set viewport
                    await browser.setWindowSize(viewport.width, viewport.height);
                    await browser.pause(500); // Allow layout to adjust
                    
                    // Handle scenario-specific setup
                    await setupScenario(scenario);
                    
                    // Hide dynamic elements
                    if (scenario.hideElements) {
                        await hideElements(scenario.hideElements);
                    }
                    
                    // Wait for scenario-specific timing
                    if (scenario.waitFor) {
                        await browser.pause(scenario.waitFor);
                    }
                    
                    // Generate baseline filename
                    const filename = getBaselineFilename(scenario.name, viewport.name);
                    const baselinePath = join(platformConfig.baselineDir, filename);
                    
                    try {
                        // Capture baseline screenshot
                        await browser.saveScreenshot(baselinePath);
                        console.log(`✅ Baseline captured: ${filename}`);
                        
                        // Also save to actual directory for comparison
                        const actualPath = join(visualConfig.screenshotDir.actual, filename);
                        await browser.saveScreenshot(actualPath);
                        
                    } catch (error) {
                        console.error(`❌ Failed to capture baseline for ${scenario.name}:`, error.message);
                        throw error;
                    }
                });
            });
        });
    });
    
    describe('Platform-Specific UI Elements', () => {
        it('should capture platform-specific window decorations', async () => {
            console.log(`🪟 Capturing platform-specific UI elements for ${platformConfig.currentPlatform}`);
            
            const viewport = getViewport('desktop-small');
            await browser.setWindowSize(viewport.width, viewport.height);
            
            // Capture full window including decorations
            const filename = `window-decorations-${platformConfig.currentPlatform}.png`;
            const baselinePath = join(platformConfig.baselineDir, filename);
            
            await browser.pause(1000);
            await browser.saveScreenshot(baselinePath);
            
            console.log(`✅ Platform-specific baseline captured: ${filename}`);
        });
        
        it('should capture application chrome and navigation', async () => {
            console.log(`🧭 Capturing application navigation elements`);
            
            const viewport = getViewport('desktop-large');
            await browser.setWindowSize(viewport.width, viewport.height);
            
            // Focus on navigation and chrome elements
            try {
                const header = await browser.$('header, [data-testid="header"], .header');
                if (await header.isExisting()) {
                    const filename = `app-chrome-${platformConfig.currentPlatform}.png`;
                    const baselinePath = join(platformConfig.baselineDir, filename);
                    
                    await browser.pause(500);
                    await browser.saveScreenshot(baselinePath);
                    console.log(`✅ App chrome baseline captured: ${filename}`);
                }
            } catch (error) {
                console.log('Note: App chrome elements not found, capturing full view');
                const filename = `app-navigation-${platformConfig.currentPlatform}.png`;
                const baselinePath = join(platformConfig.baselineDir, filename);
                await browser.saveScreenshot(baselinePath);
            }
        });
    });
    
    describe('Component States', () => {
        const componentStates = [
            {
                name: 'loading-state',
                description: 'Loading indicators and spinners',
                setup: async () => {
                    // Try to trigger loading state
                    const createButton = await browser.$('button*=Create');
                    if (await createButton.isExisting()) {
                        await createButton.click();
                        await browser.pause(100); // Capture during loading
                    }
                }
            },
            {
                name: 'error-state',
                description: 'Error messages and alerts',
                setup: async () => {
                    // Try to trigger error state (submit empty form)
                    const createButton = await browser.$('button*=Create');
                    if (await createButton.isExisting()) {
                        await createButton.click();
                        const submitButton = await browser.$('button[type="submit"], button*=Create');
                        if (await submitButton.isExisting()) {
                            await submitButton.click();
                            await browser.pause(500);
                        }
                    }
                }
            },
            {
                name: 'success-state',
                description: 'Success messages and confirmations',
                setup: async () => {
                    // This would require successful form submission
                    // For now, just capture the normal state
                    await browser.pause(500);
                }
            }
        ];
        
        componentStates.forEach(state => {
            it(`should capture ${state.name} baseline`, async () => {
                console.log(`🎭 Capturing component state: ${state.description}`);
                
                const viewport = getViewport('desktop-small');
                await browser.setWindowSize(viewport.width, viewport.height);
                
                try {
                    await state.setup();
                    
                    const filename = `${state.name}-${platformConfig.currentPlatform}.png`;
                    const baselinePath = join(platformConfig.baselineDir, filename);
                    
                    await browser.pause(300);
                    await browser.saveScreenshot(baselinePath);
                    
                    console.log(`✅ Component state baseline captured: ${filename}`);
                } catch (error) {
                    console.log(`Note: Could not capture ${state.name}:`, error.message);
                }
                
                // Reset state
                await TestUtils.clearAppState();
            });
        });
    });
});

/**
 * Set up scenario-specific conditions
 */
async function setupScenario(scenario) {
    try {
        // Handle preconditions
        if (scenario.precondition === 'empty-state') {
            await TestUtils.verifyAppState('initial');
        }
        
        // Handle triggers
        if (scenario.trigger) {
            const triggerElement = await browser.$(scenario.trigger);
            if (await triggerElement.isExisting()) {
                await triggerElement.click();
                
                // Wait for triggered element to appear
                if (scenario.selector && scenario.selector !== 'body') {
                    await browser.waitUntil(async () => {
                        const element = await browser.$(scenario.selector);
                        return await element.isDisplayed();
                    }, {
                        timeout: 10000,
                        timeoutMsg: `Triggered element ${scenario.selector} did not appear`
                    });
                }
            }
        }
    } catch (error) {
        console.log(`Note: Could not set up scenario ${scenario.name}:`, error.message);
    }
}

/**
 * Hide dynamic elements that cause visual noise
 */
async function hideElements(selectors) {
    for (const selector of selectors) {
        try {
            const elements = await browser.$$(selector);
            for (const element of elements) {
                if (await element.isDisplayed()) {
                    await browser.execute((el) => {
                        el.style.visibility = 'hidden';
                    }, element);
                }
            }
        } catch (error) {
            console.log(`Note: Could not hide element ${selector}:`, error.message);
        }
    }
}
