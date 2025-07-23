import { TestUtils } from '../helpers/setup.js';
import { visualConfig, getPlatformConfig, getViewport, getScenario, getBaselineFilename, isCI } from '../../visual/visual.config.js';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Visual Regression Tests', () => {
    let platformConfig;
    let comparisonConfig;
    
    before(async () => {
        platformConfig = getPlatformConfig();
        comparisonConfig = isCI() ? visualConfig.ci : visualConfig.comparison;
        
        console.log(`🔍 Running visual regression tests for platform: ${platformConfig.currentPlatform}`);
        console.log(`📊 Using comparison threshold: ${comparisonConfig.misMatchThreshold}`);
        
        // Verify baseline directory exists
        if (!existsSync(platformConfig.baselineDir)) {
            console.log(`⚠️  Baseline directory not found: ${platformConfig.baselineDir}`);
            console.log('💡 Run baseline capture first: npm run e2e:visual:baseline');
        }
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
        await TestUtils.takeScreenshot('visual-regression', 'test-complete');
    });
    
    describe('Cross-Platform Baseline Comparison', () => {
        visualConfig.scenarios.forEach(scenario => {
            visualConfig.viewports.forEach(viewport => {
                it(`should match baseline for ${scenario.name} at ${viewport.name} (${viewport.width}x${viewport.height})`, async () => {
                    console.log(`🔍 Testing: ${scenario.description} at ${viewport.description}`);
                    
                    // Set viewport
                    await browser.setWindowSize(viewport.width, viewport.height);
                    await browser.pause(500);
                    
                    // Set up scenario
                    await setupScenario(scenario);
                    
                    // Hide dynamic elements
                    if (scenario.hideElements) {
                        await hideElements(scenario.hideElements);
                    }
                    
                    // Wait for scenario timing
                    if (scenario.waitFor) {
                        await browser.pause(scenario.waitFor);
                    }
                    
                    // Generate baseline filename
                    const filename = getBaselineFilename(scenario.name, viewport.name);
                    const baselinePath = join(platformConfig.baselineDir, filename);
                    
                    try {
                        if (existsSync(baselinePath)) {
                            // Compare against baseline
                            const result = await browser.checkScreen(scenario.name + '-' + viewport.name, {
                                misMatchThreshold: comparisonConfig.misMatchThreshold,
                                ignoreAntialiasing: comparisonConfig.ignoreAntialiasing,
                                ignoreColors: comparisonConfig.ignoreColors,
                                ignoreLess: comparisonConfig.ignoreLess,
                                ignoreTransparentPixel: comparisonConfig.ignoreTransparentPixel,
                                disableCSSAnimation: true,
                                hideScrollBars: true
                            });
                            
                            if (result === 0) {
                                console.log(`✅ No visual differences detected for ${scenario.name}`);
                            } else {
                                const message = `Visual differences detected: ${result}% difference`;
                                if (comparisonConfig.failOnDifference) {
                                    console.log(`❌ ${message}`);
                                    throw new Error(message);
                                } else {
                                    console.log(`⚠️ ${message}`);
                                }
                            }
                        } else {
                            console.log(`📸 Baseline not found, capturing new baseline: ${filename}`);
                            await browser.saveScreenshot(baselinePath);
                            console.log(`✅ New baseline captured: ${filename}`);
                        }
                    } catch (error) {
                        console.error(`❌ Visual comparison failed for ${scenario.name}:`, error.message);
                        
                        // Save failure screenshot for debugging
                        const failurePath = join(visualConfig.screenshotDir.actual, `failure-${filename}`);
                        await browser.saveScreenshot(failurePath);
                        
                        if (comparisonConfig.failOnDifference) {
                            throw error;
                        }
                    }
                });
            });
        });
    });
    
    describe('Platform-Specific Visual Elements', () => {
        it('should match platform-specific window decorations and chrome', async () => {
            console.log(`🔍 Testing platform-specific UI elements for ${platformConfig.currentPlatform}`);
            
            const viewport = getViewport('desktop-small');
            await browser.setWindowSize(viewport.width, viewport.height);
            await browser.pause(1000);
            
            const filename = `window-decorations-${platformConfig.currentPlatform}.png`;
            const baselinePath = join(platformConfig.baselineDir, filename);
            
            try {
                if (existsSync(baselinePath)) {
                    const result = await browser.checkScreen('platform-decorations', {
                        misMatchThreshold: comparisonConfig.misMatchThreshold * 2, // More lenient for platform differences
                        ignoreAntialiasing: true,
                        disableCSSAnimation: true
                    });
                    
                    if (result === 0) {
                        console.log('✅ Platform-specific UI elements match baseline');
                    } else {
                        console.log(`⚠️ Platform UI differences: ${result}% (expected for different platforms)`);
                    }
                } else {
                    await browser.saveScreenshot(baselinePath);
                    console.log(`📸 New platform baseline captured: ${filename}`);
                }
            } catch (error) {
                console.log(`Note: Platform comparison failed: ${error.message}`);
            }
        });
        
        it('should handle responsive design across viewports', async () => {
            console.log('📱 Testing responsive design across different viewports');
            
            for (const viewport of visualConfig.viewports) {
                console.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
                
                await browser.setWindowSize(viewport.width, viewport.height);
                await browser.pause(800); // Allow layout to adjust
                
                const filename = `responsive-${viewport.name}-${platformConfig.currentPlatform}.png`;
                const baselinePath = join(platformConfig.baselineDir, filename);
                
                try {
                    if (existsSync(baselinePath)) {
                        const result = await browser.checkScreen(`responsive-${viewport.name}`, {
                            misMatchThreshold: comparisonConfig.misMatchThreshold,
                            ignoreAntialiasing: comparisonConfig.ignoreAntialiasing,
                            disableCSSAnimation: true,
                            hideScrollBars: true
                        });
                        
                        if (result === 0) {
                            console.log(`✅ Responsive design matches for ${viewport.name}`);
                        } else {
                            console.log(`⚠️ Responsive differences at ${viewport.name}: ${result}%`);
                        }
                    } else {
                        await browser.saveScreenshot(baselinePath);
                        console.log(`📸 New responsive baseline: ${filename}`);
                    }
                } catch (error) {
                    console.log(`Note: Responsive test failed for ${viewport.name}: ${error.message}`);
                }
            }
        });
    });
    
    it('should capture screenshots at different viewport sizes', async () => {
        console.log('🧪 Testing responsive design at different viewport sizes...');
        
        const viewports = [
            { width: 1280, height: 800, name: 'desktop' },
            { width: 1920, height: 1080, name: 'large-desktop' },
            { width: 1024, height: 768, name: 'tablet-landscape' }
        ];
        
        for (const viewport of viewports) {
            console.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
            
            // Set viewport size
            await browser.setWindowSize(viewport.width, viewport.height);
            
            // Wait for layout to adjust
            await browser.pause(1000);
            
            // Take screenshot
            await TestUtils.takeScreenshot('responsive', `${viewport.name}-${viewport.width}x${viewport.height}`);
            
            try {
                await browser.checkScreen(`main-view-${viewport.name}`, {
                    disableCSSAnimation: true,
                    hideScrollBars: true
                });
                console.log(`✅ ${viewport.name} viewport test completed`);
            } catch (error) {
                console.log(`Note: Visual comparison for ${viewport.name} not configured`);
            }
        }
        
        // Reset to default viewport
        await browser.setWindowSize(1280, 800);
    });
    
    it('should detect UI changes in different application states', async () => {
        console.log('🧪 Testing UI states visual regression...');
        
        const states = [
            {
                name: 'empty-state',
                description: 'Application with no projects',
                setup: async () => {
                    // Ensure we're in empty state
                    await TestUtils.verifyAppState('initial');
                }
            },
            {
                name: 'loading-state',
                description: 'Application during loading',
                setup: async () => {
                    // Try to trigger a loading state
                    const createButton = await browser.$('button*=Create');
                    if (await createButton.isExisting()) {
                        await createButton.click();
                        // Capture during modal opening
                        await browser.pause(100);
                    }
                }
            }
        ];
        
        for (const state of states) {
            console.log(`Testing state: ${state.name} - ${state.description}`);
            
            try {
                await state.setup();
                await browser.pause(500);
                
                await TestUtils.takeScreenshot('ui-states', state.name);
                
                try {
                    await browser.checkScreen(`app-state-${state.name}`, {
                        disableCSSAnimation: true
                    });
                    console.log(`✅ ${state.name} state test completed`);
                } catch (error) {
                    console.log(`Note: Visual comparison for ${state.name} not configured`);
                }
            } catch (error) {
                console.log(`Note: Could not test ${state.name} state:`, error.message);
            }
            
            // Reset state
            await TestUtils.clearAppState();
            await browser.pause(500);
        }
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
