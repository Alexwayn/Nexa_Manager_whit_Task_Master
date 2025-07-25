import BatchProcessingService, { 
  BatchJob, 
  BatchProcessingOptions, 
  BatchProgress, 
  BatchResult, 
  BatchError, 
  BatchJobStatus 
} from '@/services/scanner/batchProcessingService';
import { AIOCRService } from '@/services/scanner/ocrService';
import ImageOptimizationService from '@/services/scanner/imageOptimizationService';
import ResultCacheService from '@/services/scanner/resultCacheService';
import { OCRProvider, OCRResult } from '@/types/scanner';

// Mock dependencies
jest.mock('@/services/scanner/ocrService');
jest.mock('@/services/scanner/imageOptimizationService');
jest.mock('@/services/scanner/resultCacheService');
jest.mock('@/utils/Logger');
jest.mock('@/lib/sentry');

const mockAIOCRService = AIOCRService as jest.MockedClass<typeof AIOCRService>;
const mockImageOptimizationService = ImageOptimizationService as any;
const mockResultCacheService = ResultCacheService as any;

describe('BatchProcessingService', () => {
  let service: BatchProcessingService;
  let mockOCRInstance: jest.Mocked<AIOCRService>;
  let mockOptimizationInstance: jest.Mocked<ImageOptimizationService>;
  let mockCacheInstance: jest.Mocked<ResultCacheService>;

  const mockOCRResult: OCRResult = {
    text: 'Extracted text from document',
    confidence: 0.95,
    provider: OCRProvider.OpenAI,
    processingTime: 1500,
    blocks: [
      {
        text: 'Extracted text from document',
        bounds: { x: 0, y: 0, width: 100, height: 20 },
        confidence: 0.95
      }
    ]
  };

  const createMockFile = (name: string, size: number = 1024): File => {
    const content = 'x'.repeat(size);
    return new File([content], name, { type: 'image/jpeg' });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset singleton instance
    (BatchProcessingService as any).instance = null;

    // Setup mock instances
    mockOCRInstance = {
      extractText: jest.fn().mockResolvedValue(mockOCRResult)
    } as any;

    mockOptimizationInstance = {
      optimizeForOCR: jest.fn().mockResolvedValue({
        optimizedImage: new Blob(['optimized'], { type: 'image/jpeg' }),
        originalSize: 2048,
        optimizedSize: 1024,
        compressionRatio: 2.0,
        processingTime: 500
      }),
      getInstance: jest.fn()
    } as any;

    mockCacheInstance = {
      generateOCRKey: jest.fn().mockReturnValue('cache-key-123'),
      getCachedOCRResult: jest.fn().mockResolvedValue(null),
      cacheOCRResult: jest.fn().mockResolvedValue(undefined),
      getInstance: jest.fn()
    } as any;

    // Setup static method mocks
    mockAIOCRService.mockImplementation(() => mockOCRInstance);
    jest.spyOn(mockImageOptimizationService, 'getInstance').mockReturnValue(mockOptimizationInstance);
    jest.spyOn(mockResultCacheService, 'getInstance').mockReturnValue(mockCacheInstance);

    service = BatchProcessingService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    service.dispose();
  });

  describe('initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = BatchProcessingService.getInstance();
      const instance2 = BatchProcessingService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should initialize with required services', () => {
      expect(mockAIOCRService).toHaveBeenCalled();
      expect(mockImageOptimizationService.getInstance).toHaveBeenCalled();
      expect(mockResultCacheService.getInstance).toHaveBeenCalled();
    });
  });

  describe('batch job creation', () => {
    it('should create batch job with default options', () => {
      const files = [createMockFile('test1.jpg'), createMockFile('test2.jpg')];
      
      const jobId = service.createBatchJob(files);

      expect(jobId).toMatch(/^batch_\d+_/);
      
      const job = service.getJobStatus(jobId);
      expect(job).toBeDefined();
      expect(job?.files).toHaveLength(2);
      expect(job?.status).toBe(BatchJobStatus.PENDING);
      expect(job?.progress.total).toBe(2);
      expect(job?.progress.completed).toBe(0);
    });

    it('should create batch job with custom options', () => {
      const files = [createMockFile('test.jpg')];
      const options: BatchProcessingOptions = {
        maxConcurrency: 5,
        optimizeImages: false,
        enableCaching: false,
        retryFailures: false
      };

      const jobId = service.createBatchJob(files, options);
      const job = service.getJobStatus(jobId);

      expect(job?.options.maxConcurrency).toBe(5);
      expect(job?.options.optimizeImages).toBe(false);
      expect(job?.options.enableCaching).toBe(false);
      expect(job?.options.retryFailures).toBe(false);
    });

    it('should start processing automatically', () => {
      const files = [createMockFile('test.jpg')];
      
      service.createBatchJob(files);

      // Advance timers to allow processing to start
      jest.advanceTimersByTime(100);

      expect(mockOCRInstance.extractText).toHaveBeenCalled();
    });
  });

  describe('job status management', () => {
    it('should return job status', () => {
      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files);

      const status = service.getJobStatus(jobId);

      expect(status).toBeDefined();
      expect(status?.id).toBe(jobId);
      expect(status?.status).toBe(BatchJobStatus.PENDING);
    });

    it('should return null for non-existent job', () => {
      const status = service.getJobStatus('non-existent-job');

      expect(status).toBeNull();
    });

    it('should get all active jobs', () => {
      const files1 = [createMockFile('test1.jpg')];
      const files2 = [createMockFile('test2.jpg')];

      service.createBatchJob(files1);
      service.createBatchJob(files2);

      const activeJobs = service.getActiveJobs();

      expect(activeJobs).toHaveLength(2);
    });
  });

  describe('job control', () => {
    it('should cancel pending job', () => {
      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files);

      const cancelled = service.cancelJob(jobId);

      expect(cancelled).toBe(true);
      
      const job = service.getJobStatus(jobId);
      expect(job?.status).toBe(BatchJobStatus.CANCELLED);
    });

    it('should cancel running job', async () => {
      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files);

      // Let job start running
      jest.advanceTimersByTime(100);
      
      const cancelled = service.cancelJob(jobId);

      expect(cancelled).toBe(true);
    });

    it('should pause running job', () => {
      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files);

      // Manually set status to running
      const job = service.getJobStatus(jobId)!;
      job.status = BatchJobStatus.RUNNING;

      const paused = service.pauseJob(jobId);

      expect(paused).toBe(true);
      expect(job.status).toBe(BatchJobStatus.PAUSED);
    });

    it('should resume paused job', () => {
      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files);

      // Manually set status to paused
      const job = service.getJobStatus(jobId)!;
      job.status = BatchJobStatus.PAUSED;

      const resumed = service.resumeJob(jobId);

      expect(resumed).toBe(true);
      expect(job.status).toBe(BatchJobStatus.RUNNING);
    });

    it('should not pause non-running job', () => {
      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files);

      const paused = service.pauseJob(jobId);

      expect(paused).toBe(false);
    });

    it('should not resume non-paused job', () => {
      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files);

      const resumed = service.resumeJob(jobId);

      expect(resumed).toBe(false);
    });
  });

  describe('file processing', () => {
    it('should process single file successfully', async () => {
      const files = [createMockFile('test.jpg', 2048)];
      const jobId = service.createBatchJob(files);

      // Wait for processing to complete
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Allow promises to resolve

      const job = service.getJobStatus(jobId);
      expect(job?.progress.completed).toBe(1);
      expect(job?.results).toHaveLength(1);
      expect(job?.results[0].success).toBe(true);
      expect(job?.results[0].ocrResult).toEqual(mockOCRResult);
    });

    it('should optimize images when enabled', async () => {
      const files = [createMockFile('test.jpg')];
      const options: BatchProcessingOptions = { optimizeImages: true };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockOptimizationInstance.optimizeForOCR).toHaveBeenCalled();
    });

    it('should skip optimization when disabled', async () => {
      const files = [createMockFile('test.jpg')];
      const options: BatchProcessingOptions = { optimizeImages: false };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockOptimizationInstance.optimizeForOCR).not.toHaveBeenCalled();
    });

    it('should use cached results when available', async () => {
      mockCacheInstance.getCachedOCRResult.mockResolvedValue(mockOCRResult);

      const files = [createMockFile('test.jpg')];
      const options: BatchProcessingOptions = { enableCaching: true };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const job = service.getJobStatus(service.getActiveJobs()[0].id);
      expect(job?.results[0].cacheHit).toBe(true);
      expect(mockOCRInstance.extractText).not.toHaveBeenCalled();
    });

    it('should cache results when enabled', async () => {
      const files = [createMockFile('test.jpg')];
      const options: BatchProcessingOptions = { enableCaching: true };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockCacheInstance.cacheOCRResult).toHaveBeenCalledWith(
        'cache-key-123',
        mockOCRResult
      );
    });

    it('should handle processing errors', async () => {
      mockOCRInstance.extractText.mockRejectedValue(new Error('OCR failed'));

      const files = [createMockFile('test.jpg')];
      const options: BatchProcessingOptions = { retryFailures: false };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const job = service.getJobStatus(service.getActiveJobs()[0].id);
      expect(job?.progress.failed).toBe(1);
      expect(job?.errors).toHaveLength(1);
      expect(job?.results[0].success).toBe(false);
    });

    it('should retry failed processing when enabled', async () => {
      let callCount = 0;
      mockOCRInstance.extractText.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('First attempt failed'));
        }
        return Promise.resolve(mockOCRResult);
      });

      const files = [createMockFile('test.jpg')];
      const options: BatchProcessingOptions = { 
        retryFailures: true,
        maxRetries: 2
      };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(3000); // Allow time for retries
      await Promise.resolve();

      expect(mockOCRInstance.extractText).toHaveBeenCalledTimes(2);
      
      const job = service.getJobStatus(service.getActiveJobs()[0].id);
      expect(job?.progress.completed).toBe(1);
      expect(job?.progress.failed).toBe(0);
    });

    it('should respect concurrency limits', async () => {
      const files = Array.from({ length: 10 }, (_, i) => createMockFile(`test${i}.jpg`));
      const options: BatchProcessingOptions = { maxConcurrency: 2 };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      // Should not process more than maxConcurrency files simultaneously
      expect(mockOCRInstance.extractText).toHaveBeenCalledTimes(2);
    });
  });

  describe('progress tracking', () => {
    it('should track progress correctly', async () => {
      const files = [createMockFile('test1.jpg'), createMockFile('test2.jpg')];
      let progressUpdates: BatchProgress[] = [];
      
      const options: BatchProcessingOptions = {
        onProgress: (progress) => progressUpdates.push({ ...progress })
      };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(progressUpdates.length).toBeGreaterThan(0);
      const finalProgress = progressUpdates[progressUpdates.length - 1];
      expect(finalProgress.percentage).toBe(100);
      expect(finalProgress.completed).toBe(2);
    });

    it('should call onFileComplete callback', async () => {
      const files = [createMockFile('test.jpg')];
      const completedFiles: BatchResult[] = [];
      
      const options: BatchProcessingOptions = {
        onFileComplete: (result) => completedFiles.push(result)
      };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(completedFiles).toHaveLength(1);
      expect(completedFiles[0].fileName).toBe('test.jpg');
      expect(completedFiles[0].success).toBe(true);
    });

    it('should call onError callback', async () => {
      mockOCRInstance.extractText.mockRejectedValue(new Error('Processing failed'));

      const files = [createMockFile('test.jpg')];
      const errors: BatchError[] = [];
      
      const options: BatchProcessingOptions = {
        retryFailures: false,
        onError: (error) => errors.push(error)
      };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(errors).toHaveLength(1);
      expect(errors[0].fileName).toBe('test.jpg');
      expect(errors[0].error).toBe('Processing failed');
    });

    it('should calculate estimated time remaining', async () => {
      const files = Array.from({ length: 4 }, (_, i) => createMockFile(`test${i}.jpg`));
      let progressUpdates: BatchProgress[] = [];
      
      const options: BatchProcessingOptions = {
        maxConcurrency: 1, // Process one at a time for predictable timing
        onProgress: (progress) => progressUpdates.push({ ...progress })
      };
      
      service.createBatchJob(files, options);

      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      // Should have progress updates with time estimates
      const progressWithEstimate = progressUpdates.find(p => p.estimatedTimeRemaining !== undefined);
      expect(progressWithEstimate).toBeDefined();
      expect(progressWithEstimate?.averageProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('job cleanup', () => {
    it('should clear completed jobs', () => {
      const files1 = [createMockFile('test1.jpg')];
      const files2 = [createMockFile('test2.jpg')];

      const jobId1 = service.createBatchJob(files1);
      const jobId2 = service.createBatchJob(files2);

      // Manually set one job as completed
      const job1 = service.getJobStatus(jobId1)!;
      job1.status = BatchJobStatus.COMPLETED;

      const clearedCount = service.clearCompletedJobs();

      expect(clearedCount).toBe(1);
      expect(service.getJobStatus(jobId1)).toBeNull();
      expect(service.getJobStatus(jobId2)).toBeDefined();
    });

    it('should clear failed jobs', () => {
      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files);

      // Manually set job as failed
      const job = service.getJobStatus(jobId)!;
      job.status = BatchJobStatus.FAILED;

      const clearedCount = service.clearCompletedJobs();

      expect(clearedCount).toBe(1);
      expect(service.getJobStatus(jobId)).toBeNull();
    });
  });

  describe('statistics', () => {
    it('should provide batch processing statistics', async () => {
      const files = [createMockFile('test.jpg')];
      service.createBatchJob(files);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const stats = service.getBatchStats();

      expect(stats).toHaveProperty('totalJobs');
      expect(stats).toHaveProperty('activeJobs');
      expect(stats).toHaveProperty('completedJobs');
      expect(stats).toHaveProperty('failedJobs');
      expect(stats).toHaveProperty('totalFilesProcessed');
      expect(stats).toHaveProperty('averageProcessingTime');
      expect(stats).toHaveProperty('cacheHitRate');

      expect(stats.totalJobs).toBe(1);
      expect(stats.totalFilesProcessed).toBe(1);
    });

    it('should calculate cache hit rate correctly', async () => {
      // First file uses cache miss
      mockCacheInstance.getCachedOCRResult.mockResolvedValueOnce(null);
      // Second file uses cache hit
      mockCacheInstance.getCachedOCRResult.mockResolvedValueOnce(mockOCRResult);

      const files = [createMockFile('test1.jpg'), createMockFile('test2.jpg')];
      service.createBatchJob(files, { enableCaching: true });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const stats = service.getBatchStats();
      expect(stats.cacheHitRate).toBe(0.5); // 1 hit out of 2 files
    });
  });

  describe('export functionality', () => {
    it('should export batch results', async () => {
      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const exported = service.exportBatchResults(jobId);

      expect(exported).toHaveProperty('jobId', jobId);
      expect(exported).toHaveProperty('status');
      expect(exported).toHaveProperty('progress');
      expect(exported).toHaveProperty('results');
      expect(exported).toHaveProperty('errors');
      expect(exported).toHaveProperty('createdAt');
    });

    it('should return null for non-existent job export', () => {
      const exported = service.exportBatchResults('non-existent-job');

      expect(exported).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle optimization errors gracefully', async () => {
      mockOptimizationInstance.optimizeForOCR.mockRejectedValue(new Error('Optimization failed'));

      const files = [createMockFile('test.jpg')];
      service.createBatchJob(files, { optimizeImages: true });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Should still process the file with original image
      expect(mockOCRInstance.extractText).toHaveBeenCalled();
      
      const job = service.getJobStatus(service.getActiveJobs()[0].id);
      expect(job?.progress.completed).toBe(1);
    });

    it('should handle caching errors gracefully', async () => {
      mockCacheInstance.cacheOCRResult.mockRejectedValue(new Error('Cache failed'));

      const files = [createMockFile('test.jpg')];
      service.createBatchJob(files, { enableCaching: true });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Should still complete processing despite cache error
      const job = service.getJobStatus(service.getActiveJobs()[0].id);
      expect(job?.progress.completed).toBe(1);
    });

    it('should handle job processing errors', async () => {
      // Mock internal error during job processing
      mockOCRInstance.extractText.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files, { retryFailures: false });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const job = service.getJobStatus(jobId);
      expect(job?.status).toBe(BatchJobStatus.COMPLETED); // Should complete despite errors
      expect(job?.progress.failed).toBe(1);
    });
  });

  describe('disposal', () => {
    it('should dispose resources properly', () => {
      const files = [createMockFile('test.jpg')];
      service.createBatchJob(files);

      service.dispose();

      const activeJobs = service.getActiveJobs();
      expect(activeJobs).toHaveLength(0);
    });

    it('should cancel active jobs on disposal', () => {
      const files = [createMockFile('test.jpg')];
      const jobId = service.createBatchJob(files);

      // Manually set job as running
      const job = service.getJobStatus(jobId)!;
      job.status = BatchJobStatus.RUNNING;

      service.dispose();

      expect(job.status).toBe(BatchJobStatus.CANCELLED);
    });
  });
});