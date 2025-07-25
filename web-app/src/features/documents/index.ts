// Documents Feature - Public API

// Components
export { default as DocumentViewer } from './components/DocumentManager'; // Using DocumentManager.jsx as fallback
export { default as DocumentUpload } from './components/DocumentUploadModal'; // Using DocumentUploadModal.jsx
export { default as DocumentList } from './components/DocumentsList'; // Using DocumentsList.jsx
export { default as DocumentManager } from './components/DocumentManager';
export { default as PDFGenerator } from './components/PDFGenerator';
export { default as ReceiptUpload } from './components/ReceiptUpload';
export { default as DocumentSearch } from './components/DocumentManager'; // Using DocumentManager.jsx as fallback
export { default as DocumentFilters } from './components/DocumentManager'; // Using DocumentManager.jsx as fallback

// Hooks (if any exist)
// export { default as useDocuments } from './hooks/useDocuments';

// Services
export { default as documentService } from './services/documentService.js';
export { default as pdfGenerationService } from './services/pdfGenerationService.js';
export { default as receiptUploadService } from './services/receiptUploadService.js';