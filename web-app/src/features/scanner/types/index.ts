// Scanner Types

export interface ScanResult {
  id: string;
  text: string;
  confidence: number;
  blocks: TextBlock[];
  tables?: TableData[];
  metadata: {
    provider: string;
    processingTime: number;
    imageSize: {
      width: number;
      height: number;
    };
  };
  createdAt: string;
}

export interface TextBlock {
  text: string;
  confidence: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TableData {
  rows: TableRow[];
  confidence: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableCell {
  text: string;
  confidence: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRProvider {
  name: string;
  isAvailable: () => Promise<boolean>;
  extractText: (image: Blob, options?: OCROptions) => Promise<ScanResult>;
}

export interface OCROptions {
  language?: string;
  detectTables?: boolean;
  enhanceImage?: boolean;
  timeout?: number;
}

export interface ScanSettings {
  defaultProvider: string;
  fallbackProviders: string[];
  autoEnhance: boolean;
  detectTables: boolean;
  languages: string[];
  qualityThreshold: number;
}