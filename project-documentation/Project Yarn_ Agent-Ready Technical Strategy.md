

# **Project Yarn: Agent-Ready Technical Strategy**

Document Version: 3.0  
Date: July 14, 2025  
Status: Final  
Authors: Principal Systems Architect

## **1\. Introduction: An IDE for Documents**

This document outlines the definitive technical strategy for Project Yarn, directly derived from the "Project Yarn PRD: Final" (Version 3.0). Its primary purpose is to serve as a blueprint for the development team, including both human engineers and AI agents.

The core vision is to build an "IDE for Documents"—a high-performance, AI-native environment that unifies the entire lifecycle of professional writing within a single, local-first application.1 To achieve this, the architecture prioritizes modularity, security, and performance. A key guiding principle is

**Agent-Ready Development**; this document is intentionally structured with explicit boundaries, clear instructions, and code examples to facilitate efficient, task-oriented development by AI agents.1

## **2\. Foundational Technology Stack**

The technology stack is chosen to deliver on the core principles of being AI-Native and Local-First, ensuring performance, security, and a robust foundation for future growth.1

### **2.1. Desktop Framework: Tauri**

The definitive choice for the desktop framework is **Tauri**. This decision is based on a strategic prioritization of performance, resource efficiency, and security—qualities that are paramount for an AI-heavy, local-first application.2

Tauri's architecture leverages the operating system's native WebView component (WebView2 on Windows, WebKit on macOS) instead of bundling an entire browser engine.3 This results in significantly smaller application bundles (2.5–10 MB vs. Electron's 80–244 MB) and lower memory consumption (\~58% less RAM), which is critical for ensuring a responsive user experience during intensive local tasks like AI context management and document indexing.2

Furthermore, Tauri's security model is fundamentally more robust. It is built on the "principle of least privilege," where the frontend WebView is sandboxed and has no direct access to the operating system.6 All privileged operations must be explicitly exposed by the Rust backend via a secure Inter-Process Communication (IPC) bridge, creating a much smaller attack surface than Electron's model.3 For an application handling sensitive user API keys and proprietary documents, this security-first architecture is a decisive advantage.1

| Feature | Tauri | Electron | Justification for Yarn |
| :---- | :---- | :---- | :---- |
| **Architecture** | Rust backend with OS-native WebView for UI 3 | Bundled Chromium instance with Node.js backend 8 | Tauri's lean architecture is critical for the performance of an AI-heavy, local-first application. |
| **Performance** | Significantly lower CPU and RAM usage (\~58% less memory) 5 | High resource consumption due to bundled browser engine 9 | Yarn's responsiveness during intensive local processing depends on minimizing resource overhead. |
| **Bundle Size** | Extremely small binaries (2.5 MB to 10 MB) 2 | Very large binaries (80 MB to 244 MB) 3 | A smaller download improves user acquisition and reduces distribution costs. |
| **Security Model** | Secure by default; sandboxed WebView enforces least privilege 6 | Requires manual hardening; renderer has Node.js access 10 | Handling user API keys and proprietary documents demands the most secure architecture available. |

### **2.2. Core Stack and Platform Support**

* **Core Stack:** The application will be built with **Rust** for the backend and **React** for the frontend.1 This combination leverages Rust's exceptional performance and memory safety for core logic and AI integration, while utilizing React's vast ecosystem for building a sophisticated and interactive UI.11  
* **Platform Support:** To ensure a native experience and avoid the performance penalties of emulation layers like Rosetta 2, **native binaries** are mandatory for all target platforms.13 The build pipeline will be configured to compile for 1:  
  * Windows: x86\_64 and ARM64 (aarch64) 15  
  * macOS: x86\_64 (Intel) and ARM64 (Apple Silicon) 16

### **2.3. Recommended Technology Stack Summary**

This table provides a consolidated blueprint of the recommended technology stack, serving as a single source of truth for the development team.

| Category | Recommended Technology | Justification/Role in Project Yarn |
| :---- | :---- | :---- |
| **Desktop Framework** | Tauri | Provides a secure, lightweight, and high-performance foundation using a Rust backend and native WebViews, crucial for an AI-forward application.3 |
| **Backend Language** | Rust | Ensures memory safety and top-tier performance for core logic, AI integration, and file system operations.12 |
| **Frontend Framework** | React | Enables the creation of a complex, component-based, and interactive three-panel UI with a vast ecosystem of tools and libraries.18 |
| **UI Component Library** | Shadcn/ui | Provides a set of accessible, unstyled UI primitives that can be easily customized to create Yarn's unique visual identity.19 |
| **UI State Management** | Zustand & React Context | Zustand for simple, performant global UI state; React Context for localized, feature-scoped state to balance power and complexity.20 |
| **Workflow State Mgt.** | Custom FSM in Rust | A backend Finite State Machine to enforce the prescribed, robust, and secure document lifecycle (e.g., Memo \-\> PRD).22 |
| **Local Database** | SQLite with rusqlite | Ideal for transactional (OLTP) workloads like managing project meta-files and document metadata; provides robust, reliable local storage.23 |
| **Local Search** | SQLite FTS5 Extension | Provides fast, efficient, and powerful full-text search capabilities for all .md documents, enabling the RAG system.24 |
| **Local AI Inference** | Candle (Rust) | A minimalist ML framework for running bundled models in a Rust-based sidecar, ensuring a cohesive and performant stack.1 |
| **AI API Clients** | aws-sdk-bedrockruntime, gemini-rs | Official and community-maintained Rust crates for direct, type-safe interaction with Amazon Bedrock and Google Gemini APIs.25 |
| **Build & CI/CD** | GitHub Actions with tauri-action | Automates the entire cross-platform build, signing, and release process for all target architectures.27 |

## **3\. System Architecture**

### **3.1. Multi-Process Model**

The application is architecturally defined by Tauri's multi-process model, which creates a fundamental separation between the application's core logic and its user interface.6

* **The Tauri Core Process (Rust):** This is the privileged heart of the application. It is a native Rust binary responsible for all high-trust operations, including window management, file system I/O, network requests, database connections, and execution of core business logic.29  
* **The WebView Process (React/JavaScript):** This process renders the entire UI within a sandboxed, OS-native WebView. It has zero direct access to the file system or other native capabilities.6

This "Isolation Pattern" is a foundational security contract. It treats the entire frontend and its extensive tree of npm dependencies as an untrusted environment, mitigating a wide range of potential vulnerabilities.7 Any request for a privileged operation must be sent to the trusted Rust core for validation.

### **3.2. Backend Design: Layered "Clean Architecture"**

The Rust backend will be structured using a layered architecture inspired by the principles of **Clean Architecture**.31 This enforces a strict separation of concerns, enhances testability, and ensures the core business logic remains portable and decoupled from external frameworks like Tauri.32 This modularity is a direct enabler of agentic development. By creating clear boundaries, tasks can be scoped with high precision (e.g., "implement a new database adapter in the Infrastructure layer"), allowing an AI agent to work on one part of the system without needing context on the whole.1

The backend will comprise three layers:

* **Core/Domain Layer:** Pure Rust logic defining the fundamental business entities (Project, Document) and rules (the FSM). The Project entity encapsulates all project-specific metadata, including name, version, file lists, and the map of key concepts and definitions that ensures project-wide consistency. It has zero external dependencies.  
* **Application/Service Layer:** Orchestrates use cases (e.g., CreateNewDocument). It depends on the Core layer and interacts with the outside world through abstract interfaces (Rust traits like IAiProvider).  
* **Adapter/Infrastructure Layer:** The outermost layer that implements the interfaces. It contains the Tauri command handlers, database clients, and AI API clients, acting as the "glue" to the external world.32

### **3.3. Frontend-Backend Communication: Tauri IPC**

All communication between the React frontend and the Rust backend will occur exclusively through Tauri's secure IPC mechanisms, ensuring all interactions are explicit and auditable.33

* **Commands:** Used for request-response interactions initiated by the frontend (e.g., saving a file). A frontend invoke call triggers a Rust function decorated with \#\[tauri::command\].34  
* **Events:** Used for asynchronous, "push-style" notifications from the backend to the frontend (e.g., streaming an AI response). The backend emits an event that the frontend listens for.35

**Code Example: AI Suggestion Streaming**

The following illustrates how a command and events work together to stream an AI response.

**Rust Backend (src-tauri/src/main.rs):**

Rust

\#\[tauri::command\]  
async fn generate\_ai\_suggestion(  
    app: tauri::AppHandle,  
    prompt: String  
) \-\> Result\<(), String\> {  
    // Spawns a non-blocking async task to handle the long-running API call  
    tokio::spawn(async move {  
        // Assume 'ai\_service' is a state-managed service that returns a stream  
        // let mut stream \= ai\_service.stream\_response(prompt).await;  
        // while let Some(chunk) \= stream.next().await {  
        //     app.emit("ai\_suggestion\_chunk", chunk).unwrap();  
        // }  
        // For demonstration, we simulate a stream  
        for i in 0..5 {  
            tokio::time::sleep(tokio::time::Duration::from\_millis(100)).await;  
            let chunk \= format\!(" part {}", i);  
            app.emit("ai\_suggestion\_chunk", \&chunk).unwrap();  
        }  
        app.emit("ai\_generation\_complete", ()).unwrap();  
    });  
    Ok(())  
}

**TypeScript Frontend (src/MyComponent.tsx):**

TypeScript

import { invoke } from '@tauri-apps/api/core';  
import { listen } from '@tauri-apps/api/event';  
import { useEffect, useState } from 'react';

function AiChat() {  
    const \= useState('');

    useEffect(() \=\> {  
        const unlistenChunk \= listen\<string\>('ai\_suggestion\_chunk', (event) \=\> {  
            setResponse(prev \=\> prev \+ event.payload);  
        });  
        const unlistenComplete \= listen('ai\_generation\_complete', () \=\> {  
            console.log('Stream finished.');  
        });  
        return () \=\> {  
            unlistenChunk.then(f \=\> f());  
            unlistenComplete.then(f \=\> f());  
        };  
    },);

    const handleGenerate \= () \=\> {  
        setResponse('');  
        invoke('generate\_ai\_suggestion', { prompt: 'Tell me a story.' });  
    };

    return (  
        \<div\>  
            \<button onClick\={handleGenerate}\>Generate\</button\>  
            \<p\>{response}\</p\>  
        \</div\>  
    );  
}

***Note for AI Agent:*** *Agent, all communication between the frontend (React) and backend (Rust) MUST use the invoke function for commands or listen for events from the @tauri-apps/api package. Direct access to native APIs from the frontend is forbidden by the architecture. When creating a new backend function to be called from the frontend, it must be decorated with \#\[tauri::command\] and registered in the tauri::generate\_handler\! macro in main.rs*.1

## **4\. Data & Persistence Layer**

### **4.1. Local Database: SQLite**

The definitive choice for the local database is **SQLite**, implemented via the rusqlite crate in the Rust backend.1 Yarn's primary database workload is transactional (OLTP)—frequent, small reads and writes for project meta-files, document states, and settings. SQLite's row-based architecture is highly optimized for this workload, offering superior performance compared to analytical (OLAP) databases like DuckDB.37

| Feature | SQLite | DuckDB | Recommendation for Yarn |
| :---- | :---- | :---- | :---- |
| **Primary Workload** | OLTP (Transactional) 37 | OLAP (Analytical) 38 | Yarn's core operations are transactional, making **SQLite** the optimal choice. |
| **Architecture** | Row-oriented storage 39 | Column-oriented storage 39 | Row-oriented is more efficient for frequent updates to individual records. |
| **Transactional Writes** | Highly optimized; faster for small writes 40 | Slower for transactional writes 41 | SQLite's write performance is critical for a responsive application. |

### **4.2. Full-Text Search & RAG: SQLite FTS5**

To power both the general document search and the Retrieval-Augmented Generation (RAG) system for the @ context command, Yarn will leverage **SQLite's built-in FTS5 extension**.24 This provides a powerful, efficient, and integrated full-text search capability. The implementation will use an "external content" table to avoid duplicating document content in the database, with database triggers (

AFTER INSERT, AFTER UPDATE, AFTER DELETE) ensuring the search index is automatically and seamlessly synchronized with any changes to the documents.42

### **4.3. Secure Credential Storage: OS-Native Keychains**

It is imperative that sensitive user credentials (for AWS Bedrock, Google Gemini) are never stored in plaintext, configuration files, or the application's database. The only secure and acceptable method is to leverage the operating system's native, protected credential management services. The implementation will use the **keyring-rs** crate in the Rust backend.43 This library provides a cross-platform abstraction over:

* **macOS:** The user's **Keychain**.44  
* **Windows:** The **Windows Credential Manager**.45

When a user provides an API key, it will be sent via a secure command to the backend and stored immediately in the OS vault. It will only be retrieved on-demand when an authenticated API call is required.46

## **5\. AI & Workflow Implementation**

### **5.1. AI Service Abstraction**

To support multiple AI providers (local and cloud) and ensure modularity, a unified abstraction layer will be created in the Rust backend using the **Adapter/Strategy** design pattern.47 An

AiProvider trait will define a common interface (e.g., invoke\_model, invoke\_model\_stream). Concrete implementations (LocalProvider, BedrockProvider, GeminiProvider) will handle the specifics of each service.48 This design makes the system agnostic to the underlying AI service and simplifies adding new providers in the future.

### **5.2. Document Lifecycle Management: Finite State Machine (FSM)**

The structured document workflow (e.g., Memo \-\> PRD \-\> Epic Breakdown) is a core feature and will be implemented using a **Finite State Machine (FSM)** in the Rust backend.1 This provides a robust and predictable way to manage a document's lifecycle.22 A Rust

enum will define the possible states, and transition logic will enforce valid progressions (e.g., a Memo can become a PR FAQ, but not an Epic Breakdown directly). The FSM will be the ultimate authority on state transitions, and the current state of each document will be persisted in the SQLite database.50

### **5.3. Diagramming Integration: Mermaid.js**

To serve technical users, Yarn will support integrated diagramming via Mermaid.js. The editor will detect fenced code blocks with the mermaid language identifier and render the contained syntax into an SVG diagram.1 A critical security constraint for this feature is the sandboxing of the rendered output. To mitigate the risk of arbitrary script execution within a diagram, the rendered SVG

**must** be placed within a **sandboxed \<iframe\>** in the document's preview panel. This isolates the diagram's execution context from the main application, a security best practice.1

## **6\. Local AI Agent & Processing Engine**

To deliver a truly local-first and agentic experience, Yarn will integrate a sophisticated local AI subsystem responsible for real-time user assistance and background project analysis, running entirely on the user's machine.1

### **6.1. Hybrid Local Model Strategy**

A single local model is inefficient for handling both semantic analysis and text generation. Therefore, a hybrid strategy employing two specialized, lightweight models is mandated 1:

* **Analysis Model (Embeddings):** For background processing and building the project knowledge base, the application will use a sentence-transformer model. The recommended model is **sentence-transformers/all-MiniLM-L6-v2**. This model is highly efficient, mapping text to a 384-dimensional vector space while being only \~80MB in size, making it ideal for continuous background analysis without high resource consumption.1  
* **Generative Model (Autocomplete):** For real-time autocomplete, the recommended model is **Microsoft's Phi-3-mini (3.8B parameters)**. It offers an exceptional balance of reasoning capability and performance, making it suitable for on-device execution. An alternative is a 2B parameter model from the **CodeGemma** family.1

### **6.2. Local Model Integration and Execution**

* **Bundled Installation:** Both local AI models will be bundled directly with the Yarn application installer to fulfill the requirement for an out-of-the-box local AI experience.1  
* **Sidecar Pattern:** To ensure stability and isolate resource-intensive tasks, the local models will be executed in a separate process managed by the main Tauri application, using the **sidecar pattern**.52 The main Rust backend will communicate with this sidecar to request embeddings or text generations. This prevents the UI from freezing during inference and allows the main application to recover if the model process crashes.  
* **Inference Engine:** The sidecar will be powered by a Rust-based ML framework like **Candle**, which is developed by Hugging Face and integrates seamlessly into the Rust ecosystem.1 This allows for efficient, cross-platform execution of the bundled models.

### **6.3. Agentic Interaction Model**

Yarn will move beyond a simple "copilot" to a more powerful "agent" paradigm 54:

* **Local Autocomplete:** As the user types, the editor sends the current context to the local generative model (Phi-3), which provides real-time, multi-token completion suggestions.1  
* **Background Knowledge Curation:** The local analysis model (all-MiniLM-L6-v2) runs continuously in the background, processing document changes to update the project's vector knowledge base in SQLite.1  
* **Context-Aware Generation:** When the user interacts with the main AI agent, the RAG system queries both the full-text search index (FTS5) and the local vector database. This provides the agent (whether local or cloud-based) with deep, structured context, ensuring all generated content is coherent with the project's established knowledge.54

## **7\. Comprehensive Testing Strategy**

A multi-layered testing strategy is required to ensure the quality, stability, and correctness of the application across all its components and target platforms.1

### **7.1. Unit Testing**

* **Rust Backend:** Individual functions and services in the Rust core will be tested using Cargo's built-in test runner (cargo test). For testing Tauri command handlers that depend on application state, the tauri::test feature must be enabled in Cargo.toml. This allows for the creation of a mock App instance using tauri::test::mock\_builder(), enabling commands to be invoked programmatically and their results asserted.1  
* **React Frontend:** Individual React components will be tested in isolation using **Vitest** and **React Testing Library**.1

### **7.2. Integration Testing (Frontend \<\> Backend Bridge)**

The most critical integration point is the IPC bridge between the React frontend and the Rust backend.

* **Strategy:** The Rust backend will be mocked at the IPC boundary using the **@tauri-apps/api/mocks** module. This allows tests to run entirely in the frontend test environment (Vitest) without needing a live Rust process.1  
* **Implementation:** Before each test, mockIPC will be used to intercept invoke calls. The mock can be configured to simulate various backend responses, including success cases, error conditions, and different data payloads, enabling comprehensive testing of the frontend's interaction logic.1

### **7.3. End-to-End (E2E) Testing**

E2E tests will simulate full user workflows in a compiled, running application to validate the integration of all components.

* **Strategy:** The official and recommended toolchain is **WebdriverIO** combined with tauri-driver. tauri-driver provides a cross-platform wrapper around the native WebDriver server for the OS, exposing a standardized interface for automation.1

### **7.4. Visual Regression Testing**

As a mandatory mitigation for the potential UI inconsistencies introduced by using native WebViews, a visual regression testing strategy will be implemented.

* **Strategy:** This involves capturing screenshots of the application's UI and comparing them against a set of approved baseline images to automatically detect unintended visual changes.  
* **Implementation:** The E2E testing framework, **Playwright**, provides excellent built-in support for this with the await expect(page).toHaveScreenshot() assertion.1 The CI/CD pipeline will be configured to run these tests on all target platforms and architectures.

## **8\. Implementation & Delivery Plan**

### **8.1. Phased Implementation Roadmap**

Development will proceed in distinct phases to manage complexity and deliver value incrementally.1

* **Phase 1: Minimum Viable Product (MVP)**  
  * **Objective:** Establish the core editor experience and validate the foundational technology stack with local-first AI.  
  * **Key Features:** Core Tauri application (macOS/Windows x64), basic three-panel UI, project creation, **Local AI Agent** with a bundled generative model (Phi-3-mini) for autocomplete, secure credential storage, and the automated build pipeline.  
* **Phase 2: AI-Forward Enhancements**  
  * **Objective:** Implement the advanced AI and workflow features that differentiate Yarn.  
  * **Key Features:** Full document workflow FSM, integration of the local analysis model for background project analysis, advanced RAG system, integration with cloud AI providers (Bedrock, Gemini), and implementation of the auto-updater mechanism.  
* **Phase 3: Polish and Expansion**  
  * **Objective:** Refine the user experience and expand platform support.  
  * **Key Features:** Performance optimization for very large documents, full code signing and notarization, addition of native ARM64 support for Windows, and UI/UX polish.

### **8.2. Key Component Breakdown**

To facilitate parallel workstreams and agentic development, the application will be broken down into the following primary modules with clear boundaries and responsibilities.1

| Module Name | Primary Language | Key Responsibilities | Dependencies |
| :---- | :---- | :---- | :---- |
| ui-react | TypeScript/React | All UI components, frontend state management, invoking backend commands. | core-rust (via IPC) |
| core-rust | Rust | Application entry point, window management, IPC command handlers, FSM logic. | local-ai-engine, db-layer |
| local-ai-engine | Rust | Manages local model sidecars, provides services for autocomplete and background analysis. | local-model-sidecar, db-layer |
| local-model-sidecar | Rust | Isolated process running the Candle inference engine for bundled AI models. | candle |
| db-layer | Rust | SQLite connection management, schema definition, query execution (CRUD, FTS5, vector index). | rusqlite |
| build-pipeline | YAML | GitHub Actions workflows for testing, building, signing, and releasing. | tauri-action |

### **8.3. Build, Distribution, and Maintenance**

* **CI/CD Pipeline:** The entire build, test, and release process will be fully automated using **GitHub Actions** and the official tauri-action.27 The pipeline will execute all tests and then build, sign, and package native binaries for all target platforms and architectures.  
* **Trusted Distribution: Code Signing & Notarization:** Code signing is a non-negotiable requirement to ensure user trust and bypass OS security warnings.1  
  * **Windows:** An Organization Validation (OV) or Extended Validation (EV) Code Signing Certificate will be acquired. The certificate and its password will be stored as GitHub secrets and used in the CI pipeline to automatically sign all .exe and .msi files.56  
  * **macOS:** An Apple Developer ID certificate will be used. The tauri-action will leverage secrets stored in GitHub to automatically code-sign the .app bundle, submit it to Apple's notary service for verification, and "staple" the notarization ticket to the final .dmg installer.58  
* **Application Updates: Tauri Updater:** An automatic update mechanism will be implemented using **Tauri's built-in updater plugin** to provide a seamless user experience.59 Updates will be cryptographically signed, and  
  **GitHub Releases** will serve as the update server.60

#### **Works cited**

1. Project Yarn PRD: Final  
2. Tauri vs Electron: A 2025 Comparison for Desktop Development ..., accessed July 7, 2025, [https://codeology.co.nz/articles/tauri-vs-electron-2025-desktop-development.html](https://codeology.co.nz/articles/tauri-vs-electron-2025-desktop-development.html)  
3. Tauri vs. Electron: performance, bundle size, and the real trade-offs, accessed July 7, 2025, [https://www.gethopp.app/blog/tauri-vs-electron](https://www.gethopp.app/blog/tauri-vs-electron)  
4. Tauri Architecture, accessed July 7, 2025, [https://v2.tauri.app/concept/architecture/](https://v2.tauri.app/concept/architecture/)  
5. Tauri vs. Electron Benchmark: \~58% Less Memory, \~96% Smaller Bundle – Our Findings and Why We Chose Tauri : r/programming \- Reddit, accessed July 7, 2025, [https://www.reddit.com/r/programming/comments/1jwjw7b/tauri\_vs\_electron\_benchmark\_58\_less\_memory\_96/](https://www.reddit.com/r/programming/comments/1jwjw7b/tauri_vs_electron_benchmark_58_less_memory_96/)  
6. Process Model \- Tauri, accessed July 7, 2025, [https://v2.tauri.app/concept/process-model/](https://v2.tauri.app/concept/process-model/)  
7. Isolation Pattern | Tauri v1, accessed July 7, 2025, [https://tauri.app/v1/references/architecture/inter-process-communication/isolation/](https://tauri.app/v1/references/architecture/inter-process-communication/isolation/)  
8. Building a desktop application with Electron | by Kristian Poslek | Developers Writing, accessed July 7, 2025, [https://medium.com/developers-writing/building-a-desktop-application-with-electron-204203eeb658](https://medium.com/developers-writing/building-a-desktop-application-with-electron-204203eeb658)  
9. Framework Wars: Tauri vs Electron vs Flutter vs React Native, accessed July 7, 2025, [https://www.moontechnolabs.com/blog/tauri-vs-electron-vs-flutter-vs-react-native/](https://www.moontechnolabs.com/blog/tauri-vs-electron-vs-flutter-vs-react-native/)  
10. How to Build Desktop Applications using Electron the Right Way : r/programming \- Reddit, accessed July 7, 2025, [https://www.reddit.com/r/programming/comments/juw2w5/how\_to\_build\_desktop\_applications\_using\_electron/](https://www.reddit.com/r/programming/comments/juw2w5/how_to_build_desktop_applications_using_electron/)  
11. Developing a Desktop Application via Rust and NextJS. The Tauri Way. \- DEV Community, accessed July 7, 2025, [https://dev.to/valorsoftware/developing-a-desktop-application-via-rust-and-nextjs-the-tauri-way-2iin](https://dev.to/valorsoftware/developing-a-desktop-application-via-rust-and-nextjs-the-tauri-way-2iin)  
12. What is the best framework to create desktop apps in rust \- Reddit, accessed July 7, 2025, [https://www.reddit.com/r/rust/comments/1jy1oyj/what\_is\_the\_best\_framework\_to\_create\_desktop\_apps/](https://www.reddit.com/r/rust/comments/1jy1oyj/what_is_the_best_framework_to_create_desktop_apps/)  
13. How is the app support for Windows ARM compared to MacOS? : r/Windows11 \- Reddit, accessed July 7, 2025, [https://www.reddit.com/r/Windows11/comments/1bri0tx/how\_is\_the\_app\_support\_for\_windows\_arm\_compared/](https://www.reddit.com/r/Windows11/comments/1bri0tx/how_is_the_app_support_for_windows_arm_compared/)  
14. Apple Silicon Support | Electron, accessed July 7, 2025, [https://electronjs.org/blog/apple-silicon](https://electronjs.org/blog/apple-silicon)  
15. Windows Installer | Tauri, accessed July 7, 2025, [https://v2.tauri.app/distribute/windows-installer/](https://v2.tauri.app/distribute/windows-installer/)  
16. macOS Bundle | Tauri v1, accessed July 7, 2025, [https://tauri.app/v1/guides/building/macos/](https://tauri.app/v1/guides/building/macos/)  
17. tauri-apps/tauri: Build smaller, faster, and more secure desktop and mobile applications with a web frontend. \- GitHub, accessed July 7, 2025, [https://github.com/tauri-apps/tauri](https://github.com/tauri-apps/tauri)  
18. Easily Build a 3D Rust Desktop App using Tauri, TheatreJS and React Three Fiber, accessed July 7, 2025, [https://www.youtube.com/watch?v=rJ2vN6iFF7w](https://www.youtube.com/watch?v=rJ2vN6iFF7w)  
19. agmmnn/tauri-ui: Create modern Tauri desktop apps in just a few simple steps with shadcn/ui. React, Next.js, Sveltekit. \- GitHub, accessed July 7, 2025, [https://github.com/agmmnn/tauri-ui](https://github.com/agmmnn/tauri-ui)  
20. 7 Top React State Management Libraries \- Trio Dev, accessed July 7, 2025, [https://trio.dev/7-top-react-state-management-libraries/](https://trio.dev/7-top-react-state-management-libraries/)  
21. Using a State Management Library \- React Flow, accessed July 7, 2025, [https://reactflow.dev/learn/advanced-use/state-management](https://reactflow.dev/learn/advanced-use/state-management)  
22. You don't need a library for state machines \- DEV Community, accessed July 7, 2025, [https://dev.to/davidkpiano/you-don-t-need-a-library-for-state-machines-k7h](https://dev.to/davidkpiano/you-don-t-need-a-library-for-state-machines-k7h)  
23. So, hype aside, what's the over/under on DuckDB vs Sqlite these days? I'm workin... | Hacker News, accessed July 7, 2025, [https://news.ycombinator.com/item?id=40891880](https://news.ycombinator.com/item?id=40891880)  
24. SQLite FTS5 Extension, accessed July 7, 2025, [https://www.sqlite.org/fts5.html](https://www.sqlite.org/fts5.html)  
25. aws-sdk-bedrockruntime \- crates.io: Rust Package Registry, accessed July 7, 2025, [https://crates.io/crates/aws-sdk-bedrockruntime](https://crates.io/crates/aws-sdk-bedrockruntime)  
26. gemini-rs \- crates.io: Rust Package Registry, accessed July 7, 2025, [https://crates.io/crates/gemini-rs](https://crates.io/crates/gemini-rs)  
27. Cross-Platform Compilation | Tauri v1, accessed July 7, 2025, [https://tauri.app/v1/guides/building/cross-platform/](https://tauri.app/v1/guides/building/cross-platform/)  
28. Releases · tauri-apps/tauri-action \- GitHub, accessed July 7, 2025, [https://github.com/tauri-apps/tauri-action/releases](https://github.com/tauri-apps/tauri-action/releases)  
29. tauri/ARCHITECTURE.md at dev · tauri-apps/tauri \- GitHub, accessed July 7, 2025, [https://github.com/tauri-apps/tauri/blob/dev/ARCHITECTURE.md](https://github.com/tauri-apps/tauri/blob/dev/ARCHITECTURE.md)  
30. Tauri Architecture | Tauri v1, accessed July 7, 2025, [https://tauri.app/v1/references/architecture/](https://tauri.app/v1/references/architecture/)  
31. How I build a Rust backend service \- World Without Eng, accessed July 7, 2025, [https://worldwithouteng.com/articles/how-i-build-a-rust-backend-service](https://worldwithouteng.com/articles/how-i-build-a-rust-backend-service)  
32. Rust Web Application Code Template \- Rust10x, accessed July 7, 2025, [https://rust10x.com/web-app](https://rust10x.com/web-app)  
33. Inter-Process Communication \- Tauri, accessed July 7, 2025, [https://v2.tauri.app/concept/inter-process-communication/](https://v2.tauri.app/concept/inter-process-communication/)  
34. Tauri Framework: Code-First Deep Dive : E1 \- DEV Community, accessed July 7, 2025, [https://dev.to/mdabir1203/tauri-framework-code-first-deep-dive-e1-411d](https://dev.to/mdabir1203/tauri-framework-code-first-deep-dive-e1-411d)  
35. Calling the Frontend from Rust | Tauri, accessed July 7, 2025, [https://v2.tauri.app/develop/calling-frontend/](https://v2.tauri.app/develop/calling-frontend/)  
36. Sending data from backend to frontend : r/tauri \- Reddit, accessed July 7, 2025, [https://www.reddit.com/r/tauri/comments/1ir4wgc/sending\_data\_from\_backend\_to\_frontend/](https://www.reddit.com/r/tauri/comments/1ir4wgc/sending_data_from_backend_to_frontend/)  
37. DuckDB vs SQLite: Performance, Scalability and Features \- MotherDuck, accessed July 7, 2025, [https://motherduck.com/learn-more/duckdb-vs-sqlite-databases/](https://motherduck.com/learn-more/duckdb-vs-sqlite-databases/)  
38. Why DuckDB, accessed July 7, 2025, [https://duckdb.org/why\_duckdb.html](https://duckdb.org/why_duckdb.html)  
39. DuckDB vs SQLite Benchmarks: Performance Showdown \- Galaxy, accessed July 7, 2025, [https://www.getgalaxy.io/learn/glossary/duckdb-vs-sqlite-benchmarks](https://www.getgalaxy.io/learn/glossary/duckdb-vs-sqlite-benchmarks)  
40. DuckDB vs SQLite: What is the Best Database for Analytics? \- Kanaries Docs, accessed July 7, 2025, [https://docs.kanaries.net/topics/DuckDB/duckdb-vs-sqlite](https://docs.kanaries.net/topics/DuckDB/duckdb-vs-sqlite)  
41. Why We Moved from SQLite to DuckDB: 5x Faster Queries, \~80% Less Storage \- Reddit, accessed July 7, 2025, [https://www.reddit.com/r/dataengineering/comments/1ixbrkc/why\_we\_moved\_from\_sqlite\_to\_duckdb\_5x\_faster/](https://www.reddit.com/r/dataengineering/comments/1ixbrkc/why_we_moved_from_sqlite_to_duckdb_5x_faster/)  
42. Populate virtual SQLite FTS5 (full text search) table from content table \- Stack Overflow, accessed July 7, 2025, [https://stackoverflow.com/questions/70847617/populate-virtual-sqlite-fts5-full-text-search-table-from-content-table](https://stackoverflow.com/questions/70847617/populate-virtual-sqlite-fts5-full-text-search-table-from-content-table)  
43. open-source-cooperative/keyring-rs: Cross-platform library and utility to manage passwords, accessed July 7, 2025, [https://github.com/hwchen/keyring-rs](https://github.com/hwchen/keyring-rs)  
44. Getting access to Secure Enclave : r/rust \- Reddit, accessed July 7, 2025, [https://www.reddit.com/r/rust/comments/1ksf6dl/getting\_access\_to\_secure\_enclave/](https://www.reddit.com/r/rust/comments/1ksf6dl/getting_access_to_secure_enclave/)  
45. Credential Manager in Windows \- Microsoft Support, accessed July 7, 2025, [https://support.microsoft.com/en-us/windows/credential-manager-in-windows-1b5c916a-6a16-889f-8581-fc16e8165ac0](https://support.microsoft.com/en-us/windows/credential-manager-in-windows-1b5c916a-6a16-889f-8581-fc16e8165ac0)  
46. Building a Local-First Password Manager: Tauri, Rust, Sqlx and SQLCipher | by Mahmut, accessed July 7, 2025, [https://mhmtsr.medium.com/building-a-local-first-password-manager-tauri-rust-sqlx-and-sqlcipher-09d0134db5bc](https://mhmtsr.medium.com/building-a-local-first-password-manager-tauri-rust-sqlx-and-sqlcipher-09d0134db5bc)  
47. Design Patterns in Rust \- Refactoring.Guru, accessed July 7, 2025, [https://refactoring.guru/design-patterns/rust](https://refactoring.guru/design-patterns/rust)  
48. Design Patterns in Rust \- Reddit, accessed July 7, 2025, [https://www.reddit.com/r/rust/comments/1aol909/design\_patterns\_in\_rust/](https://www.reddit.com/r/rust/comments/1aol909/design_patterns_in_rust/)  
49. Designing an API Client in Rust: New RSpotify Version a Year Later | NullDeref, accessed July 7, 2025, [https://nullderef.com/blog/web-api-client/](https://nullderef.com/blog/web-api-client/)  
50. Robot \- a fast functional library for creating Finite State Machines and Statecharts, accessed July 7, 2025, [https://thisrobot.life/](https://thisrobot.life/)  
51. Choosing the Best Multi-Model LLM Strategy \- Gupshup, accessed July 7, 2025, [https://www.gupshup.io/resources/blog/multi-model-llm-strategy](https://www.gupshup.io/resources/blog/multi-model-llm-strategy)  
52. Making desktop apps with revved-up potential: Rust \+ Tauri \+ sidecar \- Evil Martians, accessed July 7, 2025, [https://evilmartians.com/chronicles/making-desktop-apps-with-revved-up-potential-rust-tauri-sidecar](https://evilmartians.com/chronicles/making-desktop-apps-with-revved-up-potential-rust-tauri-sidecar)  
53. Building Local LM Desktop Applications with Tauri | by Dillon de Silva | Jun, 2025 \- Medium, accessed July 7, 2025, [https://medium.com/@dillon.desilva/building-local-lm-desktop-applications-with-tauri-f54c628b13d9](https://medium.com/@dillon.desilva/building-local-lm-desktop-applications-with-tauri-f54c628b13d9)  
54. Mastering Context Management in Ai Development: Complete Guide (In Plain English) | by Madhura Jayashanka \- Medium, accessed July 7, 2025, [https://medium.com/@madhurajayashanka/mastering-context-management-in-ai-development-complete-guide-in-plain-english-5b5cadc2adb4](https://medium.com/@madhurajayashanka/mastering-context-management-in-ai-development-complete-guide-in-plain-english-5b5cadc2adb4)  
55. How Multi-Context Processing Could Make or Break An LLM Project \- Galileo AI, accessed July 7, 2025, [https://galileo.ai/blog/multi-context-processing-llms](https://galileo.ai/blog/multi-context-processing-llms)  
56. Windows \- Code signing guide locally & with GitHub Actions | Tauri v1, accessed July 7, 2025, [https://tauri.app/v1/guides/distribution/sign-windows/](https://tauri.app/v1/guides/distribution/sign-windows/)  
57. Windows Code Signing | Tauri, accessed July 7, 2025, [https://v2.tauri.app/distribute/sign/windows/](https://v2.tauri.app/distribute/sign/windows/)  
58. macOS Code Signing | Tauri, accessed July 7, 2025, [https://v2.tauri.app/distribute/sign/macos/](https://v2.tauri.app/distribute/sign/macos/)  
59. Updater \- Tauri, accessed July 7, 2025, [https://v2.tauri.app/plugin/updater/](https://v2.tauri.app/plugin/updater/)  
60. Updater | Tauri v1, accessed July 7, 2025, [https://v1.tauri.app/v1/guides/distribution/updater/](https://v1.tauri.app/v1/guides/distribution/updater/)  
61. How to make automatic updates work with Tauri v2 and GitHub \- That Gurjot, accessed July 7, 2025, [https://thatgurjot.com/til/tauri-auto-updater/](https://thatgurjot.com/til/tauri-auto-updater/)