# Mermaid Diagram Test Document

This document contains various Mermaid diagrams to test the integration in Project Yarn's Markdown editor.

## Flowchart Example

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Editor
    participant Mermaid
    
    User->>Editor: Types diagram
    Editor->>Mermaid: Parse syntax
    Mermaid->>Editor: Render diagram
    Editor->>User: Display result
```

## Class Diagram

```mermaid
classDiagram
    class MarkdownEditor {
        +String content
        +String viewMode
        +Array mermaidBlocks
        +setViewMode()
        +parseMermaidBlocks()
    }
    
    class MermaidDiagram {
        +String definition
        +render()
        +validate()
    }
    
    MarkdownEditor --> MermaidDiagram
```

## Git Graph

```mermaid
gitgraph
    commit id: "Initial"
    branch feature
    checkout feature
    commit id: "Add Mermaid"
    commit id: "Test diagrams"
    checkout main
    merge feature
    commit id: "Release"
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Edit
    Edit --> Preview : Toggle Preview
    Preview --> Edit : Toggle Edit
    Edit --> Split : Toggle Split
    Split --> Edit : Toggle Edit
    Split --> Preview : Toggle Preview
    Preview --> Split : Toggle Split
```

## Regular Markdown Content

This is regular markdown content that should render normally:

- **Bold text**
- *Italic text*
- `Code snippets`
- [Links](https://example.com)

### Code Block (Non-Mermaid)

```javascript
function testMermaid() {
    console.log("This should not be rendered as a diagram");
    return "Just regular code";
}
```

## Another Mermaid Diagram

```mermaid
pie title Task 3.3.2 Progress
    "Completed" : 85
    "Remaining" : 15
```

This document tests various Mermaid diagram types and ensures they render correctly in the sandboxed iframe while preserving regular markdown functionality.
