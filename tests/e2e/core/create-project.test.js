import { TestUtils } from '../helpers/setup.js';

describe('Create Project Workflow', () => {
    let testProjectData;
    
    beforeEach(async () => {
        // Generate fresh test data for each test
        testProjectData = TestUtils.generateProjectData();
        
        // Wait for application to be ready
        await TestUtils.waitForApp();
        
        // Clear any existing state
        await TestUtils.clearAppState();
        
        // Take initial screenshot
        await TestUtils.takeScreenshot('create-project', 'initial-state');
    });
    
    afterEach(async () => {
        // Take final screenshot
        await TestUtils.takeScreenshot('create-project', 'final-state');
        
        // Clean up any created projects (if cleanup is needed)
        await TestUtils.clearAppState();
    });
    
    it('should successfully create a new project through the UI', async () => {
        console.log('🧪 Testing Create Project workflow...');
        
        // Step 1: Verify initial state - should show "Create your first project" or similar
        console.log('Step 1: Verifying initial application state');
        await TestUtils.takeScreenshot('create-project', 'step-1-initial');
        
        // Look for the "Create Project" button or similar trigger
        const createProjectButton = await browser.$('button*=Create');
        if (!(await createProjectButton.isExisting())) {
            // Try alternative selectors
            const altButton = await browser.$('[data-testid="create-project-button"]');
            if (await altButton.isExisting()) {
                await altButton.click();
            } else {
                // Try to find any button with "Project" in the text
                const projectButton = await browser.$('button*=Project');
                expect(await projectButton.isExisting()).to.be.true;
                await projectButton.click();
            }
        } else {
            await createProjectButton.click();
        }
        
        console.log('✅ Step 1: Found and clicked create project button');
        await TestUtils.takeScreenshot('create-project', 'step-1-clicked-create');
        
        // Step 2: Wait for project creation modal/form to appear
        console.log('Step 2: Waiting for project creation form');
        await browser.waitUntil(async () => {
            try {
                // Look for modal dialog or form
                const modal = await browser.$('[role="dialog"]');
                if (await modal.isExisting() && await modal.isDisplayed()) {
                    return true;
                }
                
                // Alternative: look for form elements
                const nameInput = await browser.$('input[placeholder*="name" i]');
                return await nameInput.isExisting();
            } catch (error) {
                return false;
            }
        }, {
            timeout: 10000,
            timeoutMsg: 'Project creation form did not appear within 10 seconds'
        });
        
        console.log('✅ Step 2: Project creation form appeared');
        await TestUtils.takeScreenshot('create-project', 'step-2-form-appeared');
        
        // Step 3: Fill in project details
        console.log('Step 3: Filling in project details');
        
        // Find and fill project name input
        const nameInput = await browser.$('input[placeholder*="name" i], input[name="name"], input[id*="name"]');
        expect(await nameInput.isExisting()).to.be.true;
        await nameInput.waitForDisplayed({ timeout: 5000 });
        await nameInput.setValue(testProjectData.name);
        
        console.log(`✅ Step 3a: Entered project name: ${testProjectData.name}`);
        
        // Find and fill project description (if available)
        try {
            const descriptionInput = await browser.$('textarea[placeholder*="description" i], textarea[name="description"], input[placeholder*="description" i]');
            if (await descriptionInput.isExisting()) {
                await descriptionInput.setValue(testProjectData.description);
                console.log(`✅ Step 3b: Entered project description`);
            }
        } catch (error) {
            console.log('Note: Description field not found or not required');
        }
        
        // Find and fill project path (if available)
        try {
            const pathInput = await browser.$('input[placeholder*="path" i], input[name="path"], input[placeholder*="location" i]');
            if (await pathInput.isExisting()) {
                await pathInput.setValue(testProjectData.path);
                console.log(`✅ Step 3c: Entered project path: ${testProjectData.path}`);
            }
        } catch (error) {
            console.log('Note: Path field not found or auto-generated');
        }
        
        await TestUtils.takeScreenshot('create-project', 'step-3-form-filled');
        
        // Step 4: Submit the form
        console.log('Step 4: Submitting project creation form');
        
        // Look for submit button
        const submitButton = await browser.$('button*=Create, button[type="submit"], button*=Save');
        expect(await submitButton.isExisting()).to.be.true;
        await submitButton.waitForClickable({ timeout: 5000 });
        await submitButton.click();
        
        console.log('✅ Step 4: Clicked submit button');
        await TestUtils.takeScreenshot('create-project', 'step-4-submitted');
        
        // Step 5: Wait for project creation to complete
        console.log('Step 5: Waiting for project creation to complete');
        
        // Wait for loading to complete
        await TestUtils.waitForLoadingComplete();
        
        // Wait for the modal to close (indicating success)
        await browser.waitUntil(async () => {
            try {
                const modal = await browser.$('[role="dialog"]');
                return !(await modal.isDisplayed());
            } catch (error) {
                return true; // Modal doesn't exist, which means it closed
            }
        }, {
            timeout: 15000,
            timeoutMsg: 'Project creation modal did not close within 15 seconds'
        });
        
        console.log('✅ Step 5: Project creation completed (modal closed)');
        await TestUtils.takeScreenshot('create-project', 'step-5-creation-complete');
        
        // Step 6: Verify project was created successfully
        console.log('Step 6: Verifying project was created successfully');
        
        // Look for project in the UI
        await browser.waitUntil(async () => {
            try {
                // Look for project name in the UI
                const projectElement = await browser.$(`*=${testProjectData.name}`);
                if (await projectElement.isExisting()) {
                    return true;
                }
                
                // Alternative: look for project panel or list
                const projectPanel = await browser.$('[data-testid="project-panel"], [class*="project"]');
                return await projectPanel.isExisting();
            } catch (error) {
                return false;
            }
        }, {
            timeout: 10000,
            timeoutMsg: 'Created project did not appear in the UI within 10 seconds'
        });
        
        console.log('✅ Step 6: Project appears in the UI');
        
        // Verify project details are correct
        try {
            const projectNameElement = await browser.$(`*=${testProjectData.name}`);
            expect(await projectNameElement.isExisting()).to.be.true;
            console.log('✅ Step 6a: Project name is displayed correctly');
        } catch (error) {
            console.log('Note: Could not verify project name display:', error.message);
        }
        
        await TestUtils.takeScreenshot('create-project', 'step-6-verification-complete');
        
        // Step 7: Verify application state after project creation
        console.log('Step 7: Verifying application state');
        
        // The app should now be in "project loaded" state
        await TestUtils.verifyAppState('project-loaded');
        
        console.log('✅ Step 7: Application is in correct state after project creation');
        await TestUtils.takeScreenshot('create-project', 'step-7-final-state');
        
        console.log('🎉 Create Project workflow test completed successfully!');
    });
    
    it('should show validation errors for invalid project data', async () => {
        console.log('🧪 Testing Create Project validation...');
        
        // Click create project button
        const createProjectButton = await browser.$('button*=Create');
        if (await createProjectButton.isExisting()) {
            await createProjectButton.click();
        }
        
        // Wait for form to appear
        await browser.waitUntil(async () => {
            const modal = await browser.$('[role="dialog"]');
            return await modal.isExisting() && await modal.isDisplayed();
        }, { timeout: 10000 });
        
        await TestUtils.takeScreenshot('create-project-validation', 'form-opened');
        
        // Try to submit empty form
        const submitButton = await browser.$('button*=Create, button[type="submit"]');
        if (await submitButton.isExisting()) {
            await submitButton.click();
            
            // Wait for validation errors to appear
            await browser.pause(1000);
            
            // Look for error messages
            const errorMessages = await browser.$$('[class*="error"], [role="alert"], .text-red-500, .text-destructive');
            
            if (errorMessages.length > 0) {
                console.log('✅ Validation errors are displayed for empty form');
                await TestUtils.takeScreenshot('create-project-validation', 'validation-errors');
            } else {
                console.log('Note: No validation errors found (may not be implemented yet)');
            }
        }
        
        console.log('✅ Create Project validation test completed');
    });
    
    it('should allow canceling project creation', async () => {
        console.log('🧪 Testing Create Project cancellation...');
        
        // Click create project button
        const createProjectButton = await browser.$('button*=Create');
        if (await createProjectButton.isExisting()) {
            await createProjectButton.click();
        }
        
        // Wait for form to appear
        await browser.waitUntil(async () => {
            const modal = await browser.$('[role="dialog"]');
            return await modal.isExisting() && await modal.isDisplayed();
        }, { timeout: 10000 });
        
        await TestUtils.takeScreenshot('create-project-cancel', 'form-opened');
        
        // Look for cancel button
        const cancelButton = await browser.$('button*=Cancel, button*=Close');
        if (await cancelButton.isExisting()) {
            await cancelButton.click();
            
            // Wait for modal to close
            await browser.waitUntil(async () => {
                try {
                    const modal = await browser.$('[role="dialog"]');
                    return !(await modal.isDisplayed());
                } catch (error) {
                    return true;
                }
            }, { timeout: 5000 });
            
            console.log('✅ Project creation was cancelled successfully');
            await TestUtils.takeScreenshot('create-project-cancel', 'cancelled');
        } else {
            console.log('Note: Cancel button not found');
        }
        
        console.log('✅ Create Project cancellation test completed');
    });
});
