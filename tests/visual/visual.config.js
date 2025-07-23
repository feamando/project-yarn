import { platform } from 'os';
import { join } from 'path';

/**
 * Visual Regression Testing Configuration
 * Defines platform-specific baselines and comparison settings
 */
export const visualConfig = {
    // Platform-specific baseline directories
    baselineDir: {
        win32: join(process.cwd(), 'tests', 'visual', 'baselines', 'windows'),
        darwin: join(process.cwd(), 'tests', 'visual', 'baselines', 'macos'),
        linux: join(process.cwd(), 'tests', 'visual', 'baselines', 'linux')
    },
    
    // Screenshot output directories
    screenshotDir: {
        actual: join(process.cwd(), 'tests', 'visual', 'actual'),
        diff: join(process.cwd(), 'tests', 'visual', 'diff'),
        temp: join(process.cwd(), 'tests', 'visual', 'temp')
    },
    
    // Visual comparison settings
    comparison: {
        // Threshold for pixel differences (0-1, where 0 = exact match)
        misMatchThreshold: 0.01,
        
        // Ignore anti-aliasing differences
        ignoreAntialiasing: true,
        
        // Ignore colors (grayscale comparison)
        ignoreColors: false,
        
        // Ignore less significant differences
        ignoreLess: true,
        
        // Ignore transparent pixels
        ignoreTransparentPixel: false,
        
        // Color distance threshold
        colorDistance: 25,
        
        // Pixel density differences
        ignorePixelDensity: true
    },
    
    // Standard viewport configurations
    viewports: [
        {
            name: 'desktop-small',
            width: 1280,
            height: 800,
            description: 'Standard desktop resolution'
        },
        {
            name: 'desktop-large',
            width: 1920,
            height: 1080,
            description: 'Large desktop resolution'
        },
        {
            name: 'desktop-wide',
            width: 2560,
            height: 1440,
            description: 'Wide desktop resolution'
        }
    ],
    
    // Test scenarios for baseline capture
    scenarios: [
        {
            name: 'main-application-view',
            description: 'Main application interface',
            selector: 'body',
            hideElements: [
                '[data-testid="loading-spinner"]',
                '.animate-pulse',
                '[class*="loading"]'
            ],
            waitFor: 2000
        },
        {
            name: 'project-creation-modal',
            description: 'Project creation dialog',
            trigger: 'button*=Create',
            selector: '[role="dialog"]',
            waitFor: 1000
        },
        {
            name: 'ai-settings-page',
            description: 'AI Settings configuration page',
            trigger: 'button*=Settings',
            selector: '.settings-container, [data-testid="settings"]',
            waitFor: 1500
        },
        {
            name: 'empty-project-state',
            description: 'Application with no projects loaded',
            selector: 'body',
            precondition: 'empty-state',
            waitFor: 1000
        }
    ],
    
    // Platform-specific adjustments
    platformAdjustments: {
        win32: {
            // Windows-specific adjustments
            windowDecorations: true,
            titleBarHeight: 32,
            borderWidth: 1
        },
        darwin: {
            // macOS-specific adjustments
            windowDecorations: true,
            titleBarHeight: 28,
            borderRadius: 8
        },
        linux: {
            // Linux-specific adjustments
            windowDecorations: false,
            titleBarHeight: 0,
            borderWidth: 0
        }
    },
    
    // CI/CD specific settings
    ci: {
        // Stricter thresholds for CI
        misMatchThreshold: 0.005,
        
        // Retry failed comparisons
        retryCount: 2,
        
        // Generate detailed reports
        generateReport: true,
        
        // Fail build on visual differences
        failOnDifference: true
    }
};

/**
 * Get platform-specific configuration
 */
export function getPlatformConfig() {
    const currentPlatform = platform();
    return {
        ...visualConfig,
        currentPlatform,
        baselineDir: visualConfig.baselineDir[currentPlatform],
        platformAdjustments: visualConfig.platformAdjustments[currentPlatform] || {}
    };
}

/**
 * Get viewport configuration by name
 */
export function getViewport(name) {
    return visualConfig.viewports.find(v => v.name === name) || visualConfig.viewports[0];
}

/**
 * Get scenario configuration by name
 */
export function getScenario(name) {
    return visualConfig.scenarios.find(s => s.name === name);
}

/**
 * Generate baseline filename
 */
export function getBaselineFilename(scenario, viewport, platform = null) {
    const platformSuffix = platform || getPlatformConfig().currentPlatform;
    return `${scenario}-${viewport}-${platformSuffix}.png`;
}

/**
 * Check if running in CI environment
 */
export function isCI() {
    return !!(
        process.env.CI ||
        process.env.GITHUB_ACTIONS ||
        process.env.JENKINS_URL ||
        process.env.BUILDKITE ||
        process.env.CIRCLECI
    );
}
