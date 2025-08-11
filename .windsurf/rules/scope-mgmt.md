---
trigger: manual
---

---
description: Enforce conservative coding practices that make only user-requested changes without assumptions
globs: "**/*"
alwaysApply: false
---
# Minimal Changes Policy

Enforce conservative coding practices that prioritize user intent and minimal scope changes.

<rule>
name: minimal_changes_policy
description: Ensure changes are minimal, user-directed, and avoid assumptions
filters:
  # Apply to all code changes
  - type: event
    pattern: "code_change"
  # Apply to all file modifications
  - type: event
    pattern: "file_modify"
  # Apply to feature additions
  - type: content
    pattern: "(?i)(add|create|implement|build)"

actions:
  - type: enforce
    message: |
      STRICT POLICY: Minimal Changes Only

      NEVER do more than the user explicitly requested:

      1. **NO ASSUMPTIONS**:
         - Do not assume user needs additional features
         - Do not add "helpful" extras not requested
         - Do not anticipate future requirements
         - Ask clarifying questions if uncertain

      2. **SCOPE LIMITATIONS**:
         - Change ONLY what user specified
         - Make small, incremental changes
         - Stop after completing the specific request

      3. **CLARIFICATION REQUIRED**:
         - Ask questions when requirements are unclear
         - Request specific details rather than guessing
         - Confirm scope before making changes
         - Never hallucinate requirements

      4. **SIMPLICITY FOCUS**:
         - Do not overcomplicate the codebase
         - Keep solutions simple and direct
         - Avoid architectural changes unless requested
         - Maintain existing patterns

      5. **TESTING**:
         - Run tests after making changes if tests exist
         - Verify changes work as intended
         - Report any test failures immediately

examples:
  - input: |
      User: "Fix this bug in login.js"
      
      # Bad: Also refactor authentication, add logging, update styles
      # Good: Fix only the specific bug mentioned
    output: "Fixed only the specific bug in login.js"

  - input: |
      User: "Add a button to the header"
      
      # Bad: Also improve header layout, add animations, update theme
      # Good: Add only the requested button
    output: "Added only the requested button to header"

metadata:
  priority: critical
  version: 1.0
  enforcement: strict
</rule>