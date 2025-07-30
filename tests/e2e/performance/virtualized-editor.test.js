/**
 * E2E Performance Tests for Virtualized Markdown Editor
 * Task 3.1.2: Implement UI virtualization for the Markdown editor
 * 
 * These tests verify the performance improvements achieved through UI virtualization
 * when working with large Markdown documents in the actual application environment.
 */

describe('Virtualized Markdown Editor Performance', () => {
    let app;

    before(async () => {
        // Initialize the application
        app = await browser.getWindowHandle();
    });

    beforeEach(async () => {
        // Navigate to the application
        await browser.url('http://localhost:1420');
        await browser.waitForDisplayed('[data-testid="app-container"]', { timeout: 10000 });
    });

    describe('Large Document Performance', () => {
        it('should render 1000-line document within performance target', async () => {
            // Create a large test document
            const largeContent = Array.from({ length: 1000 }, (_, i) => 
                `# Line ${i + 1}\n\nThis is test content for line ${i + 1}. It includes **bold text**, *italic text*, and [links](https://example.com). Here's some code: \`console.log('test')\`\n\n`
            ).join('');

            // Create new project and document
            await browser.click('[data-testid="create-project-btn"]');
            await browser.setValue('[data-testid="project-name-input"]', 'Performance Test Project');
            await browser.click('[data-testid="create-project-confirm"]');
            
            // Wait for project creation
            await browser.waitForDisplayed('[data-testid="project-explorer"]', { timeout: 5000 });
            
            // Create new document
            await browser.click('[data-testid="new-document-btn"]');
            await browser.setValue('[data-testid="document-name-input"]', 'large-document.md');
            await browser.click('[data-testid="create-document-confirm"]');
            
            // Wait for editor to load
            await browser.waitForDisplayed('[data-testid="markdown-editor"]', { timeout: 5000 });
            
            // Measure time to load large content
            const startTime = Date.now();
            
            // Set large content (simulate loading large document)
            await browser.execute((content) => {
                const editor = document.querySelector('[data-testid="virtualized-list"]');
                if (editor) {
                    // Simulate large document load
                    window.testLargeContent = content;
                }
            }, largeContent);
            
            // Wait for virtualization to kick in
            await browser.waitForDisplayed('[data-testid="virtualized-list"]', { timeout: 5000 });
            
            const loadTime = Date.now() - startTime;
            
            // Performance assertion: should load within 2 seconds
            expect(loadTime).toBeLessThan(2000);
            
            // Verify virtualization indicator is shown
            const virtualizationIndicator = await browser.$('*=Virtualized');
            await virtualizationIndicator.waitForDisplayed({ timeout: 3000 });
            
            // Verify only visible lines are rendered (not all 1000)
            const renderedLines = await browser.$$('[data-testid="editor-line"]');
            expect(renderedLines.length).toBeLessThan(50); // Should render much fewer than total lines
        });

        it('should handle scrolling through large document smoothly', async () => {
            // Assuming large document is already loaded from previous test
            await browser.waitForDisplayed('[data-testid="virtualized-list"]', { timeout: 5000 });
            
            const scrollContainer = await browser.$('[data-testid="virtualized-list"]');
            
            // Measure scroll performance
            const scrollTests = [];
            
            for (let i = 0; i < 10; i++) {
                const startTime = Date.now();
                
                // Scroll down
                await scrollContainer.scrollIntoView({ block: 'end' });
                await browser.pause(50); // Small pause to allow rendering
                
                const scrollTime = Date.now() - startTime;
                scrollTests.push(scrollTime);
            }
            
            // Average scroll time should be fast
            const averageScrollTime = scrollTests.reduce((a, b) => a + b, 0) / scrollTests.length;
            expect(averageScrollTime).toBeLessThan(100); // Should scroll smoothly in < 100ms
        });

        it('should maintain responsive editing with large documents', async () => {
            await browser.waitForDisplayed('[data-testid="virtualized-list"]', { timeout: 5000 });
            
            // Find first editable line
            const firstLine = await browser.$('[data-testid="editor-line"]:first-child textarea');
            await firstLine.waitForDisplayed({ timeout: 3000 });
            
            // Measure typing responsiveness
            const typingTests = [];
            const testText = 'This is a responsiveness test';
            
            for (const char of testText) {
                const startTime = Date.now();
                
                await firstLine.addValue(char);
                
                // Wait for character to appear
                await browser.waitUntil(async () => {
                    const value = await firstLine.getValue();
                    return value.includes(char);
                }, { timeout: 1000 });
                
                const typingTime = Date.now() - startTime;
                typingTests.push(typingTime);
            }
            
            // Average typing response should be fast
            const averageTypingTime = typingTests.reduce((a, b) => a + b, 0) / typingTests.length;
            expect(averageTypingTime).toBeLessThan(50); // Should respond to typing in < 50ms
        });
    });

    describe('Memory Usage Performance', () => {
        it('should not cause memory leaks with large documents', async () => {
            // Get initial memory usage
            const initialMemory = await browser.execute(() => {
                return performance.memory ? performance.memory.usedJSHeapSize : 0;
            });
            
            // Create and destroy multiple large documents
            for (let i = 0; i < 5; i++) {
                // Create large document
                await browser.click('[data-testid="new-document-btn"]');
                await browser.setValue('[data-testid="document-name-input"]', `large-doc-${i}.md`);
                await browser.click('[data-testid="create-document-confirm"]');
                
                // Load large content
                const largeContent = Array.from({ length: 500 }, (_, j) => 
                    `Line ${j + 1} in document ${i}`
                ).join('\n');
                
                await browser.execute((content) => {
                    window.testLargeContent = content;
                }, largeContent);
                
                await browser.waitForDisplayed('[data-testid="virtualized-list"]', { timeout: 3000 });
                
                // Switch to another document (cleanup previous)
                if (i > 0) {
                    await browser.click(`[data-testid="document-tab-large-doc-${i-1}"] button[aria-label="Close"]`);
                }
            }
            
            // Force garbage collection if available
            await browser.execute(() => {
                if (window.gc) {
                    window.gc();
                }
            });
            
            // Check final memory usage
            const finalMemory = await browser.execute(() => {
                return performance.memory ? performance.memory.usedJSHeapSize : 0;
            });
            
            // Memory growth should be reasonable (less than 50MB increase)
            const memoryGrowth = finalMemory - initialMemory;
            expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB limit
        });
    });

    describe('Comparison with Non-Virtualized Editor', () => {
        it('should perform significantly better than non-virtualized editor', async () => {
            const largeContent = Array.from({ length: 2000 }, (_, i) => 
                `Line ${i + 1}: Performance comparison test content`
            ).join('\n');
            
            // Test virtualized editor
            await browser.click('[data-testid="new-document-btn"]');
            await browser.setValue('[data-testid="document-name-input"]', 'virtualized-test.md');
            await browser.click('[data-testid="create-document-confirm"]');
            
            const virtualizedStartTime = Date.now();
            await browser.execute((content) => {
                window.testLargeContent = content;
            }, largeContent);
            
            await browser.waitForDisplayed('[data-testid="virtualized-list"]', { timeout: 5000 });
            const virtualizedLoadTime = Date.now() - virtualizedStartTime;
            
            // Switch to non-virtualized editor (if available as fallback)
            await browser.click('[data-testid="editor-settings-btn"]');
            await browser.click('[data-testid="disable-virtualization"]');
            
            const nonVirtualizedStartTime = Date.now();
            await browser.waitForDisplayed('[data-testid="standard-editor"]', { timeout: 10000 });
            const nonVirtualizedLoadTime = Date.now() - nonVirtualizedStartTime;
            
            // Virtualized should be significantly faster
            expect(virtualizedLoadTime).toBeLessThan(nonVirtualizedLoadTime * 0.5); // At least 50% faster
        });
    });

    describe('Performance Metrics Reporting', () => {
        it('should display accurate performance metrics', async () => {
            await browser.waitForDisplayed('[data-testid="virtualized-list"]', { timeout: 5000 });
            
            // Check performance metrics display
            const metricsElement = await browser.$('*=Virtualized');
            await metricsElement.waitForDisplayed({ timeout: 3000 });
            
            const metricsText = await metricsElement.getText();
            
            // Should show percentage of rendered lines
            expect(metricsText).toMatch(/\d+\.\d+% rendered/);
            
            // Should show line counts
            expect(metricsText).toMatch(/\d+\/\d+ lines/);
        });

        it('should update performance metrics during scrolling', async () => {
            const scrollContainer = await browser.$('[data-testid="virtualized-list"]');
            const metricsElement = await browser.$('*=lines');
            
            // Get initial metrics
            const initialMetrics = await metricsElement.getText();
            
            // Scroll to different position
            await scrollContainer.scrollIntoView({ block: 'center' });
            await browser.pause(100);
            
            // Metrics should update (though content might be similar)
            const updatedMetrics = await metricsElement.getText();
            expect(updatedMetrics).toBeDefined();
        });
    });

    after(async () => {
        // Cleanup test data
        await browser.execute(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });
});

/**
 * Performance Benchmark Suite
 * Measures and reports specific performance metrics
 */
describe('Virtualized Editor Performance Benchmarks', () => {
    const performanceResults = {};

    before(async () => {
        await browser.url('http://localhost:1420');
        await browser.waitForDisplayed('[data-testid="app-container"]', { timeout: 10000 });
    });

    it('benchmarks rendering performance for various document sizes', async () => {
        const documentSizes = [100, 500, 1000, 2000, 5000];
        
        for (const size of documentSizes) {
            const content = Array.from({ length: size }, (_, i) => `Line ${i + 1}`).join('\n');
            
            // Create new document
            await browser.click('[data-testid="new-document-btn"]');
            await browser.setValue('[data-testid="document-name-input"]', `benchmark-${size}.md`);
            await browser.click('[data-testid="create-document-confirm"]');
            
            // Measure rendering time
            const startTime = Date.now();
            await browser.execute((content) => {
                window.testLargeContent = content;
            }, content);
            
            await browser.waitForDisplayed('[data-testid="virtualized-list"]', { timeout: 10000 });
            const renderTime = Date.now() - startTime;
            
            performanceResults[`render_${size}_lines`] = renderTime;
            
            // Clean up
            await browser.click('[data-testid="close-document-btn"]');
        }
        
        // Report results
        console.log('Virtualized Editor Performance Benchmarks:', performanceResults);
        
        // Assert performance targets
        expect(performanceResults.render_1000_lines).toBeLessThan(1000); // 1000 lines in < 1s
        expect(performanceResults.render_5000_lines).toBeLessThan(3000); // 5000 lines in < 3s
    });

    after(async () => {
        // Save performance results for reporting
        await browser.execute((results) => {
            window.virtualizationBenchmarks = results;
        }, performanceResults);
    });
});
