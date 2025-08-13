# TP-002-20250803-app-startup-fix-plan

## Overview
**Project Name:** Project Yarn  
**Date:** 2025-08-03  
**Goal:** Fix critical startup issues preventing the Project Yarn application from launching

### Problem Statement
The Project Yarn application fails to start due to two critical blocking issues:
1. **Backend (Tauri) Issue**: `tauri-plugin-updater` version mismatch - version "1.0" doesn't exist, needs "2.0.0-rc.4"
2. **Frontend (React) Issue**: Multiple UI components using incorrect absolute import paths for utils module

### Current Status
- Frontend builds successfully (Vite ready in ~200ms)
- Backend compilation fails due to plugin version mismatch
- 6 UI components have incorrect import paths that will cause runtime errors
- App cannot reach http://localhost:1420/ due to backend failure

## Pre-requisites
- Node.js and npm installed
- Rust and Cargo installed
- Tauri CLI available
- Project dependencies installed via `npm install`

## Dependencies
- No external dependencies or team coordination required
- All fixes are internal to the codebase

## Task Breakdown

### Phase 1: Backend Fix (Tauri Plugin Version)
- [ ] 1.0 Fix Tauri Plugin Version Mismatch
    - [ ] 1.1 Update `tauri-plugin-updater` version in `src-tauri/Cargo.toml` from "1.0" to "2.0.0-rc.4"
    - [ ] 1.2 Verify Cargo.toml syntax is correct after change
    - [ ] 1.3 Test backend compilation with `cargo check` in src-tauri directory
    - [ ] 1.4 Confirm fix resolves the plugin version error

### Phase 2: Frontend Fixes (Import Path Corrections)
- [ ] 2.0 Fix UI Component Import Paths (6 components)
    - [ ] 2.1 Fix import in `src/components/ui/button.tsx` from `"src/lib/utils"` to `"../../lib/utils"`
    - [ ] 2.2 Fix import in `src/components/ui/badge.tsx` from `"src/lib/utils"` to `"../../lib/utils"`
    - [ ] 2.3 Fix import in `src/components/ui/dialog.tsx` from `"src/lib/utils"` to `"../../lib/utils"`
    - [ ] 2.4 Fix import in `src/components/ui/input.tsx` from `"src/lib/utils"` to `"../../lib/utils"`
    - [ ] 2.5 Fix import in `src/components/ui/select.tsx` from `"src/lib/utils"` to `"../../lib/utils"`
    - [ ] 2.6 Fix import in `src/components/ui/textarea.tsx` from `"src/lib/utils"` to `"../../lib/utils"`

### Phase 3: Validation and Testing
- [ ] 3.0 Validate All Fixes Applied
    - [ ] 3.1 Verify no remaining `"src/lib/utils"` imports in UI components
    - [ ] 3.2 Verify Cargo.toml shows correct plugin version "2.0.0-rc.4"
    - [ ] 3.3 Test frontend build with `npm run dev` (should show no import errors)
    - [ ] 3.4 Test full application startup with `npm run tauri dev`
    - [ ] 3.5 Confirm app window opens and http://localhost:1420/ is accessible

## Implementation Guidelines

### Atomic Task Execution Rules
- **Execute ONE task at a time** - complete each sub-task before moving to the next
- **Verify each change** - confirm the fix works before proceeding
- **Stop on errors** - if any task fails, diagnose and fix before continuing
- **No parallel execution** - tasks must be completed sequentially

### File Modification Approach
1. **Single File Changes**: Modify one file per task
2. **Immediate Verification**: Test the change immediately after making it
3. **Rollback Strategy**: Keep track of changes in case rollback is needed

### Testing Strategy
- After Phase 1: Test backend compilation only
- After Phase 2: Test frontend build only  
- After Phase 3: Test full application startup

## Proposed File Structure
No new files or directories needed. Modifications to existing files:

```
src-tauri/
├── Cargo.toml                    # Update plugin version
src/components/ui/
├── button.tsx                    # Fix import path
├── badge.tsx                     # Fix import path
├── dialog.tsx                    # Fix import path
├── input.tsx                     # Fix import path
├── select.tsx                    # Fix import path
└── textarea.tsx                  # Fix import path
```

## Edge Cases & Error Handling

### Potential Issues
1. **Cargo Cache**: May need `cargo clean` if plugin cache is corrupted
2. **Node Module Cache**: May need to clear Vite cache if import resolution fails
3. **Port Conflicts**: Port 1420 may be in use by another process
4. **Permission Issues**: File modification permissions on Windows

### Error Handling Strategy
- **Backup Approach**: Keep original file contents for rollback
- **Incremental Testing**: Test each change individually
- **Clear Error Messages**: Document exact error messages encountered
- **Alternative Solutions**: Have fallback approaches for each fix

## Code Review Guidelines

### Critical Review Points
1. **Exact Version Match**: Ensure `tauri-plugin-updater` version is exactly "2.0.0-rc.4"
2. **Import Path Accuracy**: Verify all import paths use exactly `"../../lib/utils"`
3. **File Syntax**: Confirm no syntax errors introduced during modifications
4. **No Regression**: Ensure no other imports or functionality broken

### Validation Checklist
- [ ] Cargo.toml syntax is valid TOML format
- [ ] All import statements use correct relative paths
- [ ] No TypeScript compilation errors
- [ ] No Rust compilation errors
- [ ] Application starts successfully

## Acceptance Testing Checklist

### Functional Requirements
- [ ] **Backend Compilation**: `cargo check` in src-tauri passes without plugin errors
- [ ] **Frontend Build**: `npm run dev` completes without import resolution errors
- [ ] **Application Startup**: `npm run tauri dev` successfully starts the application
- [ ] **UI Accessibility**: Application window opens and displays correctly
- [ ] **Web Interface**: http://localhost:1420/ is accessible in browser
- [ ] **No Console Errors**: No critical errors in browser console or terminal

### Non-Functional Requirements
- [ ] **Startup Time**: Application starts within reasonable time (< 30 seconds)
- [ ] **Resource Usage**: No excessive memory or CPU usage during startup
- [ ] **Error Recovery**: Application handles startup errors gracefully

## Notes / Open Questions

### Future Improvements
- Consider setting up absolute import paths properly with TypeScript path mapping
- Evaluate if Tauri plugin version should be pinned or use range
- Add automated tests to prevent similar import path issues

### Risk Mitigation
- All changes are minimal and low-risk
- Each change can be easily reverted if needed
- No database or external service dependencies affected

## Success Criteria
✅ **Primary Goal**: Project Yarn application starts successfully  
✅ **Secondary Goal**: All import paths use correct relative paths  
✅ **Tertiary Goal**: No compilation or runtime errors during startup

---
**Document Type**: Task Plan (TP)  
**Sequence Number**: 002  
**Date**: 20250803  
**Name**: app-startup-fix-plan
