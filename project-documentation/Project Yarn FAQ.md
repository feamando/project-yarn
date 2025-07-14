# Project Yarn FAQ

**Document Version:** 1.0  
**Date:** July 14, 2025  
**Status:** Draft

---

## General Questions

### What is Project Yarn?
Project Yarn is an "IDE for Documents" - a desktop application designed specifically for professional writing and document management. Unlike traditional word processors with AI features added on, Yarn is built from the ground up to be an AI-native environment that unifies your entire documentation workflow in a single, powerful application.

### Who is Project Yarn designed for?
Yarn targets three primary personas:
- **Product Managers** who need to create consistent project artifacts across different stakeholders
- **Tech Leads** who require precision and structure for technical specifications and architectural documents
- **Content Strategists** who create complex, long-form content like white papers and technical articles

### How is Yarn different from existing tools like Google Docs or Notion?
Yarn solves the "tool fragmentation" problem where professionals must switch between multiple incompatible tools (Google Docs → Confluence → Jira) to manage a single idea's lifecycle. Yarn provides:
- **Project-centric workflow**: Everything related to a project stays together
- **Structured document transformations**: AI-powered conversion between document types (e.g., Memo → PRD → Epic Breakdown)
- **Local-first architecture**: Full offline capability with your data stored locally
- **AI-native design**: Not retrofitted - designed for AI from the ground up

## Technical Questions

### What platforms does Project Yarn support?
Yarn will be available for:
- **Windows**: x86_64 and ARM64 (aarch64)
- **macOS**: x86_64 (Intel) and ARM64 (Apple Silicon)

Native binaries ensure optimal performance on all platforms without emulation layers.

### Why was Tauri chosen over Electron?
Tauri offers significant advantages for an AI-heavy application:
- **Performance**: ~58% less memory usage and much smaller binaries (2.5-10MB vs 80-244MB)
- **Security**: Sandboxed frontend with secure IPC bridge vs. direct Node.js access
- **Resource efficiency**: Critical for local AI model execution

### How does the local AI work?
Yarn uses a hybrid local AI strategy:
- **Generative Model**: Microsoft's Phi-3-mini (3.8B parameters) for real-time autocomplete
- **Analysis Model**: sentence-transformers/all-MiniLM-L6-v2 for background document analysis
- **Execution**: Models run in isolated sidecar processes to prevent UI freezing
- **Bundling**: Both models are included with the installer for out-of-the-box functionality

### What cloud AI providers are supported?
Yarn integrates with:
- **Amazon Bedrock**: For access to Claude, LLama, and other AWS models
- **Google Gemini**: For Google's latest language models
- Users can switch between local and cloud models based on task requirements

## Data & Privacy Questions

### Where is my data stored?
Yarn follows a "local-first" architecture:
- All documents are stored as standard Markdown (.md) files on your local file system
- Project metadata is stored in a local SQLite database
- You maintain full ownership and control of your data
- No data is sent to external servers unless you explicitly use cloud AI features

### How are API keys and credentials secured?
All sensitive credentials are stored using your operating system's native security systems:
- **macOS**: Stored in the user's Keychain
- **Windows**: Stored in Windows Credential Manager
- Credentials are never stored in plaintext, configuration files, or the application database

### Can I export my data?
Yes, your data portability is guaranteed:
- Documents are stored in standard Markdown format
- You can access, copy, or move your files using any file manager
- Project structure is transparent and documented
- No vendor lock-in

## Feature Questions

### What is the "structured document workflow"?
Yarn implements a document lifecycle management system where documents can be transformed from one type to another:
- **Example flow**: Problem Memo → Product Requirements Document → Epic Breakdown
- **AI-powered**: Transformations are handled by AI while maintaining consistency
- **State management**: Each document has a defined state tracked by a Finite State Machine

### How does the @ context command work?
The @ command enables multi-file context awareness:
- Type "@filename" to reference other documents in your project
- Yarn uses Retrieval-Augmented Generation (RAG) to find relevant content
- Combines keyword search (SQLite FTS5) with semantic search (vector embeddings)
- Provides the AI with rich context from across your entire project

### Can I create diagrams in Yarn?
Yes, Yarn supports integrated diagramming via Mermaid.js:
- Use fenced code blocks with `mermaid` language identifier
- Supports flowcharts, sequence diagrams, and other diagram types
- Renders directly in the document preview
- Diagrams are rendered in sandboxed iframes for security

### What are "AI Blocks"?
AI Blocks are reusable, custom AI prompts that you can create, save, and apply:
- Create templates for repetitive writing tasks
- Ensure consistency across similar documents
- Share common prompts across projects
- Customize AI behavior for specific use cases

## Development & Updates

### What is the development timeline?
Yarn development follows a three-phase approach:

**Phase 1 (MVP)**: Core editor experience with local AI
- Basic three-panel UI with Markdown editor
- Local AI autocomplete with bundled models
- Project creation and file management
- Secure credential storage

**Phase 2 (AI-Forward)**: Advanced AI and workflow features
- Cloud AI provider integration
- Full RAG system for multi-file context
- Document transformation workflows
- Background analysis and knowledge curation

**Phase 3 (Polish)**: Professional-grade features
- Performance optimization for large projects
- Code signing and trusted distribution
- UI/UX polish and accessibility improvements
- Additional platform support

### How will updates be delivered?
Yarn includes an automatic updater system:
- Updates are cryptographically signed for security
- Users are notified when updates are available
- Downloads and installs happen in the background
- Uses GitHub Releases as the update server

### Is Project Yarn open source?
The documents don't specify the licensing model, but the architecture is designed with clear module boundaries that could support various distribution models.

## Getting Started

### How do I install Project Yarn?
Installation details will be provided upon release. The application will be distributed as:
- **Windows**: .exe and .msi installers
- **macOS**: .dmg installer with code signing and notarization

### What are the system requirements?
Specific requirements will be published with the release, but Yarn is designed to be efficient:
- Local AI models require some RAM and CPU but are optimized for consumer hardware
- SQLite database provides efficient storage
- Tauri's architecture minimizes resource usage

### Do I need to configure anything to get started?
Yarn is designed for immediate productivity:
- Local AI models are bundled with the installer
- No additional downloads or setup required for basic functionality
- Cloud AI providers are optional and can be configured later
- Simple project creation gets you started immediately

---

*This FAQ will be updated as the project develops and based on user feedback.*
