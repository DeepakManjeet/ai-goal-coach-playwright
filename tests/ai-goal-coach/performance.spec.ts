/**
 * Performance Tests for AI Goal Coach API
 * 
 * These tests measure:
 * - Response latency (P50, P95, P99)
 * - Throughput under load
 * - Concurrent request handling
 * - Error rates under stress
 */

import { test, expect } from '@playwright/test';
import { MockGoalCoachAPI } from './mocks/goalCoachMock';
import { PERFORMANCE_TEST_CONFIG, VALID_GOALS } from './data/testData';
import { PerformanceResult } from './types/goalCoach.types';

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  const index = Math.ceil((p / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

/**
 * Run multiple requests and collect timing data
 */
async function measurePerformance(
  api: MockGoalCoachAPI,
  requestCount: number,
  goals: string[]
): Promise<PerformanceResult> {
  const latencies: number[] = [];
  let errorCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < requestCount; i++) {
    const goal = goals[i % goals.length];
    const requestStart = Date.now();
    
    try {
      await api.processGoal({ goal });
      latencies.push(Date.now() - requestStart);
    } catch {
      errorCount++;
    }
  }

  const totalDuration = Date.now() - startTime;
  const sortedLatencies = [...latencies].sort((a, b) => a - b);

  return {
    requestCount,
    totalDuration,
    averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    p50Latency: percentile(sortedLatencies, 50),
    p95Latency: percentile(sortedLatencies, 95),
    p99Latency: percentile(sortedLatencies, 99),
    minLatency: Math.min(...latencies),
    maxLatency: Math.max(...latencies),
    errorCount,
    errorRate: errorCount / requestCount,
  };
}

/**
 * Run concurrent requests
 */
async function measureConcurrentPerformance(
  api: MockGoalCoachAPI,
  concurrency: number,
  goals: string[]
): Promise<PerformanceResult> {
  const latencies: number[] = [];
  let errorCount = 0;
  const startTime = Date.now();

  const requests = Array.from({ length: concurrency }, (_, i) => {
    const goal = goals[i % goals.length];
    const requestStart = Date.now();
    
    return api.processGoal({ goal })
      .then(() => {
        latencies.push(Date.now() - requestStart);
      })
      .catch(() => {
        errorCount++;
      });
  });

  await Promise.all(requests);

  const totalDuration = Date.now() - startTime;
  const sortedLatencies = [...latencies].sort((a, b) => a - b);

  return {
    requestCount: concurrency,
    totalDuration,
    averageLatency: latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0,
    p50Latency: latencies.length > 0 ? percentile(sortedLatencies, 50) : 0,
    p95Latency: latencies.length > 0 ? percentile(sortedLatencies, 95) : 0,
    p99Latency: latencies.length > 0 ? percentile(sortedLatencies, 99) : 0,
    minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
    maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
    errorCount,
    errorRate: errorCount / concurrency,
  };
}

test.describe('Performance Tests', () => {
  const goals = VALID_GOALS.map(tc => tc.input);
  
  test.describe('Single Request Latency', () => {
    
    test('single request should complete within timeout', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 100 });
      
      const startTime = Date.now();
      await api.processGoal({ goal: 'I want to improve my skills' });
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_TEST_CONFIG.singleRequestTimeout);
    });

    test('single request latency measurement', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 50 });
      const result = await measurePerformance(api, 10, goals);
      
      console.log('Single Request Performance:', {
        avgLatency: `${result.averageLatency.toFixed(2)}ms`,
        p50: `${result.p50Latency}ms`,
        p99: `${result.p99Latency}ms`,
      });
      
      expect(result.p50Latency).toBeLessThan(PERFORMANCE_TEST_CONFIG.targetP50Latency);
      expect(result.errorRate).toBe(0);
    });
  });

  test.describe('Concurrent Request Handling', () => {
    
    test('should handle 10 concurrent requests', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 50 });
      const result = await measureConcurrentPerformance(api, 10, goals);
      
      console.log('10 Concurrent Requests:', {
        totalDuration: `${result.totalDuration}ms`,
        avgLatency: `${result.averageLatency.toFixed(2)}ms`,
        errorRate: `${(result.errorRate * 100).toFixed(2)}%`,
      });
      
      expect(result.errorRate).toBeLessThan(PERFORMANCE_TEST_CONFIG.maxErrorRate);
    });

    test('should handle 50 concurrent requests', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 30 });
      const result = await measureConcurrentPerformance(api, 50, goals);
      
      console.log('50 Concurrent Requests:', {
        totalDuration: `${result.totalDuration}ms`,
        avgLatency: `${result.averageLatency.toFixed(2)}ms`,
        p99: `${result.p99Latency}ms`,
        errorRate: `${(result.errorRate * 100).toFixed(2)}%`,
      });
      
      expect(result.errorRate).toBeLessThan(PERFORMANCE_TEST_CONFIG.maxErrorRate);
    });

    test('should handle 100 concurrent requests', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 20 });
      const result = await measureConcurrentPerformance(api, 100, goals);
      
      console.log('100 Concurrent Requests:', {
        totalDuration: `${result.totalDuration}ms`,
        avgLatency: `${result.averageLatency.toFixed(2)}ms`,
        p99: `${result.p99Latency}ms`,
        errorRate: `${(result.errorRate * 100).toFixed(2)}%`,
      });
      
      expect(result.errorRate).toBeLessThan(PERFORMANCE_TEST_CONFIG.maxErrorRate);
    });
  });

  test.describe('Throughput Tests', () => {
    
    test('should maintain throughput under sequential load', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 20 });
      const result = await measurePerformance(api, 50, goals);
      
      const throughput = (result.requestCount / result.totalDuration) * 1000; // requests per second
      
      console.log('Sequential Throughput:', {
        requests: result.requestCount,
        duration: `${result.totalDuration}ms`,
        throughput: `${throughput.toFixed(2)} req/s`,
      });
      
      // Should handle at least 10 requests per second with 20ms latency
      expect(throughput).toBeGreaterThan(5);
    });

    test('should maintain throughput under concurrent load', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 20 });
      const result = await measureConcurrentPerformance(api, 50, goals);
      
      const throughput = (result.requestCount / result.totalDuration) * 1000;
      
      console.log('Concurrent Throughput:', {
        requests: result.requestCount,
        duration: `${result.totalDuration}ms`,
        throughput: `${throughput.toFixed(2)} req/s`,
      });
      
      // Concurrent should be faster than sequential
      expect(throughput).toBeGreaterThan(10);
    });
  });

  test.describe('Error Rate Under Load', () => {
    
    test('should maintain low error rate with no errors configured', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 20, errorRate: 0 });
      const result = await measureConcurrentPerformance(api, 100, goals);
      
      expect(result.errorRate).toBe(0);
      expect(result.errorCount).toBe(0);
    });

    test('should report errors correctly when configured', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 20, errorRate: 0.1 }); // 10% error rate
      const result = await measureConcurrentPerformance(api, 100, goals);
      
      console.log('Error Rate Test:', {
        errorCount: result.errorCount,
        errorRate: `${(result.errorRate * 100).toFixed(2)}%`,
      });
      
      // Error rate should be roughly around configured rate (with some variance)
      expect(result.errorRate).toBeGreaterThan(0);
      expect(result.errorRate).toBeLessThan(0.3); // Allow for variance
    });
  });

  test.describe('Latency Distribution', () => {
    
    test('P50 latency should be within target', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 50 });
      const result = await measurePerformance(api, 100, goals);
      
      console.log('P50 Latency:', `${result.p50Latency}ms`);
      expect(result.p50Latency).toBeLessThan(PERFORMANCE_TEST_CONFIG.targetP50Latency);
    });

    test('P99 latency should be within target', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 50 });
      const result = await measurePerformance(api, 100, goals);
      
      console.log('P99 Latency:', `${result.p99Latency}ms`);
      expect(result.p99Latency).toBeLessThan(PERFORMANCE_TEST_CONFIG.targetP99Latency);
    });

    test('latency variance should be reasonable', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 50 });
      const result = await measurePerformance(api, 50, goals);
      
      const variance = result.maxLatency - result.minLatency;
      
      console.log('Latency Variance:', {
        min: `${result.minLatency}ms`,
        max: `${result.maxLatency}ms`,
        variance: `${variance}ms`,
      });
      
      // Variance should be reasonable (not more than 10x the base latency)
      expect(variance).toBeLessThan(500);
    });
  });

  test.describe('Stress Tests', () => {
    
    test('should handle rapid sequential requests', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 10 });
      const startTime = Date.now();
      const requestCount = 100;
      let errorCount = 0;

      for (let i = 0; i < requestCount; i++) {
        try {
          await api.processGoal({ goal: goals[i % goals.length] });
        } catch {
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      const errorRate = errorCount / requestCount;

      console.log('Rapid Sequential Stress:', {
        requests: requestCount,
        duration: `${duration}ms`,
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
      });

      expect(errorRate).toBeLessThan(PERFORMANCE_TEST_CONFIG.maxErrorRate);
    });

    test('should recover after burst of requests', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 20 });
      
      // Burst of 50 concurrent requests
      await measureConcurrentPerformance(api, 50, goals);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should still work normally
      const response = await api.processGoal({ 
        goal: 'I want to improve my skills' 
      });
      
      expect(response.refined_goal.length).toBeGreaterThan(0);
    });
  });

  test.describe('Performance Baseline', () => {
    
    test('establish performance baseline', async () => {
      const api = new MockGoalCoachAPI({ latencyMs: 50 });
      const result = await measurePerformance(api, 100, goals);
      
      // Log baseline for future comparison
      console.log('=== Performance Baseline ===');
      console.log(`Requests: ${result.requestCount}`);
      console.log(`Total Duration: ${result.totalDuration}ms`);
      console.log(`Average Latency: ${result.averageLatency.toFixed(2)}ms`);
      console.log(`P50 Latency: ${result.p50Latency}ms`);
      console.log(`P95 Latency: ${result.p95Latency}ms`);
      console.log(`P99 Latency: ${result.p99Latency}ms`);
      console.log(`Min Latency: ${result.minLatency}ms`);
      console.log(`Max Latency: ${result.maxLatency}ms`);
      console.log(`Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
      console.log('===========================');
      
      // Store baseline assertions
      expect(result.averageLatency).toBeLessThan(200);
      expect(result.p99Latency).toBeLessThan(500);
      expect(result.errorRate).toBe(0);
    });
  });
});
