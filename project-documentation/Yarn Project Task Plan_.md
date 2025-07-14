

# **Project Yarn: Definitive Technical Task Plan**

This document constitutes the canonical and definitive technical task plan for the development of Project Yarn. It is derived exclusively from the "Project Yarn PRD: Final" (v3.0) and the "Project Yarn: Agent-Ready Technical Strategy" (v3.0).1 Every task herein is designed to be an atomic, independently verifiable unit of work, optimized for an iterative development lifecycle executed by an AI-powered coding agent. Adherence to this plan is mandatory to ensure architectural integrity, security, and quality across all phases of development.

## **Section 1: Phase 1 Task Plan — Minimum Viable Product (MVP)**

The primary objective of Phase 1 is to establish the foundational, stable core of the application. This phase is strategically designed as a comprehensive risk mitigation vehicle. The technical strategy makes several high-stakes technology choices, including Tauri for the desktop framework, Rust for the backend, and a local AI model operating in a sidecar process.1 These components are deeply interconnected, and their integration presents the highest technical risk to the project.

Consequently, this phase is not focused on delivering a broad set of features. Instead, its strategic purpose is to de-risk the project by constructing the thinnest possible "vertical slice" of functionality that touches every single one of these core technologies. This slice will encompass the "Create Project" and "Local AI Autocomplete" features. Successful implementation of this slice will validate that:

1. The Tauri application can be successfully built and run on the initial target platforms (macOS x86\_64, Windows x86\_64).  
2. The React frontend can reliably communicate with the Rust backend via the secure Tauri Inter-Process Communication (IPC) bridge.  
3. The Rust backend can correctly interact with the SQLite database for persistence.  
4. The main Rust process can manage the lifecycle of and communicate with the Candle-based AI sidecar process.

By proving the viability of this end-to-end data flow, the project establishes a stable architectural foundation. The tasks in this phase are therefore sequenced to build this vertical slice first, deliberately postponing more complex business logic, such as the document lifecycle FSM, and non-essential features until the core architecture is proven to be stable, performant, and secure.

### **1.1 Workstream: Foundational Infrastructure & CI/CD**

This workstream establishes the essential groundwork for all subsequent development. Its purpose is to ensure consistency, automation, and quality from the very first commit. By automating the build and test processes, it provides a rapid feedback loop for all development activities.

* **Task 1.1.1: Project Scaffolding.** Initialize the project monorepo. This includes creating the root directory and the two primary modules as specified in the architecture: src-tauri/ for the Rust backend and src/ for the React frontend.1  
* **Task 1.1.2: Build System Configuration.** Configure the root-level build system files. This involves creating and populating the main package.json with dependencies like react, react-dom, vite, zustand, and @tauri-apps/api. Simultaneously, create the root Cargo.toml within src-tauri/ and declare the Rust workspace, specifying dependencies such as tauri, rusqlite, tokio, and keyring-rs.1  
* **Task 1.1.3: Initial CI/CD Pipeline.** Establish the initial GitHub Actions workflow within .github/workflows/. This build-pipeline will use the official tauri-action.1 The initial build matrix will target  
  macos-latest (x86\_64) and windows-latest (x86\_64) only, aligning with the MVP scope.1 This workflow will be configured to trigger on every push to the main branch and will execute two primary jobs:  
  cargo test \--workspace to run all backend tests, and npm run test to run all frontend tests. This task lays the foundation for automated quality gates.  
* **Task 1.1.4: Frontend Test Framework Setup.** Configure the frontend testing environment. This involves installing and configuring Vitest as the test runner and React Testing Library for rendering components in a test environment.1 A sample test for the main  
  App component will be created to validate the setup.  
* **Task 1.1.5: Backend Test Framework Setup.** Configure the backend testing environment. This requires enabling the tauri::test feature in src-tauri/Cargo.toml. This feature is critical as it provides the tauri::test::mock\_builder() function, which is the mandated method for unit testing Tauri command handlers that require access to application state or the event emitter.1 A placeholder test file will be created to confirm the feature is correctly enabled.

### **1.2 Workstream: Core Backend Services (core-rust, db-layer)**

This workstream focuses on building the skeleton of the Rust backend. It mandates strict adherence to the layered "Clean Architecture" specified in the technical strategy.1 This separation of concerns is not merely good practice; it is a prerequisite for the "Agent-Ready Development" principle, as it creates clear, isolated modules that can be worked on independently.1

* **Task 1.2.1: Clean Architecture Scaffolding.** Within src-tauri/src/, create the directory structure that represents the three layers of the Clean Architecture: core/, application/, and infrastructure/.1 Each directory will be configured as a Rust module.  
* **Task 1.2.2: Domain Model Definition.** In the core module, define the initial, pure Rust data structures. These represent the fundamental business entities and must have zero external dependencies. The initial structs will be Project (containing fields like id, name, path) and Document (with fields id, project\_id, path, state), directly derived from the project concept in the PRD.1  
* **Task 1.2.3: Database Module Creation.** Create a new db-layer module within the Rust workspace. This module will encapsulate all direct database interactions.  
* **Task 1.2.4: Database Connection Management.** Within the db-layer module, integrate the rusqlite crate.1 Implement a  
  ConnectionManager struct responsible for initializing the application's data directory and opening a connection to the yarn\_metadata.sqlite database file. This manager will handle the connection lifecycle and will be managed as Tauri state.  
* **Task 1.2.5: Initial Schema Migration.** Implement the initial database schema migration logic. This will be a function that is run on application startup. The first migration will execute the CREATE TABLE SQL statements for the projects and documents tables, based on the structs defined in Task 1.2.2. This directly supports the requirement for a local metadata database.1  
* **Task 1.2.6: Secure Credential Storage Module.** In the infrastructure layer, create a credential\_manager module. This module will integrate the keyring-rs crate.1 It will implement two functions:  
  store\_credential(service\_name: \&str, username: \&str, secret: \&str) and retrieve\_credential(service\_name: \&str, username: \&str). These functions will provide a secure abstraction over the OS-native keychains (macOS Keychain, Windows Credential Manager).1 This task prepares the backend for secure handling of API keys, a non-negotiable security requirement.1

### **1.3 Workstream: Core Frontend Shell (ui-react)**

This workstream constructs the main application window and the static structure of the user interface. The focus is on establishing the layout and state management foundation upon which all subsequent features will be built.

* **Task 1.3.1: React Application Scaffolding.** Scaffold the React application in the src/ directory using the Vite toolchain. This provides a fast development server and optimized build process.  
* **Task 1.3.2: UI Component Library Integration.** Integrate the Shadcn/ui component library.1 This involves running its initialization script, which will set up  
  tailwind.css and create the necessary configuration files. This choice provides unstyled, accessible primitives that can be customized to create Yarn's unique visual identity.  
* **Task 1.3.3: Three-Panel Layout Implementation.** Implement the main App.tsx component. This component will render the static three-panel layout as described in the PRD.1 The layout will consist of a resizable left panel (for the future file tree), a central panel (for the editor), and a right panel (for the future AI chat). Initially, the left and right panels will be static placeholders. This directly addresses User Story 2.1.  
* **Task 1.3.4: Global State Management Setup.** Set up global UI state management using Zustand.1 Create an initial global store (  
  useAppStore) to manage application-level state that is shared across many components, such as the currentProjectId or application-wide settings.  
* **Task 1.3.5: Basic Markdown Editor Component.** Create a basic, uncontrolled Markdown editor component to be placed in the central panel. For the MVP, this can be a simple \<textarea\> element. This serves as the initial target for implementing the autocomplete functionality.

#### **1.3.X: Critical Fix Required - TailwindCSS PostCSS Configuration**

**Issue Identified:** During development server startup, the following PostCSS plugin error occurs:
```
[postcss] It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin. 
The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS 
with PostCSS you'll need to install `@tailwindcss/postcss` and update your PostCSS configuration.
```

**Root Cause:** The current `postcss.config.js` configuration uses `tailwindcss` directly as a PostCSS plugin, but newer versions of TailwindCSS require the separate `@tailwindcss/postcss` package.

**Required Fix:**
* **Task 1.3.X.1:** Install the correct PostCSS plugin: `npm install @tailwindcss/postcss`
* **Task 1.3.X.2:** Update `postcss.config.js` to use `@tailwindcss/postcss` instead of `tailwindcss`
* **Task 1.3.X.3:** Verify development server starts without PostCSS errors
* **Task 1.3.X.4:** Test that Tailwind CSS classes render correctly in the application

**Impact:** This fix is required for the development server to start properly and for the UI component library integration (Task 1.3.2) to function correctly.

### **1.4 Workstream: Local Generative AI Engine (local-ai-engine, local-model-sidecar)**

This workstream addresses one of the highest-risk and most critical features of the MVP: the integration of the local AI model. It follows the sidecar pattern mandated by the technical strategy to ensure UI responsiveness and application stability.1

* **Task 1.4.1: Sidecar Crate Creation.** Create a new, separate Rust crate within the workspace named local-model-sidecar. This binary crate will be the isolated process responsible for all ML inference.1  
* **Task 1.4.2: Inference Engine Integration.** Integrate the Candle ML framework into the local-model-sidecar crate.1 This includes adding it as a dependency and setting up the basic boilerplate for model loading.  
* **Task 1.4.3: Generative Model Loading and Serving.** Implement the logic within the sidecar to load the bundled Microsoft/Phi-3-mini generative model.1 The sidecar will then listen on its standard input (  
  stdin) for prompts (as JSON-formatted strings) and write completions to its standard output (stdout). This simple IPC mechanism is robust and cross-platform.  
* **Task 1.4.4: Sidecar Bundling Configuration.** Configure the main application's tauri.conf.json file. The tauri.bundle.externalBin property will be set to include the compiled local-model-sidecar binary. This ensures the sidecar is packaged with the final application installer, fulfilling the "out-of-the-box" local AI requirement.1  
* **Task 1.4.5: Sidecar Management Service.** Create a new local-ai-engine module within the core-rust crate. This module will contain a service responsible for spawning the sidecar process using Tauri's Command::new\_sidecar() API. It will also manage communication, sending prompts to the sidecar's stdin and reading responses from its stdout.  
* **Task 1.4.6: Autocomplete Backend Command.** Expose a single, simple Tauri command in the application layer: async fn get\_autocomplete(context: String) \-\> Result\<String, String\>. This command will take the current text context from the editor, forward it to the local-ai-engine service, and return the generated completion. This command is the direct backend implementation for User Story 5.2.1

### **1.5 Workstream: MVP Feature Integration & Testing**

This final workstream for Phase 1 connects all the previously built components into a single, functional, and testable vertical slice. Each sub-section represents a user-facing feature and includes the full development and testing cycle.

* **✅ Task 1.5.1: Project Creation Feature \- Frontend. [COMPLETED]** In the ui-react module, build the UI for creating a new project. This will likely be a modal dialog that prompts the user for a project name, fulfilling the UI part of User Story 2.2.1
  * **Implementation Details:** Custom `ProjectCreationModal` component with React + Zustand integration, form validation, loading states, error handling, "New Project" button in main App header, modal state management with keyboard shortcuts (Escape to close)
  
* **✅ Task 1.5.2: Project Creation Feature \- Backend. [COMPLETED]** In the core-rust module, implement the async fn create\_project(name: String) Tauri command. This command will perform two actions: 1\) use the db-layer to insert a new record into the projects table, and 2\) create a corresponding project folder on the user's local file system.1
  * **Implementation Details:** `ProjectService` with database and filesystem dependencies, `create_project` Tauri command with full SQLite integration using `ProjectRepository`, project creation logic (validates name → generates UUID → creates directory → saves to database), proper dependency injection with `Arc<DatabaseManager>` and `Arc<FilesystemManager>`
  
* **✅ Task 1.5.3: Project Creation Feature \- Integration. [COMPLETED]** In the ui-react module, wire the "Create" button in the UI to the backend command using @tauri-apps/api/core's invoke('create\_project', { name }) function.
  * **Implementation Details:** Frontend modal calls actual Tauri backend via `invoke('create_project')`, JSON serialization between frontend/backend, all TypeScript interface and lint issues resolved, both `cargo build` and `npm run build` succeed
  
* **✅ Task 1.5.4: Project Creation Feature \- Testing. [COMPLETED]**  
  * **✅ Integration Test [COMPLETED]:** Write a Vitest test for the project creation UI. This test will use the @tauri-apps/api/mocks module to mockIPC. The mock will intercept the call to create\_project and simulate a successful response, allowing verification that the frontend behaves correctly without a live Rust backend.1
    * **Implementation Details:** Comprehensive test suite in `ProjectCreationModal.test.tsx` with test cases for modal rendering, form validation, successful project creation, error handling, input sanitization, loading states, and form element behavior during async operations
  * **✅ Unit Test [COMPLETED]:** Write a Rust unit test for the create\_project command itself. This test will use tauri::test::mock\_builder() to create a mock application environment and invoke the command programmatically, asserting that the command returns a successful result.1
    * **Implementation Details:** Comprehensive Rust unit tests in `commands.rs` using `tauri::test::mock_builder()`, temporary database/filesystem setup with `tempfile`, test cases for successful creation, validation, duplicate names, and name sanitization  
* **✅ Task 1.5.5: Local Autocomplete Feature \- Integration. [COMPLETED]** In the ui-react module, modify the Markdown editor component. Add an onChange event handler that debounces the user's input (e.g., waiting 300ms after the last keystroke) and then calls the get\_autocomplete command via invoke. The returned suggestion will then be displayed to the user. This implements the frontend part of User Story 5.2.1
  * **Implementation Details:** Enhanced `MarkdownEditor.tsx` with comprehensive AI autocomplete functionality including:
    * **Debounced Input Handling:** 300ms timeout after last keystroke before triggering AI autocomplete
    * **Tauri Backend Integration:** Calls `get_autocomplete` command via `invoke` with context text (last 200 characters)
    * **AI Suggestion Display:** Floating overlay with suggestion text, accept/dismiss controls, and keyboard shortcuts
    * **User Interaction:** Tab to accept suggestion, Esc to dismiss, click buttons for manual control
    * **Visual Feedback:** Loading indicators, status badges, cursor position tracking, and contextual UI states
    * **Error Handling:** Graceful fallback when AI service unavailable or returns invalid responses  
* **Task 1.5.6: Local Autocomplete Feature \- Testing.** Write a Vitest integration test using mockIPC to verify that the editor component correctly debounces input and calls the get\_autocomplete command with the expected payload.

### **Table 1: Phase 1 MVP Task Breakdown**

| Task ID | Workstream | Module | Task Description | Dependencies | PRD User Story | Testing Mandate |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1.1.1 | Infrastructure | Root | Initialize project monorepo structure. | \- | 1.2 | N/A |
| 1.1.2 | Infrastructure | Root | Configure root package.json and Cargo.toml. | 1.1.1 | 1.2, 1.3 | N/A |
| 1.1.3 | Infrastructure | build-pipeline | Establish initial GitHub Actions CI workflow for build and test. | 1.1.2 | 1.1 | CI pipeline must pass. |
| 1.1.4 | Infrastructure | ui-react | Set up Vitest and React Testing Library. | 1.1.2 | N/A | Create sample component test. |
| 1.1.5 | Infrastructure | core-rust | Enable tauri::test feature in Cargo.toml. | 1.1.2 | N/A | Create placeholder test file. |
| 1.2.1 | Backend | core-rust | Scaffold Clean Architecture directory structure. | 1.1.2 | N/A | N/A |
| 1.2.2 | Backend | core-rust | Define Project and Document domain model structs. | 1.2.1 | 1.4 | Rust unit tests for structs. |
| 1.2.3 | Backend | db-layer | Create the db-layer Rust module. | 1.1.2 | 1.4 | N/A |
| 1.2.4 | Backend | db-layer | Implement ConnectionManager using rusqlite. | 1.2.3 | 1.4 | Rust unit test for connection logic. |
| 1.2.5 | Backend | db-layer | Implement initial DB schema migration for projects and documents. | 1.2.4 | 1.4 | Rust unit test for migration SQL. |
| 1.2.6 | Backend | core-rust | Implement credential\_manager module using keyring-rs. | 1.1.2 | 3.1, 3.3 | Rust unit tests mocking keyring calls. |
| 1.3.1 | Frontend | ui-react | Scaffold React application using Vite. | 1.1.2 | N/A | N/A |
| 1.3.2 | Frontend | ui-react | Integrate Shadcn/ui and tailwind.css. | 1.3.1 | 2.1 | N/A |
| 1.3.3 | Frontend | ui-react | Implement static three-panel layout. | 1.3.2 | 2.1 | Vitest component test for layout. |
| 1.3.4 | Frontend | ui-react | Set up Zustand for global state management. | 1.3.1 | N/A | Vitest test for store logic. |
| 1.3.5 | Frontend | ui-react | Create basic \<textarea\>-based Markdown editor component. | 1.3.3 | 2.1 | Vitest component test. |
| 1.4.1 | Local AI | local-model-sidecar | Create the local-model-sidecar binary crate. | 1.1.2 | 5.1 | N/A |
| 1.4.2 | Local AI | local-model-sidecar | Integrate Candle ML framework. | 1.4.1 | 5.1 | N/A |
| 1.4.3 | Local AI | local-model-sidecar | Implement Phi-3-mini loading and serving via stdin/stdout. | 1.4.2 | 5.1, 5.2 | Rust unit test for I/O handling. |
| 1.4.4 | Local AI | core-rust | Configure tauri.conf.json to bundle the sidecar binary. | 1.4.1 | 5.1 | Manual build verification. |
| 1.4.5 | Local AI | local-ai-engine | Implement sidecar management service in core-rust. | 1.4.4 | 5.2 | Rust unit test for process spawning. |
| 1.4.6 | Local AI | core-rust | Implement get\_autocomplete Tauri command. | 1.4.5 | 5.2 | Rust unit test using tauri::test. |
| 1.5.1 | MVP Integration | ui-react | Build "Create New Project" UI. | 1.3.3 | 2.2 | Vitest component test. |
| 1.5.2 | MVP Integration | core-rust | Implement create\_project Tauri command. | 1.2.5 | 2.2 | Rust unit test using tauri::test. |
| 1.5.3 | MVP Integration | ui-react | Wire "Create Project" UI to backend command via invoke. | 1.5.1, 1.5.2 | 2.2 | N/A |
| 1.5.4 | MVP Integration | ui-react, core-rust | Test "Create Project" feature. | 1.5.3 | 2.2 | Vitest IPC mock test; Rust unit test. |
| 1.5.5 | MVP Integration | ui-react | Integrate get\_autocomplete command into editor component. | 1.3.5, 1.4.6 | 5.2 | N/A |
| 1.5.6 | MVP Integration | ui-react | Test autocomplete feature integration. | 1.5.5 | 5.2 | Vitest IPC mock test. |

## **Section 2: Phase 2 Task Plan — AI-Forward Enhancements**

With the core architectural risks retired in Phase 1, Phase 2 focuses on building the advanced AI and structured workflow features that constitute Project Yarn's primary value proposition. This phase will transform the application from a basic editor into an intelligent "IDE for Documents".1

The central architectural component of this phase is the AiProvider abstraction. The product requirements mandate support for multiple, switchable AI providers (local, AWS Bedrock, Google Gemini).1 A naive implementation would lead to brittle, hard-to-maintain conditional logic throughout the codebase. The technical strategy explicitly mandates the Adapter/Strategy design pattern to avoid this, defining an

AiProvider trait as a unified contract for AI interaction.1 This decouples the application's core logic from the specific implementation details of any given AI service. Therefore, the implementation of this trait is the lynchpin of the entire phase. The plan prioritizes creating this abstraction first, which then allows the individual provider implementations to be developed as independent, parallelizable tasks.

Simultaneously, this phase will implement the advanced Retrieval-Augmented Generation (RAG) system. The power of this system derives from a hybrid approach, combining the lexical, keyword-based search of SQLite's FTS5 extension with the semantic, conceptual search enabled by a local vector database.1 This dual-source retrieval ensures that the AI agent receives rich, relevant context for its generations, fulfilling the requirement for multi-file context awareness.1

### **2.1 Workstream: Advanced Backend Logic (core-rust)**

This workstream implements the core business logic for managing the structured document lifecycle.

* **Task 2.1.1: Document State FSM Implementation.** In the core layer of the core-rust module, implement the full Finite State Machine (FSM) for the document lifecycle.1 This involves creating a Rust  
  enum named DocumentState with variants for each state (e.g., Memo, PRFAQ, EpicBreakdown). A transitions module will be created to contain the logic defining valid state changes (e.g., a Memo can transition to PRFAQ, but not directly to EpicBreakdown). This enforces the structured workflow defined in the PRD.1  
* **Task 2.1.2: Database Schema Update for FSM.** In the db-layer module, create a new database migration. This migration will add a state column (of type TEXT) to the documents table.  
* **Task 2.1.3: Database Functions for FSM.** In the db-layer, implement the data access functions to support the FSM. This includes update\_document\_state(document\_id, new\_state) and get\_document\_state(document\_id). These functions will be used by the application layer to persist and retrieve the state of each document.

### **2.2 Workstream: Cloud & Local AI Integration (core-rust, local-ai-engine)**

This workstream builds the flexible AI provider system, allowing the application to seamlessly switch between local and cloud-based models.

* **Task 2.2.1: Define AiProvider Trait.** In the application layer of core-rust, define the trait AiProvider: Send \+ Sync. This trait will declare the common interface for all AI services, including a primary method like async fn invoke\_model\_stream(\&self, prompt: String, app\_handle: \&tauri::AppHandle) \-\> Result\<(), String\>.1 The  
  Send \+ Sync bounds are crucial for use in a multi-threaded context.  
* **Task 2.2.2: Implement LocalProvider.** In the infrastructure layer, create a LocalProvider struct that implements the AiProvider trait. This will refactor the MVP logic from Phase 1, wrapping the communication with the local-ai-engine service to conform to the new trait interface.  
* **Task 2.2.3: Implement BedrockProvider.** In the infrastructure layer, create a BedrockProvider struct that implements AiProvider. This implementation will use the aws-sdk-bedrockruntime crate to make API calls.1 It will use the  
  credential\_manager module (from Task 1.2.6) to retrieve the necessary AWS credentials from the OS keychain.  
* **Task 2.2.4: Implement GeminiProvider.** In the infrastructure layer, create a GeminiProvider struct that implements AiProvider. This will use the gemini-rs crate and the credential\_manager module to interact with the Google Gemini API.1  
* **Task 2.2.5: Implement AI Provider State Manager.** In the application layer, implement a state manager to hold the currently active AI provider. This can be a Tauri-managed state object like Arc\<Mutex\<Box\<dyn AiProvider\>\>\>, allowing the active provider to be changed at runtime.  
* **Task 2.2.6: Implement Credential Management Commands.** Create the suite of Tauri commands required for AI configuration 1:  
  * set\_bedrock\_credentials(access\_key, secret\_key, region)  
  * validate\_bedrock\_credentials(...)  
  * set\_gemini\_credentials(api\_key)  
  * validate\_gemini\_credentials(...)  
  * select\_active\_provider(provider\_name: String)  
    These commands will interact with the credential\_manager and the AI provider state manager.

### **2.3 Workstream: Advanced Retrieval-Augmented Generation (RAG) System**

This workstream builds the sophisticated context retrieval system that powers the @ command.

* **Task 2.3.1: Integrate Analysis Model.** In the local-model-sidecar crate, add the logic to load and run the sentence-transformers/all-MiniLM-L6-v2 model.1 The sidecar's I/O protocol will be extended to handle requests for embeddings in addition to text generation.  
* **Task 2.3.2: Implement Background File Watcher.** In the local-ai-engine module, implement a background service that uses a file system watcher (e.g., the notify crate) to monitor the project directory for changes to .md files. This directly supports User Stories 1.5 and 5.3.1  
* **Task 2.3.3: Implement Background Embedding Generation.** When the file watcher detects a change, the background service will read the modified file's content, send it to the local-model-sidecar to be converted into a vector embedding, and then store that embedding in the database. This implements the "Background Knowledge Curation" feature.1  
* **Task 2.3.4: Create Vector Index Table.** In the db-layer, create a new database migration for a vector\_index table. This table will store document\_id and the embedding (as a BLOB). Implement functions to insert, update, and retrieve these embeddings.  
* **Task 2.3.5: Implement FTS5 Full-Text Search.** In the db-layer, create a migration to set up the SQLite FTS5 virtual table.1 Implement the  
  AFTER INSERT, AFTER UPDATE, and AFTER DELETE triggers on the documents table to automatically keep the FTS5 index synchronized with the document content, as specified in the technical strategy.1  
* **Task 2.3.6: Implement Hybrid RAG Logic.** Implement the backend logic for the @ context command.1 This function will orchestrate the two-step retrieval process:  
  1. Perform a fast, lexical search using the FTS5 index to get a candidate set of relevant documents.  
  2. For the candidate documents, perform a vector similarity search on their embeddings to find the most semantically relevant text chunks.  
  3. Assemble the retrieved text into a context string to be passed to the active AiProvider.

### **2.4 Workstream: Frontend Feature Implementation (ui-react)**

This workstream builds the user interfaces for the new backend capabilities.

* **Task 2.4.1: Build AI Settings UI.** Build the "Settings" page in the React application. This page will contain forms for users to input their AWS Bedrock and Google Gemini credentials and a button to trigger the validation commands. This supports User Stories 3.1 through 3.4.1  
* **Task 2.4.2: Build AI Model Selector UI.** Implement the UI element (e.g., a dropdown menu in the AI chat panel) that allows the user to switch between configured AI providers. This will call the select\_active\_provider command. This supports User Story 3.5.1  
* **Task 2.4.3: Implement Streaming Chat UI.** Implement the main AI chat panel. The UI must be able to handle streaming responses from the backend. This will use the @tauri-apps/api/event's listen function to subscribe to ai\_suggestion\_chunk events, appending the payload to the response in real-time, as demonstrated in the technical strategy's code example.1 This supports User Story 4.2.1  
* **Task 2.4.4: Implement Document Transformation UI.** Implement the UI for the document transformation workflow. This could be a context menu option on a file in the file tree or a command palette action. It will allow the user to select a document and invoke a command like "Transform to PR FAQ," which will call the backend FSM logic. This supports User Story 4.4.1

### **2.5 Workstream: System Maintenance & Testing Expansion**

This workstream focuses on improving the development and release infrastructure and expanding the testing scope.

* **Task 2.5.1: Integrate Auto-Updater.** Integrate the tauri-plugin-updater into both the Rust backend and the React frontend.1 The frontend will include logic to check for updates on startup and prompt the user if one is available.  
* **Task 2.5.2: Configure Update Pipeline.** Update the build-pipeline in GitHub Actions. After the build and sign steps, add a step to generate the cryptographically signed update artifacts and the latest.json manifest file, then upload them to a GitHub Release.1  
* **Task 2.5.3: Set Up E2E Testing Framework.** Set up the end-to-end testing framework using WebdriverIO and tauri-driver.1 Configure the  
  wdio.conf.js file to correctly spawn the tauri-driver process. Write the first E2E test for the "Create Project" workflow from Phase 1, automating the full user interaction.  
* **Task 2.5.4: Set Up Visual Regression Testing.** Set up the visual regression testing framework. While the tech strategy mentions Playwright, to maintain a single E2E framework, this will be implemented using WebdriverIO's visual testing service. Capture baseline screenshots of the main application view on both macOS and Windows. Integrate this test run into the CI pipeline to catch unintended UI changes between platforms.1

### **Table 2: Phase 2 AI-Forward Task Breakdown**

| Task ID | Workstream | Module | Task Description | Dependencies | PRD User Story | Testing Mandate |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 2.1.1 | Backend Logic | core-rust | Implement Document State FSM logic. | 1.2.2 | 4.4 | Rust unit tests for all state transitions. |
| 2.1.2 | Backend Logic | db-layer | Add state column to documents table via migration. | 2.1.1 | 1.4 | N/A |
| 2.1.3 | Backend Logic | db-layer | Implement CRUD functions for document state. | 2.1.2 | 1.4 | Rust unit tests for DB functions. |
| 2.2.1 | AI Integration | core-rust | Define AiProvider trait. | 1.2.1 | 3.5 | N/A |
| 2.2.2 | AI Integration | core-rust | Implement LocalProvider struct. | 2.2.1, 1.4.6 | 3.5 | Rust unit tests for the provider. |
| 2.2.3 | AI Integration | core-rust | Implement BedrockProvider struct. | 2.2.1, 1.2.6 | 3.1, 3.2, 3.5 | Rust unit tests mocking AWS SDK calls. |
| 2.2.4 | AI Integration | core-rust | Implement GeminiProvider struct. | 2.2.1, 1.2.6 | 3.3, 3.4, 3.5 | Rust unit tests mocking Gemini SDK calls. |
| 2.2.5 | AI Integration | core-rust | Implement AI Provider state manager. | 2.2.1 | 3.5 | Rust unit tests for state switching. |
| 2.2.6 | AI Integration | core-rust | Implement credential management Tauri commands. | 2.2.5, 1.2.6 | 3.1-3.5 | Rust unit tests using tauri::test. |
| 2.3.1 | RAG System | local-model-sidecar | Integrate all-MiniLM-L6-v2 analysis model. | 1.4.3 | 5.3 | Rust unit test for embedding I/O. |
| 2.3.2 | RAG System | local-ai-engine | Implement background file watcher service. | 1.2.2 | 1.5, 5.3 | Rust integration test for watcher events. |
| 2.3.3 | RAG System | local-ai-engine | Implement background embedding generation logic. | 2.3.1, 2.3.2 | 5.3 | Rust integration test for the full pipeline. |
| 2.3.4 | RAG System | db-layer | Create vector\_index table and CRUD functions. | 1.2.5 | 1.4 | Rust unit tests for vector DB functions. |
| 2.3.5 | RAG System | db-layer | Implement SQLite FTS5 table and sync triggers. | 1.2.5 | 1.4 | Rust integration test for triggers. |
| 2.3.6 | RAG System | core-rust | Implement hybrid RAG logic for @ command. | 2.3.4, 2.3.5 | 4.3 | Rust integration test for hybrid search. |
| 2.4.1 | Frontend | ui-react | Build AI settings UI for credentials. | 2.2.6 | 3.1-3.4 | Vitest component and IPC mock tests. |
| 2.4.2 | Frontend | ui-react | Build AI model selector UI. | 2.2.6 | 3.5 | Vitest component and IPC mock tests. |
| 2.4.3 | Frontend | ui-react | Implement streaming AI chat panel UI. | 2.2.1 | 4.2 | Vitest component test for event handling. |
| 2.4.4 | Frontend | ui-react | Implement document transformation UI. | 2.1.1 | 4.4 | Vitest component and IPC mock tests. |
| 2.5.1 | Maintenance | core-rust, ui-react | Integrate tauri-plugin-updater. | 1.1.3 | N/A | Manual update test. |
| 2.5.2 | Maintenance | build-pipeline | Configure CI/CD to generate and publish update artifacts. | 2.5.1 | N/A | E2E test of the update process. |
| 2.5.3 | Maintenance | Root | Set up E2E testing with WebdriverIO and tauri-driver. | 1.1.3 | N/A | E2E test for "Create Project" workflow. |
| 2.5.4 | Maintenance | Root | Set up visual regression testing. | 2.5.3 | N/A | E2E visual tests for main UI views. |

## **Section 3: Phase 3 Task Plan — Polish, Expansion, and Distribution**

The final phase of development, Phase 3, is dedicated to transforming the feature-complete application into a professional, trusted, and robust product suitable for public release. The focus shifts from feature implementation to non-functional requirements, including performance optimization, expanded platform support, and the critical infrastructure for secure software distribution.

A central theme of this phase is establishing user trust. The target personas are professionals who often use company-managed devices with stringent security policies.1 An application that is not properly signed will trigger severe operating system warnings (such as Windows SmartScreen and macOS Gatekeeper), creating a significant barrier to adoption. Therefore, code signing and, for macOS, notarization, are not considered optional "polish" steps. They are non-negotiable, mandatory requirements for successful distribution and user acquisition.1 The tasks related to the build and distribution pipeline are consequently treated as critical path items for launch, requiring the acquisition of external assets (code signing certificates) and the secure management of sensitive credentials within the CI/CD environment.

### **3.1 Workstream: Performance & Optimization**

This workstream ensures the application is responsive and efficient, even when handling large-scale projects.

* **Task 3.1.1: Performance Profiling.** Conduct systematic performance profiling of the application. The primary focus will be on scenarios involving very large Markdown documents (e.g., \>1MB of text) and projects with hundreds of files. Key metrics to measure are UI responsiveness during typing, time to open large files, and memory consumption.  
* **Task 3.1.2: Editor UI Virtualization.** Based on the results of profiling, implement UI virtualization for the Markdown editor. This technique, using a library like react-window or tanstack-virtual, ensures that only the visible portion of a large document is rendered in the DOM, preventing UI lag and high memory usage.  
* **Task 3.1.3: File List UI Virtualization.** Apply the same virtualization technique to the file list in the left-hand panel to ensure it remains smooth and responsive even in projects containing thousands of documents.  
* **Task 3.1.4: Database Query Optimization.** Analyze and optimize critical database queries in the db-layer. This involves using EXPLAIN QUERY PLAN in SQLite to identify slow queries and adding database indexes where necessary to improve the performance of data retrieval, particularly for the RAG system.

### **3.2 Workstream: Platform & Distribution**

This workstream expands platform support to all targets defined in the PRD and implements the secure distribution pipeline.

* **Task 3.2.1: Expand Build Matrix.** Update the GitHub Actions build-pipeline build matrix to include targets for Windows on ARM64 (aarch64-pc-windows-msvc) and macOS on ARM64/Apple Silicon (aarch64-apple-darwin). This fulfills the final platform support requirements of User Story 1.1.1  
* **Task 3.2.2: Acquire Windows Code Signing Certificate.** Procure an Organization Validation (OV) or Extended Validation (EV) Code Signing Certificate from a trusted Certificate Authority. This is a hard requirement for signing Windows binaries.1  
* **Task 3.2.3: Implement Windows Code Signing.** Store the acquired certificate and its associated password as encrypted secrets in GitHub Actions. Update the build-pipeline YAML to include a step that uses signtool.exe (via a helper action) to automatically sign all generated .exe and .msi artifacts during the CI/CD run.1  
* **Task 3.2.4: Acquire Apple Developer ID Certificate.** Enroll in the Apple Developer Program to acquire the Developer ID certificate required for distributing applications outside the Mac App Store.1  
* **Task 3.2.5: Implement macOS Code Signing & Notarization.** Store the Apple certificate, its private key, and the associated password as encrypted secrets in GitHub Actions. Configure the tauri-action in the build-pipeline with these secrets. The action will then automatically handle the entire process:  
  1. Code-sign the .app bundle.  
  2. Submit the signed bundle to Apple's notary service for automated security verification.  
  3. "Staple" the notarization ticket to the final .dmg installer, ensuring it passes Gatekeeper checks on user machines.1

### **3.3 Workstream: UI/UX Refinement**

This workstream focuses on adding the final user-facing features and conducting a thorough polish and accessibility pass.

* **Task 3.3.1: Implement Reusable Prompts (AI Blocks).** Implement the full feature for creating, saving, and reusing custom AI prompts, referred to as "AI Blocks." This involves creating the necessary backend commands to store and retrieve these prompts from the SQLite database and building the corresponding UI for managing them. This fulfills User Story 4.5.1  
* **Task 3.3.2: Implement Mermaid.js Diagramming.** Implement the integrated diagramming feature. The Markdown editor will be enhanced to detect fenced code blocks with the mermaid language identifier. The frontend will then use the Mermaid.js library to render the syntax into an SVG. This task has a critical security constraint: the rendered SVG *must* be placed within a sandboxed \<iframe\> element in the UI to isolate its execution context and mitigate the risk of script injection, as mandated by the technical strategy.1 This fulfills User Story 2.4.  
* **Task 3.3.3: Accessibility Audit.** Conduct a comprehensive accessibility audit of the entire application. This includes verifying full keyboard navigability for all interactive elements, ensuring all components have appropriate ARIA attributes for screen reader compatibility, and checking for sufficient color contrast ratios to meet WCAG AA standards.  
* **Task 3.3.4: Accessibility Remediation.** Create and execute a series of sub-tasks to remediate all issues identified during the accessibility audit.  
* **Task 3.3.5: Final Design Polish.** Conduct a final design and consistency pass across the entire application UI. This involves refining spacing, typography, iconography, and component states to ensure a cohesive and professional user experience.

### **Table 3: Phase 3 Polish & Expansion Task Breakdown**

| Task ID | Workstream | Module | Task Description | Dependencies | PRD User Story | Testing Mandate |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3.1.1 | Performance | All | Conduct performance profiling on large documents and projects. | 2.4.3 | N/A | Documented performance benchmarks. |
| 3.1.2 | Performance | ui-react | Implement UI virtualization for the Markdown editor. | 3.1.1 | N/A | E2E performance tests. |
| 3.1.3 | Performance | ui-react | Implement UI virtualization for the file list view. | 3.1.1 | N/A | E2E performance tests. |
| 3.1.4 | Performance | db-layer | Analyze and optimize critical database queries with indexes. | 3.1.1 | N/A | Rust integration tests for query speed. |
| 3.2.1 | Distribution | build-pipeline | Add Windows ARM64 and macOS ARM64 to CI build matrix. | 1.1.3 | 1.1 | Successful builds for all targets. |
| 3.2.2 | Distribution | N/A | Acquire OV/EV Code Signing Certificate for Windows. | \- | N/A | N/A |
| 3.2.3 | Distribution | build-pipeline | Implement automated Windows binary signing in CI/CD. | 3.2.1, 3.2.2 | N/A | Verify signature on downloaded artifact. |
| 3.2.4 | Distribution | N/A | Acquire Apple Developer ID Certificate. | \- | N/A | N/A |
| 3.2.5 | Distribution | build-pipeline | Implement automated macOS signing and notarization in CI/CD. | 3.2.1, 3.2.4 | N/A | Verify signature and notarization on.dmg. |
| 3.3.1 | UI/UX | core-rust, ui-react | Implement "AI Blocks" feature for reusable prompts. | 2.4.3 | 4.5 | E2E test for creating/using an AI Block. |
| 3.3.2 | UI/UX | ui-react | Implement Mermaid.js diagram rendering in a sandboxed iframe. | 1.3.5 | 2.4 | E2E test rendering a diagram; security review of sandbox. |
| 3.3.3 | UI/UX | ui-react | Conduct full accessibility audit of the application. | 3.3.2 | N/A | Audit report with identified issues. |
| 3.3.4 | UI/UX | ui-react | Remediate all issues found in the accessibility audit. | 3.3.3 | N/A | E2E tests for keyboard navigation and ARIA roles. |
| 3.3.5 | UI/UX | ui-react | Perform final design polish and consistency pass. | 3.3.4 | N/A | Visual regression tests updated with final designs. |

#### **Works cited**

1. Project Yarn PRD: Final