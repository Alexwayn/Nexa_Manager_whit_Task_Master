// Image processing service implementation
import type { 
  ImageProcessingService as IImageProcessingService, 
  EnhancedImage, 
  DocumentBounds,
  ImagePreprocessingOptions,
  CompressionResult
} from '@/types/scanner';

export class ImageProcessingService implements IImageProcessingService {
  // Default preprocessing options optimized for OCR APIs
  private readonly defaultPreprocessingOptions: ImagePreprocessingOptions = {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.85,
    format: 'jpeg',
    targetFileSize: 4 * 1024 * 1024, // 4MB - common API limit
    maintainAspectRatio: true
  };

  /**
   * Compress and optimize image for API requirements
   */
  async compressImage(
    image: Blob, 
    options: Partial<ImagePreprocessingOptions> = {}
  ): Promise<CompressionResult> {
    const opts = { ...this.defaultPreprocessingOptions, ...options };
    const canvas = await this.blobToCanvas(image);
    const originalSize = image.size;
    
    // Calculate optimal dimensions
    const { width: newWidth, height: newHeight } = this.calculateOptimalDimensions(
      canvas.width,
      canvas.height,
      opts.maxWidth!,
      opts.maxHeight!,
      opts.maintainAspectRatio!
    );

    // Create resized canvas
    const resizedCanvas = this.resizeCanvas(canvas, newWidth, newHeight);
    
    // Convert to target format with compression
    let compressedBlob = await this.canvasToBlob(resizedCanvas, opts.format!, opts.quality!);
    
    // If still too large, reduce quality iteratively
    if (opts.targetFileSize && compressedBlob.size > opts.targetFileSize) {
      compressedBlob = await this.iterativeCompress(
        resizedCanvas,
        opts.format!,
        opts.targetFileSize,
        opts.quality!
      );
    }

    return {
      blob: compressedBlob,
      originalSize,
      compressedSize: compressedBlob.size,
      compressionRatio: originalSize / compressedBlob.size,
      format: opts.format!,
      dimensions: { width: newWidth, height: newHeight }
    };
  }

  /**
   * Convert image to different format
   */
  async convertFormat(
    image: Blob, 
    targetFormat: 'jpeg' | 'png' | 'webp',
    quality: number = 0.9
  ): Promise<Blob> {
    const canvas = await this.blobToCanvas(image);
    return this.canvasToBlob(canvas, targetFormat, quality);
  }

  /**
   * Optimize image resolution for OCR processing
   */
  async optimizeForOCR(image: Blob): Promise<Blob> {
    const canvas = await this.blobToCanvas(image);
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Unable to create canvas context');
    }

    // OCR works best with high contrast, sharp images
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const optimizedImageData = this.applyOCROptimizations(imageData);
    
    context.putImageData(optimizedImageData, 0, 0);
    
    // Compress with settings optimized for OCR
    return this.compressImage(await this.canvasToBlob(canvas), {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.95, // Higher quality for better OCR results
      format: 'jpeg'
    }).then(result => result.blob);
  }

  /**
   * Preprocess image for API submission
   */
  async preprocessForAPI(
    image: Blob,
    apiRequirements: {
      maxFileSize?: number;
      maxDimensions?: { width: number; height: number };
      supportedFormats?: string[];
    } = {}
  ): Promise<CompressionResult> {
    const {
      maxFileSize = 4 * 1024 * 1024, // 4MB default
      maxDimensions = { width: 2048, height: 2048 },
      supportedFormats = ['jpeg', 'png']
    } = apiRequirements;

    // Choose best format based on image content and API support
    const optimalFormat = this.selectOptimalFormat(image, supportedFormats);
    
    return this.compressImage(image, {
      maxWidth: maxDimensions.width,
      maxHeight: maxDimensions.height,
      targetFileSize: maxFileSize,
      format: optimalFormat as 'jpeg' | 'png' | 'webp',
      quality: 0.85
    });
  }
  async enhanceImage(image: Blob): Promise<EnhancedImage> {
    const canvas = await this.blobToCanvas(image);
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Unable to create canvas context');
    }

    // Apply image enhancements
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const enhancedImageData = this.applyEnhancements(imageData);
    
    context.putImageData(enhancedImageData, 0, 0);
    
    const enhancedBlob = await this.canvasToBlob(canvas);
    
    return {
      original: image,
      enhanced: enhancedBlob,
      width: canvas.width,
      height: canvas.height
    };
  }

  async detectDocumentEdges(image: Blob): Promise<DocumentBounds> {
    // Placeholder implementation - in a real app, this would use computer vision
    const canvas = await this.blobToCanvas(image);
    const { width, height } = canvas;
    
    // Return approximate document bounds (assuming document fills most of the image)
    const margin = 0.05; // 5% margin
    
    return {
      topLeft: { x: width * margin, y: height * margin },
      topRight: { x: width * (1 - margin), y: height * margin },
      bottomLeft: { x: width * margin, y: height * (1 - margin) },
      bottomRight: { x: width * (1 - margin), y: height * (1 - margin) }
    };
  }

  async cropToDocument(image: Blob, bounds: DocumentBounds): Promise<Blob> {
    const canvas = await this.blobToCanvas(image);
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Unable to create canvas context');
    }

    // Calculate crop dimensions
    const minX = Math.min(bounds.topLeft.x, bounds.bottomLeft.x);
    const maxX = Math.max(bounds.topRight.x, bounds.bottomRight.x);
    const minY = Math.min(bounds.topLeft.y, bounds.topRight.y);
    const maxY = Math.max(bounds.bottomLeft.y, bounds.bottomRight.y);
    
    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;
    
    // Create new canvas with cropped dimensions
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    
    const croppedContext = croppedCanvas.getContext('2d');
    if (!croppedContext) {
      throw new Error('Unable to create cropped canvas context');
    }
    
    // Draw cropped image
    croppedContext.drawImage(
      canvas,
      minX, minY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    return this.canvasToBlob(croppedCanvas);
  }

  async adjustContrast(image: Blob, level: number): Promise<Blob> {
    const canvas = await this.blobToCanvas(image);
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Unable to create canvas context');
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const factor = (259 * (level + 255)) / (255 * (259 - level));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128)); // Red
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // Green
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // Blue
    }
    
    context.putImageData(imageData, 0, 0);
    return this.canvasToBlob(canvas);
  }

  async adjustBrightness(image: Blob, level: number): Promise<Blob> {
    const canvas = await this.blobToCanvas(image);
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Unable to create canvas context');
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + level)); // Red
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + level)); // Green
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + level)); // Blue
    }
    
    context.putImageData(imageData, 0, 0);
    return this.canvasToBlob(canvas);
  }

  async removeShadows(image: Blob): Promise<Blob> {
    // Placeholder implementation - in a real app, this would use advanced image processing
    const canvas = await this.blobToCanvas(image);
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Unable to create canvas context');
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const enhancedImageData = this.applyEnhancements(imageData);
    
    context.putImageData(enhancedImageData, 0, 0);
    return this.canvasToBlob(canvas);
  }

  async convertToPDF(images: Blob[]): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const canvas = await this.blobToCanvas(image);
      
      // Calculate dimensions to fit page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgAspectRatio = canvas.width / canvas.height;
      
      let imgWidth = pageWidth - 20; // 10mm margin on each side
      let imgHeight = imgWidth / imgAspectRatio;
      
      // If image is too tall, scale by height instead
      if (imgHeight > pageHeight - 20) {
        imgHeight = pageHeight - 20;
        imgWidth = imgHeight * imgAspectRatio;
      }
      
      // Convert canvas to data URL
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Add new page for subsequent images
      if (i > 0) {
        pdf.addPage();
      }
      
      // Add image to PDF
      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
    }
    
    // Convert PDF to blob
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  }

  /**
   * Parse PDF and extract pages as images
   */
  async parsePDF(pdfBlob: Blob): Promise<Blob[]> {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const images: Blob[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Unable to create canvas context for PDF page');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to blob
      const imageBlob = await this.canvasToBlob(canvas, 'jpeg', 0.9);
      images.push(imageBlob);
    }
    
    return images;
  }

  /**
   * Extract individual pages from PDF as separate image files
   */
  async extractPDFPages(pdfBlob: Blob): Promise<{ pageNumber: number; image: Blob }[]> {
    const images = await this.parsePDF(pdfBlob);
    
    return images.map((image, index) => ({
      pageNumber: index + 1,
      image
    }));
  }

  /**
   * Handle multi-page document processing
   */
  async processMultiPageDocument(
    input: Blob | Blob[],
    options: {
      combineIntoPDF?: boolean;
      optimizeForOCR?: boolean;
      maxPagesPerBatch?: number;
    } = {}
  ): Promise<{
    pages: Blob[];
    combinedPDF?: Blob;
    totalPages: number;
    processingInfo: {
      pageNumber: number;
      originalSize: number;
      processedSize: number;
      format: string;
    }[];
  }> {
    const {
      combineIntoPDF = false,
      optimizeForOCR = true,
      maxPagesPerBatch = 50
    } = options;
    
    let pages: Blob[];
    
    // Handle different input types
    if (Array.isArray(input)) {
      pages = input;
    } else {
      // Check if input is PDF
      const inputType = input.type;
      if (inputType === 'application/pdf') {
        pages = await this.parsePDF(input);
      } else {
        pages = [input];
      }
    }
    
    // Limit pages per batch to prevent memory issues
    if (pages.length > maxPagesPerBatch) {
      console.warn(`Document has ${pages.length} pages, limiting to ${maxPagesPerBatch} for processing`);
      pages = pages.slice(0, maxPagesPerBatch);
    }
    
    // Process each page
    const processedPages: Blob[] = [];
    const processingInfo: {
      pageNumber: number;
      originalSize: number;
      processedSize: number;
      format: string;
    }[] = [];
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const originalSize = page.size;
      
      let processedPage = page;
      
      if (optimizeForOCR) {
        processedPage = await this.optimizeForOCR(page);
      }
      
      processedPages.push(processedPage);
      
      processingInfo.push({
        pageNumber: i + 1,
        originalSize,
        processedSize: processedPage.size,
        format: processedPage.type
      });
    }
    
    // Combine into PDF if requested
    let combinedPDF: Blob | undefined;
    if (combineIntoPDF && processedPages.length > 0) {
      combinedPDF = await this.convertToPDF(processedPages);
    }
    
    return {
      pages: processedPages,
      combinedPDF,
      totalPages: processedPages.length,
      processingInfo
    };
  }

  private async blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to create canvas context'));
          return;
        }
        
        context.drawImage(img, 0, 0);
        resolve(canvas);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  private async canvasToBlob(
    canvas: HTMLCanvasElement, 
    format: string = 'jpeg', 
    quality: number = 0.9
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = `image/${format}`;
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to convert canvas to ${format} blob`));
        }
      }, mimeType, quality);
    });
  }

  private applyEnhancements(imageData: ImageData): ImageData {
    const data = imageData.data;
    
    // Apply basic enhancements: increase contrast and brightness
    for (let i = 0; i < data.length; i += 4) {
      // Increase contrast
      const factor = 1.2;
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128)); // Red
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // Green
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // Blue
      
      // Slight brightness adjustment
      const brightness = 10;
      data[i] = Math.max(0, Math.min(255, data[i] + brightness));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
    }
    
    return imageData;
  }

  /**
   * Apply OCR-specific optimizations to image data
   */
  private applyOCROptimizations(imageData: ImageData): ImageData {
    const data = imageData.data;
    
    // Convert to grayscale and increase contrast for better OCR
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale using luminance formula
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Apply high contrast for text recognition
      const threshold = 128;
      const contrastFactor = 2.0;
      const enhancedGray = gray > threshold 
        ? Math.min(255, gray * contrastFactor)
        : Math.max(0, gray / contrastFactor);
      
      data[i] = enhancedGray;     // Red
      data[i + 1] = enhancedGray; // Green
      data[i + 2] = enhancedGray; // Blue
      // Alpha channel (i + 3) remains unchanged
    }
    
    return imageData;
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    if (!maintainAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    
    // Scale down if necessary
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }
    
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }
    
    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
  }

  /**
   * Resize canvas to new dimensions
   */
  private resizeCanvas(
    originalCanvas: HTMLCanvasElement,
    newWidth: number,
    newHeight: number
  ): HTMLCanvasElement {
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    
    const context = resizedCanvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create canvas context for resizing');
    }
    
    // Use high-quality image scaling
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    context.drawImage(originalCanvas, 0, 0, newWidth, newHeight);
    
    return resizedCanvas;
  }

  /**
   * Iteratively compress image until target file size is reached
   */
  private async iterativeCompress(
    canvas: HTMLCanvasElement,
    format: string,
    targetSize: number,
    initialQuality: number
  ): Promise<Blob> {
    let quality = initialQuality;
    let blob = await this.canvasToBlob(canvas, format, quality);
    
    // Reduce quality in steps until target size is reached
    while (blob.size > targetSize && quality > 0.1) {
      quality -= 0.1;
      blob = await this.canvasToBlob(canvas, format, quality);
    }
    
    // If still too large, try reducing dimensions
    if (blob.size > targetSize) {
      const scaleFactor = Math.sqrt(targetSize / blob.size);
      const newWidth = Math.round(canvas.width * scaleFactor);
      const newHeight = Math.round(canvas.height * scaleFactor);
      
      const smallerCanvas = this.resizeCanvas(canvas, newWidth, newHeight);
      blob = await this.canvasToBlob(smallerCanvas, format, 0.8);
    }
    
    return blob;
  }

  /**
   * Select optimal format based on image content and API support
   */
  private selectOptimalFormat(_image: Blob, supportedFormats: string[]): string {
    // Default to JPEG for photos, PNG for graphics with transparency
    if (supportedFormats.includes('jpeg')) {
      return 'jpeg'; // Generally better compression for photos
    }
    
    if (supportedFormats.includes('png')) {
      return 'png'; // Better for graphics and text
    }
    
    if (supportedFormats.includes('webp')) {
      return 'webp'; // Best compression but less universal support
    }
    
    return supportedFormats[0] || 'jpeg';
  }
}
