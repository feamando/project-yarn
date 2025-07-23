import { expect } from 'chai';

// Global test setup and utilities
global.expect = expect;

/**
 * Test utilities for E2E tests
 */
export class TestUtils {
    /**
     * Wait for the main application window to be ready
     */
    static async waitForApp() {
        await browser.waitForTauriWindow();
        
        // Wait for the main app container to be visible
        await browser.waitUntil(async () => {
            try {
                const appContainer = await browser.$('[data-testid="app-container"]');
                return await appContainer.isDisplayed();
            } catch (error) {
                // If data-testid is not available, try common selectors
                try {
                    const body = await browser.$('body');
                    return await body.isDisplayed();
                } catch (fallbackError) {
                    return false;
                }
            }
        }, {
            timeout: 30000,
            timeoutMsg: 'Application did not load within 30 seconds'
        });
        
        // Additional wait for React to hydrate
        await browser.pause(1000);
    }
    
    /**
     * Clear application state (useful between tests)
     */
    static async clearAppState() {
        try {
            // Clear any modal dialogs
            const modals = await browser.$$('[role="dialog"]');
            for (const modal of modals) {
                if (await modal.isDisplayed()) {
                    const closeButton = await modal.$('button[aria-label="Close"]');
                    if (await closeButton.isExisting()) {
                        await closeButton.click();
                    }
                }
            }
            
            // Wait for modals to close
            await browser.pause(500);
        } catch (error) {
            console.log('Note: Could not clear modal state:', error.message);
        }
    }
    
    /**
     * Take a screenshot with a descriptive name
     */
    static async takeScreenshot(name, step = '') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = step ? `${name}-${step}-${timestamp}.png` : `${name}-${timestamp}.png`;
        const path = `./tests/e2e/screenshots/${filename}`;
        
        try {
            await browser.saveScreenshot(path);
            console.log(`📸 Screenshot saved: ${filename}`);
            return path;
        } catch (error) {
            console.log(`Failed to save screenshot ${filename}:`, error.message);
            return null;
        }
    }
    
    /**
     * Wait for an element to be clickable and click it
     */
    static async clickElement(selector, options = {}) {
        const element = await browser.$(selector);
        await element.waitForClickable({
            timeout: options.timeout || 10000
        });
        await element.click();
        
        // Small pause to allow for UI updates
        await browser.pause(options.pauseAfter || 200);
    }
    
    /**
     * Type text into an input field
     */
    static async typeText(selector, text, options = {}) {
        const element = await browser.$(selector);
        await element.waitForDisplayed({
            timeout: options.timeout || 10000
        });
        
        if (options.clear) {
            await element.clearValue();
        }
        
        await element.setValue(text);
        
        // Small pause to allow for UI updates
        await browser.pause(options.pauseAfter || 200);
    }
    
    /**
     * Wait for text to appear in an element
     */
    static async waitForText(selector, expectedText, options = {}) {
        await browser.waitUntil(async () => {
            try {
                const element = await browser.$(selector);
                const text = await element.getText();
                return text.includes(expectedText);
            } catch (error) {
                return false;
            }
        }, {
            timeout: options.timeout || 10000,
            timeoutMsg: `Text "${expectedText}" did not appear in element "${selector}" within ${options.timeout || 10000}ms`
        });
    }
    
    /**
     * Generate test data for projects
     */
    static generateProjectData() {
        const timestamp = Date.now();
        return {
            name: `Test Project ${timestamp}`,
            description: `E2E test project created at ${new Date().toISOString()}`,
            path: `./test-projects/project-${timestamp}`
        };
    }
    
    /**
     * Generate test data for documents
     */
    static generateDocumentData() {
        const timestamp = Date.now();
        return {
            name: `Test Document ${timestamp}`,
            content: `# Test Document\n\nThis is a test document created at ${new Date().toISOString()}\n\n## Content\n\nThis document is used for E2E testing purposes.`,
            type: 'markdown'
        };
    }
    
    /**
     * Wait for loading states to complete
     */
    static async waitForLoadingComplete() {
        // Wait for any loading spinners to disappear
        await browser.waitUntil(async () => {
            try {
                const spinners = await browser.$$('[data-testid*="loading"], [class*="loading"], [class*="spinner"]');
                for (const spinner of spinners) {
                    if (await spinner.isDisplayed()) {
                        return false;
                    }
                }
                return true;
            } catch (error) {
                return true; // If we can't find loading indicators, assume loading is complete
            }
        }, {
            timeout: 15000,
            timeoutMsg: 'Loading did not complete within 15 seconds'
        });
    }
    
    /**
     * Verify application is in expected state
     */
    static async verifyAppState(expectedState) {
        switch (expectedState) {
            case 'initial':
                // Verify app is in initial state (no projects)
                await this.waitForText('body', 'Create your first project');
                break;
            case 'project-loaded':
                // Verify a project is loaded
                await browser.waitUntil(async () => {
                    try {
                        const projectPanel = await browser.$('[data-testid="project-panel"]');
                        return await projectPanel.isDisplayed();
                    } catch (error) {
                        return false;
                    }
                }, {
                    timeout: 10000,
                    timeoutMsg: 'Project panel did not appear'
                });
                break;
            default:
                console.log(`Unknown app state: ${expectedState}`);
        }
    }
}

// Make TestUtils available globally
global.TestUtils = TestUtils;
