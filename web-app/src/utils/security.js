/**
 * Security utility functions for file handling and validation
 */

// File type validation
export const ALLOWED_FILE_TYPES = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ],
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  archives: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ]
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  document: 50 * 1024 * 1024, // 50MB
  image: 10 * 1024 * 1024,    // 10MB
  archive: 100 * 1024 * 1024, // 100MB
  default: 25 * 1024 * 1024   // 25MB
};

// Maximum number of files per upload
export const MAX_FILES_PER_UPLOAD = 20;

/**
 * Validates if a file type is allowed
 * @param {string} mimeType - The MIME type of the file
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if file type is allowed
 */
export const isFileTypeAllowed = (mimeType, allowedTypes = null) => {
  if (!mimeType) return false;
  
  const allAllowedTypes = allowedTypes || [
    ...ALLOWED_FILE_TYPES.documents,
    ...ALLOWED_FILE_TYPES.images,
    ...ALLOWED_FILE_TYPES.archives
  ];
  
  return allAllowedTypes.includes(mimeType.toLowerCase());
};

/**
 * Validates file size against limits
 * @param {number} fileSize - Size of the file in bytes
 * @param {string} fileType - MIME type of the file
 * @returns {boolean} - True if file size is within limits
 */
export const isFileSizeValid = (fileSize, fileType = 'default') => {
  if (!fileSize || fileSize <= 0) return false;
  
  let limit;
  if (ALLOWED_FILE_TYPES.documents.includes(fileType)) {
    limit = FILE_SIZE_LIMITS.document;
  } else if (ALLOWED_FILE_TYPES.images.includes(fileType)) {
    limit = FILE_SIZE_LIMITS.image;
  } else if (ALLOWED_FILE_TYPES.archives.includes(fileType)) {
    limit = FILE_SIZE_LIMITS.archive;
  } else {
    limit = FILE_SIZE_LIMITS.default;
  }
  
  return fileSize <= limit;
};

/**
 * Sanitizes a filename by removing dangerous characters
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return 'unnamed_file';
  
  return filename
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    // Remove dangerous characters
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Remove multiple underscores
    .replace(/_+/g, '_')
    // Trim underscores from start and end
    .replace(/^_|_$/g, '')
    // Limit length
    .substring(0, 255);
};

/**
 * Validates and sanitizes a folder name
 * @param {string} folderName - Original folder name
 * @returns {object} - {isValid: boolean, sanitized: string, errors: string[]}
 */
export const validateFolderName = (folderName) => {
  const errors = [];
  
  if (!folderName || typeof folderName !== 'string') {
    errors.push('Folder name is required');
    return { isValid: false, sanitized: '', errors };
  }
  
  const trimmed = folderName.trim();
  
  if (trimmed.length === 0) {
    errors.push('Folder name cannot be empty');
    return { isValid: false, sanitized: '', errors };
  }
  
  if (trimmed.length > 255) {
    errors.push('Folder name too long (max 255 characters)');
  }
  
  // Check for reserved names
  const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'];
  if (reservedNames.includes(trimmed.toLowerCase())) {
    errors.push('Folder name is reserved by the system');
  }
  
  // Check for dangerous characters
  const dangerousChars = /[<>:"/\\|?*\x00-\x1F]/g;
  if (dangerousChars.test(trimmed)) {
    errors.push('Folder name contains invalid characters');
  }
  
  // Sanitize the name
  const sanitized = trimmed
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
};

/**
 * Validates a file before upload
 * @param {File} file - File object to validate
 * @param {object} options - Validation options
 * @returns {object} - {isValid: boolean, errors: string[], warnings: string[]}
 */
export const validateFile = (file, options = {}) => {
  const errors = [];
  const warnings = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors, warnings };
  }
  
  const {
    allowedTypes = null,
    maxSize = null,
    requireExtension = true
  } = options;
  
  // Check file type
  if (!isFileTypeAllowed(file.type, allowedTypes)) {
    errors.push(`File type ${file.type || 'unknown'} is not allowed`);
  }
  
  // Check file size
  if (!isFileSizeValid(file.size, file.type)) {
    const limit = maxSize || FILE_SIZE_LIMITS.default;
    errors.push(`File size (${formatFileSize(file.size)}) exceeds limit (${formatFileSize(limit)})`);
  }
  
  // Check filename
  if (!file.name || file.name.trim().length === 0) {
    errors.push('File must have a name');
  } else {
    const sanitized = sanitizeFilename(file.name);
    if (sanitized !== file.name) {
      warnings.push('Filename will be sanitized for security');
    }
    
    if (requireExtension && !sanitized.includes('.')) {
      warnings.push('File has no extension');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates multiple files for batch upload
 * @param {FileList|Array} files - Files to validate
 * @param {object} options - Validation options
 * @returns {object} - {isValid: boolean, validFiles: File[], invalidFiles: object[], errors: string[]}
 */
export const validateFiles = (files, options = {}) => {
  const fileArray = Array.from(files || []);
  const validFiles = [];
  const invalidFiles = [];
  const globalErrors = [];
  
  // Check total number of files
  if (fileArray.length > MAX_FILES_PER_UPLOAD) {
    globalErrors.push(`Too many files. Maximum ${MAX_FILES_PER_UPLOAD} files allowed`);
  }
  
  // Check for duplicate names
  const names = new Set();
  const duplicates = new Set();
  
  fileArray.forEach(file => {
    const sanitized = sanitizeFilename(file.name);
    if (names.has(sanitized)) {
      duplicates.add(sanitized);
    }
    names.add(sanitized);
  });
  
  if (duplicates.size > 0) {
    globalErrors.push(`Duplicate filenames detected: ${Array.from(duplicates).join(', ')}`);
  }
  
  // Validate each file
  fileArray.forEach(file => {
    const validation = validateFile(file, options);
    
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({
        file,
        errors: validation.errors,
        warnings: validation.warnings
      });
    }
  });
  
  return {
    isValid: globalErrors.length === 0 && invalidFiles.length === 0,
    validFiles,
    invalidFiles,
    errors: globalErrors
  };
};

/**
 * Generates a secure random ID
 * @param {number} length - Length of the ID
 * @returns {string} - Random ID
 */
export const generateSecureId = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Formats file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Checks if a URL is safe (prevents XSS)
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is safe
 */
export const isSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Block javascript: and data: URLs
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase().trim();
  
  return !dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol));
};

/**
 * Sanitizes HTML content (basic)
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Rate limiting helper (simple in-memory implementation)
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  reset(identifier) {
    this.requests.delete(identifier);
  }
  
  clear() {
    this.requests.clear();
  }
}

export const createRateLimiter = (maxRequests, windowMs) => {
  return new RateLimiter(maxRequests, windowMs);
};

// Export default object with all functions
export default {
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  MAX_FILES_PER_UPLOAD,
  isFileTypeAllowed,
  isFileSizeValid,
  sanitizeFilename,
  validateFolderName,
  validateFile,
  validateFiles,
  generateSecureId,
  formatFileSize,
  isSafeUrl,
  sanitizeHtml,
  isValidEmail,
  createRateLimiter
}; 
