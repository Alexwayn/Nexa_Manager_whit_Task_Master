/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock the logger
jest.mock('@utils/Logger', () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import EmailAttachmentManager from '../EmailAttachmentManager';
import emailAttachmentService from '@lib/emailAttachmentService';
import { Logger } from '@utils/Logger';

// Setup user-event with clipboard disabled to avoid conflicts
const setupUserEvent = () => {
  return userEvent.setup({
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0,
  });
};

describe('EmailAttachmentManager', () => {
  const defaultProps = {
    attachments: [],
    onAttachmentsChange: jest.fn(),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    allowedTypes: ['image/*', 'application/pdf', 'text/*'],
  };

  const setupUserEvent = () => userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Spy on emailAttachmentService methods
    jest.spyOn(emailAttachmentService, 'getConfig').mockReturnValue({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxTotalSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      allowedTypes: ['image/*', 'application/pdf', 'text/*'],
      bannedExtensions: ['.exe', '.bat'],
    });

    jest.spyOn(emailAttachmentService, 'validateFile').mockReturnValue({
      isValid: true,
      error: null,
    });

    jest.spyOn(emailAttachmentService, 'validateFiles').mockReturnValue({
      isValid: true,
      errors: [],
    });

    jest.spyOn(emailAttachmentService, 'uploadAttachment').mockResolvedValue({
      id: 'test-id',
      url: 'test-url',
      progress: 100,
    });

    jest.spyOn(emailAttachmentService, 'uploadAttachments').mockResolvedValue([
      {
        id: 'test-id',
        url: 'test-url',
        progress: 100,
      },
    ]);

    jest.spyOn(emailAttachmentService, 'deleteAttachment').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    test('should render attachment manager with upload area', () => {
      render(<EmailAttachmentManager {...defaultProps} />);

      expect(screen.getByText(/drop files here or click to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/maximum 5 files/i)).toBeInTheDocument();
    });

    test('should show attachment list when attachments exist', () => {
      const attachments = [
        { id: '1', name: 'test.pdf', size: 1024, type: 'application/pdf' },
        { id: '2', name: 'image.jpg', size: 2048, type: 'image/jpeg' },
      ];

      render(<EmailAttachmentManager {...defaultProps} attachments={attachments} />);

      expect(screen.getByText(/attachments \(2\/5\)/i)).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.jpg')).toBeInTheDocument();
    });

    test('should show file type information', () => {
      render(<EmailAttachmentManager {...defaultProps} />);

      expect(screen.getByText(/allowed file types/i)).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('should handle file input upload', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

      emailAttachmentService.uploadAttachments.mockResolvedValue({
        success: true,
        data: [{ id: '1', name: 'test.txt', size: 1024, type: 'text/plain' }],
      });

      render(<EmailAttachmentManager {...defaultProps} />);

      // Find the file input directly
      const fileInput = document.querySelector('input[type="file"]');
      
      // Simulate file selection
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(emailAttachmentService.uploadAttachments).toHaveBeenCalledWith([file], []);
      });

      expect(defaultProps.onAttachmentsChange).toHaveBeenCalledWith([
        { id: '1', name: 'test.txt', size: 1024, type: 'text/plain' },
      ]);
    });

    test('should handle drag and drop upload', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

      emailAttachmentService.uploadAttachments.mockResolvedValue({
        success: true,
        data: [{ id: '1', name: 'test.txt', size: 1024, type: 'text/plain' }],
      });

      render(<EmailAttachmentManager {...defaultProps} />);

      // Find the main upload area div with border-2 class
      const uploadArea = document.querySelector('div[class*="border-2"]');

      // Simulate drag enter
      fireEvent.dragEnter(uploadArea, {
        dataTransfer: { files: [file] },
      });

      expect(uploadArea).toHaveClass('border-blue-500', 'bg-blue-50');

      // Simulate drop
      fireEvent.drop(uploadArea, {
        dataTransfer: { files: [file] },
      });

      await waitFor(() => {
        expect(emailAttachmentService.uploadAttachments).toHaveBeenCalledWith([file], []);
      });

      expect(defaultProps.onAttachmentsChange).toHaveBeenCalledWith([
        { id: '1', name: 'test.txt', size: 1024, type: 'text/plain' },
      ]);
    });

    test('should show uploading state', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      // Mock a delayed response
      emailAttachmentService.uploadAttachments.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            data: [{ id: '1', name: 'test.txt', size: 1024, type: 'text/plain' }],
          }), 100)
        )
      );

      render(<EmailAttachmentManager {...defaultProps} />);

      // Find the file input directly
      const fileInput = document.querySelector('input[type="file"]');
      
      // Simulate file selection
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Should show uploading state
      expect(screen.getByText('Uploading files...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Uploading files...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle upload errors gracefully', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      emailAttachmentService.uploadAttachments.mockResolvedValue({
        success: false,
        error: 'Upload failed',
      });

      render(<EmailAttachmentManager {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/upload errors/i)).toBeInTheDocument();
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });
    });

    test('should handle network errors', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      emailAttachmentService.uploadAttachments.mockRejectedValue(new Error('Network error'));

      render(<EmailAttachmentManager {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/upload errors/i)).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('should allow dismissing errors', async () => {
      const user = setupUserEvent();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      emailAttachmentService.uploadAttachments.mockResolvedValue({
        success: false,
        error: 'Upload failed',
      });

      render(<EmailAttachmentManager {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/upload errors/i)).toBeInTheDocument();
      });

      // Find and click the dismiss button (X button)
      const dismissButton = screen.getByRole('button', { name: '' }); // XMarkIcon button
      await user.click(dismissButton);

      expect(screen.queryByText(/upload errors/i)).not.toBeInTheDocument();
    });
  });

  describe('Attachment Management', () => {
    test('should allow removing attachments', async () => {
      const user = setupUserEvent();
      const attachments = [
        { id: '1', name: 'test.pdf', size: 1024, type: 'application/pdf' }
      ];

      render(<EmailAttachmentManager {...defaultProps} attachments={attachments} />);

      const removeButton = screen.getByTitle('Remove');
      await user.click(removeButton);

      expect(emailAttachmentService.deleteAttachment).toHaveBeenCalledWith('1');
      expect(defaultProps.onAttachmentsChange).toHaveBeenCalled();
    });

    test('should allow previewing attachments', async () => {
      const user = setupUserEvent();
      const attachments = [
        { id: '1', name: 'test.pdf', size: 1024, type: 'application/pdf' }
      ];

      // Mock window.alert to avoid actual alert in tests
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<EmailAttachmentManager {...defaultProps} attachments={attachments} />);

      const previewButton = screen.getByTitle('Preview');
      await user.click(previewButton);

      expect(alertSpy).toHaveBeenCalledWith('Preview functionality would show test.pdf');
      
      alertSpy.mockRestore();
    });

    test('should show file size warning when approaching limit', () => {
      // maxTotalSize is 50MB, so 80% is 40MB. We need more than 40MB to trigger the warning
      const largeAttachments = [
        { id: '1', name: 'large.pdf', size: 42 * 1024 * 1024, type: 'application/pdf' } // 42MB > 40MB (80% of 50MB)
      ];

      render(<EmailAttachmentManager {...defaultProps} attachments={largeAttachments} />);

      expect(screen.getByText(/approaching size limit/i)).toBeInTheDocument();
    });
  });

  describe('Size Warnings', () => {
    test('should show size warning when approaching limit', () => {
      // maxTotalSize is 50MB, so 80% is 40MB. We need more than 40MB to trigger the warning
      const attachments = [
        {
          id: '1',
          name: 'large-file.pdf',
          size: 42 * 1024 * 1024, // 42MB > 40MB (80% of 50MB)
          type: 'application/pdf',
        },
      ];

      render(<EmailAttachmentManager {...defaultProps} attachments={attachments} />);

      expect(screen.getByText(/approaching size limit/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      const attachments = [
        { id: '1', name: 'test.pdf', size: 1024, type: 'application/pdf' }
      ];

      render(<EmailAttachmentManager {...defaultProps} attachments={attachments} />);

      // Check file input attributes
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('multiple');

      // Check that remove button has proper title
      const removeButton = screen.getByTitle('Remove');
      expect(removeButton).toBeInTheDocument();

      // Check that preview button has proper title
      const previewButton = screen.getByTitle('Preview');
      expect(previewButton).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = setupUserEvent();
      const attachments = [
        { id: '1', name: 'test.pdf', size: 1024, type: 'application/pdf' }
      ];

      render(<EmailAttachmentManager {...defaultProps} attachments={attachments} />);

      // Get the interactive elements
      const previewButton = screen.getByTitle('Preview');
      const removeButton = screen.getByTitle('Remove');

      // Focus on preview button first
      previewButton.focus();
      expect(previewButton).toHaveFocus();

      // Tab to remove button
      await user.tab();
      expect(removeButton).toHaveFocus();
    });

    test('should handle disabled state properly', () => {
      render(<EmailAttachmentManager {...defaultProps} disabled={true} />);

      // Find the upload area div that contains the text and has the disabled classes
      const uploadAreaText = screen.getByText(/drop files here or click to upload/i);
      const uploadArea = uploadAreaText.closest('div[class*="border-2"]');
      
      expect(uploadArea).toHaveClass('opacity-50');
      expect(uploadArea).toHaveClass('cursor-not-allowed');

      // The file input should be disabled
      const fileInput = uploadArea.querySelector('input[type="file"]');
      expect(fileInput).toBeDisabled();
    });
  });
});