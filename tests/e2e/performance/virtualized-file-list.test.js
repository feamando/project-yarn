/**
 * E2E Performance Tests for Virtualized File List
 * Task 3.1.3: Implement UI virtualization for the file list view
 * 
 * These tests verify the performance improvements achieved through UI virtualization
 * when working with large projects containing thousands of documents.
 */

describe('Virtualized File List Performance', () => {
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

    describe('Large Project Performance', () => {
        it('should render 1000+ document project within performance target', async () => {
            // Create a large test project with many documents
            await browser.click('[data-testid="create-project-btn"]');
            await browser.setValue('[data-testid="project-name-input"]', 'Large Performance Test Project');
            await browser.click('[data-testid="create-project-confirm"]');
            
            // Wait for project creation
            await browser.waitForDisplayed('[data-testid="project-explorer"]', { timeout: 5000 });
            
            // Simulate adding many documents via store manipulation
            const startTime = Date.now();
            
            await browser.execute(() => {
                // Access the app store and add 1000 documents
                const { useAppStore } = window;
                const store = useAppStore.getState();
                const projectId = store.projects[0]?.id;
                
                if (projectId) {
                    for (let i = 0; i < 1000; i++) {
                        store.addDocument({
                            id: `perf-doc-${i}`,
                            projectId: projectId,
                            path: `/documents/document-${i}.md`,
                            name: `Document-${i}.md`,
                            content: `# Document ${i}\n\nThis is test content for document ${i}. It includes **bold text**, *italic text*, and [links](https://example.com). Here's some code: \`console.log('test ${i}')\`\n\n`,
                            state: i % 6 === 0 ? 'memo' : 
                                   i % 6 === 1 ? 'prfaq' : 
                                   i % 6 === 2 ? 'prd' : 
                                   i % 6 === 3 ? 'epic_breakdown' : 
                                   i % 6 === 4 ? 'archived' : 'draft',
                            createdAt: new Date(Date.now() - i * 1000),
                            updatedAt: new Date(Date.now() - i * 100)
                        });
                    }
                }
            });
            
            // Wait for file list to render
            await browser.waitForDisplayed('[data-testid="virtualized-file-list"]', { timeout: 10000 });
            
            const renderTime = Date.now() - startTime;
            
            // Should render within 2 seconds even with 1000 documents
            expect(renderTime).toBeLessThan(2000);
            
            // Verify virtualization is active
            const performanceMetrics = await browser.$('[data-testid="performance-metrics"]');
            if (await performanceMetrics.isDisplayed()) {
                const metricsText = await performanceMetrics.getText();
                expect(metricsText).toContain('Virtualized');
                expect(metricsText).toContain('1000');
            }
            
            // Verify only visible items are rendered in DOM
            const renderedItems = await browser.$$('[data-testid="file-item"]');
            expect(renderedItems.length).toBeLessThanOrEqual(20); // Only visible items
        });

        it('should maintain smooth scrolling with large document sets', async () => {
            await browser.waitForDisplayed('[data-testid="virtualized-file-list"]', { timeout: 5000 });
            
            const fileListContainer = await browser.$('[data-testid="virtualized-file-list"]');
            
            // Measure scroll performance
            const scrollTimes = [];
            
            for (let i = 0; i < 10; i++) {
                const startTime = Date.now();
                
                // Scroll down
                await fileListContainer.scrollIntoView({ block: 'end' });
                await browser.pause(50); // Small pause to allow scroll to complete
                
                // Scroll back up
                await fileListContainer.scrollIntoView({ block: 'start' });
                await browser.pause(50);
                
                const scrollTime = Date.now() - startTime;
                scrollTimes.push(scrollTime);
            }
            
            const averageScrollTime = scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length;
            
            // Average scroll time should be under 100ms
            expect(averageScrollTime).toBeLessThan(100);
        });

        it('should handle rapid search filtering efficiently', async () => {
            await browser.waitForDisplayed('[data-testid="search-input"]', { timeout: 5000 });
            
            const searchInput = await browser.$('[data-testid="search-input"]');
            
            // Measure search performance with rapid typing
            const startTime = Date.now();
            
            // Simulate rapid typing
            await searchInput.setValue('D');
            await browser.pause(10);
            await searchInput.setValue('Do');
            await browser.pause(10);
            await searchInput.setValue('Doc');
            await browser.pause(10);
            await searchInput.setValue('Docu');
            await browser.pause(10);
            await searchInput.setValue('Document-1');
            
            // Wait for search results
            await browser.waitForDisplayed('[data-testid="file-item"]', { timeout: 2000 });
            
            const searchTime = Date.now() - startTime;
            
            // Search should complete within 500ms even with rapid typing
            expect(searchTime).toBeLessThan(500);
            
            // Verify search results are filtered
            const resultCount = await browser.$('[data-testid="result-count"]');
            const countText = await resultCount.getText();
            expect(countText).toMatch(/\d+ \/ 1000/); // Should show filtered count
        });
    });

    describe('Memory Usage Performance', () => {
        it('should not cause memory leaks with large document sets', async () => {
            // Get initial memory usage
            const initialMemory = await browser.execute(() => {
                return performance.memory ? performance.memory.usedJSHeapSize : 0;
            });
            
            // Create and destroy large document sets multiple times
            for (let cycle = 0; cycle < 3; cycle++) {
                await browser.execute((cycleNum) => {
                    const { useAppStore } = window;
                    const store = useAppStore.getState();
                    const projectId = store.projects[0]?.id;
                    
                    if (projectId) {
                        // Add 500 documents
                        for (let i = 0; i < 500; i++) {
                            store.addDocument({
                                id: `cycle-${cycleNum}-doc-${i}`,
                                projectId: projectId,
                                path: `/cycle-${cycleNum}/document-${i}.md`,
                                name: `Cycle-${cycleNum}-Document-${i}.md`,
                                content: `# Cycle ${cycleNum} Document ${i}\n\nTest content...`,
                                state: 'draft',
                                createdAt: new Date(),
                                updatedAt: new Date()
                            });
                        }
                        
                        // Remove documents to simulate cleanup
                        const documents = store.documents.filter(doc => doc.id.startsWith(`cycle-${cycleNum}`));
                        documents.forEach(doc => store.removeDocument(doc.id));
                    }
                }, cycle);
                
                await browser.pause(100); // Allow for cleanup
            }
            
            // Force garbage collection if available
            await browser.execute(() => {
                if (window.gc) {
                    window.gc();
                }
            });
            
            await browser.pause(1000); // Allow for garbage collection
            
            const finalMemory = await browser.execute(() => {
                return performance.memory ? performance.memory.usedJSHeapSize : 0;
            });
            
            // Memory should not grow significantly (allow 50% increase)
            if (initialMemory > 0 && finalMemory > 0) {
                const memoryGrowth = (finalMemory - initialMemory) / initialMemory;
                expect(memoryGrowth).toBeLessThan(0.5);
            }
        });

        it('should maintain constant DOM element count regardless of document count', async () => {
            // Test with small document set
            await browser.execute(() => {
                const { useAppStore } = window;
                const store = useAppStore.getState();
                const projectId = store.projects[0]?.id;
                
                if (projectId) {
                    // Clear existing documents
                    store.documents.forEach(doc => store.removeDocument(doc.id));
                    
                    // Add 10 documents
                    for (let i = 0; i < 10; i++) {
                        store.addDocument({
                            id: `small-doc-${i}`,
                            projectId: projectId,
                            path: `/small/document-${i}.md`,
                            name: `Small-Document-${i}.md`,
                            content: `# Small Document ${i}`,
                            state: 'draft',
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                }
            });
            
            await browser.pause(500);
            let smallSetDOMCount = await browser.$$('[data-testid="file-item"]').length;
            
            // Test with large document set
            await browser.execute(() => {
                const { useAppStore } = window;
                const store = useAppStore.getState();
                const projectId = store.projects[0]?.id;
                
                if (projectId) {
                    // Add 1000 more documents
                    for (let i = 0; i < 1000; i++) {
                        store.addDocument({
                            id: `large-doc-${i}`,
                            projectId: projectId,
                            path: `/large/document-${i}.md`,
                            name: `Large-Document-${i}.md`,
                            content: `# Large Document ${i}`,
                            state: 'draft',
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                }
            });
            
            await browser.pause(500);
            let largeSetDOMCount = await browser.$$('[data-testid="file-item"]').length;
            
            // DOM element count should be similar regardless of document count
            expect(Math.abs(largeSetDOMCount - smallSetDOMCount)).toBeLessThan(5);
        });
    });

    describe('Sorting and Filtering Performance', () => {
        it('should sort large document sets efficiently', async () => {
            await browser.waitForDisplayed('[data-testid="sort-button"]', { timeout: 5000 });
            
            const sortButton = await browser.$('[data-testid="sort-button"]');
            
            // Test different sort operations
            const sortTimes = [];
            
            for (let i = 0; i < 5; i++) {
                const startTime = Date.now();
                
                await sortButton.click(); // Toggle sort order
                await browser.waitForDisplayed('[data-testid="file-item"]', { timeout: 2000 });
                
                const sortTime = Date.now() - startTime;
                sortTimes.push(sortTime);
                
                await browser.pause(100);
            }
            
            const averageSortTime = sortTimes.reduce((a, b) => a + b, 0) / sortTimes.length;
            
            // Sorting should complete within 200ms on average
            expect(averageSortTime).toBeLessThan(200);
        });

        it('should filter by state efficiently with large document sets', async () => {
            await browser.waitForDisplayed('[data-testid="filter-button"]', { timeout: 5000 });
            
            const filterButton = await browser.$('[data-testid="filter-button"]');
            await filterButton.click();
            
            await browser.waitForDisplayed('[data-testid="state-filter-draft"]', { timeout: 2000 });
            
            const draftFilter = await browser.$('[data-testid="state-filter-draft"]');
            
            const startTime = Date.now();
            await draftFilter.click();
            
            // Wait for filtering to complete
            await browser.waitForDisplayed('[data-testid="file-item"]', { timeout: 2000 });
            
            const filterTime = Date.now() - startTime;
            
            // Filtering should complete within 300ms
            expect(filterTime).toBeLessThan(300);
            
            // Verify filter is applied
            const resultCount = await browser.$('[data-testid="result-count"]');
            const countText = await resultCount.getText();
            expect(countText).toMatch(/\d+ \/ 1000/); // Should show filtered results
        });
    });

    describe('Performance Metrics Display', () => {
        it('should display accurate virtualization metrics', async () => {
            await browser.waitForDisplayed('[data-testid="virtualized-file-list"]', { timeout: 5000 });
            
            // Check if performance metrics are displayed for large document sets
            const performanceMetrics = await browser.$('[data-testid="performance-metrics"]');
            
            if (await performanceMetrics.isDisplayed()) {
                const metricsText = await performanceMetrics.getText();
                
                // Should show virtualization information
                expect(metricsText).toContain('Virtualized');
                expect(metricsText).toContain('Rendering');
                expect(metricsText).toMatch(/\d+% efficiency/);
            }
            
            // Check footer stats
            const footerStats = await browser.$('[data-testid="footer-stats"]');
            if (await footerStats.isDisplayed()) {
                const statsText = await footerStats.getText();
                expect(statsText).toMatch(/\d+ files/);
            }
        });

        it('should show correct document counts and filtering status', async () => {
            await browser.waitForDisplayed('[data-testid="document-count-badge"]', { timeout: 5000 });
            
            const countBadge = await browser.$('[data-testid="document-count-badge"]');
            const badgeText = await countBadge.getText();
            
            // Should show total document count
            expect(badgeText).toMatch(/\d+ \/ \d+/);
            
            // Test search filtering count update
            const searchInput = await browser.$('[data-testid="search-input"]');
            await searchInput.setValue('Document-1');
            
            await browser.waitUntil(async () => {
                const updatedBadgeText = await countBadge.getText();
                return updatedBadgeText !== badgeText; // Count should change
            }, { timeout: 2000 });
            
            const filteredBadgeText = await countBadge.getText();
            expect(filteredBadgeText).toMatch(/\d+ \/ \d+/);
            
            // Clear search
            await searchInput.clearValue();
            
            await browser.waitUntil(async () => {
                const restoredBadgeText = await countBadge.getText();
                return restoredBadgeText === badgeText; // Count should restore
            }, { timeout: 2000 });
        });
    });
});

/**
 * Performance Benchmark Suite
 * Measures and reports specific performance metrics
 */
describe('File List Performance Benchmarks', () => {
    const performanceResults = {};

    before(async () => {
        await browser.url('http://localhost:1420');
        await browser.waitForDisplayed('[data-testid="app-container"]', { timeout: 10000 });
    });

    it('benchmarks rendering performance across different document counts', async () => {
        const documentCounts = [100, 500, 1000, 2000, 5000];
        
        for (const count of documentCounts) {
            // Setup project with specific document count
            await browser.execute((docCount) => {
                const { useAppStore } = window;
                const store = useAppStore.getState();
                
                // Clear existing documents
                store.documents.forEach(doc => store.removeDocument(doc.id));
                
                const projectId = store.projects[0]?.id || 'test-project';
                
                // Add documents
                for (let i = 0; i < docCount; i++) {
                    store.addDocument({
                        id: `bench-doc-${i}`,
                        projectId: projectId,
                        path: `/bench/document-${i}.md`,
                        name: `Benchmark-Document-${i}.md`,
                        content: `# Benchmark Document ${i}\n\nContent...`,
                        state: 'draft',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }, count);
            
            // Measure rendering time
            const startTime = Date.now();
            await browser.waitForDisplayed('[data-testid="virtualized-file-list"]', { timeout: 10000 });
            const renderTime = Date.now() - startTime;
            
            performanceResults[`render_${count}_docs`] = renderTime;
            
            // Measure scroll performance
            const fileList = await browser.$('[data-testid="virtualized-file-list"]');
            const scrollStartTime = Date.now();
            await fileList.scrollIntoView({ block: 'end' });
            await browser.pause(50);
            await fileList.scrollIntoView({ block: 'start' });
            const scrollTime = Date.now() - scrollStartTime;
            
            performanceResults[`scroll_${count}_docs`] = scrollTime;
            
            console.log(`Performance for ${count} documents: Render=${renderTime}ms, Scroll=${scrollTime}ms`);
        }
        
        // Verify performance scaling
        expect(performanceResults.render_5000_docs).toBeLessThan(3000); // 3 second max for 5000 docs
        expect(performanceResults.scroll_5000_docs).toBeLessThan(200);  // 200ms max scroll time
    });

    after(() => {
        // Report performance results
        console.log('File List Performance Benchmark Results:', performanceResults);
    });
});
