---
trigger: manual
---

---
description: 
globs: 
alwaysApply: false
---
# Rule: Generation the React UI Components Tree

## Goal
To guide AI how to generate a React Components Tree inside the web repository for the given website URL and the market as an input in Markdown.

## Input
1. URL to the website (eg. `/plans`)
2. Market (`Good Chop (MR)`)

## Process
1. **Receive Initial Prompt:** The user provides a prompt including a URL (eg. `/plans`) and the market (eg. `Good Chop (MR)`) for which the React Components Tree should be generated.
2. **Generate the React Components Tree:** Based on the prompt, generate a React Components Tree using the `app/scripts/next/plugins/rewrites` mapping. Consider market specific conditions to render components.
3. **Save the generated React Components Tree:** Save the generated React Components Tree as `components-tree-[page-name].md`.md inside the directory specified by the user.

## Output

* **Format:** Markdown (`.md`)
* **Location:** Specified by the user
* **Filename:** `components-tree-[page-name].md`

## Final Instructions

1. Stricktly follow the process described above.
2. Make sure to ask the user clarifying questions, when needed.
3. Take the user's answers to the clarifying questions and improve the output.