/**
 * Mock for quotePdfService
 * Provides mock implementations for PDF generation functionality
 */

const mockQuotePdfService = {
  generateBlob: jest.fn().mockResolvedValue(new Blob(['mock-pdf'], { type: 'application/pdf' })),
  generatePdf: jest.fn().mockResolvedValue(new Blob(['mock-pdf'], { type: 'application/pdf' })),
  generateQuotePdf: jest.fn().mockResolvedValue(new Blob(['mock-pdf'], { type: 'application/pdf' })),
  createPdfDocument: jest.fn().mockResolvedValue({
    save: jest.fn().mockResolvedValue(new Blob(['mock-pdf'], { type: 'application/pdf' })),
    output: jest.fn().mockReturnValue('mock-pdf-data'),
  }),
  downloadPdf: jest.fn().mockResolvedValue(true),
  previewPdf: jest.fn().mockResolvedValue('data:application/pdf;base64,mock-pdf-data'),
};

// Default export
export default mockQuotePdfService;

// Named exports
export const generateBlob = mockQuotePdfService.generateBlob;
export const generatePdf = mockQuotePdfService.generatePdf;
export const generateQuotePdf = mockQuotePdfService.generateQuotePdf;
export const createPdfDocument = mockQuotePdfService.createPdfDocument;
export const downloadPdf = mockQuotePdfService.downloadPdf;
export const previewPdf = mockQuotePdfService.previewPdf;

// CommonJS compatibility
module.exports = mockQuotePdfService;
module.exports.default = mockQuotePdfService;
module.exports.generateBlob = mockQuotePdfService.generateBlob;
module.exports.generatePdf = mockQuotePdfService.generatePdf;
module.exports.generateQuotePdf = mockQuotePdfService.generateQuotePdf;
module.exports.createPdfDocument = mockQuotePdfService.createPdfDocument;
module.exports.downloadPdf = mockQuotePdfService.downloadPdf;
module.exports.previewPdf = mockQuotePdfService.previewPdf;
