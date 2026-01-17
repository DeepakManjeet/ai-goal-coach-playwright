/**
 * Real AI API Client for AI Goal Coach
 * 
 * This client connects to real AI APIs (Hugging Face, etc.) for integration testing.
 * Use this for end-to-end validation against actual AI models.
 * 
 * Setup:
 * 1. Get a free Hugging Face API token: https://huggingface.co/settings/tokens
 * 2. Set environment variable: export HF_TOKEN=your_token_here
 * 3. Run tests with: USE_REAL_API=true npx playwright test
 */

import { GoalCoachRequest, GoalCoachResponse } from '../types/goalCoach.types';

/**
 * Hugging Face API Configuration
 * Uses OpenAI-compatible Chat Completions API via router.huggingface.co
 */
const HF_CONFIG = {
  apiUrl: 'https://router.huggingface.co/v1/chat/completions',
  model: 'Qwen/Qwen2.5-72B-Instruct', // A well-supported model on HF Inference
  timeout: 60000,
};

/**
 * System prompt for the AI Goal Coach
 */
const SYSTEM_PROMPT = `You are an AI Goal Coach that helps employees transform vague aspirations into actionable SMART goals.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "refined_goal": "A specific, measurable, achievable, relevant, and time-bound goal statement",
  "key_results": ["3-5 measurable subgoals as an array of strings"],
  "confidence_score": <integer 1-10 indicating how confident you are this is a valid goal>
}

Rules:
1. refined_goal must be a concrete, actionable SMART goal
2. key_results must have exactly 3-5 measurable items
3. confidence_score must be 1-10 (1=not a goal, 10=clearly a goal)
4. For gibberish, nonsense, or inappropriate input, set confidence_score to 1-3
5. NEVER hallucinate a goal for invalid input - use low confidence instead
6. Output ONLY the JSON object, nothing else`;

/**
 * Real AI Goal Coach API Client
 */
export class RealGoalCoachAPI {
  private apiToken: string;
  private apiUrl: string;
  private model: string;

  constructor(options: { apiToken?: string; apiUrl?: string; model?: string } = {}) {
    this.apiToken = options.apiToken || process.env.HF_TOKEN || '';
    this.apiUrl = options.apiUrl || HF_CONFIG.apiUrl;
    this.model = options.model || HF_CONFIG.model;

    if (!this.apiToken) {
      console.warn('⚠️ No API token provided. Set HF_TOKEN environment variable or pass apiToken option.');
    }
  }

  /**
   * Check if the API client is configured
   */
  isConfigured(): boolean {
    return !!this.apiToken;
  }

  /**
   * Process a goal using the real AI API (OpenAI-compatible Chat Completions)
   */
  async processGoal(request: GoalCoachRequest): Promise<GoalCoachResponse> {
    if (!this.apiToken) {
      throw new Error('API token not configured. Set HF_TOKEN environment variable.');
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Convert this goal into a SMART goal: "${request.goal}"` }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Extract the generated text from OpenAI-compatible response
      let generatedText = '';
      if (data.choices && data.choices[0]?.message?.content) {
        generatedText = data.choices[0].message.content;
      } else {
        throw new Error('Unexpected API response format');
      }

      // Parse the JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return this.normalizeResponse(parsed);

    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  /**
   * Normalize and validate the API response
   */
  private normalizeResponse(raw: unknown): GoalCoachResponse {
    const response = raw as Record<string, unknown>;

    // Ensure refined_goal is a string
    const refined_goal = typeof response.refined_goal === 'string' 
      ? response.refined_goal 
      : 'Unable to process the goal. Please provide a clearer aspiration.';

    // Ensure key_results is an array of 3-5 strings
    let key_results: string[] = [];
    if (Array.isArray(response.key_results)) {
      key_results = response.key_results
        .filter((kr): kr is string => typeof kr === 'string')
        .slice(0, 5);
    }
    
    // Pad to minimum 3 if needed
    while (key_results.length < 3) {
      key_results.push('Define additional measurable outcomes');
    }

    // Ensure confidence_score is 1-10
    let confidence_score = 5;
    if (typeof response.confidence_score === 'number') {
      confidence_score = Math.min(10, Math.max(1, Math.round(response.confidence_score)));
    }

    return {
      refined_goal,
      key_results,
      confidence_score,
    };
  }
}

/**
 * Factory function to get the appropriate API client
 */
export function getGoalCoachAPI(): RealGoalCoachAPI | null {
  const useRealApi = process.env.USE_REAL_API === 'true';
  
  if (useRealApi) {
    const api = new RealGoalCoachAPI();
    if (api.isConfigured()) {
      return api;
    }
    console.warn('USE_REAL_API=true but no token configured. Falling back to mock.');
  }
  
  return null;
}

/**
 * Check if real API testing is enabled and configured
 * HF tokens start with "hf_" prefix
 */
export function isRealApiEnabled(): boolean {
  const token = process.env.HF_TOKEN || '';
  const isValidToken = token.startsWith('hf_') && token.length > 10;
  return process.env.USE_REAL_API === 'true' && isValidToken;
}

/**
 * Validate token and provide helpful error message
 */
export function validateApiToken(): { valid: boolean; message: string } {
  const token = process.env.HF_TOKEN || '';
  
  if (!token) {
    return { valid: false, message: 'HF_TOKEN environment variable is not set' };
  }
  
  if (!token.startsWith('hf_')) {
    return { valid: false, message: 'HF_TOKEN should start with "hf_" prefix. Get a token at https://huggingface.co/settings/tokens' };
  }
  
  if (token.length < 10) {
    return { valid: false, message: 'HF_TOKEN appears to be too short. Get a valid token at https://huggingface.co/settings/tokens' };
  }
  
  return { valid: true, message: 'Token format appears valid' };
}
