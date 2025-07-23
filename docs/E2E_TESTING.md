# End-to-End Testing Framework

This document describes the E2E testing framework for Project Yarn, implemented using WebdriverIO and tauri-driver for comprehensive application testing.

## Overview

The E2E testing framework provides:
- **Cross-platform testing** for Windows, macOS, and Linux
- **Visual regression testing** to catch UI changes
- **Smoke tests** for critical application functionality
- **Core workflow testing** including the "Create Project" workflow
- **Automated screenshot capture** for debugging and documentation

## Framework Components

### WebdriverIO Configuration (`wdio.conf.js`)
- **Tauri Integration**: Configured to spawn and control Tauri applications
- **Multi-platform Support**: Automatic platform detection and executable path resolution
- **Visual Testing**: Integrated visual regression testing service
- **Reporting**: JSON and JUnit report generation for CI/CD integration
- **Screenshot Capture**: Automatic failure screenshots and manual capture utilities

### Test Suites

#### 1. Smoke Tests (`tests/e2e/smoke/`)
Basic functionality tests that verify the application starts and responds correctly:
- **Application Startup**: Verifies app launches without errors
- **Window Management**: Tests window creation and visibility
- **Basic Interaction**: Ensures UI responds to user input
- **Console Error Detection**: Monitors for JavaScript errors

#### 2. Core Workflow Tests (`tests/e2e/core/`)
Comprehensive tests for main application workflows:
- **Create Project Workflow**: Full end-to-end project creation testing
- **Form Validation**: Tests input validation and error handling
- **User Interaction**: Tests complete user journeys
- **State Management**: Verifies application state changes

#### 3. Visual Regression Tests (`tests/e2e/visual/`)
Visual comparison tests to detect unintended UI changes:
- **Baseline Screenshots**: Captures reference images for comparison
- **Responsive Design**: Tests UI at different viewport sizes
- **Component States**: Tests various UI states and interactions
- **Cross-platform Consistency**: Ensures UI consistency across platforms

### Test Utilities (`tests/e2e/helpers/setup.js`)
Shared utilities and helpers for all tests:
- **Application Lifecycle**: App startup and cleanup utilities
- **UI Interaction**: Safe element interaction methods
- **Screenshot Management**: Organized screenshot capture
- **Test Data Generation**: Dynamic test data creation
- **State Verification**: Application state validation helpers

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

The following E2E testing dependencies are included:
- `@wdio/cli` - WebdriverIO test runner
- `@wdio/local-runner` - Local test execution
- `@wdio/mocha-framework` - Mocha testing framework
- `@wdio/spec-reporter` - Test result reporting
- `@wdio/visual-service` - Visual regression testing
- `tauri-driver` - Tauri application driver
- `webdriverio` - WebDriver implementation

### 2. Build Application
Before running E2E tests, ensure the application is built:
```bash
npm run tauri build --debug
```

### 3. Run Tests
```bash
# Run all E2E tests
npm run e2e:test

# Run specific test suites
npm run e2e:test -- --suite smoke
npm run e2e:test -- --suite core
npm run e2e:test -- --suite visual

# Run tests in headless mode (CI)
npm run e2e:test:headless

# Run tests with debugging
npm run e2e:test:debug
```

## Test Structure

### Test Organization
```
tests/e2e/
├── helpers/
│   └── setup.js              # Test utilities and helpers
├── smoke/
│   └── app-startup.test.js    # Basic functionality tests
├── core/
│   └── create-project.test.js # Core workflow tests
├── visual/
│   └── ui-regression.test.js  # Visual regression tests
├── screenshots/               # Test screenshots
└── reports/                   # Test reports
```

### Test Naming Convention
- **Test Files**: `*.test.js`
- **Test Suites**: Organized by functionality (smoke, core, visual)
- **Test Cases**: Descriptive names starting with "should"
- **Screenshots**: Timestamped with test context

## Writing Tests

### Basic Test Structure
```javascript
import { TestUtils } from '../helpers/setup.js';

describe('Feature Name', () => {
    beforeEach(async () => {
        await TestUtils.waitForApp();
        await TestUtils.clearAppState();
    });
    
    it('should perform expected behavior', async () => {
        // Test implementation
        await TestUtils.takeScreenshot('test-name', 'step-description');
        
        // Assertions
        expect(result).to.be.true;
    });
});
```

### Using Test Utilities
```javascript
// Wait for application to be ready
await TestUtils.waitForApp();

// Clear application state
await TestUtils.clearAppState();

// Take screenshots
await TestUtils.takeScreenshot('test-name', 'step');

// Interact with elements safely
await TestUtils.clickElement('button[data-testid="submit"]');
await TestUtils.typeText('input[name="name"]', 'Test Value');

// Wait for specific conditions
await TestUtils.waitForText('.status', 'Complete');
await TestUtils.waitForLoadingComplete();

// Generate test data
const projectData = TestUtils.generateProjectData();
const documentData = TestUtils.generateDocumentData();
```

## Visual Regression Testing

### Baseline Creation
First run creates baseline screenshots:
```bash
npm run e2e:visual
```

### Comparison Testing
Subsequent runs compare against baselines:
- **Differences detected**: Test fails with diff images
- **No differences**: Test passes
- **New baselines**: Created for new test cases

### Visual Test Configuration
```javascript
await browser.checkScreen('test-name', {
    blockOutStatusBar: true,
    blockOutToolBar: true,
    disableCSSAnimation: true,
    hideScrollBars: true,
    misMatchThreshold: 0.01
});
```

## CI/CD Integration

### GitHub Actions Integration
The E2E tests are integrated into the CI/CD pipeline:

```yaml
# In .github/workflows/build-and-test.yml
- name: Run E2E Tests
  run: |
    npm run tauri build --debug
    npm run e2e:test:headless
```

### Test Reports
- **JSON Reports**: `tests/e2e/reports/results-*.json`
- **JUnit Reports**: `tests/e2e/reports/results-*.xml`
- **Screenshots**: `tests/e2e/screenshots/`
- **Visual Diffs**: Generated for failed visual tests

## Platform-Specific Considerations

### Windows
- **Executable**: `project-yarn.exe`
- **Path Separators**: Handled automatically
- **WebView2**: Requires WebView2 runtime

### macOS
- **App Bundle**: `Project Yarn.app`
- **Permissions**: May require accessibility permissions
- **Code Signing**: Debug builds don't require signing

### Linux
- **Dependencies**: Requires WebKit2GTK
- **Display**: May need virtual display in CI
- **Permissions**: File system access permissions

## Debugging Tests

### Debug Mode
```bash
npm run e2e:test:debug
```

### Manual Debugging
- **Screenshots**: Automatic capture on failure
- **Browser Logs**: Available through WebdriverIO
- **Step-by-step**: Use `browser.debug()` for breakpoints
- **Element Inspection**: Use `browser.pause()` for manual inspection

### Common Issues

**Application Not Starting**:
- Verify Tauri app is built (`npm run tauri build --debug`)
- Check executable path in `wdio.conf.js`
- Ensure all dependencies are installed

**Element Not Found**:
- Use `browser.debug()` to inspect DOM
- Check for dynamic content loading
- Verify element selectors are correct

**Visual Test Failures**:
- Review diff images in screenshots folder
- Check for animation or timing issues
- Adjust `misMatchThreshold` if needed

**Timeout Issues**:
- Increase timeout values in test configuration
- Add explicit waits for slow operations
- Check for loading states

## Best Practices

### Test Design
- **Independent Tests**: Each test should be self-contained
- **Clear Assertions**: Use descriptive assertion messages
- **Error Handling**: Handle expected failures gracefully
- **Cleanup**: Always clean up test data and state

### Performance
- **Parallel Execution**: Configure for faster test runs
- **Resource Management**: Clean up resources after tests
- **Screenshot Optimization**: Only capture when necessary
- **Build Caching**: Cache Tauri builds when possible

### Maintenance
- **Regular Updates**: Keep dependencies up to date
- **Baseline Refresh**: Update visual baselines when UI changes
- **Test Review**: Regularly review and refactor tests
- **Documentation**: Keep test documentation current

## Future Enhancements

### Planned Features
- **Cross-browser Testing**: Support for different WebView versions
- **Performance Testing**: Load time and responsiveness metrics
- **Accessibility Testing**: Automated accessibility checks
- **API Testing**: Backend API integration testing

### Integration Opportunities
- **Test Data Management**: Database seeding and cleanup
- **Mock Services**: Mock external dependencies
- **Test Reporting**: Enhanced reporting and analytics
- **Continuous Monitoring**: Production monitoring integration

## Support

For issues with E2E testing:
1. Check the test logs and screenshots
2. Review this documentation for configuration
3. Run tests in debug mode for detailed information
4. Open an issue with test failure details and screenshots

---

**Last Updated**: January 2024  
**Version**: 1.0.0
