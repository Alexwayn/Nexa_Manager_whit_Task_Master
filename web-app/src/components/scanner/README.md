# Scanner Feature

This directory contains the Document Scanner feature implementation for Nexa Manager.

## Overview

The Scanner feature allows users to digitize physical documents using their device's camera or by uploading existing images. It includes AI-powered OCR (Optical Character Recognition) to extract text from documents and organize them within the platform.

## Directory Structure

```
scanner/
├── README.md                 # This file
├── index.ts                  # Feature exports
├── types.ts                  # Component-specific types
├── ScannerPage.tsx          # Main scanner page component
├── CameraCapture.tsx        # Camera capture component
├── FileUpload.tsx           # File upload component
└── DocumentPreview.tsx      # Document preview component
```

## Related Files

### Services (`/src/services/scanner/`)
- `cameraService.ts` - Camera access and image capture
- `fileUploadService.ts` - File validation and processing
- `imageProcessingService.ts` - Image enhancement and manipulation
- `ocrService.ts` - AI-powered OCR with multiple providers
- `ocrResultHandler.ts` - OCR result processing and formatting
- `documentStorageService.ts` - Document storage and retrieval

### Hooks (`/src/hooks/scanner/`)
- `useScanner.ts` - Main scanner orchestration hook
- `useCamera.ts` - Camera functionality hook (to be implemented)
- `useFileUpload.ts` - File upload hook (to be implemented)
- `useImageProcessing.ts` - Image processing hook (to be implemented)
- `useOCR.ts` - OCR functionality hook (to be implemented)
- `useDocumentStorage.ts` - Document storage hook (to be implemented)

### Types (`/src/types/scanner.ts`)
- Core types and interfaces for the Scanner feature
- Service interfaces and data models
- OCR provider types and configurations

### Configuration (`/src/config/scanner.ts`)
- Scanner feature configuration
- OCR provider settings
- File upload limits and accepted types

## Key Features

1. **Camera Capture** - Use device camera to scan documents
2. **File Upload** - Upload existing document images (JPG, PNG, PDF)
3. **Image Processing** - Automatic image enhancement and document edge detection
4. **AI-Powered OCR** - Text extraction using multiple AI providers:
   - OpenAI Vision API
   - Qwen OCR API
   - Fallback OCR services
5. **Document Management** - Organize, categorize, and search scanned documents
6. **Sharing** - Share documents with clients and team members

## Implementation Status

✅ **Task 1: Project Structure** - Complete
- Directory structure created
- Core interfaces and types defined
- Service implementations scaffolded
- Component placeholders created

✅ **Task 2.1: ScannerPage Component** - Complete
- Tabbed interface with camera and upload options
- Real-time processing status indicators
- Comprehensive error handling with user feedback
- Document review workflow integration
- State management via useScanner hook
- Responsive design with TailwindCSS
- Debug information panel for development

🔄 **Task 2: Scanner UI Components** - In Progress
- Task 2.2: CameraCapture component implementation
- Task 2.3: FileUpload component with drag-and-drop
- Task 2.4: DocumentPreview component for editing

⏳ **Upcoming Tasks**
- Task 3: Image processing service
- Task 4: AI OCR service
- Task 5: Document storage and management
- Task 6: Error handling and optimization
- Task 7: Unit and integration tests
- Task 8: Document sharing functionality

## Usage

### ScannerPage Component

```typescript
import { ScannerPage } from '@/components/scanner';

const MyComponent = () => {
  const handleDocumentProcessed = (document: ProcessedDocument) => {
    console.log('Document processed and saved:', document);
    // Document is now saved to the database with metadata
  };

  return (
    <ScannerPage
      onDocumentProcessed={handleDocumentProcessed}
      defaultCategory="invoices"
      clientId="client-123"
      projectId="project-456"
    />
  );
};
```

### ScannerPage Props

```typescript
interface ScannerProps {
  onDocumentProcessed: (document: ProcessedDocument) => void;
  defaultCategory?: string;
  clientId?: string;
  projectId?: string;
}
```

### Key Features

- **Tabbed Interface**: Camera capture and file upload tabs
- **Real-time Status**: Processing indicators for each step
- **Error Handling**: User-friendly error messages with dismiss
- **Document Review**: Preview and edit before saving
- **Responsive Design**: Mobile and desktop optimized
- **Debug Mode**: Development information panel

## Configuration

The Scanner feature can be configured via environment variables:

```env
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_QWEN_API_KEY=your_qwen_api_key
```

See `/src/config/scanner.ts` for detailed configuration options.

## Dependencies

- React 19 with TypeScript
- TailwindCSS for styling
- Canvas API for image processing
- MediaDevices API for camera access
- File API for file handling
- Fetch API for OCR service integration

## Next Steps

1. Implement Scanner UI components (Task 2)
2. Add camera capture functionality
3. Implement file upload with drag-and-drop
4. Integrate AI OCR services
5. Add document storage and management
6. Implement error handling and user feedback
7. Add comprehensive testing
8. Implement document sharing features