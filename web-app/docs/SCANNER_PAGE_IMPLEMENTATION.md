# ScannerPage Component Implementation

## Overview

The ScannerPage component is the main entry point for the Document Scanner feature in Nexa Manager. It provides a comprehensive user interface for document digitization with camera capture and file upload capabilities.

## Component Architecture

### File Location
`web-app/src/components/scanner/ScannerPage.tsx`

### Key Features

1. **Tabbed Interface**: Switch between camera capture and file upload modes
2. **Real-time Status**: Live processing indicators for each workflow step
3. **Error Management**: Comprehensive error handling with user-friendly feedback
4. **Document Review**: Preview and edit workflow before final save
5. **Responsive Design**: Mobile and desktop optimized layout
6. **Debug Information**: Development-only debug panel

## Implementation Details

### State Management

The component uses the `useScanner` hook for centralized state management:

```typescript
const scanner = useScanner();
```

### Processing Workflow

1. **Document Input**: User captures via camera or uploads files
2. **Processing Status**: Real-time feedback during image processing
3. **OCR Extraction**: AI-powered text extraction with status updates
4. **Document Review**: Preview extracted content and metadata
5. **Final Save**: Document saved with client/project association
6. **Completion**: Callback fired with processed document

### UI Components

#### Header Section
- Page title and description
- Real-time processing status indicator with spinner
- Status messages for different processing steps

#### Error Handling
- Dismissible error alerts with red styling
- Clear error messages for user understanding
- Error recovery through dismiss functionality

#### Tab Navigation
- Camera and Upload tabs with icons
- Disabled state handling for unsupported features
- Loading state management during processing

#### Content Areas
- Camera capture interface (when camera tab is active)
- File upload interface (when upload tab is active)
- Document preview interface (during review step)

#### Debug Panel (Development Only)
- Current processing step display
- Active tab information
- Camera support status
- Processing state indicators
- Configuration values (category, client ID, project ID)

### Props Interface

```typescript
interface ScannerProps {
  onDocumentProcessed: (document: ProcessedDocument) => void;
  defaultCategory?: string;
  clientId?: string;
  projectId?: string;
}
```

### Processing Steps

The component handles different processing steps from the `ScannerStep` enum:

- `Idle`: Initial state, ready for input
- `Processing`: Image processing in progress
- `OCR`: Text extraction in progress
- `Review`: Document preview and editing
- `Saving`: Document persistence in progress
- `Complete`: Processing finished successfully
- `Error`: Error occurred during processing

### Error Handling Strategy

1. **Capture Errors**: Try-catch blocks around async operations
2. **User Feedback**: Clear error messages in dismissible alerts
3. **Error Recovery**: Reset functionality to return to idle state
4. **Logging**: Console logging for debugging purposes

### Integration Points

#### Camera Capture
```typescript
const handleCameraCapture = async (image: Blob) => {
  try {
    setError(null);
    await scanner.processDocument(image);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to process captured image');
  }
};
```

#### File Upload
```typescript
const handleFileUpload = async (files: File[]) => {
  try {
    setError(null);
    await scanner.fileUpload.processFiles(files);
    
    if (files.length > 0) {
      const blob = new Blob([files[0]], { type: files[0].type });
      await scanner.processDocument(blob);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to process uploaded files');
  }
};
```

#### Document Saving
```typescript
const handleSave = async (doc: ProcessedDocument) => {
  try {
    await scanner.saveProcessedDocument({
      ...doc,
      category: defaultCategory || doc.category,
      clientId: clientId || doc.clientId,
      projectId: projectId || doc.projectId,
    });
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to save document');
  }
};
```

## Styling and Design

### TailwindCSS Classes

The component uses a comprehensive set of TailwindCSS classes for styling:

- **Layout**: `min-h-screen`, `max-w-7xl`, `mx-auto`, `px-4 sm:px-6 lg:px-8`
- **Colors**: `bg-gray-50`, `bg-white`, `text-gray-900`, `text-blue-600`
- **Spacing**: `py-6`, `py-8`, `space-x-2`, `space-y-1`
- **Borders**: `border-b`, `border-gray-200`, `rounded-lg`
- **Shadows**: `shadow-sm`, `shadow`
- **Interactive**: `hover:bg-red-200`, `focus:outline-none`, `focus:ring-2`

### Responsive Design

- Mobile-first approach with responsive breakpoints
- Flexible grid layout that adapts to screen size
- Touch-friendly button sizes and spacing
- Optimized typography for different screen sizes

### Accessibility

- Proper ARIA labels for navigation elements
- Keyboard navigation support
- Screen reader friendly error messages
- High contrast colors for visibility
- Focus management for interactive elements

## Testing Considerations

### Unit Tests
- Component rendering with different props
- Error state handling and display
- Tab switching functionality
- Processing status updates
- Debug panel visibility in development

### Integration Tests
- Camera capture workflow
- File upload workflow
- Document review process
- Error recovery scenarios
- State management integration

### E2E Tests
- Complete document scanning workflow
- Cross-browser camera support
- File upload with different file types
- Error handling user experience
- Mobile device compatibility

## Performance Optimizations

### React Optimizations
- `useCallback` for event handlers to prevent unnecessary re-renders
- Conditional rendering for different processing steps
- Efficient state updates with proper dependency arrays

### Loading States
- Immediate feedback for user actions
- Progressive loading indicators
- Optimistic UI updates where appropriate

### Memory Management
- Proper cleanup of camera streams
- File object disposal after processing
- Error state cleanup on component unmount

## Future Enhancements

### Planned Features
- Batch document processing
- Advanced image editing tools
- Document templates and presets
- Offline processing capabilities
- Enhanced mobile camera controls

### Technical Improvements
- Service worker integration for offline support
- WebAssembly for client-side image processing
- Progressive Web App features
- Advanced error recovery mechanisms

## Dependencies

### React Ecosystem
- React 19 with TypeScript
- React hooks for state management
- React Context for global state

### UI Libraries
- Heroicons for consistent iconography
- TailwindCSS for styling and responsive design

### Browser APIs
- MediaDevices API for camera access
- File API for file handling
- Canvas API for image processing
- Fetch API for service communication

## Configuration

### Environment Variables
```env
NODE_ENV=development  # Enables debug panel
```

### Component Configuration
```typescript
const config = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  enableDebug: process.env.NODE_ENV === 'development'
};
```

## Troubleshooting

### Common Issues

**Camera Not Working**
- Check browser permissions
- Ensure HTTPS connection
- Verify camera hardware availability

**File Upload Fails**
- Check file size limits (10MB max)
- Verify file type support
- Ensure sufficient storage space

**Processing Errors**
- Check network connectivity
- Verify API key configuration
- Review browser console for detailed errors

**UI Not Responsive**
- Clear browser cache
- Check TailwindCSS compilation
- Verify responsive breakpoints

### Debug Information

The debug panel (development only) provides:
- Current processing step
- Active tab information
- Camera support status
- Processing state indicators
- Configuration values

This information helps developers understand the component's internal state and troubleshoot issues effectively.