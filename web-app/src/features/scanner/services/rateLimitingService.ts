// Rate limiting and quota management service
import Logger from '@/utils/Logger';
import { captureError, addBreadcrumb } from '@/lib/sentry';
import { OCRProvider } from '@/types/scanner';

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstCapacity?: number;
  refillRate?: number; // tokens per second
}

export interface QuotaConfig {
  dailyLimit: number;
  monthlyLimit: number;
  warningThreshold: number; // percentage (0-1)
  alertThreshold: number; // percentage (0-1)
}

export interface TokenBucket {
  capacity: number;
  tokens: number;
  refillRate: number;
  lastRefill: number;
}

export interface RateLimitStatus {
  allowed: boolean;
  tokensRemaining: number;
  resetTime: number;
  retryAfter?: number;
  quotaRemaining: {
    daily: number;
    monthly: number;
  };
  warningLevel: 'none' | 'warning' | 'critical';
}

export interface QuotaUsage {
  provider: OCRProvider;
  daily: {
    used: number;
    limit: number;
    resetTime: number;
  };
  monthly: {
    used: number;
    limit: number;
    resetTime: number;
  };
  lastUpdated: number;
}

export interface RequestQueue {
  id: string;
  provider: OCRProvider;
  priority: number;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeoutId?: NodeJS.Timeout;
}

export class RateLimitingService {
  private static instance: RateLimitingService;
  private tokenBuckets: Map<OCRProvider, TokenBucket> = new Map();
  private quotaUsage: Map<OCRProvider, QuotaUsage> = new Map();
  private requestQueues: Map<OCRProvider, RequestQueue[]> = new Map();
  private rateLimitConfigs: Map<OCRProvider, RateLimitConfig> = new Map();
  private quotaConfigs: Map<OCRProvider, QuotaConfig> = new Map();
  private processingQueues = false;

  private constructor() {
    this.initializeConfigs();
    this.loadQuotaUsage();
    this.startRefillInterval();
    this.startQueueProcessor();
  }

  static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService();
    }
    return RateLimitingService.instance;
  }

  private initializeConfigs(): void {
    // OpenAI rate limits
    this.rateLimitConfigs.set(OCRProvider.OpenAI, {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstCapacity: 10,
      refillRate: 1 // 1 token per second
    });

    this.quotaConfigs.set(OCRProvider.OpenAI, {
      dailyLimit: 1000,
      monthlyLimit: 25000,
      warningThreshold: 0.8,
      alertThreshold: 0.95
    });

    // Qwen rate limits
    this.rateLimitConfigs.set(OCRProvider.Qwen, {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 5000,
      burstCapacity: 5,
      refillRate: 0.5 // 0.5 tokens per second
    });

    this.quotaConfigs.set(OCRProvider.Qwen, {
      dailyLimit: 500,
      monthlyLimit: 10000,
      warningThreshold: 0.8,
      alertThreshold: 0.95
    });

    // Fallback provider (no limits)
    this.rateLimitConfigs.set(OCRProvider.Fallback, {
      requestsPerMinute: 1000,
      requestsPerHour: 10000,
      requestsPerDay: 100000,
      burstCapacity: 100,
      refillRate: 10
    });

    this.quotaConfigs.set(OCRProvider.Fallback, {
      dailyLimit: 10000,
      monthlyLimit: 100000,
      warningThreshold: 0.9,
      alertThreshold: 0.99
    });

    // Initialize token buckets
    for (const [provider, config] of this.rateLimitConfigs.entries()) {
      this.tokenBuckets.set(provider, {
        capacity: config.burstCapacity || 10,
        tokens: config.burstCapacity || 10,
        refillRate: config.refillRate || 1,
        lastRefill: Date.now()
      });

      this.requestQueues.set(provider, []);
    }
  }

  /**
   * Check if request is allowed and consume token
   */
  async checkRateLimit(provider: OCRProvider): Promise<RateLimitStatus> {
    const bucket = this.tokenBuckets.get(provider);
    const quotaUsage = this.getQuotaUsage(provider);
    
    if (!bucket) {
      throw new Error(`No rate limit configuration for provider: ${provider}`);
    }

    // Refill tokens
    this.refillTokens(provider);

    // Check quota limits first
    const quotaCheck = this.checkQuotaLimits(provider);
    if (!quotaCheck.allowed) {
      return quotaCheck;
    }

    // Check token availability
    const tokensAvailable = bucket.tokens >= 1;
    
    if (tokensAvailable) {
      // Consume token
      bucket.tokens -= 1;
      this.incrementQuotaUsage(provider);
      
      Logger.debug('Rate limit check passed', {
        provider,
        tokensRemaining: bucket.tokens,
        quotaUsage: quotaUsage.daily.used
      });

      return {
        allowed: true,
        tokensRemaining: bucket.tokens,
        resetTime: this.calculateResetTime(provider),
        quotaRemaining: {
          daily: quotaUsage.daily.limit - quotaUsage.daily.used,
          monthly: quotaUsage.monthly.limit - quotaUsage.monthly.used
        },
        warningLevel: this.getWarningLevel(provider)
      };
    } else {
      // Rate limited
      const retryAfter = this.calculateRetryAfter(provider);
      
      Logger.warn('Rate limit exceeded', {
        provider,
        tokensRemaining: bucket.tokens,
        retryAfter
      });

      addBreadcrumb(
        'Rate limit exceeded',
        'warning',
        { provider, retryAfter },
        'warning'
      );

      return {
        allowed: false,
        tokensRemaining: 0,
        resetTime: this.calculateResetTime(provider),
        retryAfter,
        quotaRemaining: {
          daily: quotaUsage.daily.limit - quotaUsage.daily.used,
          monthly: quotaUsage.monthly.limit - quotaUsage.monthly.used
        },
        warningLevel: this.getWarningLevel(provider)
      };
    }
  }

  /**
   * Queue a request for processing when rate limit allows
   */
  async queueRequest<T>(
    provider: OCRProvider,
    requestFn: () => Promise<T>,
    priority: number = 0,
    timeout: number = 30000
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const queueItem: RequestQueue = {
        id: requestId,
        provider,
        priority,
        timestamp: Date.now(),
        resolve: async (value) => {
          try {
            const result = await requestFn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        reject
      };

      // Set timeout
      if (timeout > 0) {
        queueItem.timeoutId = setTimeout(() => {
          this.removeFromQueue(provider, requestId);
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      }

      // Add to queue
      const queue = this.requestQueues.get(provider) || [];
      queue.push(queueItem);
      
      // Sort by priority (higher priority first) and timestamp
      queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });

      this.requestQueues.set(provider, queue);

      Logger.debug('Request queued', {
        requestId,
        provider,
        priority,
        queueLength: queue.length
      });

      // Start processing if not already running
      if (!this.processingQueues) {
        this.processRequestQueues();
      }
    });
  }

  /**
   * Get current quota usage for provider
   */
  getQuotaUsage(provider: OCRProvider): QuotaUsage {
    let usage = this.quotaUsage.get(provider);
    
    if (!usage) {
      const config = this.quotaConfigs.get(provider);
      if (!config) {
        throw new Error(`No quota configuration for provider: ${provider}`);
      }

      const now = Date.now();
      const dailyReset = this.getNextDailyReset();
      const monthlyReset = this.getNextMonthlyReset();

      usage = {
        provider,
        daily: {
          used: 0,
          limit: config.dailyLimit,
          resetTime: dailyReset
        },
        monthly: {
          used: 0,
          limit: config.monthlyLimit,
          resetTime: monthlyReset
        },
        lastUpdated: now
      };

      this.quotaUsage.set(provider, usage);
    }

    // Check if quotas need to be reset
    this.checkQuotaResets(provider);
    
    return usage;
  }

  /**
   * Get rate limit status for all providers
   */
  getAllRateLimitStatus(): Map<OCRProvider, RateLimitStatus> {
    const statuses = new Map<OCRProvider, RateLimitStatus>();
    
    for (const provider of this.tokenBuckets.keys()) {
      try {
        // Don't consume tokens, just check status
        const bucket = this.tokenBuckets.get(provider)!;
        this.refillTokens(provider);
        
        const quotaUsage = this.getQuotaUsage(provider);
        const quotaCheck = this.checkQuotaLimits(provider);
        
        statuses.set(provider, {
          allowed: bucket.tokens >= 1 && quotaCheck.allowed,
          tokensRemaining: bucket.tokens,
          resetTime: this.calculateResetTime(provider),
          retryAfter: bucket.tokens < 1 ? this.calculateRetryAfter(provider) : undefined,
          quotaRemaining: {
            daily: quotaUsage.daily.limit - quotaUsage.daily.used,
            monthly: quotaUsage.monthly.limit - quotaUsage.monthly.used
          },
          warningLevel: this.getWarningLevel(provider)
        });
      } catch (error) {
        Logger.error('Failed to get rate limit status', { provider, error });
      }
    }
    
    return statuses;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): Map<OCRProvider, { length: number; oldestRequest: number; averageWaitTime: number }> {
    const stats = new Map();
    
    for (const [provider, queue] of this.requestQueues.entries()) {
      const now = Date.now();
      const waitTimes = queue.map(req => now - req.timestamp);
      
      stats.set(provider, {
        length: queue.length,
        oldestRequest: queue.length > 0 ? Math.max(...waitTimes) : 0,
        averageWaitTime: waitTimes.length > 0 ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length : 0
      });
    }
    
    return stats;
  }

  /**
   * Clear queue for provider
   */
  clearQueue(provider: OCRProvider): number {
    const queue = this.requestQueues.get(provider) || [];
    const count = queue.length;
    
    // Reject all queued requests
    queue.forEach(req => {
      if (req.timeoutId) {
        clearTimeout(req.timeoutId);
      }
      req.reject(new Error('Queue cleared'));
    });
    
    this.requestQueues.set(provider, []);
    
    Logger.info('Queue cleared', { provider, clearedRequests: count });
    return count;
  }

  private refillTokens(provider: OCRProvider): void {
    const bucket = this.tokenBuckets.get(provider);
    if (!bucket) return;

    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * bucket.refillRate;
    
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  private checkQuotaLimits(provider: OCRProvider): RateLimitStatus {
    const usage = this.getQuotaUsage(provider);
    const config = this.quotaConfigs.get(provider);
    
    if (!config) {
      throw new Error(`No quota configuration for provider: ${provider}`);
    }

    // Check daily limit
    if (usage.daily.used >= usage.daily.limit) {
      return {
        allowed: false,
        tokensRemaining: 0,
        resetTime: usage.daily.resetTime,
        retryAfter: usage.daily.resetTime - Date.now(),
        quotaRemaining: {
          daily: 0,
          monthly: usage.monthly.limit - usage.monthly.used
        },
        warningLevel: 'critical'
      };
    }

    // Check monthly limit
    if (usage.monthly.used >= usage.monthly.limit) {
      return {
        allowed: false,
        tokensRemaining: 0,
        resetTime: usage.monthly.resetTime,
        retryAfter: usage.monthly.resetTime - Date.now(),
        quotaRemaining: {
          daily: usage.daily.limit - usage.daily.used,
          monthly: 0
        },
        warningLevel: 'critical'
      };
    }

    return {
      allowed: true,
      tokensRemaining: 0, // Will be set by caller
      resetTime: 0, // Will be set by caller
      quotaRemaining: {
        daily: usage.daily.limit - usage.daily.used,
        monthly: usage.monthly.limit - usage.monthly.used
      },
      warningLevel: this.getWarningLevel(provider)
    };
  }

  private incrementQuotaUsage(provider: OCRProvider): void {
    const usage = this.getQuotaUsage(provider);
    usage.daily.used++;
    usage.monthly.used++;
    usage.lastUpdated = Date.now();
    
    this.saveQuotaUsage();
    
    // Check for warnings
    const warningLevel = this.getWarningLevel(provider);
    if (warningLevel !== 'none') {
      this.sendQuotaAlert(provider, warningLevel);
    }
  }

  private getWarningLevel(provider: OCRProvider): 'none' | 'warning' | 'critical' {
    const usage = this.getQuotaUsage(provider);
    const config = this.quotaConfigs.get(provider);
    
    if (!config) return 'none';

    const dailyUsagePercent = usage.daily.used / usage.daily.limit;
    const monthlyUsagePercent = usage.monthly.used / usage.monthly.limit;
    const maxUsagePercent = Math.max(dailyUsagePercent, monthlyUsagePercent);

    if (maxUsagePercent >= config.alertThreshold) {
      return 'critical';
    } else if (maxUsagePercent >= config.warningThreshold) {
      return 'warning';
    }

    return 'none';
  }

  private sendQuotaAlert(provider: OCRProvider, level: 'warning' | 'critical'): void {
    const usage = this.getQuotaUsage(provider);
    
    Logger.warn('Quota alert', {
      provider,
      level,
      dailyUsage: usage.daily.used,
      dailyLimit: usage.daily.limit,
      monthlyUsage: usage.monthly.used,
      monthlyLimit: usage.monthly.limit
    });

    addBreadcrumb(
      'Quota alert',
      'warning',
      {
        provider,
        level,
        dailyUsagePercent: Math.round((usage.daily.used / usage.daily.limit) * 100),
        monthlyUsagePercent: Math.round((usage.monthly.used / usage.monthly.limit) * 100)
      },
      'warning'
    );

    // Could trigger UI notifications here
  }

  private calculateResetTime(provider: OCRProvider): number {
    const bucket = this.tokenBuckets.get(provider);
    if (!bucket) return 0;

    const tokensNeeded = 1 - bucket.tokens;
    const timeToRefill = tokensNeeded / bucket.refillRate * 1000; // milliseconds
    
    return Date.now() + timeToRefill;
  }

  private calculateRetryAfter(provider: OCRProvider): number {
    const bucket = this.tokenBuckets.get(provider);
    if (!bucket) return 1000;

    const timeToRefill = (1 / bucket.refillRate) * 1000; // milliseconds for 1 token
    return Math.ceil(timeToRefill);
  }

  private checkQuotaResets(provider: OCRProvider): void {
    const usage = this.quotaUsage.get(provider);
    if (!usage) return;

    const now = Date.now();
    
    // Check daily reset
    if (now >= usage.daily.resetTime) {
      usage.daily.used = 0;
      usage.daily.resetTime = this.getNextDailyReset();
      Logger.info('Daily quota reset', { provider });
    }
    
    // Check monthly reset
    if (now >= usage.monthly.resetTime) {
      usage.monthly.used = 0;
      usage.monthly.resetTime = this.getNextMonthlyReset();
      Logger.info('Monthly quota reset', { provider });
    }
  }

  private getNextDailyReset(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  private getNextMonthlyReset(): number {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth.getTime();
  }

  private async processRequestQueues(): Promise<void> {
    if (this.processingQueues) return;
    
    this.processingQueues = true;

    while (this.hasQueuedRequests()) {
      for (const [provider, queue] of this.requestQueues.entries()) {
        if (queue.length === 0) continue;

        try {
          const status = await this.checkRateLimit(provider);
          
          if (status.allowed) {
            const request = queue.shift()!;
            
            if (request.timeoutId) {
              clearTimeout(request.timeoutId);
            }
            
            Logger.debug('Processing queued request', {
              requestId: request.id,
              provider,
              waitTime: Date.now() - request.timestamp
            });

            // Process request asynchronously
            request.resolve(null);
          }
        } catch (error) {
          Logger.error('Error processing queue', { provider, error });
        }
      }

      // Small delay to prevent tight loop
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processingQueues = false;
  }

  private hasQueuedRequests(): boolean {
    for (const queue of this.requestQueues.values()) {
      if (queue.length > 0) return true;
    }
    return false;
  }

  private removeFromQueue(provider: OCRProvider, requestId: string): void {
    const queue = this.requestQueues.get(provider) || [];
    const index = queue.findIndex(req => req.id === requestId);
    
    if (index > -1) {
      const request = queue.splice(index, 1)[0];
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
    }
  }

  private startRefillInterval(): void {
    // Refill tokens every second
    setInterval(() => {
      for (const provider of this.tokenBuckets.keys()) {
        this.refillTokens(provider);
      }
    }, 1000);
  }

  private startQueueProcessor(): void {
    // Process queues every 500ms
    setInterval(() => {
      if (!this.processingQueues && this.hasQueuedRequests()) {
        this.processRequestQueues();
      }
    }, 500);
  }

  private loadQuotaUsage(): void {
    try {
      const saved = localStorage.getItem('scanner_quota_usage');
      if (saved) {
        const data = JSON.parse(saved);
        
        for (const [provider, usage] of Object.entries(data)) {
          this.quotaUsage.set(provider as OCRProvider, usage as QuotaUsage);
        }
        
        Logger.info('Quota usage loaded from storage');
      }
    } catch (error) {
      Logger.warn('Failed to load quota usage from storage', error);
    }
  }

  private saveQuotaUsage(): void {
    try {
      const data = Object.fromEntries(this.quotaUsage.entries());
      localStorage.setItem('scanner_quota_usage', JSON.stringify(data));
    } catch (error) {
      Logger.warn('Failed to save quota usage to storage', error);
    }
  }

  /**
   * Reset quota usage for provider (admin function)
   */
  resetQuotaUsage(provider: OCRProvider): void {
    const usage = this.getQuotaUsage(provider);
    usage.daily.used = 0;
    usage.monthly.used = 0;
    usage.lastUpdated = Date.now();
    
    this.saveQuotaUsage();
    Logger.info('Quota usage reset', { provider });
  }

  /**
   * Update rate limit configuration
   */
  updateRateLimitConfig(provider: OCRProvider, config: Partial<RateLimitConfig>): void {
    const currentConfig = this.rateLimitConfigs.get(provider);
    if (currentConfig) {
      const newConfig = { ...currentConfig, ...config };
      this.rateLimitConfigs.set(provider, newConfig);
      
      // Update token bucket if capacity changed
      if (config.burstCapacity || config.refillRate) {
        const bucket = this.tokenBuckets.get(provider);
        if (bucket) {
          bucket.capacity = newConfig.burstCapacity || bucket.capacity;
          bucket.refillRate = newConfig.refillRate || bucket.refillRate;
          bucket.tokens = Math.min(bucket.tokens, bucket.capacity);
        }
      }
      
      Logger.info('Rate limit configuration updated', { provider, config: newConfig });
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clear all queues
    for (const provider of this.requestQueues.keys()) {
      this.clearQueue(provider);
    }
    
    this.saveQuotaUsage();
    this.processingQueues = false;
  }
}

export default RateLimitingService;