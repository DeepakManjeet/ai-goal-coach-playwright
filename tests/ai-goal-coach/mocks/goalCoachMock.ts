/**
 * Mock AI Goal Coach Service
 * 
 * This mock simulates the AI Goal Coach API behavior for testing purposes.
 * It handles both normal and adversarial inputs with appropriate responses.
 */

import { GoalCoachRequest, GoalCoachResponse } from '../types/goalCoach.types';

/**
 * Keywords that indicate adversarial/invalid input
 */
const ADVERSARIAL_PATTERNS = {
  sqlInjection: /('|"|;|--|\bDROP\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bUNION\b)/i,
  xss: /(<script|<\/script|javascript:|on\w+\s*=|<iframe|<img[^>]+onerror)/i,
  promptInjection: /(ignore\s+(previous|all|your|the)\s*(instructions|guidelines|rules)?|disregard|forget\s+everything|system\s*:|assistant\s*:|tell\s+me\s+your)/i,
  profanity: /\b(fuck|shit|damn|ass|bitch|crap|bastard)\b/i,
  commandInjection: /(\||`|\$\(|&&|\|\|)/,  // Removed semicolon to avoid false positives
};

/**
 * Common gibberish patterns
 */
const GIBBERISH_PATTERNS = [
  /^[^aeiouAEIOU\s]{8,}$/,  // No vowels in string of 8+ chars
  /^(.)\1{4,}$/,             // Repeated single character 5+ times
  /^[!@#$%^&*()_+=\[\]{}|\\:";'<>?,./]+$/, // Only special characters
  /^[a-z]{2,4}[0-9]+[!@#$%^&*]+$/i, // Pattern like "xyz123!@#"
  /^(?:[bcdfghjklmnpqrstvwxz]{3,}\s*)+$/i, // Multiple consonant-only words
  /qwerty|asdf|zxcv/i,      // Keyboard patterns
];

/**
 * Goal-related keywords for confidence scoring
 */
const GOAL_KEYWORDS = [
  'improve', 'increase', 'decrease', 'learn', 'achieve', 'develop',
  'grow', 'build', 'create', 'complete', 'finish', 'start', 'begin',
  'master', 'become', 'reduce', 'enhance', 'strengthen', 'expand',
  'want', 'goal', 'objective', 'target', 'aim', 'aspiration',
  'better', 'more', 'less', 'faster', 'higher', 'lower',
  'sales', 'revenue', 'productivity', 'efficiency', 'skills',
  'health', 'fitness', 'career', 'promotion', 'salary', 'team',
];

/**
 * Templates for generating SMART goals based on input category
 */
const GOAL_TEMPLATES: Record<string, { goal: string; keyResults: string[] }> = {
  sales: {
    goal: 'Increase quarterly sales revenue by 25% through targeted client acquisition and improved conversion rates within the next 6 months',
    keyResults: [
      'Generate 100 new qualified leads per month through outbound campaigns',
      'Achieve a 20% conversion rate on sales presentations',
      'Increase average deal size by 15% through upselling strategies',
      'Maintain customer retention rate above 90%',
    ],
  },
  leadership: {
    goal: 'Develop and demonstrate strong leadership capabilities by successfully leading a cross-functional team project within the next quarter',
    keyResults: [
      'Complete a leadership training program with certification',
      'Lead at least 2 team projects with positive feedback from stakeholders',
      'Mentor 2 junior team members with documented progress',
      'Achieve team satisfaction score above 8/10 in quarterly survey',
    ],
  },
  productivity: {
    goal: 'Enhance personal productivity by 30% through improved time management and workflow optimization within 3 months',
    keyResults: [
      'Implement a time-blocking system and maintain 80% adherence',
      'Reduce meeting time by 25% while maintaining output quality',
      'Complete all high-priority tasks within planned timeframes',
      'Achieve inbox zero at end of each workday',
    ],
  },
  learning: {
    goal: 'Acquire proficiency in a new skill area by completing structured learning and practical application within 4 months',
    keyResults: [
      'Complete an accredited course or certification program',
      'Apply new skills in at least 3 real work projects',
      'Document learnings and share with team through presentation',
      'Receive positive feedback from manager on skill application',
    ],
  },
  health: {
    goal: 'Improve overall health and fitness by establishing consistent exercise habits and better nutrition within 3 months',
    keyResults: [
      'Exercise at least 4 times per week for 30+ minutes',
      'Achieve target weight/fitness metrics as defined with healthcare provider',
      'Maintain consistent sleep schedule of 7-8 hours per night',
      'Track and maintain balanced nutrition for 80% of meals',
    ],
  },
  default: {
    goal: 'Achieve measurable progress on personal development goals through consistent effort and tracking within the next quarter',
    keyResults: [
      'Define specific, measurable targets for the goal area',
      'Establish weekly check-ins to track progress',
      'Complete key milestones on schedule',
      'Document and share outcomes with stakeholders',
    ],
  },
};

/**
 * Detect if input contains adversarial content
 */
function detectAdversarialInput(input: string): { isAdversarial: boolean; type?: string } {
  if (ADVERSARIAL_PATTERNS.sqlInjection.test(input)) {
    return { isAdversarial: true, type: 'sql_injection' };
  }
  if (ADVERSARIAL_PATTERNS.xss.test(input)) {
    return { isAdversarial: true, type: 'xss' };
  }
  if (ADVERSARIAL_PATTERNS.promptInjection.test(input)) {
    return { isAdversarial: true, type: 'prompt_injection' };
  }
  if (ADVERSARIAL_PATTERNS.profanity.test(input)) {
    return { isAdversarial: true, type: 'profanity' };
  }
  if (ADVERSARIAL_PATTERNS.commandInjection.test(input)) {
    return { isAdversarial: true, type: 'command_injection' };
  }
  return { isAdversarial: false };
}

/**
 * Detect if input is gibberish
 */
function isGibberish(input: string): boolean {
  const cleanInput = input.trim();
  
  // Too short to be a meaningful goal
  if (cleanInput.length < 3) return true;
  
  // Check gibberish patterns
  for (const pattern of GIBBERISH_PATTERNS) {
    if (pattern.test(cleanInput)) return true;
  }
  
  // Check for very short non-meaningful input
  const words = cleanInput.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  // Single short word without goal keywords
  if (words.length === 1 && cleanInput.length < 10) {
    const hasGoalKeyword = GOAL_KEYWORDS.some(keyword => cleanInput.toLowerCase().includes(keyword));
    if (!hasGoalKeyword) return true;
  }
  
  // Check vowel ratio - natural language has vowels
  const vowelCount = (cleanInput.match(/[aeiouAEIOU]/g) || []).length;
  const letterCount = (cleanInput.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 5 && vowelCount / letterCount < 0.15) return true;
  
  // Check if input has no recognizable words (simple heuristic)
  const hasGoalKeyword = words.some(word => 
    GOAL_KEYWORDS.some(keyword => word.includes(keyword))
  );
  
  // If very short and no goal keywords, likely not a valid goal
  if (words.length <= 2 && !hasGoalKeyword) {
    // Check if it's just random characters
    const alphaRatio = letterCount / cleanInput.length;
    if (alphaRatio < 0.5) return true;
  }
  
  return false;
}

/**
 * Calculate confidence score based on input quality
 */
function calculateConfidenceScore(input: string): number {
  const cleanInput = input.trim().toLowerCase();
  
  // Empty or whitespace only
  if (!cleanInput) return 1;
  
  // Check for adversarial content
  const adversarial = detectAdversarialInput(input);
  if (adversarial.isAdversarial) return 2;
  
  // Check for gibberish
  if (isGibberish(input)) return 2;
  
  // Base score
  let score = 5;
  
  // Increase score for goal-related keywords
  const words = cleanInput.split(/\s+/);
  const keywordMatches = GOAL_KEYWORDS.filter(keyword => 
    cleanInput.includes(keyword)
  ).length;
  
  score += Math.min(keywordMatches, 3); // Max +3 for keywords
  
  // Bonus for reasonable length (10-200 chars is ideal)
  if (cleanInput.length >= 10 && cleanInput.length <= 200) {
    score += 1;
  }
  
  // Bonus for having multiple words (indicates thought-out goal)
  if (words.length >= 3 && words.length <= 20) {
    score += 1;
  }
  
  // Cap at 10
  return Math.min(score, 10);
}

/**
 * Detect goal category from input
 */
function detectGoalCategory(input: string): string {
  const cleanInput = input.toLowerCase();
  
  // Check productivity first (more specific patterns)
  if (/productiv|efficiency|time\s*(management|better)|organize|workflow|task/i.test(cleanInput)) {
    return 'productivity';
  }
  if (/sales|revenue|customer|client|deal|prospect|quota/i.test(cleanInput)) {
    return 'sales';
  }
  if (/lead(er|ing|ership)|manage\s*team|team\s*lead|mentor|delegate|supervise/i.test(cleanInput)) {
    return 'leadership';
  }
  if (/learn|study|course|skill|certif|train|education/i.test(cleanInput)) {
    return 'learning';
  }
  if (/health|fitness|exercise|weight|diet|sleep|wellness/i.test(cleanInput)) {
    return 'health';
  }
  
  return 'default';
}

/**
 * Generate a mock response for the AI Goal Coach
 */
export function generateMockResponse(request: GoalCoachRequest): GoalCoachResponse {
  const { goal } = request;
  const confidence = calculateConfidenceScore(goal);
  
  // For low confidence inputs, return minimal response
  if (confidence <= 3) {
    return {
      refined_goal: 'Unable to identify a clear goal from the provided input. Please provide a specific aspiration or objective you would like to achieve.',
      key_results: [
        'Clarify the specific outcome you want to achieve',
        'Define measurable success criteria',
        'Set a realistic timeframe',
      ],
      confidence_score: confidence,
    };
  }
  
  // For valid goals, generate appropriate response
  const category = detectGoalCategory(goal);
  const template = GOAL_TEMPLATES[category];
  
  // Personalize the goal slightly based on input
  let refinedGoal = template.goal;
  const keyResults = [...template.keyResults];
  
  // Add some variation based on input length and content
  if (goal.length > 50) {
    // Longer input suggests more specific goal, slightly higher confidence
    refinedGoal = refinedGoal.replace('within', 'by consistently working towards this');
  }
  
  return {
    refined_goal: refinedGoal,
    key_results: keyResults,
    confidence_score: confidence,
  };
}

/**
 * Mock API class for more realistic testing
 */
export class MockGoalCoachAPI {
  private requestCount = 0;
  private latencyMs: number;
  private errorRate: number;
  private shouldSimulateBugs: boolean;

  constructor(options: {
    latencyMs?: number;
    errorRate?: number;
    simulateBugs?: boolean;
  } = {}) {
    this.latencyMs = options.latencyMs ?? 100;
    this.errorRate = options.errorRate ?? 0;
    this.shouldSimulateBugs = options.simulateBugs ?? false;
  }

  /**
   * Simulate API call with configurable latency and error rate
   */
  async processGoal(request: GoalCoachRequest): Promise<GoalCoachResponse> {
    this.requestCount++;
    
    // Simulate network latency
    await this.delay(this.latencyMs + Math.random() * 50);
    
    // Simulate random errors based on error rate
    if (Math.random() < this.errorRate) {
      throw new Error('Service temporarily unavailable');
    }

    // Simulate bugs if enabled
    if (this.shouldSimulateBugs) {
      return this.generateBuggyResponse(request);
    }
    
    return generateMockResponse(request);
  }

  /**
   * Generate responses with intentional bugs for bug hunt testing
   */
  private generateBuggyResponse(request: GoalCoachRequest): GoalCoachResponse {
    const response = generateMockResponse(request);
    const bugType = this.requestCount % 5;
    
    switch (bugType) {
      case 0:
        // BUG 1: Null refined_goal
        return { ...response, refined_goal: null as unknown as string };
      case 1:
        // BUG 2: Empty key_results array
        return { ...response, key_results: [] };
      case 2:
        // BUG 3: Confidence score out of range
        return { ...response, confidence_score: 15 };
      case 3:
        // BUG 4: High confidence for gibberish
        if (isGibberish(request.goal)) {
          return { ...response, confidence_score: 9 };
        }
        break;
      case 4:
        // BUG 5: Key results with null values
        return { ...response, key_results: [null as unknown as string, ...response.key_results] };
    }
    
    return response;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  reset(): void {
    this.requestCount = 0;
  }
}

/**
 * Default mock instance for simple usage
 */
export const mockGoalCoachAPI = new MockGoalCoachAPI();
