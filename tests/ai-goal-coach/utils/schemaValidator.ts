/**
 * Schema validation utilities for AI Goal Coach API responses
 */

import { GoalCoachResponse, ValidationResult } from '../types/goalCoach.types';

/**
 * JSON Schema for GoalCoachResponse
 */
export const GOAL_COACH_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['refined_goal', 'key_results', 'confidence_score'],
  properties: {
    refined_goal: {
      type: 'string',
      minLength: 1,
      description: 'The improved, SMART-ified goal',
    },
    key_results: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      minItems: 3,
      maxItems: 5,
      description: '3-5 measurable subgoals',
    },
    confidence_score: {
      type: 'integer',
      minimum: 1,
      maximum: 10,
      description: 'Model confidence that the input is a goal (1-10)',
    },
  },
  additionalProperties: false,
};

/**
 * Validate a GoalCoachResponse against the schema
 */
export function validateSchema(response: unknown): ValidationResult {
  const errors: string[] = [];

  // Check if response is an object
  if (typeof response !== 'object' || response === null) {
    return {
      isValid: false,
      errors: ['Response must be a non-null object'],
    };
  }

  const resp = response as Record<string, unknown>;

  // Check required fields
  if (!('refined_goal' in resp)) {
    errors.push('Missing required field: refined_goal');
  }
  if (!('key_results' in resp)) {
    errors.push('Missing required field: key_results');
  }
  if (!('confidence_score' in resp)) {
    errors.push('Missing required field: confidence_score');
  }

  // Validate refined_goal
  if ('refined_goal' in resp) {
    if (typeof resp.refined_goal !== 'string') {
      errors.push(`refined_goal must be a string, got ${typeof resp.refined_goal}`);
    } else if (resp.refined_goal.length === 0) {
      errors.push('refined_goal must not be empty');
    }
  }

  // Validate key_results
  if ('key_results' in resp) {
    if (!Array.isArray(resp.key_results)) {
      errors.push(`key_results must be an array, got ${typeof resp.key_results}`);
    } else {
      const keyResults = resp.key_results as unknown[];
      
      if (keyResults.length < 3) {
        errors.push(`key_results must have at least 3 items, got ${keyResults.length}`);
      }
      if (keyResults.length > 5) {
        errors.push(`key_results must have at most 5 items, got ${keyResults.length}`);
      }

      keyResults.forEach((item, index) => {
        if (typeof item !== 'string') {
          errors.push(`key_results[${index}] must be a string, got ${typeof item}`);
        } else if (item.length === 0) {
          errors.push(`key_results[${index}] must not be empty`);
        }
      });

      // Check for null values in array
      if (keyResults.some(item => item === null)) {
        errors.push('key_results must not contain null values');
      }
    }
  }

  // Validate confidence_score
  if ('confidence_score' in resp) {
    const score = resp.confidence_score;
    if (typeof score !== 'number') {
      errors.push(`confidence_score must be a number, got ${typeof score}`);
    } else if (!Number.isInteger(score)) {
      errors.push(`confidence_score must be an integer, got ${score}`);
    } else if (score < 1 || score > 10) {
      errors.push(`confidence_score must be between 1 and 10, got ${score}`);
    }
  }

  // Check for unexpected fields
  const expectedFields = ['refined_goal', 'key_results', 'confidence_score'];
  const actualFields = Object.keys(resp);
  const unexpectedFields = actualFields.filter(f => !expectedFields.includes(f));
  
  if (unexpectedFields.length > 0) {
    errors.push(`Unexpected fields in response: ${unexpectedFields.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Type guard to check if response is a valid GoalCoachResponse
 */
export function isValidGoalCoachResponse(response: unknown): response is GoalCoachResponse {
  return validateSchema(response).isValid;
}

/**
 * Validate that the refined goal contains SMART elements
 */
export function validateSMARTGoal(refinedGoal: string): ValidationResult {
  const errors: string[] = [];
  const lowerGoal = refinedGoal.toLowerCase();

  // Check for Specific elements (contains action verbs)
  const actionVerbs = ['increase', 'decrease', 'improve', 'achieve', 'complete', 'develop', 'build', 'create', 'reduce', 'enhance'];
  const hasActionVerb = actionVerbs.some(verb => lowerGoal.includes(verb));
  if (!hasActionVerb) {
    errors.push('Goal may lack specificity - consider adding concrete action verbs');
  }

  // Check for Measurable elements (contains numbers or percentages)
  const measurablePattern = /\d+%?|\b(more|less|higher|lower|better|faster)\b/i;
  const isMeasurable = measurablePattern.test(refinedGoal);
  if (!isMeasurable) {
    errors.push('Goal may lack measurability - consider adding quantifiable metrics');
  }

  // Check for Time-bound elements
  const timePatterns = /\b(month|week|quarter|year|day|within|by|until|deadline|timeline)\b/i;
  const isTimeBound = timePatterns.test(refinedGoal);
  if (!isTimeBound) {
    errors.push('Goal may lack time constraints - consider adding a deadline');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate key results quality
 */
export function validateKeyResults(keyResults: string[]): ValidationResult {
  const errors: string[] = [];

  keyResults.forEach((kr, index) => {
    // Check minimum length
    if (kr.length < 10) {
      errors.push(`key_results[${index}] is too short to be meaningful`);
    }

    // Check for measurable elements
    const measurablePattern = /\d+|%|increase|decrease|achieve|complete|maintain/i;
    if (!measurablePattern.test(kr)) {
      errors.push(`key_results[${index}] may lack measurability`);
    }
  });

  // Check for duplicate key results
  const uniqueResults = new Set(keyResults.map(kr => kr.toLowerCase().trim()));
  if (uniqueResults.size !== keyResults.length) {
    errors.push('key_results contains duplicate entries');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
