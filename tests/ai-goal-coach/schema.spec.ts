/**
 * Schema Validation Tests for AI Goal Coach API
 * 
 * These tests ensure that all API responses conform to the expected JSON schema:
 * - refined_goal (String): Non-empty string
 * - key_results (Array): 3-5 non-empty strings
 * - confidence_score (Integer): 1-10
 */

import { test, expect } from '@playwright/test';
import { generateMockResponse, MockGoalCoachAPI } from './mocks/goalCoachMock';
import { validateSchema, isValidGoalCoachResponse, validateSMARTGoal, validateKeyResults } from './utils/schemaValidator';
import { GoalCoachResponse } from './types/goalCoach.types';
import { VALID_GOALS } from './data/testData';

test.describe('Schema Validation Tests', () => {
  
  test.describe('Required Fields Validation', () => {
    
    test('response should contain all required fields', async () => {
      const response = generateMockResponse({ goal: 'I want to improve my sales skills' });
      
      expect(response).toHaveProperty('refined_goal');
      expect(response).toHaveProperty('key_results');
      expect(response).toHaveProperty('confidence_score');
    });

    test('should fail validation when refined_goal is missing', async () => {
      const invalidResponse = {
        key_results: ['Result 1', 'Result 2', 'Result 3'],
        confidence_score: 8,
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: refined_goal');
    });

    test('should fail validation when key_results is missing', async () => {
      const invalidResponse = {
        refined_goal: 'Some goal',
        confidence_score: 8,
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: key_results');
    });

    test('should fail validation when confidence_score is missing', async () => {
      const invalidResponse = {
        refined_goal: 'Some goal',
        key_results: ['Result 1', 'Result 2', 'Result 3'],
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: confidence_score');
    });
  });

  test.describe('refined_goal Field Validation', () => {
    
    test('refined_goal should be a non-empty string', async () => {
      const response = generateMockResponse({ goal: 'I want to learn programming' });
      
      expect(typeof response.refined_goal).toBe('string');
      expect(response.refined_goal.length).toBeGreaterThan(0);
    });

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

    test('should fail validation when refined_goal is empty string', async () => {
      const invalidResponse = {
        refined_goal: '',
        key_results: ['Result 1', 'Result 2', 'Result 3'],
        confidence_score: 8,
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('refined_goal must not be empty'))).toBe(true);
    });

    test('should fail validation when refined_goal is not a string', async () => {
      const invalidResponse = {
        refined_goal: 12345,
        key_results: ['Result 1', 'Result 2', 'Result 3'],
        confidence_score: 8,
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('refined_goal must be a string'))).toBe(true);
    });
  });

  test.describe('key_results Field Validation', () => {
    
    test('key_results should be an array with 3-5 elements', async () => {
      const response = generateMockResponse({ goal: 'I want to improve productivity' });
      
      expect(Array.isArray(response.key_results)).toBe(true);
      expect(response.key_results.length).toBeGreaterThanOrEqual(3);
      expect(response.key_results.length).toBeLessThanOrEqual(5);
    });

    test('each key_result should be a non-empty string', async () => {
      const response = generateMockResponse({ goal: 'I want to become a better leader' });
      
      response.key_results.forEach((kr, index) => {
        expect(typeof kr).toBe('string');
        expect(kr.length).toBeGreaterThan(0);
      });
    });

    test('should fail validation when key_results has less than 3 items', async () => {
      const invalidResponse = {
        refined_goal: 'Some goal',
        key_results: ['Result 1', 'Result 2'],
        confidence_score: 8,
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('at least 3 items'))).toBe(true);
    });

    test('should fail validation when key_results has more than 5 items', async () => {
      const invalidResponse = {
        refined_goal: 'Some goal',
        key_results: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
        confidence_score: 8,
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('at most 5 items'))).toBe(true);
    });

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

    test('should fail validation when key_results contains empty strings', async () => {
      const invalidResponse = {
        refined_goal: 'Some goal',
        key_results: ['Result 1', '', 'Result 3'],
        confidence_score: 8,
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('must not be empty'))).toBe(true);
    });

    test('should fail validation when key_results is not an array', async () => {
      const invalidResponse = {
        refined_goal: 'Some goal',
        key_results: 'not an array',
        confidence_score: 8,
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('must be an array'))).toBe(true);
    });
  });

  test.describe('confidence_score Field Validation', () => {
    
    test('confidence_score should be an integer between 1 and 10', async () => {
      const response = generateMockResponse({ goal: 'I want to grow my business' });
      
      expect(Number.isInteger(response.confidence_score)).toBe(true);
      expect(response.confidence_score).toBeGreaterThanOrEqual(1);
      expect(response.confidence_score).toBeLessThanOrEqual(10);
    });

    test('should fail validation when confidence_score is below 1', async () => {
      const invalidResponse = {
        refined_goal: 'Some goal',
        key_results: ['Result 1', 'Result 2', 'Result 3'],
        confidence_score: 0,
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('between 1 and 10'))).toBe(true);
    });

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

    test('should fail validation when confidence_score is not an integer', async () => {
      const invalidResponse = {
        refined_goal: 'Some goal',
        key_results: ['Result 1', 'Result 2', 'Result 3'],
        confidence_score: 7.5,
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('must be an integer'))).toBe(true);
    });

    test('should fail validation when confidence_score is not a number', async () => {
      const invalidResponse = {
        refined_goal: 'Some goal',
        key_results: ['Result 1', 'Result 2', 'Result 3'],
        confidence_score: '8',
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('must be a number'))).toBe(true);
    });
  });

  test.describe('Additional Fields Validation', () => {
    
    test('should fail validation when response contains unexpected fields', async () => {
      const invalidResponse = {
        refined_goal: 'Some goal',
        key_results: ['Result 1', 'Result 2', 'Result 3'],
        confidence_score: 8,
        extra_field: 'unexpected',
      };
      
      const result = validateSchema(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Unexpected fields'))).toBe(true);
    });

    test('should pass validation for valid response without extra fields', async () => {
      const validResponse = {
        refined_goal: 'Increase sales by 20% this quarter',
        key_results: [
          'Contact 50 new prospects weekly',
          'Achieve 15% conversion rate',
          'Increase deal size by 10%',
        ],
        confidence_score: 9,
      };
      
      const result = validateSchema(validResponse);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  test.describe('Type Guard Validation', () => {
    
    test('isValidGoalCoachResponse should return true for valid response', async () => {
      const response = generateMockResponse({ goal: 'I want to improve my skills' });
      expect(isValidGoalCoachResponse(response)).toBe(true);
    });

    test('isValidGoalCoachResponse should return false for invalid response', async () => {
      const invalidResponse = { refined_goal: null };
      expect(isValidGoalCoachResponse(invalidResponse)).toBe(false);
    });
  });

  test.describe('SMART Goal Validation', () => {
    
    test('should validate SMART elements in refined goal', async () => {
      const smartGoal = 'Increase quarterly sales revenue by 25% within the next 6 months through targeted client acquisition';
      const result = validateSMARTGoal(smartGoal);
      
      expect(result.isValid).toBe(true);
    });

    test('should warn when goal lacks specificity', async () => {
      const vagueGoal = 'Be better at my job';
      const result = validateSMARTGoal(vagueGoal);
      
      expect(result.errors.some(e => e.includes('specificity'))).toBe(true);
    });

    test('should warn when goal lacks measurability', async () => {
      const unmeasurableGoal = 'Improve team communication through regular meetings';
      const result = validateSMARTGoal(unmeasurableGoal);
      
      // This goal has no numbers
      expect(result.errors.some(e => e.includes('measurability'))).toBe(true);
    });
  });

  test.describe('Key Results Quality Validation', () => {
    
    test('should validate measurable key results', async () => {
      const keyResults = [
        'Increase leads by 50 per month',
        'Achieve 20% conversion rate',
        'Complete 10 training sessions',
      ];
      
      const result = validateKeyResults(keyResults);
      expect(result.isValid).toBe(true);
    });

    test('should warn about short key results', async () => {
      const keyResults = ['Do more', 'Be better', 'Try hard'];
      const result = validateKeyResults(keyResults);
      
      expect(result.errors.some(e => e.includes('too short'))).toBe(true);
    });

    test('should warn about duplicate key results', async () => {
      const keyResults = [
        'Increase sales by 20%',
        'Increase Sales by 20%', // Duplicate (case-insensitive)
        'Improve customer satisfaction',
      ];
      
      const result = validateKeyResults(keyResults);
      expect(result.errors.some(e => e.includes('duplicate'))).toBe(true);
    });
  });

  test.describe('Valid Goals Schema Compliance', () => {
    
    // Parameterized tests for all valid goals
    for (const testCase of VALID_GOALS) {
      test(`Schema validation for: ${testCase.name}`, async () => {
        const response = generateMockResponse({ goal: testCase.input });
        const result = validateSchema(response);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        
        // Additional assertions based on test case expectations
        if (testCase.expectedMinConfidence) {
          expect(response.confidence_score).toBeGreaterThanOrEqual(testCase.expectedMinConfidence);
        }
        if (testCase.keyResultsMinCount) {
          expect(response.key_results.length).toBeGreaterThanOrEqual(testCase.keyResultsMinCount);
        }
        if (testCase.keyResultsMaxCount) {
          expect(response.key_results.length).toBeLessThanOrEqual(testCase.keyResultsMaxCount);
        }
      });
    }
  });
});
