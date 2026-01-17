# AI Goal Coach Test Suite

This directory contains a comprehensive test suite for the AI Goal Coach system—an AI-powered service that transforms vague employee aspirations into actionable, SMART goals.

## 📁 Project Structure

```
tests/
├── ai-goal-coach/
│   ├── api/
│   │   └── realApiClient.ts     # Real Hugging Face API client (optional)
│   ├── data/
│   │   └── testData.ts          # Test data: valid goals, edge cases, adversarial inputs
│   ├── mocks/
│   │   └── goalCoachMock.ts     # Mock API implementation
│   ├── types/
│   │   └── goalCoach.types.ts   # TypeScript type definitions
│   ├── utils/
│   │   └── schemaValidator.ts   # Schema validation utilities
│   ├── schema.spec.ts           # Schema validation tests
│   ├── adversarial.spec.ts      # Edge case & security tests
│   ├── functional.spec.ts       # Functional flow tests
│   ├── performance.spec.ts      # Performance/load tests
│   └── integration.spec.ts      # Real API integration tests (optional)
└── README.md                    # This file

Root:
├── TEST_STRATEGY.md             # Comprehensive test strategy document
├── BUGS.md                      # Bug documentation
└── playwright.config.ts         # Playwright configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers (if needed)
npx playwright install
```

### Running Tests

```bash
# Run all AI Goal Coach tests
npx playwright test tests/ai-goal-coach/

# Run specific test files
npx playwright test tests/ai-goal-coach/schema.spec.ts
npx playwright test tests/ai-goal-coach/adversarial.spec.ts
npx playwright test tests/ai-goal-coach/functional.spec.ts
npx playwright test tests/ai-goal-coach/performance.spec.ts

# Run with UI mode (interactive)
npx playwright test tests/ai-goal-coach/ --ui

# Run headed (see browser)
npx playwright test tests/ai-goal-coach/ --headed

# Run specific test by name
npx playwright test -g "SQL injection"

# Generate HTML report
npx playwright test tests/ai-goal-coach/ --reporter=html
npx playwright show-report
```

## 📋 Test Categories

### 1. Schema Validation Tests (`schema.spec.ts`)
Ensures all API responses conform to the expected JSON schema:
- ✅ Required fields validation (`refined_goal`, `key_results`, `confidence_score`)
- ✅ Field type validation (string, array, integer)
- ✅ Array bounds validation (3-5 key results)
- ✅ Confidence score range (1-10)
- ✅ No null values
- ✅ No unexpected fields

### 2. Edge Case & Adversarial Tests (`adversarial.spec.ts`)
Tests system resilience against:
- **Edge Cases**: Empty input, whitespace, long strings, unicode, emojis
- **SQL Injection**: DROP TABLE, UNION SELECT, OR 1=1
- **XSS**: Script tags, event handlers, javascript: protocol
- **Prompt Injection**: "Ignore instructions", system prompt leaks
- **Profanity**: Explicit content filtering
- **Gibberish**: Random characters, keyboard mashing
- **Command Injection**: Pipe, semicolon, backtick attacks
- **PII Handling**: SSN, credit card, credential detection

### 3. Functional Flow Tests (`functional.spec.ts`)
Validates core business logic:
- ✅ Valid goal processing for different categories
- ✅ SMART goal quality (Specific, Measurable, Achievable, Relevant, Time-bound)
- ✅ Confidence score accuracy
- ✅ Key results generation quality
- ✅ Regression testing with golden dataset

### 4. Performance Tests (`performance.spec.ts`)
Measures system performance:
- Single request latency
- Concurrent request handling (10, 50, 100 parallel)
- Throughput measurements
- Latency distribution (P50, P95, P99)
- Error rate under load

### 5. Integration Tests (`integration.spec.ts`) - Optional
Tests against real AI API (Hugging Face Inference API):
- Schema compliance with real responses
- Functional tests with actual AI responses
- Guardrail tests (gibberish, injection handling)
- Performance measurement

**Note:** Integration tests are skipped by default. Enable with environment variables.

## 🧪 Mock API

The test suite includes a configurable mock API (`goalCoachMock.ts`) that simulates the AI Goal Coach behavior:

```typescript
import { MockGoalCoachAPI, generateMockResponse } from './mocks/goalCoachMock';

// Simple usage
const response = generateMockResponse({ goal: 'I want to improve my sales' });

// Configurable mock
const api = new MockGoalCoachAPI({
  latencyMs: 100,    // Simulated network latency
  errorRate: 0.1,    // 10% error rate
  simulateBugs: true // Enable bug simulation for testing
});

const result = await api.processGoal({ goal: 'My goal' });
```

## 📊 Test Data

Test data is organized in `data/testData.ts`:

- `VALID_GOALS`: Array of valid goal test cases with expectations
- `EDGE_CASE_INPUTS`: Boundary condition inputs
- `ADVERSARIAL_INPUTS`: Security/attack vector inputs
- `GOLDEN_DATASET`: Regression testing baseline
- `PERFORMANCE_TEST_CONFIG`: Performance thresholds

## 🔧 Configuration

### Running Against Real API

The test suite includes a real API client (`api/realApiClient.ts`) for testing against Hugging Face:

```bash
# Enable real API testing
$env:USE_REAL_API = "true"
$env:HF_TOKEN = "your_huggingface_token"

# Run integration tests only
npx playwright test tests/ai-goal-coach/integration.spec.ts

# Run all tests (mock tests + integration tests)
npx playwright test tests/ai-goal-coach/
```

Or in bash:
```bash
USE_REAL_API=true HF_TOKEN=your_token npx playwright test tests/ai-goal-coach/integration.spec.ts
```

### Example Usage in Code

```typescript
import { RealGoalCoachAPI, isRealApiEnabled } from './api/realApiClient';

// Check if real API is configured
if (isRealApiEnabled()) {
  const api = new RealGoalCoachAPI();
  const response = await api.processGoal({ goal: 'My goal' });
}
```

### Environment Variables

```bash
# For real API testing
export HF_TOKEN=your_huggingface_token
export USE_REAL_API=true

# Test configuration
export TEST_TIMEOUT=30000
export PARALLEL_WORKERS=4
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: AI Goal Coach Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test tests/ai-goal-coach/
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🐛 Bug Simulation

The mock can simulate known bugs for testing bug detection:

```typescript
const buggyApi = new MockGoalCoachAPI({ simulateBugs: true });

// This will occasionally return:
// - null refined_goal
// - empty key_results array
// - confidence_score > 10
// - high confidence for gibberish
// - null values in key_results
```

See [BUGS.md](../BUGS.md) for documented bugs and how tests catch them.

## 📚 Related Documentation

- [TEST_STRATEGY.md](../TEST_STRATEGY.md) - Comprehensive test strategy
- [BUGS.md](../BUGS.md) - Bug documentation with reproduction steps
- [Playwright Documentation](https://playwright.dev/docs/intro)

## 🛠️ Extending the Test Suite

### Adding New Test Cases

1. Add test data to `data/testData.ts`
2. Create test in appropriate spec file
3. Update schema validator if needed

### Adding New Test Categories

1. Create new `.spec.ts` file
2. Import shared utilities and test data
3. Follow existing patterns for consistency

## 📝 Test Naming Conventions

```typescript
test.describe('Category Name', () => {
  test.describe('Sub-category', () => {
    test('should [expected behavior] when [condition]', async () => {
      // Test implementation
    });
  });
});
```

## ✅ Quality Gates

The test suite enforces these quality gates:

| Metric | Threshold |
|--------|-----------|
| Schema Tests | 100% pass |
| Functional Tests | 100% pass |
| Adversarial Tests | 100% pass |
| Performance P50 | < 2000ms |
| Performance P99 | < 5000ms |
| Error Rate | < 5% |

## 📞 Support

For questions or issues with the test suite, please:
1. Check existing documentation
2. Review test output and error messages
3. Open an issue with reproduction steps

---

**Last Updated**: January 17, 2026
