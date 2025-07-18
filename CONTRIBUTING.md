# Contributing to Project Yarn

Welcome to Project Yarn! We're excited to have you contribute to our AI-powered writing assistant. This guide will help you get started with development and understand our contribution process.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **Rust** 1.70 or higher ([Install](https://rustup.rs/))
- **Git** ([Download](https://git-scm.com/))
- **Visual Studio Code** (recommended) with Rust and TypeScript extensions

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 20GB free space (for models and dependencies)
- **Network**: Stable internet connection for model downloads

## 📥 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/feamando/project-yarn.git
cd project-yarn
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Rust dependencies (handled automatically by Tauri)
npm run tauri build --debug
```

### 3. Set Up AI Models

Project Yarn uses AI models that are managed separately from the git repository to keep the codebase lightweight.

```bash
# Interactive model setup (recommended for first-time contributors)
npm run setup-models

# Or install all recommended models automatically
npm run models:install
```

**What this does:**
- Downloads Microsoft Phi-3 Mini models (~2-4GB)
- Verifies model integrity with SHA256 checksums
- Sets up local model cache
- Configures model paths for the application

### 4. Verify Setup

```bash
# Verify all components are working
npm run verify-setup

# Check model installation
npm run models:status

# Validate git configuration
npm run validate-gitignore
```

### 5. Start Development

```bash
# Start the development server
npm run dev

# In another terminal, start the Tauri development server
npm run tauri dev
```

The application should open automatically. If not, navigate to `http://localhost:1420` in your browser.

## 🏗️ Project Structure

```
project-yarn/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── stores/            # Zustand state management
│   ├── lib/               # Utility functions
│   └── styles/            # CSS and styling
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── application/   # Application layer (commands)
│   │   ├── domain/        # Domain models
│   │   ├── infrastructure/ # Infrastructure (DB, filesystem)
│   │   └── main.rs        # Entry point
│   └── Cargo.toml         # Rust dependencies
├── scripts/               # Model management scripts
│   ├── setup-models.js    # Model installation
│   ├── verify-models.js   # Model verification
│   └── update-models.js   # Model updates
├── models/                # AI models (excluded from git)
├── docs/                  # Documentation
└── package.json           # Node.js dependencies
```

## 🤖 AI Model Management

### Understanding the Model System

Project Yarn uses a sophisticated model management system to handle large AI models efficiently:

1. **Models are NOT stored in git** - They're downloaded separately
2. **Automatic verification** - SHA256 checksums ensure integrity
3. **Version management** - Models can be updated independently
4. **Cross-platform support** - Works on Windows, macOS, and Linux

### Available Models

- **Phi-3 Mini (INT4)** - Lightweight, fast inference (~2GB)
- **Phi-3 Mini (FP16)** - Higher quality, more memory (~7GB)
- **Phi-3 Mini 128K** - Extended context version (~2GB)

### Model Commands

```bash
# Interactive model management
npm run setup-models

# Check model status
npm run models:status

# Verify model integrity
npm run verify-models

# Update models
npm run update-models

# Clean up old versions
npm run models:clean
```

### Troubleshooting Models

**Download fails:**
```bash
# Check network and retry
npm run setup-models -- --check
npm run models:install
```

**Verification fails:**
```bash
# Re-download corrupted models
npm run update-models -- --update-all --force
```

**Out of disk space:**
```bash
# Clean up old model versions
npm run models:clean
```

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- Ensure models are properly excluded from git

### 3. Test Your Changes

```bash
# Run frontend tests
npm test

# Build and test Rust backend
npm run tauri build --debug

# Verify model integration
npm run verify-setup
```

### 4. Commit Your Changes

Our git hooks will automatically:
- Prevent committing large model files
- Validate .gitignore configuration
- Check for accidentally staged large files

```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## 📝 Code Style Guidelines

### TypeScript/React

- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Use Zustand for state management
- Prefer functional components over class components
- Use Tailwind CSS for styling

### Rust

- Follow Rust naming conventions
- Use `cargo fmt` for formatting
- Add comprehensive error handling
- Write unit tests for business logic
- Use the existing architecture patterns

### Git Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 🧪 Testing

### Frontend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Backend Tests

```bash
# Run Rust tests
cd src-tauri
cargo test

# Run with output
cargo test -- --nocapture
```

### Integration Tests

```bash
# Full application test
npm run tauri build --debug
npm run verify-setup
```

## 🐛 Debugging

### Frontend Debugging

1. Use browser developer tools
2. React DevTools extension
3. Zustand DevTools for state inspection

### Backend Debugging

1. Use `println!` or `dbg!` macros for quick debugging
2. Use `cargo run` for direct Rust execution
3. Check Tauri logs in the developer console

### Model Issues

1. Check model status: `npm run models:status`
2. Verify integrity: `npm run verify-models`
3. Check logs in `./logs/` directory
4. Validate .gitignore: `npm run validate-gitignore`

## 📚 Documentation

### Writing Documentation

- Update README.md for user-facing changes
- Add inline code comments for complex logic
- Update API documentation for new endpoints
- Include examples in documentation

### Documentation Structure

- `README.md` - Main project documentation
- `CONTRIBUTING.md` - This file
- `docs/MODEL_SETUP.md` - Advanced model configuration
- `docs/TROUBLESHOOTING.md` - Common issues and solutions
- `scripts/README.md` - Model management scripts

## 🔒 Security Considerations

### Model Security

- All models are verified with SHA256 checksums
- Downloads only from trusted sources (Microsoft/HuggingFace)
- No execution of downloaded model files
- Sandboxed model storage directory

### Code Security

- No hardcoded API keys or secrets
- Use environment variables for configuration
- Validate all user inputs
- Follow Rust memory safety practices

## 🚨 Common Issues

### Setup Issues

**"Node.js version too old"**
```bash
# Update Node.js to 18.x or higher
nvm install 18
nvm use 18
```

**"Rust not found"**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

**"Models not downloading"**
```bash
# Check network and disk space
npm run setup-models -- --check
```

### Build Issues

**"Tauri build fails"**
```bash
# Clean and rebuild
rm -rf src-tauri/target
npm run tauri build --debug
```

**"Frontend build fails"**
```bash
# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Git Issues

**"Large files in git"**
```bash
# Remove from git (but keep locally)
git rm --cached path/to/large/file
git commit -m "remove large file from git"
```

**"Pre-commit hook fails"**
```bash
# Check what's being committed
git status
npm run validate-gitignore
```

## 🤝 Getting Help

### Community Support

- **GitHub Issues** - Report bugs and request features
- **GitHub Discussions** - Ask questions and share ideas
- **Discord** - Real-time chat with the community (coming soon)

### Maintainer Contact

- **GitHub** - @feamando
- **Email** - [project-yarn@example.com](mailto:project-yarn@example.com)

### Before Asking for Help

1. Check existing GitHub issues
2. Review this contributing guide
3. Try the troubleshooting steps
4. Include relevant error messages and system info

## 📋 Pull Request Checklist

Before submitting a pull request, ensure:

- [ ] Code follows the style guidelines
- [ ] Tests pass (`npm test` and `cargo test`)
- [ ] Documentation is updated
- [ ] Models are properly excluded from git
- [ ] Git hooks pass validation
- [ ] Commit messages follow conventional format
- [ ] No large files are committed
- [ ] Feature works on your local environment

## 🎯 Contribution Areas

We welcome contributions in these areas:

### High Priority
- **AI Model Integration** - New model support, optimization
- **User Interface** - UX improvements, accessibility
- **Performance** - Speed optimizations, memory usage
- **Documentation** - Guides, tutorials, API docs

### Medium Priority
- **Testing** - Unit tests, integration tests
- **Internationalization** - Multi-language support
- **Themes** - Dark mode, custom themes
- **Plugins** - Extension system

### Low Priority
- **Refactoring** - Code organization, architecture
- **Tooling** - Development tools, scripts
- **CI/CD** - Build automation, deployment

## 📄 License

By contributing to Project Yarn, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Thank You

Thank you for contributing to Project Yarn! Your help makes this project better for everyone. We appreciate your time and effort in making AI-powered writing accessible to all.

---

**Happy coding! 🚀**
