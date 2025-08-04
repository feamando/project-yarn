---
trigger: model_decision
---

---
alwaysApply: false
---
# Atomic Task Planning

Divide every job into the smallest possible atomic tasks and execute them one by one.

<rule>
name: atomic_task_planning
description: Enforce atomic task breakdown in planning phase before any work begins
filters:
  # Apply to all work requests
  - type: content
    pattern: "(?i)(add|create|implement|build|fix|change|update|refactor)"
  # Apply to all feature requests
  - type: content
    pattern: "(?i)(feature|task|requirement|request)"
  # Apply to planning activities
  - type: content
    pattern: "(?i)(plan|planning|approach|strategy)"

actions:
  - type: enforce
    message: |
      ATOMIC TASK PLANNING PROTOCOL

      MANDATORY WORKFLOW:

      1. **PLANNING PHASE REQUIRED**:
         - NEVER start work without atomic task breakdown
         - Divide ALL jobs into smallest possible tasks
         - Tasks can be as small as writing a single method
         - Tasks can be as small as renaming a variable
         - Present complete task list before starting

      2. **ATOMIC TASK CRITERIA**:
         - Each task must be independently completable
         - Should take minimal time to execute
         - Must have clear, measurable outcome
         - Cannot be broken down further meaningfully

      3. **EXECUTION RULES**:
         - Execute tasks ONE BY ONE only
         - Complete current task before starting next
         - Never work on multiple tasks simultaneously
         - Stop after each task completion

      4. **TASK EXAMPLES**:
         - "Write getUserById method"
         - "Add email validation"
         - "Rename variable 'data' to 'userData'"
         - "Add error handling to login function"
         - "Update import statement"
         - "Add single test case for edge condition"

      5. **NO TASK TOO SMALL**:
         - Prefer smaller tasks over larger ones
         - When in doubt, break it down further
         - Single line changes are valid tasks
         - Micro-improvements are encouraged

      WORKFLOW:
      1. Receive request
      2. Break into atomic tasks
      3. Present task list for approval
      4. Execute task 1
      5. Stop and confirm completion
      6. Execute task 2
      7. Repeat until all tasks done

examples:
  - input: |
      User: "Add user authentication"
      
      # Correct approach:
      "I'll break this into atomic tasks:
      1. Create User model
      2. Add password hashing method
      3. Create login endpoint
      4. Add authentication middleware
      5. Add logout functionality
      
      Should I proceed with task 1?"
    output: "Proper atomic task breakdown with sequential execution"

  - input: |
      User: "Fix the bug in calculation"
      
      # Correct approach:
      "I'll break this into atomic tasks:
      1. Identify the calculation error
      2. Write test that reproduces bug
      3. Fix the specific calculation line
      4. Verify test passes
      
      Should I start with task 1?"
    output: "Bug fix broken into atomic steps"

metadata:
  priority: high
  version: 1.0
  enforcement: strict
  dependencies: ["minimal-changes-policy", "test-driven-development"]
</rule>