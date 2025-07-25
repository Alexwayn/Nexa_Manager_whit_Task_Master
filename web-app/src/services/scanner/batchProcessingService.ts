// Batch processing service for multiple documents
import type { OCRResult, ProcessedDocument, OCROptions } from '@/types/scanner';
import { AIOCRService } from './ocrService';
import ImageOptimizationService from './imageOptimizationService';
import ResultCacheService from './resultCacheService';
import Logger from '@/utils/Logger';
import { captureError, addBreadcrumb } from '@/lib/sentry';

export interface BatchJob {
  id: string;
  files: File[];
  options: BatchProcessingOptions;
  status: BatchJobStatus;
  progress: BatchProgress;
  results: BatchResult[];
  errors: BatchError[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface BatchProcessingOptions {
  ocrOptions?: OCROptions;
  optimizeImages?: boolean;
  enableCaching?: boolean;
  maxConcurrency?: number;
  retryFailures?: boolean;
  maxRetries?: number;
  onProgress?: (progress: BatchProgress) => void;
  onFileComplete?: (result: BatchResult) => void;
  onError?: (error: BatchError) => void;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  percentage: number;
  estimatedTimeRemaining?: number;
  averageProcessingTime?: number;
}

export interface BatchResult {
  fileIndex: number;
  fileName: string;
  fileSize: number;
  success: boolean;
  ocrResult?: OCRResult;
  processedDocument?: ProcessedDocument;
  processingTime: number;
  optimizationSavings?: number;
  cacheHit?: boolean;
  error?: string;
}

export interface BatchError {
  fileIndex: number;
  fileName: string;
  error: string;
  retryCount: number;
  timestamp: number;
}

export enum BatchJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export class BatchProcessingService {
  private static instance: BatchProcessingService;
  private ocrService: AIOCRService;
  private optimizationService: ImageOptimizationService;
  private cacheService: ResultCacheService;
  private activeJobs: Map<string, BatchJob> = new Map();
  private jobQueue: string[] = [];
  private isProcessing = false;

  private constructor() {
    this.ocrService = new AIOCRService();
    this.optimizationService = ImageOptimizationService.getInstance();
    this.cacheService = ResultCacheService.getInstance();
  }

  static getInstance(): BatchProcessingService {
    if (!BatchProcessingService.instance) {
      BatchProcessingService.instance = new BatchProcessingService();
    }
    return BatchProcessingService.instance;
  }

  /**
   * Create a new batch processing job
   */
  createBatchJob(
    files: File[],
    options: BatchProcessingOptions = {}
  ): string {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultOptions: BatchProcessingOptions = {
      optimizeImages: true,
      enableCaching: true,
      maxConcurrency: 3,
      retryFailures: true,
      maxRetries: 2,
      ...options
    };

    const job: BatchJob = {
      id: jobId,
      files,
      options: defaultOptions,
      status: BatchJobStatus.PENDING,
      progress: {
        total: files.length,
        completed: 0,
        failed: 0,
        inProgress: 0,
        percentage: 0
      },
      results: [],
      errors: [],
      createdAt: Date.now()
    };

    this.activeJobs.set(jobId, job);
    this.jobQueue.push(jobId);

    Logger.info('Batch job created', {
      jobId,
      fileCount: files.length,
      options: defaultOptions
    });

    addBreadcrumb(
      'Batch job created',
      'info',
      { jobId, fileCount: files.length },
      'info'
    );

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return jobId;
  }

  /**
   * Get batch job status
   */
  getJobStatus(jobId: string): BatchJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Cancel a batch job
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    if (job.status === BatchJobStatus.RUNNING) {
      job.status = BatchJobStatus.CANCELLED;
      Logger.info('Batch job cancelled', { jobId });
      return true;
    }

    // Remove from queue if pending
    const queueIndex = this.jobQueue.indexOf(jobId);
    if (queueIndex > -1) {
      this.jobQueue.splice(queueIndex, 1);
      job.status = BatchJobStatus.CANCELLED;
      Logger.info('Batch job removed from queue', { jobId });
      return true;
    }

    return false;
  }

  /**
   * Pause a batch job
   */
  pauseJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job || job.status !== BatchJobStatus.RUNNING) return false;

    job.status = BatchJobStatus.PAUSED;
    Logger.info('Batch job paused', { jobId });
    return true;
  }

  /**
   * Resume a paused batch job
   */
  resumeJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job || job.status !== BatchJobStatus.PAUSED) return false;

    job.status = BatchJobStatus.RUNNING;
    Logger.info('Batch job resumed', { jobId });
    
    // Continue processing
    this.processJob(job);
    return true;
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Clear completed jobs
   */
  clearCompletedJobs(): number {
    let cleared = 0;
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.status === BatchJobStatus.COMPLETED || job.status === BatchJobStatus.FAILED) {
        this.activeJobs.delete(jobId);
        cleared++;
      }
    }
    
    Logger.info('Completed jobs cleared', { count: cleared });
    return cleared;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.jobQueue.length === 0) return;

    this.isProcessing = true;

    while (this.jobQueue.length > 0) {
      const jobId = this.jobQueue.shift()!;
      const job = this.activeJobs.get(jobId);

      if (!job || job.status === BatchJobStatus.CANCELLED) {
        continue;
      }

      try {
        await this.processJob(job);
      } catch (error) {
        Logger.error('Batch job processing failed', error);
        job.status = BatchJobStatus.FAILED;
      }
    }

    this.isProcessing = false;
  }

  private async processJob(job: BatchJob): Promise<void> {
    job.status = BatchJobStatus.RUNNING;
    job.startedAt = Date.now();

    Logger.info('Starting batch job processing', {
      jobId: job.id,
      fileCount: job.files.length
    });

    const concurrency = job.options.maxConcurrency || 3;
    const processingPromises: Promise<void>[] = [];
    let fileIndex = 0;

    // Process files with controlled concurrency
    while (fileIndex < job.files.length && job.status === BatchJobStatus.RUNNING) {
      // Start up to maxConcurrency files
      while (processingPromises.length < concurrency && fileIndex < job.files.length) {
        if (job.status !== BatchJobStatus.RUNNING) break;

        const currentIndex = fileIndex++;
        const file = job.files[currentIndex];
        
        const promise = this.processFile(job, file, currentIndex)
          .then(() => {
            // Remove completed promise
            const index = processingPromises.indexOf(promise);
            if (index > -1) {
              processingPromises.splice(index, 1);
            }
          });

        processingPromises.push(promise);
      }

      // Wait for at least one to complete before starting more
      if (processingPromises.length > 0) {
        await Promise.race(processingPromises);
      }
    }

    // Wait for all remaining files to complete
    await Promise.all(processingPromises);

    // Update final status
    job.completedAt = Date.now();
    if (job.status === BatchJobStatus.RUNNING) {
      job.status = job.progress.failed > 0 ? BatchJobStatus.COMPLETED : BatchJobStatus.COMPLETED;
    }

    Logger.info('Batch job completed', {
      jobId: job.id,
      completed: job.progress.completed,
      failed: job.progress.failed,
      totalTime: job.completedAt - (job.startedAt || job.createdAt)
    });
  }

  private async processFile(job: BatchJob, file: File, fileIndex: number): Promise<void> {
    const startTime = Date.now();
    let retryCount = 0;
    const maxRetries = job.options.maxRetries || 2;

    // Update progress
    job.progress.inProgress++;
    this.updateProgress(job);

    while (retryCount <= maxRetries) {
      try {
        // Check if job was cancelled or paused
        if (job.status !== BatchJobStatus.RUNNING) {
          job.progress.inProgress--;
          return;
        }

        const result = await this.processSingleFile(job, file, fileIndex);
        
        // Success
        job.results.push(result);
        job.progress.completed++;
        job.progress.inProgress--;
        
        this.updateProgress(job);
        
        if (job.options.onFileComplete) {
          job.options.onFileComplete(result);
        }

        Logger.debug('File processed successfully', {
          jobId: job.id,
          fileName: file.name,
          processingTime: result.processingTime
        });

        return;

      } catch (error) {
        retryCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        Logger.warn('File processing failed', {
          jobId: job.id,
          fileName: file.name,
          attempt: retryCount,
          error: errorMessage
        });

        if (retryCount > maxRetries || !job.options.retryFailures) {
          // Final failure
          const batchError: BatchError = {
            fileIndex,
            fileName: file.name,
            error: errorMessage,
            retryCount: retryCount - 1,
            timestamp: Date.now()
          };

          job.errors.push(batchError);
          job.progress.failed++;
          job.progress.inProgress--;
          
          this.updateProgress(job);
          
          if (job.options.onError) {
            job.options.onError(batchError);
          }

          // Add failed result
          job.results.push({
            fileIndex,
            fileName: file.name,
            fileSize: file.size,
            success: false,
            processingTime: Date.now() - startTime,
            error: errorMessage
          });

          return;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }

  private async processSingleFile(job: BatchJob, file: File, fileIndex: number): Promise<BatchResult> {
    const startTime = Date.now();
    let optimizationSavings = 0;
    let cacheHit = false;

    // Convert file to blob
    const imageBlob = new Blob([file], { type: file.type });

    // Check cache first
    let processedBlob = imageBlob;
    if (job.options.enableCaching) {
      const cacheKey = this.cacheService.generateOCRKey(imageBlob, job.options.ocrOptions);
      const cachedResult = await this.cacheService.getCachedOCRResult(cacheKey);
      
      if (cachedResult) {
        cacheHit = true;
        return {
          fileIndex,
          fileName: file.name,
          fileSize: file.size,
          success: true,
          ocrResult: cachedResult,
          processingTime: Date.now() - startTime,
          cacheHit: true
        };
      }
    }

    // Optimize image if enabled
    if (job.options.optimizeImages) {
      try {
        const optimization = await this.optimizationService.optimizeForOCR(imageBlob);
        processedBlob = optimization.optimizedImage;
        optimizationSavings = optimization.originalSize - optimization.optimizedSize;
        
        Logger.debug('Image optimized for batch processing', {
          fileName: file.name,
          originalSize: optimization.originalSize,
          optimizedSize: optimization.optimizedSize,
          savings: optimizationSavings
        });
      } catch (error) {
        Logger.warn('Image optimization failed, using original', {
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Perform OCR
    const ocrResult = await this.ocrService.extractText(processedBlob, job.options.ocrOptions);

    // Cache result if enabled
    if (job.options.enableCaching && !cacheHit) {
      const cacheKey = this.cacheService.generateOCRKey(imageBlob, job.options.ocrOptions);
      await this.cacheService.cacheOCRResult(cacheKey, ocrResult);
    }

    const processingTime = Date.now() - startTime;

    return {
      fileIndex,
      fileName: file.name,
      fileSize: file.size,
      success: true,
      ocrResult,
      processingTime,
      optimizationSavings: optimizationSavings > 0 ? optimizationSavings : undefined,
      cacheHit
    };
  }

  private updateProgress(job: BatchJob): void {
    const progress = job.progress;
    progress.percentage = Math.round((progress.completed + progress.failed) / progress.total * 100);
    
    // Calculate estimated time remaining
    if (progress.completed > 0 && job.startedAt) {
      const elapsed = Date.now() - job.startedAt;
      progress.averageProcessingTime = elapsed / progress.completed;
      const remaining = progress.total - progress.completed - progress.failed;
      progress.estimatedTimeRemaining = remaining * progress.averageProcessingTime;
    }

    if (job.options.onProgress) {
      job.options.onProgress(progress);
    }
  }

  /**
   * Get batch processing statistics
   */
  getBatchStats(): {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalFilesProcessed: number;
    averageProcessingTime: number;
    cacheHitRate: number;
  } {
    const jobs = Array.from(this.activeJobs.values());
    const completedJobs = jobs.filter(j => j.status === BatchJobStatus.COMPLETED);
    const failedJobs = jobs.filter(j => j.status === BatchJobStatus.FAILED);
    const activeJobs = jobs.filter(j => j.status === BatchJobStatus.RUNNING || j.status === BatchJobStatus.PENDING);

    const totalFilesProcessed = jobs.reduce((sum, job) => sum + job.progress.completed, 0);
    const totalProcessingTime = jobs.reduce((sum, job) => {
      return sum + job.results.reduce((resultSum, result) => resultSum + result.processingTime, 0);
    }, 0);

    const cacheHits = jobs.reduce((sum, job) => {
      return sum + job.results.filter(result => result.cacheHit).length;
    }, 0);

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      totalFilesProcessed,
      averageProcessingTime: totalFilesProcessed > 0 ? totalProcessingTime / totalFilesProcessed : 0,
      cacheHitRate: totalFilesProcessed > 0 ? cacheHits / totalFilesProcessed : 0
    };
  }

  /**
   * Export batch results
   */
  exportBatchResults(jobId: string): any {
    const job = this.activeJobs.get(jobId);
    if (!job) return null;

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      results: job.results,
      errors: job.errors,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      totalProcessingTime: job.completedAt && job.startedAt ? job.completedAt - job.startedAt : undefined
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Cancel all active jobs
    for (const job of this.activeJobs.values()) {
      if (job.status === BatchJobStatus.RUNNING) {
        job.status = BatchJobStatus.CANCELLED;
      }
    }

    this.activeJobs.clear();
    this.jobQueue = [];
    this.isProcessing = false;
  }
}

export default BatchProcessingService;