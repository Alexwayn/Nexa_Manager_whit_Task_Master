// File upload service implementation
import type { FileUploadService as IFileUploadService, ProcessedFile } from '@/types/scanner';

export class FileUploadService implements IFileUploadService {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  validateFile(file: File): boolean {
    // Check file size
    if (file.size > this.maxFileSize) {
      return false;
    }

    // Check file type
    if (!this.acceptedTypes.includes(file.type)) {
      return false;
    }

    return true;
  }

  async processFiles(files: File[]): Promise<ProcessedFile[]> {
    const processedFiles: ProcessedFile[] = [];

    for (const file of files) {
      try {
        const processedFile = await this.processFile(file);
        processedFiles.push(processedFile);
      } catch (error) {
        processedFiles.push({
          id: this.generateId(),
          originalFile: file,
          preview: '',
          size: file.size,
          type: file.type,
          name: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return processedFiles;
  }

  private async processFile(file: File): Promise<ProcessedFile> {
    if (!this.validateFile(file)) {
      throw new Error(this.getValidationError(file));
    }

    const preview = await this.generatePreview(file);

    return {
      id: this.generateId(),
      originalFile: file,
      preview,
      size: file.size,
      type: file.type,
      name: file.name
    };
  }

  private async generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to generate preview'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private getValidationError(file: File): string {
    if (file.size > this.maxFileSize) {
      return `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`;
    }

    if (!this.acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Accepted types: ${this.acceptedTypes.join(', ')}`;
    }

    return 'Invalid file';
  }

  private generateId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAcceptedFileTypes(): string[] {
    return [...this.acceptedTypes];
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }
}
