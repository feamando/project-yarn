# Rollback Strategy - TP-014 Reference UI Alignment

**Date:** 2025-08-11  
**Branch:** feature/reference-ui-alignment-20250811-014  
**Task:** TP-014 Rollback Strategy

## Phase-by-Phase Rollback Plan

### Phase 1: Import Path Alignment (TP-009)
**Rollback Command:**
```bash
git reset --hard HEAD~1  # If single commit
# OR
git revert <commit-hash>  # If already pushed
```

**Recovery Steps:**
1. Verify YarnLogo and ContextIndicator are back in `v0-components/`
2. Check all import statements are reverted
3. Run `npm run build` to verify compilation
4. Test application functionality

**Rollback Validation:**
- [ ] Components in original locations
- [ ] All imports working
- [ ] TypeScript compilation passes
- [ ] Application starts successfully

### Phase 2: Missing Components Addition (TP-010)
**Rollback Command:**
```bash
git reset --hard HEAD~<number-of-commits>
# OR selective removal
rm src/components/ui/accordion.tsx
rm src/components/ui/alert-dialog.tsx
# ... (remove all 27 added components)
```

**Recovery Steps:**
1. Remove all newly added UI components
2. Restore original `src/components/ui/` state
3. Update any modified index files
4. Run `npm run build` to verify compilation

**Rollback Validation:**
- [ ] Only original 18 UI components remain
- [ ] No broken imports from removed components
- [ ] TypeScript compilation passes
- [ ] Application functionality preserved

### Phase 3: Theme Provider Addition (TP-011)
**Rollback Command:**
```bash
git reset --hard HEAD~1
# OR
rm src/components/theme-provider.tsx
# Revert App.tsx changes
```

**Recovery Steps:**
1. Remove theme-provider.tsx
2. Revert App.tsx integration changes
3. Remove theme context usage
4. Run `npm run build` to verify compilation

**Rollback Validation:**
- [ ] theme-provider.tsx removed
- [ ] App.tsx reverted to original state
- [ ] No theme-related imports remain
- [ ] Application starts without theme provider

### Phase 4: Structural Simplification (TP-012)
**Rollback Command:**
```bash
git reset --hard HEAD~<number-of-commits>
# OR restore directory structure
git mv src/components/ComponentName.tsx src/components/original-dir/ComponentName.tsx
```

**Recovery Steps:**
1. Restore original directory structure
2. Move components back to specialized directories
3. Update all import statements
4. Restore any removed directories
5. Run `npm run build` to verify compilation

**Rollback Validation:**
- [ ] Original directory structure restored
- [ ] All components in original locations
- [ ] Import statements updated correctly
- [ ] TypeScript compilation passes
- [ ] All functionality preserved

### Phase 5: Component Consolidation (TP-013)
**Rollback Command:**
```bash
git reset --hard HEAD~<number-of-commits>
# OR revert specific component changes
```

**Recovery Steps:**
1. Restore original component implementations
2. Revert interface standardization changes
3. Restore original component patterns
4. Update any affected imports
5. Run `npm run build` to verify compilation

**Rollback Validation:**
- [ ] Original component implementations restored
- [ ] Component interfaces reverted
- [ ] No breaking changes to component usage
- [ ] TypeScript compilation passes
- [ ] All functionality preserved

## Complete Rollback Strategy

### Emergency Full Rollback
If critical issues arise at any point:

```bash
# Return to baseline state
git checkout main
git branch -D feature/reference-ui-alignment-20250811-014
git checkout -b feature/reference-ui-alignment-20250811-014-v2
```

### Partial Rollback to Specific Phase
```bash
# Find the commit hash for the desired phase
git log --oneline

# Reset to specific phase
git reset --hard <phase-commit-hash>

# Continue from that point
```

## Rollback Validation Checklist

After any rollback operation:
- [ ] TypeScript compilation passes (`npm run build`)
- [ ] Application starts successfully (`npm run dev`)
- [ ] No console errors in browser
- [ ] Key functionality works as expected
- [ ] Import statements resolve correctly
- [ ] No missing components or broken references

## Recovery Documentation

### Common Issues and Solutions

**Issue: Broken imports after rollback**
- Solution: Search and replace import paths
- Command: `grep -r "old-import-path" src/` to find remaining references

**Issue: Missing components after rollback**
- Solution: Verify all components are in expected locations
- Command: `find src/components -name "*.tsx" | sort` to list all components

**Issue: TypeScript compilation errors**
- Solution: Check for missing dependencies or type definitions
- Command: `npm run build` to see specific errors

**Issue: Application won't start**
- Solution: Check for missing imports in main application files
- Files to check: `src/App.tsx`, `src/main.tsx`, `src/index.tsx`

## Rollback Testing Protocol

1. **Immediate Validation**
   - Run TypeScript compilation
   - Start development server
   - Check browser console for errors

2. **Functionality Testing**
   - Test core application features
   - Verify component rendering
   - Check for any broken functionality

3. **Import Validation**
   - Search for any remaining references to moved/removed components
   - Verify all imports resolve correctly
   - Check for circular dependencies

## Emergency Contacts and Resources

- **Baseline Documentation:** `baseline-state-20250811-014.md`
- **Original Task Plans:** TP-009 through TP-013
- **Git History:** Use `git log --oneline` to see commit history
- **Component Inventory:** Documented in baseline state

## Notes

- Always test rollback procedures in a separate branch first
- Document any issues encountered during rollback
- Keep rollback commits separate and well-documented
- Verify functionality thoroughly after any rollback operation
