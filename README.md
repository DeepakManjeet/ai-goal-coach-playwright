# AI Goal Coach - Playwright Test Suite

A comprehensive test automation project for an AI-powered Goal Coach system using Playwright with TypeScript.

## 🎯 Project Overview

This project tests an **AI Goal Coach API** that transforms vague employee goals into actionable SMART goals. It includes:

- **192 automated tests** covering schema, functional, adversarial, and performance scenarios
- **Mock API** for fast, reliable testing
- **Real API integration** with Hugging Face
- **CI/CD ready** for GitHub Actions and Jenkins

## 📁 Project Structure

```
├── tests/
│   └── ai-goal-coach/       # Main test suite
│       ├── api/             # Real API client
│       ├── data/            # Test data
│       ├── mocks/           # Mock API implementation
│       ├── types/           # TypeScript definitions
│       ├── utils/           # Schema validator
│       ├── schema.spec.ts   # Schema validation tests
│       ├── adversarial.spec.ts  # Security/edge case tests
│       ├── functional.spec.ts   # Functional tests
│       ├── performance.spec.ts  # Performance tests
│       └── integration.spec.ts  # Real API tests
├── TEST_STRATEGY.md         # Comprehensive test strategy
├── BUGS.md                  # Bug documentation (5 bugs)
├── Jenkinsfile              # Jenkins pipeline config
├── .github/workflows/       # GitHub Actions
└── playwright.config.ts     # Playwright configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Running Tests

```bash
# Run all AI Goal Coach tests (192 tests)
npx playwright test tests/ai-goal-coach/

# Run specific test categories
npx playwright test tests/ai-goal-coach/schema.spec.ts
npx playwright test tests/ai-goal-coach/adversarial.spec.ts
npx playwright test tests/ai-goal-coach/functional.spec.ts
npx playwright test tests/ai-goal-coach/performance.spec.ts

# Run with UI mode (interactive)
npx playwright test tests/ai-goal-coach/ --ui

# View HTML report
npx playwright show-report
```

### Running with Real Hugging Face API

```powershell
# PowerShell
$env:HF_TOKEN = "your_huggingface_token"
$env:USE_REAL_API = "true"
npx playwright test tests/ai-goal-coach/integration.spec.ts
```

```bash
# Bash
HF_TOKEN=your_token USE_REAL_API=true npx playwright test tests/ai-goal-coach/integration.spec.ts
```

## 🔧 CI/CD Integration

### GitHub Actions (Automatic)
Tests run automatically on push/PR to `main` or `master` branches. See `.github/workflows/playwright.yml`.

### Jenkins Setup

1. **Install Jenkins plugins:**
   - NodeJS Plugin
   - HTML Publisher Plugin
   - JUnit Plugin

2. **Configure NodeJS in Jenkins:**
   - Go to: Manage Jenkins → Tools → NodeJS Installations
   - Add installation named `NodeJS` with version 20.x

3. **Create Pipeline Job:**
   - New Item → Pipeline
   - Select "Pipeline script from SCM"
   - Set SCM: Git, Repository URL: your GitHub URL
   - Script Path: `Jenkinsfile`

4. **Run the pipeline!**

## 📊 Test Categories

| Category | Tests | Description |
|----------|-------|-------------|
| Schema | 45+ | JSON schema validation |
| Adversarial | 30+ | SQL injection, XSS, prompt injection |
| Functional | 40+ | SMART goal generation, confidence scoring |
| Performance | 20+ | Latency, throughput, load testing |
| Integration | 8 | Real Hugging Face API |

## 📚 Documentation

- [TEST_STRATEGY.md](TEST_STRATEGY.md) - Comprehensive test strategy
- [BUGS.md](BUGS.md) - Bug documentation with 5 identified bugs
- [tests/ai-goal-coach/README.md](tests/ai-goal-coach/README.md) - Detailed test suite documentation

## 🛡️ Security Testing

The adversarial tests cover:
- SQL Injection (`'; DROP TABLE users; --`)
- XSS (`<script>alert('xss')</script>`)
- Prompt Injection (`Ignore all previous instructions...`)
- Command Injection (`;rm -rf /`)
- Profanity filtering
- Gibberish detection
- PII handling

Happy Testing! 🎭✨

