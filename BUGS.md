# AI Goal Coach - Bug Report Document

This document catalogs bugs discovered (or simulated for demonstration) in the AI Goal Coach system, along with reproduction steps, expected behavior, actual behavior, and severity ratings.

---

## Bug #1: Null `refined_goal` Field in Response

### Summary
Under certain conditions, the API returns `null` for the `refined_goal` field instead of a valid string, causing schema validation failures and potential application crashes.

### Severity
**Critical** 🔴

### Priority
P1 - Immediate

### Category
Schema Validation / Data Integrity

### Environment
- API Version: 1.0.0
- Mock Service with `simulateBugs: true`

### Steps to Reproduce
1. Configure the mock API with bug simulation enabled:
   ```typescript
   const api = new MockGoalCoachAPI({ simulateBugs: true });
   ```
2. Make a request to process a goal:
   ```typescript
   const response = await api.processGoal({ goal: 'I want to improve my skills' });
   ```
3. On certain request cycles (request count % 5 === 0), observe the response.

### Expected Behavior
```json
{
  "refined_goal": "Achieve measurable progress on personal development...",
  "key_results": ["Define specific targets...", "..."],
  "confidence_score": 7
}
```

### Actual Behavior
```json
{
  "refined_goal": null,
  "key_results": ["Define specific targets...", "..."],
  "confidence_score": 7
}
```

### Impact
- Schema validation fails
- Frontend applications crash when trying to render `null.length`
- Data integrity compromised
- User experience severely degraded

### Root Cause Analysis
The bug appears when the goal refinement module fails to generate a response but doesn't handle the null case appropriately before returning.

### Test That Catches This Bug
```typescript
// tests/ai-goal-coach/schema.spec.ts
test('should fail validation when refined_goal is null', async () => {
  const invalidResponse = {
    refined_goal: null,
    key_results: ['Result 1', 'Result 2', 'Result 3'],
    confidence_score: 8,
  };
  
  const result = validateSchema(invalidResponse);
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.includes('refined_goal'))).toBe(true);
});
```

### Recommended Fix
1. Add null check before returning response
2. Return a default message if goal refinement fails
3. Add server-side schema validation before response

---

## Bug #2: Empty `key_results` Array

### Summary
The API sometimes returns an empty `key_results` array, violating the schema requirement of 3-5 key results and leaving users without actionable subgoals.

### Severity
**High** 🟠

### Priority
P2 - High

### Category
Schema Validation / Business Logic

### Environment
- API Version: 1.0.0
- Mock Service with `simulateBugs: true`

### Steps to Reproduce
1. Configure the mock API with bug simulation enabled:
   ```typescript
   const api = new MockGoalCoachAPI({ simulateBugs: true });
   ```
2. Make multiple requests to trigger the bug (request count % 5 === 1):
   ```typescript
   await api.processGoal({ goal: 'Goal 1' }); // Normal
   const response = await api.processGoal({ goal: 'Goal 2' }); // Empty key_results
   ```

### Expected Behavior
```json
{
  "refined_goal": "...",
  "key_results": [
    "Contact 50 new prospects per week",
    "Achieve 15% conversion rate on leads",
    "Increase average deal size by 10%"
  ],
  "confidence_score": 8
}
```

### Actual Behavior
```json
{
  "refined_goal": "...",
  "key_results": [],
  "confidence_score": 8
}
```

### Impact
- Schema validation fails (minimum 3 items required)
- Users receive no actionable guidance
- OKR/goal tracking systems fail to parse response
- Reduces value of the AI coach significantly

### Root Cause Analysis
The key results generation module occasionally returns early without populating the array, possibly due to a timeout or missing template for certain goal categories.

### Test That Catches This Bug
```typescript
// tests/ai-goal-coach/schema.spec.ts
test('should fail validation when key_results is empty array', async () => {
  const invalidResponse = {
    refined_goal: 'Some goal',
    key_results: [],
    confidence_score: 8,
  };
  
  const result = validateSchema(invalidResponse);
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.includes('at least 3 items'))).toBe(true);
});
```

### Recommended Fix
1. Add validation before returning response
2. Generate default key results if array is empty
3. Log warning for investigation

---

## Bug #3: `confidence_score` Out of Valid Range (1-10)

### Summary
The API returns `confidence_score` values greater than 10 or less than 1, violating the documented schema and causing issues in downstream systems that rely on this normalized score.

### Severity
**High** 🟠

### Priority
P2 - High

### Category
Schema Validation / Data Integrity

### Environment
- API Version: 1.0.0
- Mock Service with `simulateBugs: true`

### Steps to Reproduce
1. Configure the mock API with bug simulation enabled
2. Make requests until request count % 5 === 2:
   ```typescript
   const api = new MockGoalCoachAPI({ simulateBugs: true });
   await api.processGoal({ goal: 'Goal 1' });
   await api.processGoal({ goal: 'Goal 2' });
   const response = await api.processGoal({ goal: 'Goal 3' }); // Score: 15
   ```

### Expected Behavior
```json
{
  "refined_goal": "...",
  "key_results": ["..."],
  "confidence_score": 8  // Should be 1-10
}
```

### Actual Behavior
```json
{
  "refined_goal": "...",
  "key_results": ["..."],
  "confidence_score": 15  // Invalid: exceeds maximum of 10
}
```

### Impact
- Schema validation fails
- Progress bars/visualizations overflow or break
- Threshold logic fails (e.g., "reject if score < 3" doesn't work correctly)
- Inconsistent user experience

### Root Cause Analysis
The confidence calculation logic doesn't properly cap the score at 10 when multiple positive factors combine (e.g., multiple keywords + good length + proper formatting).

### Test That Catches This Bug
```typescript
// tests/ai-goal-coach/schema.spec.ts
test('should fail validation when confidence_score is above 10', async () => {
  const invalidResponse = {
    refined_goal: 'Some goal',
    key_results: ['Result 1', 'Result 2', 'Result 3'],
    confidence_score: 15,
  };
  
  const result = validateSchema(invalidResponse);
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.includes('between 1 and 10'))).toBe(true);
});
```

### Recommended Fix
1. Add `Math.min(score, 10)` and `Math.max(score, 1)` to confidence calculation
2. Add server-side validation before response
3. Add monitoring alert for out-of-range scores

---

## Bug #4: High Confidence Score for Gibberish Input (AI Hallucination)

### Summary
The AI returns high confidence scores (≥7) for clearly gibberish or nonsensical inputs, indicating a hallucination problem where the model generates plausible-looking goals from meaningless input.

### Severity
**Critical** 🔴

### Priority
P1 - Immediate

### Category
AI Safety / Guardrails

### Environment
- API Version: 1.0.0
- Mock Service with `simulateBugs: true`

### Steps to Reproduce
1. Configure the mock API with bug simulation enabled
2. Submit a gibberish input when request count % 5 === 3:
   ```typescript
   const api = new MockGoalCoachAPI({ simulateBugs: true });
   // ... make 3 requests first
   const response = await api.processGoal({ goal: 'asdfghjkl zxcvbnm' });
   console.log(response.confidence_score); // Should be ≤3, but returns 9
   ```

### Expected Behavior
```json
{
  "refined_goal": "Unable to identify a clear goal...",
  "key_results": ["Clarify the outcome...", "..."],
  "confidence_score": 2  // Low confidence for gibberish
}
```

### Actual Behavior
```json
{
  "refined_goal": "Achieve excellence in ASDFGHJKL domain...",
  "key_results": ["Implement ZXCVBNM strategies...", "..."],
  "confidence_score": 9  // Incorrectly high confidence
}
```

### Impact
- Users receive meaningless "goals" that appear legitimate
- Trust in the system erodes when nonsense is validated
- Downstream systems process invalid goals
- **Safety Risk**: Users may act on hallucinated advice

### Root Cause Analysis
The gibberish detection layer is bypassed under certain conditions, and the model generates responses based on pattern matching without semantic validation.

### Test That Catches This Bug
```typescript
// tests/ai-goal-coach/adversarial.spec.ts
test('gibberish input should return low confidence', async () => {
  const response = generateMockResponse({ goal: 'asdfghjkl qwerty zxcvbn' });
  
  expect(response.confidence_score).toBeLessThanOrEqual(3);
});

// Specific test for hallucination
test('hallucination prevention - gibberish should not generate fake goals', async () => {
  const response = generateMockResponse({ goal: 'xyzabc123!@#' });
  
  expect(response.confidence_score).toBeLessThanOrEqual(3);
  // The refined goal should acknowledge the issue, not make up a goal
  expect(response.refined_goal.length).toBeGreaterThan(0);
});
```

### Recommended Fix
1. Strengthen gibberish detection patterns
2. Add semantic validation layer
3. Implement confidence calibration testing
4. Add monitoring for high-confidence responses to unusual inputs

---

## Bug #5: Null Values in `key_results` Array

### Summary
The `key_results` array contains `null` values mixed with valid strings, causing iteration errors and display issues in frontend applications.

### Severity
**Medium** 🟡

### Priority
P3 - Medium

### Category
Schema Validation / Data Integrity

### Environment
- API Version: 1.0.0
- Mock Service with `simulateBugs: true`

### Steps to Reproduce
1. Configure the mock API with bug simulation enabled
2. Make requests until request count % 5 === 4:
   ```typescript
   const api = new MockGoalCoachAPI({ simulateBugs: true });
   // ... make 4 requests first
   const response = await api.processGoal({ goal: 'Improve sales' });
   console.log(response.key_results); // [null, "Valid result", "Another result"]
   ```

### Expected Behavior
```json
{
  "key_results": [
    "Contact 50 new prospects per week",
    "Achieve 15% conversion rate on leads",
    "Increase average deal size by 10%"
  ]
}
```

### Actual Behavior
```json
{
  "key_results": [
    null,
    "Contact 50 new prospects per week",
    "Achieve 15% conversion rate on leads",
    "Increase average deal size by 10%"
  ]
}
```

### Impact
- Schema validation fails
- `TypeError: Cannot read property 'length' of null` in frontend
- Array methods like `.map()` produce unexpected results
- Total key results count is incorrect

### Root Cause Analysis
The key results generation process doesn't filter out failed/null results before returning, possibly due to a race condition or partial failure handling.

### Test That Catches This Bug
```typescript
// tests/ai-goal-coach/schema.spec.ts
test('should fail validation when key_results contains null values', async () => {
  const invalidResponse = {
    refined_goal: 'Some goal',
    key_results: [null, 'Result 2', 'Result 3'],
    confidence_score: 8,
  };
  
  const result = validateSchema(invalidResponse);
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.includes('null'))).toBe(true);
});
```

### Recommended Fix
1. Filter null values before returning: `keyResults.filter(kr => kr !== null)`
2. Add validation in response serialization
3. Log warning when null values are generated

---

## Summary Table

| Bug ID | Title | Severity | Priority | Category | Status |
|--------|-------|----------|----------|----------|--------|
| #1 | Null `refined_goal` Field | Critical 🔴 | P1 | Schema/Data | Open |
| #2 | Empty `key_results` Array | High 🟠 | P2 | Schema/Logic | Open |
| #3 | `confidence_score` Out of Range | High 🟠 | P2 | Schema/Data | Open |
| #4 | High Confidence for Gibberish | Critical 🔴 | P1 | AI Safety | Open |
| #5 | Null Values in `key_results` | Medium 🟡 | P3 | Schema/Data | Open |

---

## Test Coverage for Bugs

All identified bugs are covered by the automated test suite:

| Bug | Test File | Test Name |
|-----|-----------|-----------|
| #1 | schema.spec.ts | `should fail validation when refined_goal is null` |
| #2 | schema.spec.ts | `should fail validation when key_results is empty array` |
| #3 | schema.spec.ts | `should fail validation when confidence_score is above 10` |
| #4 | adversarial.spec.ts | `gibberish input should return low confidence` |
| #5 | schema.spec.ts | `should fail validation when key_results contains null values` |

---

## Running Bug Detection Tests

```bash
# Run all schema validation tests
npx playwright test tests/ai-goal-coach/schema.spec.ts

# Run adversarial tests (including hallucination detection)
npx playwright test tests/ai-goal-coach/adversarial.spec.ts

# Run with buggy mock to verify detection
# (Set simulateBugs: true in test configuration)
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-17 | QA Team | Initial bug documentation |
