/**
 * Type definitions for AI Goal Coach API
 */

export interface GoalCoachRequest {
  goal: string;
}

export interface GoalCoachResponse {
  refined_goal: string;
  key_results: string[];
  confidence_score: number;
}

export interface GoalCoachErrorResponse {
  error: string;
  code: string;
  message: string;
}

export type GoalCoachApiResponse = GoalCoachResponse | GoalCoachErrorResponse;

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Test case type for parameterized testing
 */
export interface GoalTestCase {
  name: string;
  input: string;
  expectedMinConfidence?: number;
  expectedMaxConfidence?: number;
  shouldHaveKeyResults?: boolean;
  keyResultsMinCount?: number;
  keyResultsMaxCount?: number;
  description?: string;
}

/**
 * Adversarial test case type
 */
export interface AdversarialTestCase {
  name: string;
  input: string;
  attackType: 'sql_injection' | 'xss' | 'prompt_injection' | 'profanity' | 'gibberish' | 'pii' | 'command_injection';
  expectedMaxConfidence: number;
  description: string;
}

/**
 * Performance test result
 */
export interface PerformanceResult {
  requestCount: number;
  totalDuration: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  minLatency: number;
  maxLatency: number;
  errorCount: number;
  errorRate: number;
}
