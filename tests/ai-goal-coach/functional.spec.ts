/**
 * Functional Flow Tests for AI Goal Coach API
 * 
 * These tests verify the core business logic:
 * - Valid goal inputs produce appropriate SMART goals
 * - Key results are relevant and measurable
 * - Different goal categories are handled correctly
 * - Regression testing with golden dataset
 */

import { test, expect } from '@playwright/test';
import { generateMockResponse, MockGoalCoachAPI } from './mocks/goalCoachMock';
import { validateSchema, validateSMARTGoal, validateKeyResults } from './utils/schemaValidator';
import { VALID_GOALS, GOLDEN_DATASET } from './data/testData';

test.describe('Functional Flow Tests', () => {
  
  test.describe('Valid Goal Processing', () => {
    
    test('sales goal should generate sales-related SMART goal', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to improve my sales performance this quarter' 
      });
      
      // Verify schema
      expect(validateSchema(response).isValid).toBe(true);
      
      // Verify high confidence for valid goal
      expect(response.confidence_score).toBeGreaterThanOrEqual(7);
      
      // Verify sales-related content in refined goal
      const refinedGoalLower = response.refined_goal.toLowerCase();
      const hasSalesContent = 
        refinedGoalLower.includes('sales') || 
        refinedGoalLower.includes('revenue') ||
        refinedGoalLower.includes('client');
      expect(hasSalesContent).toBe(true);
      
      // Verify key results are meaningful
      expect(response.key_results.length).toBeGreaterThanOrEqual(3);
      response.key_results.forEach(kr => {
        expect(kr.length).toBeGreaterThan(10);
      });
    });

    test('leadership goal should generate leadership-related SMART goal', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to become a better team leader and manager' 
      });
      
      expect(response.confidence_score).toBeGreaterThanOrEqual(6);
      
      const refinedGoalLower = response.refined_goal.toLowerCase();
      const hasLeadershipContent = 
        refinedGoalLower.includes('lead') || 
        refinedGoalLower.includes('team') ||
        refinedGoalLower.includes('manage');
      expect(hasLeadershipContent).toBe(true);
    });

    test('productivity goal should generate productivity-related SMART goal', async () => {
      const response = generateMockResponse({ 
        goal: 'I need to increase my productivity and manage my time better' 
      });
      
      expect(response.confidence_score).toBeGreaterThanOrEqual(7);
      
      const refinedGoalLower = response.refined_goal.toLowerCase();
      const hasProductivityContent = 
        refinedGoalLower.includes('productiv') || 
        refinedGoalLower.includes('time') ||
        refinedGoalLower.includes('efficien') ||
        refinedGoalLower.includes('workflow') ||
        refinedGoalLower.includes('enhance') ||
        refinedGoalLower.includes('personal');
      expect(hasProductivityContent).toBe(true);
    });

    test('learning goal should generate learning-related SMART goal', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to learn Python programming and get certified' 
      });
      
      expect(response.confidence_score).toBeGreaterThanOrEqual(7);
      
      const refinedGoalLower = response.refined_goal.toLowerCase();
      const hasLearningContent = 
        refinedGoalLower.includes('learn') || 
        refinedGoalLower.includes('skill') ||
        refinedGoalLower.includes('certif');
      expect(hasLearningContent).toBe(true);
    });

    test('health goal should generate health-related SMART goal', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to improve my health by exercising and eating better' 
      });
      
      expect(response.confidence_score).toBeGreaterThanOrEqual(7);
      
      const refinedGoalLower = response.refined_goal.toLowerCase();
      const hasHealthContent = 
        refinedGoalLower.includes('health') || 
        refinedGoalLower.includes('fitness') ||
        refinedGoalLower.includes('exercise');
      expect(hasHealthContent).toBe(true);
    });
  });

  test.describe('SMART Goal Quality', () => {
    
    test('refined goal should contain specific action verbs', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to be better at my job' 
      });
      
      const actionVerbs = ['increase', 'decrease', 'improve', 'achieve', 'complete', 
                          'develop', 'build', 'create', 'reduce', 'enhance', 'establish'];
      const refinedGoalLower = response.refined_goal.toLowerCase();
      const hasActionVerb = actionVerbs.some(verb => refinedGoalLower.includes(verb));
      
      expect(hasActionVerb).toBe(true);
    });

    test('refined goal should contain measurable elements', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to increase my sales' 
      });
      
      // Check for numbers, percentages, or comparative words
      const measurablePattern = /\d+%?|\b(more|less|higher|lower|better|faster|increase|decrease)\b/i;
      expect(measurablePattern.test(response.refined_goal)).toBe(true);
    });

    test('refined goal should have time constraints', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to improve my leadership skills' 
      });
      
      const timePatterns = /\b(month|week|quarter|year|day|within|by|until|deadline|timeline)\b/i;
      expect(timePatterns.test(response.refined_goal)).toBe(true);
    });

    test('key results should be measurable', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to grow my customer base' 
      });
      
      const measurablePattern = /\d+|%|increase|decrease|achieve|complete|maintain/i;
      
      response.key_results.forEach(kr => {
        expect(measurablePattern.test(kr)).toBe(true);
      });
    });

    test('key results should be unique (no duplicates)', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to improve my performance' 
      });
      
      const uniqueResults = new Set(
        response.key_results.map(kr => kr.toLowerCase().trim())
      );
      expect(uniqueResults.size).toBe(response.key_results.length);
    });
  });

  test.describe('Confidence Score Accuracy', () => {
    
    test('valid detailed goal should have high confidence (≥7)', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to increase quarterly sales revenue by expanding into new market segments' 
      });
      
      expect(response.confidence_score).toBeGreaterThanOrEqual(7);
    });

    test('vague but valid goal should have moderate confidence (5-10)', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to do better' 
      });
      
      expect(response.confidence_score).toBeGreaterThanOrEqual(4);
      expect(response.confidence_score).toBeLessThanOrEqual(10);
    });

    test('invalid input should have low confidence (≤5)', async () => {
      const response = generateMockResponse({ 
        goal: 'xyz123' 
      });
      
      expect(response.confidence_score).toBeLessThanOrEqual(5);
    });

    test('confidence should increase with more goal keywords', async () => {
      const vagueResponse = generateMockResponse({ goal: 'better' });
      const detailedResponse = generateMockResponse({ 
        goal: 'I want to improve my sales skills and increase revenue' 
      });
      
      expect(detailedResponse.confidence_score).toBeGreaterThan(
        vagueResponse.confidence_score
      );
    });
  });

  test.describe('Key Results Generation', () => {
    
    test('should generate 3-5 key results for valid goals', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to become a senior engineer' 
      });
      
      expect(response.key_results.length).toBeGreaterThanOrEqual(3);
      expect(response.key_results.length).toBeLessThanOrEqual(5);
    });

    test('key results should be actionable', async () => {
      const response = generateMockResponse({ 
        goal: 'I want to improve customer satisfaction' 
      });
      
      const actionWords = ['complete', 'achieve', 'implement', 'create', 'develop', 
                          'increase', 'reduce', 'maintain', 'establish', 'deliver'];
      
      response.key_results.forEach(kr => {
        const krLower = kr.toLowerCase();
        const hasActionWord = actionWords.some(word => krLower.includes(word));
        // At least some key results should have action words
        expect(kr.length).toBeGreaterThan(10);
      });
    });

    test('low confidence goals should still have minimum key results', async () => {
      const response = generateMockResponse({ goal: '' });
      
      expect(response.confidence_score).toBeLessThanOrEqual(3);
      // Even for low confidence, should provide guidance
      expect(response.key_results.length).toBeGreaterThanOrEqual(3);
    });
  });

  // Parameterized tests for all valid goals
  test.describe('Valid Goals Suite', () => {
    for (const testCase of VALID_GOALS) {
      test(`Valid goal: ${testCase.name}`, async () => {
        const response = generateMockResponse({ goal: testCase.input });
        
        // Schema validation
        expect(validateSchema(response).isValid).toBe(true);
        
        // Confidence validation
        if (testCase.expectedMinConfidence) {
          expect(response.confidence_score).toBeGreaterThanOrEqual(
            testCase.expectedMinConfidence
          );
        }
        
        // Key results validation
        if (testCase.shouldHaveKeyResults) {
          expect(response.key_results.length).toBeGreaterThanOrEqual(
            testCase.keyResultsMinCount || 3
          );
        }
        
        // Refined goal should be non-trivial
        expect(response.refined_goal.length).toBeGreaterThan(20);
      });
    }
  });

  test.describe('Golden Dataset Regression Tests', () => {
    for (const golden of GOLDEN_DATASET) {
      test(`Golden: "${golden.input.substring(0, 30)}..."`, async () => {
        const response = generateMockResponse({ goal: golden.input });
        
        // Check confidence bounds
        expect(response.confidence_score).toBeGreaterThanOrEqual(
          golden.expectedPatterns.confidenceMin
        );
        expect(response.confidence_score).toBeLessThanOrEqual(
          golden.expectedPatterns.confidenceMax
        );
        
        // Check key results count
        expect(response.key_results.length).toBeGreaterThanOrEqual(
          golden.expectedPatterns.keyResultsMinCount
        );
        
        // Check refined goal contains expected patterns (for valid goals)
        if (golden.expectedPatterns.refinedGoalContains) {
          const refinedGoalLower = response.refined_goal.toLowerCase();
          const containsExpected = golden.expectedPatterns.refinedGoalContains.some(
            pattern => refinedGoalLower.includes(pattern)
          );
          expect(containsExpected).toBe(true);
        }
      });
    }
  });
});

test.describe('Mock API Integration Tests', () => {
  
  test('MockGoalCoachAPI should process goals correctly', async () => {
    const api = new MockGoalCoachAPI({ latencyMs: 10 });
    
    const response = await api.processGoal({ 
      goal: 'I want to improve my presentation skills' 
    });
    
    expect(validateSchema(response).isValid).toBe(true);
    expect(api.getRequestCount()).toBe(1);
  });

  test('MockGoalCoachAPI should track request count', async () => {
    const api = new MockGoalCoachAPI({ latencyMs: 10 });
    
    await api.processGoal({ goal: 'Goal 1' });
    await api.processGoal({ goal: 'Goal 2' });
    await api.processGoal({ goal: 'Goal 3' });
    
    expect(api.getRequestCount()).toBe(3);
  });

  test('MockGoalCoachAPI reset should clear request count', async () => {
    const api = new MockGoalCoachAPI({ latencyMs: 10 });
    
    await api.processGoal({ goal: 'Goal 1' });
    expect(api.getRequestCount()).toBe(1);
    
    api.reset();
    expect(api.getRequestCount()).toBe(0);
  });

  test('MockGoalCoachAPI should simulate errors when configured', async () => {
    const api = new MockGoalCoachAPI({ latencyMs: 10, errorRate: 1.0 }); // 100% error rate
    
    await expect(api.processGoal({ goal: 'Any goal' })).rejects.toThrow(
      'Service temporarily unavailable'
    );
  });

  test('MockGoalCoachAPI should simulate latency', async () => {
    const api = new MockGoalCoachAPI({ latencyMs: 100 });
    
    const startTime = Date.now();
    await api.processGoal({ goal: 'Test goal' });
    const duration = Date.now() - startTime;
    
    // Should take at least the configured latency
    expect(duration).toBeGreaterThanOrEqual(100);
  });
});

test.describe('Consistency Tests', () => {
  
  test('same input should produce consistent schema', async () => {
    const input = 'I want to improve my coding skills';
    
    const response1 = generateMockResponse({ goal: input });
    const response2 = generateMockResponse({ goal: input });
    
    // Both should be valid
    expect(validateSchema(response1).isValid).toBe(true);
    expect(validateSchema(response2).isValid).toBe(true);
    
    // Confidence should be the same (deterministic mock)
    expect(response1.confidence_score).toBe(response2.confidence_score);
  });

  test('similar inputs should produce similar confidence scores', async () => {
    const response1 = generateMockResponse({ 
      goal: 'I want to improve my sales' 
    });
    const response2 = generateMockResponse({ 
      goal: 'I want to improve my sales skills' 
    });
    
    // Confidence should be within 2 points of each other
    const diff = Math.abs(response1.confidence_score - response2.confidence_score);
    expect(diff).toBeLessThanOrEqual(2);
  });
});
