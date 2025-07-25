// OCR result handler implementation
import type { 
  OCRResultHandler as IOCRResultHandler, 
  OCRResult, 
  StructuredData, 
  NamedEntity,
  TextBlock,
  TableData 
} from '@/types/scanner';
import { OCRProvider } from '@/types/scanner';

export class OCRResultHandler implements IOCRResultHandler {
  formatText(result: OCRResult): string {
    if (!result.text) {
      return '';
    }

    let formattedText = result.text;

    // Apply provider-specific formatting
    formattedText = this.applyProviderSpecificFormatting(formattedText, result.provider);

    // Clean up common OCR artifacts
    formattedText = this.cleanOCRArtifacts(formattedText);

    // Fix common OCR errors based on confidence level
    if (result.confidence < 0.8) {
      formattedText = this.fixCommonOCRErrors(formattedText);
    }

    // Apply advanced text formatting
    formattedText = this.applyAdvancedFormatting(formattedText);

    // Normalize whitespace and line breaks
    formattedText = this.normalizeWhitespace(formattedText);

    return formattedText.trim();
  }

  private applyProviderSpecificFormatting(text: string, provider: OCRProvider): string {
    switch (provider) {
      case OCRProvider.OpenAI:
        // OpenAI tends to be more verbose, clean up extra explanations
        return text.replace(/^(Here is the extracted text:|The text from the image is:)\s*/i, '');
      
      case OCRProvider.Qwen:
        // Qwen might include confidence indicators, remove them
        return text.replace(/\[confidence: \d+%\]/gi, '');
      
      case OCRProvider.Fallback:
        // Fallback might have placeholder text, preserve it
        return text;
      
      default:
        return text;
    }
  }

  private cleanOCRArtifacts(text: string): string {
    return text
      // Remove common OCR artifacts
      .replace(/[|]{2,}/g, '') // Multiple pipes
      .replace(/_{3,}/g, '___') // Normalize underscores
      .replace(/\.{4,}/g, '...') // Normalize dots
      .replace(/\s+([.,;:!?])/g, '$1') // Fix spacing before punctuation
      .replace(/([.,;:!?])\s*([.,;:!?])/g, '$1$2') // Fix double punctuation
      // Fix common character recognition errors
      .replace(/\b0(?=[A-Za-z])/g, 'O') // Zero before letters should be O
      .replace(/\bl(?=[A-Z])/g, 'I') // Lowercase l before uppercase should be I
      .replace(/rn/g, 'm') // Common OCR confusion
      .replace(/\|(?=[a-z])/g, 'l'); // Pipe before lowercase should be l
  }

  private applyAdvancedFormatting(text: string): string {
    // Detect and format common document structures
    let formatted = text;

    // Format headers (lines that are all caps or have specific patterns)
    formatted = formatted.replace(/^([A-Z\s]{3,})$/gm, (match) => {
      if (match.trim().length > 2 && match.trim().length < 50) {
        return `\n${match.trim()}\n`;
      }
      return match;
    });

    // Format numbered lists
    formatted = formatted.replace(/^(\d+\.)\s*(.+)$/gm, '$1 $2');

    // Format bullet points
    formatted = formatted.replace(/^[•·▪▫-]\s*(.+)$/gm, '• $1');

    // Format addresses (lines with numbers and street indicators)
    formatted = formatted.replace(/(\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd))/gi, 
      (match) => match.replace(/\s+/g, ' '));

    return formatted;
  }

  private normalizeWhitespace(text: string): string {
    return text
      .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple newlines to double newline
      .replace(/^\s+|\s+$/gm, '') // Trim each line
      .replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  }

  mergeResults(results: OCRResult[]): OCRResult {
    if (results.length === 0) {
      throw new Error('No results to merge');
    }

    if (results.length === 1) {
      return results[0];
    }

    // Sort results by confidence (highest first)
    const sortedResults = [...results].sort((a, b) => b.confidence - a.confidence);
    const bestResult = sortedResults[0];

    // Intelligent text merging based on confidence and similarity
    const mergedText = this.intelligentTextMerge(sortedResults);

    // Calculate weighted confidence based on result quality
    const weightedConfidence = this.calculateWeightedConfidence(sortedResults);

    // Merge blocks with deduplication
    const mergedBlocks = this.mergeTextBlocks(sortedResults);

    // Merge tables with conflict resolution
    const mergedTables = this.mergeTables(sortedResults);

    // Calculate total processing time
    const totalProcessingTime = results.reduce((sum, result) => sum + result.processingTime, 0);

    return {
      text: mergedText,
      confidence: weightedConfidence,
      provider: bestResult.provider,
      processingTime: totalProcessingTime,
      blocks: mergedBlocks.length > 0 ? mergedBlocks : undefined,
      tables: mergedTables.length > 0 ? mergedTables : undefined,
      rawResponse: {
        merged: true,
        mergeStrategy: 'intelligent',
        sourceResults: results.map(r => ({
          provider: r.provider,
          confidence: r.confidence,
          processingTime: r.processingTime
        })),
        originalResults: results.map(r => r.rawResponse)
      }
    };
  }

  private intelligentTextMerge(sortedResults: OCRResult[]): string {
    if (sortedResults.length === 1) {
      return sortedResults[0].text;
    }

    const texts = sortedResults.map(r => r.text).filter(text => text && text.trim().length > 0);
    
    if (texts.length === 0) {
      return '';
    }

    if (texts.length === 1) {
      return texts[0];
    }

    // Find the most similar texts and merge them
    const similarities = this.calculateTextSimilarities(texts);
    
    // If texts are very similar (>80% similarity), merge by taking the best parts
    if (similarities.maxSimilarity > 0.8) {
      return this.mergeByBestParts(texts, sortedResults);
    }

    // If texts are moderately similar (>50%), combine with clear separation
    if (similarities.maxSimilarity > 0.5) {
      return this.mergeWithSeparation(texts, sortedResults);
    }

    // If texts are very different, present all results with provider labels
    return this.mergeWithProviderLabels(texts, sortedResults);
  }

  private calculateTextSimilarities(texts: string[]): { maxSimilarity: number; avgSimilarity: number } {
    if (texts.length < 2) {
      return { maxSimilarity: 1, avgSimilarity: 1 };
    }

    let maxSimilarity = 0;
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const similarity = this.calculateStringSimilarity(texts[i], texts[j]);
        maxSimilarity = Math.max(maxSimilarity, similarity);
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return {
      maxSimilarity,
      avgSimilarity: comparisons > 0 ? totalSimilarity / comparisons : 0
    };
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1];
        } else {
          matrix[j][i] = Math.min(
            matrix[j - 1][i - 1] + 1,
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private mergeByBestParts(texts: string[], _results: OCRResult[]): string {
    // For very similar texts, take the longest/most complete version
    const bestText = texts.reduce((best, current) => 
      current.length > best.length ? current : best
    );

    return bestText;
  }

  private mergeWithSeparation(texts: string[], results: OCRResult[]): string {
    return texts
      .map((text, index) => `[OCR Result ${index + 1} - ${results[index].provider}]\n${text}`)
      .join('\n\n---\n\n');
  }

  private mergeWithProviderLabels(texts: string[], results: OCRResult[]): string {
    return texts
      .map((text, index) => {
        const provider = results[index].provider;
        const confidence = Math.round(results[index].confidence * 100);
        return `[${provider.toUpperCase()} - ${confidence}% confidence]\n${text}`;
      })
      .join('\n\n---\n\n');
  }

  private calculateWeightedConfidence(results: OCRResult[]): number {
    if (results.length === 0) return 0;
    if (results.length === 1) return results[0].confidence;

    // Weight confidence by text length and provider reliability
    let totalWeight = 0;
    let weightedSum = 0;

    for (const result of results) {
      const lengthWeight = Math.min(result.text.length / 1000, 1); // Normalize by text length
      const providerWeight = this.getProviderReliabilityWeight(result.provider);
      const weight = lengthWeight * providerWeight;
      
      weightedSum += result.confidence * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private getProviderReliabilityWeight(provider: OCRProvider): number {
    switch (provider) {
      case OCRProvider.OpenAI: return 1.0;
      case OCRProvider.Qwen: return 0.9;
      case OCRProvider.Azure: return 0.95;
      case OCRProvider.Google: return 0.95;
      case OCRProvider.Fallback: return 0.3;
      default: return 0.7;
    }
  }

  private mergeTextBlocks(results: OCRResult[]): TextBlock[] {
    const allBlocks = results.flatMap(result => result.blocks || []);
    
    if (allBlocks.length === 0) {
      return [];
    }

    // Deduplicate blocks by text content
    const uniqueBlocks = new Map<string, TextBlock>();
    
    for (const block of allBlocks) {
      const key = block.text.trim().toLowerCase();
      const existing = uniqueBlocks.get(key);
      
      if (!existing || (block.confidence || 0) > (existing.confidence || 0)) {
        uniqueBlocks.set(key, block);
      }
    }

    return Array.from(uniqueBlocks.values());
  }

  private mergeTables(results: OCRResult[]): TableData[] {
    const allTables = results.flatMap(result => result.tables || []);
    
    if (allTables.length === 0) {
      return [];
    }

    // For now, return the table from the highest confidence result
    // In a more sophisticated implementation, we could merge table data
    const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    return bestResult.tables || [];
  }

  extractStructuredData(result: OCRResult): StructuredData {
    const text = result.text;
    const confidence = result.confidence;
    const structuredData: StructuredData = {};

    // Use different extraction strategies based on confidence level
    const extractionStrategy = confidence > 0.8 ? 'aggressive' : 'conservative';

    // Extract title with confidence-based approach
    structuredData.title = this.extractTitle(text, extractionStrategy);

    // Extract dates with multiple pattern matching
    structuredData.date = this.extractDate(text, extractionStrategy);

    // Extract amounts with currency detection
    structuredData.amount = this.extractAmount(text, extractionStrategy);

    // Extract named entities with context awareness
    structuredData.entities = this.extractNamedEntities(text, extractionStrategy);

    // Extract key-value pairs with improved parsing
    structuredData.keyValuePairs = this.extractKeyValuePairs(text, extractionStrategy);

    // Extract additional structured data based on document type
    const documentType = this.detectDocumentType(text);
    if (documentType) {
      structuredData.documentType = documentType;
      structuredData.additionalData = this.extractDocumentSpecificData(text, documentType);
    }

    return structuredData;
  }

  private detectDocumentType(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    
    // Invoice detection
    if (lowerText.includes('invoice') || lowerText.includes('bill to') || lowerText.includes('invoice number')) {
      return 'invoice';
    }
    
    // Receipt detection
    if (lowerText.includes('receipt') || lowerText.includes('total:') || lowerText.includes('thank you')) {
      return 'receipt';
    }
    
    // Contract detection
    if (lowerText.includes('agreement') || lowerText.includes('contract') || lowerText.includes('terms and conditions')) {
      return 'contract';
    }
    
    // Business card detection
    if (lowerText.includes('@') && (lowerText.includes('phone') || lowerText.includes('tel') || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(lowerText))) {
      return 'business_card';
    }
    
    // Letter detection
    if (lowerText.includes('dear') || lowerText.includes('sincerely') || lowerText.includes('regards')) {
      return 'letter';
    }
    
    return undefined;
  }

  private extractDocumentSpecificData(text: string, documentType: string): Record<string, any> {
    switch (documentType) {
      case 'invoice':
        return this.extractInvoiceData(text);
      case 'receipt':
        return this.extractReceiptData(text);
      case 'business_card':
        return this.extractBusinessCardData(text);
      case 'contract':
        return this.extractContractData(text);
      default:
        return {};
    }
  }

  private extractInvoiceData(text: string): Record<string, any> {
    const data: Record<string, any> = {};
    
    // Invoice number
    const invoiceNumberMatch = text.match(/invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (invoiceNumberMatch) {
      data.invoiceNumber = invoiceNumberMatch[1];
    }
    
    // Due date
    const dueDateMatch = text.match(/due\s*date\s*:?\s*([0-9\/\-\.]+)/i);
    if (dueDateMatch) {
      data.dueDate = dueDateMatch[1];
    }
    
    // Vendor information
    const vendorMatch = text.match(/from\s*:?\s*([^\n]+)/i);
    if (vendorMatch) {
      data.vendor = vendorMatch[1].trim();
    }
    
    return data;
  }

  private extractReceiptData(text: string): Record<string, any> {
    const data: Record<string, any> = {};
    
    // Store name (usually first line or after "receipt from")
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      data.storeName = lines[0].trim();
    }
    
    // Transaction ID
    const transactionMatch = text.match(/transaction\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (transactionMatch) {
      data.transactionId = transactionMatch[1];
    }
    
    return data;
  }

  private extractBusinessCardData(text: string): Record<string, any> {
    const data: Record<string, any> = {};
    
    // Name (usually first line or largest text)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      data.name = lines[0].trim();
    }
    
    // Company (often second line)
    if (lines.length > 1) {
      data.company = lines[1].trim();
    }
    
    // Title/Position
    const titleMatch = text.match(/(CEO|CTO|Manager|Director|President|VP|Vice President|Senior|Junior|Lead|Head of)/i);
    if (titleMatch) {
      data.title = titleMatch[0];
    }
    
    return data;
  }

  private extractContractData(text: string): Record<string, any> {
    const data: Record<string, any> = {};
    
    // Contract title
    const titleMatch = text.match(/^([A-Z\s]+AGREEMENT|[A-Z\s]+CONTRACT)/m);
    if (titleMatch) {
      data.contractTitle = titleMatch[1].trim();
    }
    
    // Parties
    const partiesMatch = text.match(/between\s+([^,\n]+)\s+and\s+([^,\n]+)/i);
    if (partiesMatch) {
      data.party1 = partiesMatch[1].trim();
      data.party2 = partiesMatch[2].trim();
    }
    
    return data;
  }

  getFormattedHTML(result: OCRResult): string {
    const text = this.formatText(result);
    
    // Convert plain text to HTML with enhanced formatting
    let html = this.convertTextToHTML(text);

    // Add structured data if available
    const structuredData = this.extractStructuredData(result);
    if (Object.keys(structuredData).length > 0) {
      html = this.addStructuredDataToHTML(html, structuredData);
    }

    // Add confidence indicator and metadata
    const confidenceClass = this.getConfidenceClass(result.confidence);
    const metadata = this.generateMetadataHTML(result);
    
    html = `
      <div class="ocr-result ${confidenceClass}" data-confidence="${result.confidence}" data-provider="${result.provider}">
        ${metadata}
        <div class="ocr-content">
          ${html}
        </div>
      </div>
    `;

    return html;
  }

  private convertTextToHTML(text: string): string {
    let html = text
      // Escape HTML characters
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Convert formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/__(.*?)__/g, '<u>$1</u>') // Underline
      // Convert structure
      .replace(/^(#{1,6})\s*(.+)$/gm, (_match, hashes, content) => {
        const level = hashes.length;
        return `<h${level}>${content}</h${level}>`;
      }) // Headers
      .replace(/^\* (.+)$/gm, '<li>$1</li>') // List items
      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>') // Numbered list items
      .replace(/\n\n/g, '</p><p>') // Paragraphs
      .replace(/\n/g, '<br>'); // Line breaks

    // Wrap in paragraph tags
    html = `<p>${html}</p>`;

    // Fix list formatting
    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, ''); // Merge consecutive lists

    return html;
  }

  private addStructuredDataToHTML(html: string, structuredData: StructuredData): string {
    let structuredHTML = '';

    if (structuredData.title) {
      structuredHTML += `<div class="extracted-title"><h3>${structuredData.title}</h3></div>`;
    }

    if (structuredData.date) {
      structuredHTML += `<div class="extracted-date"><strong>Date:</strong> ${structuredData.date.toLocaleDateString()}</div>`;
    }

    if (structuredData.amount) {
      structuredHTML += `<div class="extracted-amount"><strong>Amount:</strong> $${structuredData.amount.toFixed(2)}</div>`;
    }

    if (structuredData.entities && structuredData.entities.length > 0) {
      const entitiesHTML = structuredData.entities
        .map(entity => `<span class="entity entity-${entity.type}" title="Confidence: ${Math.round(entity.confidence * 100)}%">${entity.text}</span>`)
        .join(', ');
      structuredHTML += `<div class="extracted-entities"><strong>Entities:</strong> ${entitiesHTML}</div>`;
    }

    if (structuredData.keyValuePairs && Object.keys(structuredData.keyValuePairs).length > 0) {
      const kvHTML = Object.entries(structuredData.keyValuePairs)
        .map(([key, value]) => `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`)
        .join('');
      structuredHTML += `<div class="extracted-kv"><table class="kv-table">${kvHTML}</table></div>`;
    }

    if (structuredHTML) {
      return `<div class="structured-data">${structuredHTML}</div><div class="raw-text">${html}</div>`;
    }

    return html;
  }

  private generateMetadataHTML(result: OCRResult): string {
    const confidence = Math.round(result.confidence * 100);
    const processingTime = result.processingTime;
    
    return `
      <div class="ocr-metadata">
        <span class="provider">Provider: ${result.provider.toUpperCase()}</span>
        <span class="confidence">Confidence: ${confidence}%</span>
        <span class="processing-time">Processing: ${processingTime}ms</span>
        ${result.error ? `<span class="error">Error: ${result.error.message}</span>` : ''}
      </div>
    `;
  }

  calculateConfidenceScore(result: OCRResult): number {
    let score = result.confidence;

    // Adjust based on text characteristics
    const textLength = result.text.length;
    const hasStructure = result.text.includes('\n') || result.text.includes('\t');
    const hasSpecialChars = /[^\w\s]/.test(result.text);
    const wordCount = result.text.split(/\s+/).length;

    // Length bonus (longer text usually means better extraction)
    if (textLength > 100) score += 0.05;
    if (textLength > 500) score += 0.05;

    // Structure bonus
    if (hasStructure) score += 0.05;

    // Special characters bonus (indicates preserved formatting)
    if (hasSpecialChars) score += 0.03;

    // Word count bonus
    if (wordCount > 10) score += 0.02;
    if (wordCount > 50) score += 0.03;

    // Provider-specific adjustments
    switch (result.provider) {
      case OCRProvider.OpenAI:
        score += 0.05; // OpenAI tends to be more accurate
        break;
      case OCRProvider.Qwen:
        score += 0.02; // Qwen is good but slightly less consistent
        break;
      case OCRProvider.Fallback:
        score -= 0.2; // Fallback is much less reliable
        break;
    }

    // Processing time penalty (very fast might indicate poor processing)
    if (result.processingTime < 1000) {
      score -= 0.05;
    }

    // Error penalty
    if (result.error) {
      score -= 0.1;
    }

    // Ensure score is within bounds
    return Math.min(Math.max(score, 0), 1);
  }

  private fixCommonOCRErrors(text: string): string {
    // Apply corrections contextually (this is a simplified version)
    let correctedText = text;
    
    // Fix common word patterns
    correctedText = correctedText
      .replace(/\bl\b/g, 'I') // Standalone lowercase l to I
      .replace(/\b0\b/g, 'O') // Standalone zero to O in word contexts
      .replace(/(\d)O(\d)/g, '$10$2') // O between digits should be 0
      .replace(/(\w)l(\w)/g, '$1I$2'); // l between letters should be I

    return correctedText;
  }

  private extractTitle(text: string, strategy: string = 'conservative'): string | undefined {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      return undefined;
    }

    if (strategy === 'aggressive') {
      // Look for the most prominent line (all caps, centered, or first substantial line)
      for (const line of lines.slice(0, 5)) { // Check first 5 lines
        const trimmed = line.trim();
        
        // Skip very short lines or lines that look like metadata
        if (trimmed.length < 3 || /^\d+$/.test(trimmed) || /^page\s+\d+/i.test(trimmed)) {
          continue;
        }
        
        // Prefer all caps lines (likely headers)
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && trimmed.length < 80) {
          return trimmed;
        }
        
        // Or lines with title-like formatting
        if (trimmed.length > 10 && trimmed.length < 100) {
          return trimmed.length > 100 ? trimmed.substring(0, 100) + '...' : trimmed;
        }
      }
    }

    // Conservative approach: first non-empty line
    const firstLine = lines[0].trim();
    
    // Title shouldn't be too long
    if (firstLine.length > 100) {
      return firstLine.substring(0, 100) + '...';
    }

    return firstLine;
  }

  private extractDate(text: string, strategy: string = 'conservative'): Date | undefined {
    // Extended date patterns for aggressive strategy
    const datePatterns = strategy === 'aggressive' ? [
      // Standard patterns
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g,
      /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/g,
      /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})\b/gi,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})\b/gi,
      // Additional patterns for aggressive mode
      /\b(\d{1,2})(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})\b/gi,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})(st|nd|rd|th)?,?\s+(\d{4})\b/gi,
      /\b(\d{2})(\d{2})(\d{4})\b/g, // MMDDYYYY
      /\b(\d{4})(\d{2})(\d{2})\b/g, // YYYYMMDD
    ] : [
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
      /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
      /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})\b/i,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})\b/i
    ];

    const foundDates: Date[] = [];

    for (const pattern of datePatterns) {
      let match;
      const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      
      while ((match = globalPattern.exec(text)) !== null) {
        const dateStr = match[0];
        const parsedDate = new Date(dateStr);
        
        if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1900 && parsedDate.getFullYear() < 2100) {
          foundDates.push(parsedDate);
        }
      }
    }

    if (foundDates.length === 0) {
      return undefined;
    }

    // Return the most recent date that's not in the future
    const now = new Date();
    const validDates = foundDates.filter(date => date <= now);
    
    if (validDates.length > 0) {
      return validDates.reduce((latest, current) => current > latest ? current : latest);
    }

    // If all dates are in the future, return the earliest one
    return foundDates.reduce((earliest, current) => current < earliest ? current : earliest);
  }

  private extractAmount(text: string, strategy: string = 'conservative'): number | undefined {
    // Extended amount patterns for aggressive strategy
    const amountPatterns = strategy === 'aggressive' ? [
      // Standard currency patterns
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\$/g,
      /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|CAD|AUD)\b/gi,
      // Additional patterns for aggressive mode
      /(?:total|amount|sum|price|cost|fee|charge)[\s:]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|euros?|pounds?)/gi,
      /€\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g,
      /£\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g,
      /¥\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g,
    ] : [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\$/,
      /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP)\b/i
    ];

    const foundAmounts: number[] = [];

    for (const pattern of amountPatterns) {
      let match;
      const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      
      while ((match = globalPattern.exec(text)) !== null) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        
        if (!isNaN(amount) && amount > 0 && amount < 1000000) { // Reasonable range
          foundAmounts.push(amount);
        }
      }
    }

    if (foundAmounts.length === 0) {
      return undefined;
    }

    // For invoices/receipts, usually want the largest amount (total)
    // For other documents, might want the first mentioned amount
    if (strategy === 'aggressive') {
      return Math.max(...foundAmounts);
    } else {
      return foundAmounts[0]; // First found amount
    }
  }

  private extractNamedEntities(text: string, strategy: string = 'conservative'): NamedEntity[] {
    const entities: NamedEntity[] = [];

    // Email extraction
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let emailMatch;
    while ((emailMatch = emailPattern.exec(text)) !== null) {
      entities.push({
        text: emailMatch[0],
        type: 'email',
        confidence: 0.95
      });
    }

    // Phone number extraction (multiple formats)
    const phonePatterns = [
      /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g, // US format
      /\b\+?(\d{1,3})[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})\b/g, // International
      /\b(\d{3})[-.\s](\d{3})[-.\s](\d{4})\b/g // Simple format
    ];

    for (const pattern of phonePatterns) {
      let phoneMatch;
      while ((phoneMatch = pattern.exec(text)) !== null) {
        entities.push({
          text: phoneMatch[0],
          type: 'phone',
          confidence: 0.85
        });
      }
    }

    if (strategy === 'aggressive') {
      // URL extraction
      const urlPattern = /https?:\/\/[^\s]+/g;
      let urlMatch;
      while ((urlMatch = urlPattern.exec(text)) !== null) {
        entities.push({
          text: urlMatch[0],
          type: 'url',
          confidence: 0.9
        });
      }

      // Address extraction (basic)
      const addressPattern = /\b\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)[A-Za-z\s,]*\b/gi;
      let addressMatch;
      while ((addressMatch = addressPattern.exec(text)) !== null) {
        entities.push({
          text: addressMatch[0],
          type: 'address',
          confidence: 0.7
        });
      }

      // Social Security Number (masked for privacy)
      const ssnPattern = /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g;
      let ssnMatch;
      while ((ssnMatch = ssnPattern.exec(text)) !== null) {
        entities.push({
          text: ssnMatch[0].replace(/\d/g, '*'), // Mask for privacy
          type: 'ssn',
          confidence: 0.8
        });
      }

      // Credit Card Numbers (masked for privacy)
      const ccPattern = /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g;
      let ccMatch;
      while ((ccMatch = ccPattern.exec(text)) !== null) {
        const masked = ccMatch[0].replace(/\d(?=\d{4})/g, '*');
        entities.push({
          text: masked,
          type: 'credit_card',
          confidence: 0.75
        });
      }

      // Names (basic pattern matching)
      const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
      let nameMatch;
      while ((nameMatch = namePattern.exec(text)) !== null) {
        // Filter out common false positives
        const name = nameMatch[0];
        if (!this.isCommonFalsePositive(name)) {
          entities.push({
            text: name,
            type: 'person_name',
            confidence: 0.6
          });
        }
      }

      // Company names (basic heuristics)
      const companyPattern = /\b[A-Z][A-Za-z\s&]+(Inc|LLC|Corp|Corporation|Company|Co|Ltd|Limited)\b/g;
      let companyMatch;
      while ((companyMatch = companyPattern.exec(text)) !== null) {
        entities.push({
          text: companyMatch[0],
          type: 'company',
          confidence: 0.7
        });
      }
    }

    // Remove duplicates
    const uniqueEntities = new Map<string, NamedEntity>();
    for (const entity of entities) {
      const key = `${entity.type}:${entity.text.toLowerCase()}`;
      const existing = uniqueEntities.get(key);
      if (!existing || entity.confidence > existing.confidence) {
        uniqueEntities.set(key, entity);
      }
    }

    return Array.from(uniqueEntities.values());
  }

  private isCommonFalsePositive(name: string): boolean {
    const falsePositives = [
      'Page Number', 'Date Time', 'First Last', 'John Doe', 'Jane Doe',
      'Your Name', 'Full Name', 'Last Name', 'First Name'
    ];
    return falsePositives.some(fp => name.toLowerCase().includes(fp.toLowerCase()));
  }

  private extractKeyValuePairs(text: string, strategy: string = 'conservative'): Record<string, string> {
    const pairs: Record<string, string> = {};
    
    // Multiple patterns for key-value extraction
    const patterns = strategy === 'aggressive' ? [
      /^([A-Za-z\s]+):\s*(.+)$/gm, // Standard colon format
      /^([A-Za-z\s]+)\s*-\s*(.+)$/gm, // Dash format
      /^([A-Za-z\s]+)\s*=\s*(.+)$/gm, // Equals format
      /^([A-Za-z\s]+)\s+(.+)$/gm, // Space separated (more aggressive)
    ] : [
      /^([A-Za-z\s]+):\s*(.+)$/gm, // Standard colon format only
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        // Validate key-value pair
        if (this.isValidKeyValuePair(key, value, strategy)) {
          pairs[key] = value;
        }
      }
    }

    // Additional extraction for common document fields
    if (strategy === 'aggressive') {
      this.extractCommonFields(text, pairs);
    }

    return pairs;
  }

  private isValidKeyValuePair(key: string, value: string, strategy: string): boolean {
    // Basic validation
    if (key.length === 0 || value.length === 0) {
      return false;
    }

    // Key should be reasonable length and not too generic
    if (key.length > 50 || key.length < 2) {
      return false;
    }

    // Value should not be too long (likely not a key-value pair)
    if (value.length > 200) {
      return false;
    }

    if (strategy === 'aggressive') {
      // More lenient validation
      return true;
    } else {
      // Conservative validation - key should look like a label
      return /^[A-Za-z\s]+$/.test(key) && !key.toLowerCase().includes('the ');
    }
  }

  private extractCommonFields(text: string, pairs: Record<string, string>): void {
    // Common document fields with flexible patterns
    const commonFields = [
      { key: 'Invoice Number', patterns: [/invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i] },
      { key: 'Order Number', patterns: [/order\s*#?\s*:?\s*([A-Z0-9-]+)/i] },
      { key: 'Reference', patterns: [/ref\s*#?\s*:?\s*([A-Z0-9-]+)/i] },
      { key: 'Account Number', patterns: [/account\s*#?\s*:?\s*([A-Z0-9-]+)/i] },
      { key: 'Customer ID', patterns: [/customer\s*id\s*:?\s*([A-Z0-9-]+)/i] },
      { key: 'Total Amount', patterns: [/total\s*:?\s*\$?([0-9,]+\.?\d*)/i] },
      { key: 'Subtotal', patterns: [/subtotal\s*:?\s*\$?([0-9,]+\.?\d*)/i] },
      { key: 'Tax', patterns: [/tax\s*:?\s*\$?([0-9,]+\.?\d*)/i] },
    ];

    for (const field of commonFields) {
      if (!pairs[field.key]) { // Don't override existing values
        for (const pattern of field.patterns) {
          const match = text.match(pattern);
          if (match) {
            pairs[field.key] = match[1];
            break;
          }
        }
      }
    }
  }

  private getConfidenceClass(confidence: number): string {
    if (confidence >= 0.9) return 'confidence-high';
    if (confidence >= 0.7) return 'confidence-medium';
    return 'confidence-low';
  }
}