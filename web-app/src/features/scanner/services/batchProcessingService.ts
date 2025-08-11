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
  onComplete?: (job: BatchJob) => void;
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
    const jobId = this.jobQueue.shift()!;
    const job = this.activeJobs.get(jobId);

    if (!job || job.status === BatchJobStatus.CANCELLED) {
      this.isProcessing = false;
      // Schedule next queue processing using setTimeout so Jest fake timers can advance it
      setTimeout(() => this.processQueue(), 0);
      return;
    }

    try {
      await this.processJob(job);
    } finally {
      this.isProcessing = false;
      if (this.jobQueue.length > 0) {
        // Schedule next queue processing using setTimeout so Jest fake timers can advance it
        setTimeout(() => this.processQueue(), 0);
      }
    }
  }

  private async processJob(job: BatchJob): Promise<void> {
    job.status = BatchJobStatus.RUNNING;
    job.startedAt = Date.now();

    Logger.info('Starting batch job processing', {
      jobId: job.id,
      fileCount: job.files.length
    });

    const processingPromises = job.files.map((file, index) => {
      if (job.status !== BatchJobStatus.RUNNING) {
        Logger.info('Job no longer running, skipping file processing.', { jobId: job.id, status: job.status });
        return Promise.resolve();
      }
      return this.processFile(job, file, index);
    });

    await Promise.all(processingPromises);

    job.completedAt = Date.now();
    if (job.status === BatchJobStatus.RUNNING) {
      if (job.progress.failed > 0) {
        job.status = BatchJobStatus.FAILED;
      } else {
        job.status = BatchJobStatus.COMPLETED;
      }
    }

    Logger.info('Batch job completed', {
      jobId: job.id,
      status: job.status,
      completed: job.progress.completed,
      failed: job.progress.failed,
      totalTime: job.completedAt - (job.startedAt || job.createdAt)
    });

    if (job.options.onComplete) {
      job.options.onComplete(job);
    }
  }

  private async processFile(job: BatchJob, file: File, fileIndex: number): Promise<void> {
    const startTime = Date.now();
    job.progress.inProgress++;
    this.updateProgress(job);

    try {
      if (job.status !== BatchJobStatus.RUNNING) {
        throw new Error('Job was cancelled or paused');
      }

      const result = await this.processSingleFile(job, file, fileIndex);
      
      job.results.push(result);
      job.progress.completed++;
      
      if (job.options.onFileComplete) {
        job.options.onFileComplete(result);
      }

      Logger.debug('File processed successfully', {
        jobId: job.id,
        fileName: file.name,
        processingTime: result.processingTime
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      Logger.warn('File processing failed', {
        jobId: job.id,
        fileName: file.name,
        error: errorMessage
      });

      const batchError: BatchError = {
        fileIndex,
        fileName: file.name,
        error: errorMessage,
        retryCount: 0, // No retries in this simplified version
        timestamp: Date.now()
      };

      job.errors.push(batchError);
      job.progress.failed++;
      
      if (job.options.onError) {
        job.options.onError(batchError);
      }

      job.results.push({
        fileIndex,
        fileName: file.name,
        fileSize: file.size,
        success: false,
        processingTime: Date.now() - startTime,
        error: errorMessage
      });


    } finally {
      job.progress.inProgress--;
      this.updateProgress(job);
    }
  }

  private async processSingleFile(job: BatchJob, file: File, fileIndex: number): Promise<BatchResult> {
    Logger.info('Processing file', { fileName: file.name, fileIndex });
    const startTime = Date.now();
    let optimizationSavings = 0;
    let cacheHit = false;

    Logger.info('Attempting to create blob from file', { fileName: file.name });
    // Convert file to blob
    const imageBlob = new Blob([file], { type: file.type });
    Logger.info('Blob created successfully', { fileName: file.name });

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
      Logger.info('Image optimization is enabled', { fileName: file.name });
      try {
        Logger.info('Attempting image optimization', { fileName: file.name });
        const optimization = await this.optimizationService.optimizeForOCR(imageBlob);
        Logger.info('Image optimization successful', { fileName: file.name });
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
        // Fallback to OCR on the original image
        processedBlob = imageBlob;
      }
    } else {
      Logger.info('Image optimization is disabled', { fileName: file.name });
    }

    // Perform OCR
    Logger.info('Attempting OCR extraction', { fileName: file.name });
    const ocrResult = await this.ocrService.extractText(processedBlob, job.options.ocrOptions);
    Logger.info('OCR extraction successful', { fileName: file.name });

    // Cache result if enabled
    if (job.options.enableCaching && !cacheHit) {
      const cacheKey = this.cacheService.generateOCRKey(imageBlob, job.options.ocrOptions);
      await this.cacheService.cacheOCRResult(cacheKey, ocrResult);
    }

    const processingTime = Date.now() - startTime;

    Logger.info('File processing completed', { fileName: file.name, processingTime });

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

    // Ensure OCR resources are cleaned up
    try {
      // destroy may be async; we intentionally do not await in dispose signature
      void this.ocrService.destroy();
    } catch (e) {
      // ignore
    }
  }
}

export default BatchProcessingService;
