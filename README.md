# Project Yarn

An AI-native desktop application for professional writing and document management. Project Yarn is an "IDE for Documents" that provides a project-centric workflow with structured document lifecycles, local-first architecture, and seamless AI integration.

## 🚀 Features

- **AI-Native Document Creation**: Built from the ground up for AI-assisted writing
- **Project-Centric Workflow**: Structured document lifecycles (Memo → PRD → Epic Breakdown)
- **Local-First Architecture**: Your data stays on your machine with optional cloud AI integration
- **Three-Panel Interface**: File tree, editor, and AI chat for optimal workflow
- **Multi-File Context Awareness**: AI understands your entire project context
- **Local AI Autocomplete**: Powered by Phi-3-mini for fast, private suggestions

## 🛠️ Tech Stack

- **Desktop**: Tauri (Rust backend + React frontend)
- **Database**: SQLite with FTS5 for full-text search
- **AI**: Hybrid approach - local models + cloud providers (AWS Bedrock, Google Gemini)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **State Management**: Zustand
- **Platform**: Windows & macOS (x64 and ARM64)

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable version)
- **Git** (for version control)

## 🔧 Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/feamando/project-yarn.git
cd project-yarn
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Rust dependencies (automatically handled by Cargo)
cd src-tauri
cargo build
cd ..
```

### 3. AI Model Setup

Project Yarn uses AI models that are managed separately from the git repository to keep the codebase lightweight.

```bash
# Interactive model setup (recommended for first-time setup)
npm run setup-models

# Or install all recommended models automatically
npm run models:install
```

**What this does:**
- Downloads Microsoft Phi-3 Mini models (~2-4GB)
- Verifies model integrity with SHA256 checksums
- Sets up local model cache
- Configures model paths for the application

### 4. Git Hooks Setup (Recommended)

Set up git hooks to prevent accidentally committing large model files:

```bash
# Install git hooks for model file protection
npm run setup-git-hooks

# Validate .gitignore configuration
npm run validate-gitignore
```

### 5. Start Development

```bash
# Start the development server
npm run dev

# In another terminal, start the Tauri development server
npm run tauri dev
```

The application will open automatically. If not, navigate to `http://localhost:1420` in your browser.

## 🤖 AI Model Management

### Available Commands

```bash
# Model setup and installation
npm run setup-models          # Interactive setup
npm run models:install         # Install all models
npm run models:status          # Check model status
npm run verify-models          # Verify model integrity
npm run update-models          # Update models
npm run models:clean           # Clean up old versions

# Git and repository validation
npm run validate-gitignore     # Validate .gitignore
npm run setup-git-hooks        # Install git hooks
npm run git:validate           # Full git validation
```

### Supported Models

- **Phi-3 Mini 4K (INT4)** - 2GB, fast inference, general use
- **Phi-3 Mini 4K (FP16)** - 7GB, high quality, best results
- **Phi-3 Mini 128K (INT4)** - 2GB, extended context, long documents

### Model Storage

- **Location**: `./models/` (excluded from git)
- **Cache**: Automatic integrity verification
- **Updates**: Semantic versioning with rollback support

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run Rust tests
cd src-tauri
cargo test

# Verify complete setup
npm run verify-setup
```

## 📦 Building

```bash
# Build for development
npm run tauri build --debug

# Build for production
npm run tauri build
```

## 🏗️ Project Structure

```
project-yarn/
├── src/                    # React frontend source
│   ├── components/         # UI components
│   ├── lib/               # Utilities and stores
│   └── ...
├── src-tauri/             # Rust backend source
│   ├── src/
│   │   ├── application/   # Business logic layer
│   │   ├── infrastructure/ # Database, filesystem, external services
│   │   └── ...
├── local-model-sidecar/   # Local AI model service
├── models/                # AI models (not in git, created during setup)
├── project-documentation/ # Technical documentation
└── ...
```

## 🧪 Testing

```bash
# Run frontend tests
npm run test

# Run Rust tests
cd src-tauri
cargo test
cd ..

# Run all tests
npm run test:all
```

## 📦 Building for Production

```bash
# Build the application
npm run tauri build
```

The built application will be available in `src-tauri/target/release/bundle/`.

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Set up AI models** following the setup instructions above
4. **Make your changes** and ensure tests pass
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Important Notes for Contributors

- **AI Models**: Never commit model files to the repository. They are automatically excluded via `.gitignore`
- **Build Artifacts**: The `target/`, `node_modules/`, and `dist/` directories are excluded from version control
- **Testing**: Ensure all tests pass before submitting a PR
- **Documentation**: Update documentation for any new features or changes

## 📚 Documentation

- [Task Plan](./project-documentation/Yarn%20Project%20Task%20Plan_.md) - Detailed development roadmap
- [Architecture Overview](./project-documentation/) - Technical architecture documentation

## 🎯 Target Users

- **Product Managers**: For consistent project artifacts and structured workflows
- **Tech Leads**: For technical specifications and Architecture Decision Records (ADRs)
- **Content Strategists**: For structured long-form content creation

## 🔄 Development Phases

1. **MVP**: Core editor + local AI + project creation 
2. **AI-Forward**: Cloud AI integration + RAG system + document workflows
3. **Polish**: Performance optimization + code signing + UI polish

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/feamando/project-yarn/issues) page
2. Review the setup instructions above
3. Ensure AI models are properly installed
4. Create a new issue with detailed information about your problem

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/) for cross-platform desktop development
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- AI models powered by [Microsoft Phi-3](https://azure.microsoft.com/en-us/products/ai-services/phi-3)
