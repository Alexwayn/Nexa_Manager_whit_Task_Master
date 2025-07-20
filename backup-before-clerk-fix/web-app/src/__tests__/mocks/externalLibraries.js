// External libraries mocks for comprehensive testing
// This file provides detailed mocks for all third-party dependencies

import { jest } from '@jest/globals';

// Mock PDF Generation (jsPDF, PDFKit, etc.)
export const createMockPDFGenerator = () => {
  const mockPDF = {
    // Document creation
    create: jest.fn(() => mockPDF),

    // Page management
    addPage: jest.fn(() => mockPDF),
    setPage: jest.fn(pageNumber => mockPDF),
    getNumberOfPages: jest.fn(() => 1),

    // Text operations
    text: jest.fn((text, x, y, options = {}) => mockPDF),
    setFont: jest.fn((fontName, style = 'normal') => mockPDF),
    setFontSize: jest.fn(size => mockPDF),
    setTextColor: jest.fn(color => mockPDF),

    // Drawing operations
    line: jest.fn((x1, y1, x2, y2) => mockPDF),
    rect: jest.fn((x, y, width, height, style = 'S') => mockPDF),
    circle: jest.fn((x, y, radius, style = 'S') => mockPDF),

    // Images
    addImage: jest.fn((imageData, format, x, y, width, height) => mockPDF),

    // Tables
    autoTable: jest.fn(options => mockPDF),

    // Output
    output: jest.fn((type = 'blob') => {
      if (type === 'blob') {
        return new Blob(['mock pdf content'], { type: 'application/pdf' });
      }
      if (type === 'datauri') {
        return 'data:application/pdf;base64,bW9jayBwZGYgY29udGVudA==';
      }
      if (type === 'arraybuffer') {
        return new ArrayBuffer(8);
      }
      return 'mock pdf content';
    }),

    save: jest.fn((filename = 'document.pdf') => {
      // Simulate file download
      return Promise.resolve({ filename, size: 1024 });
    }),

    // Properties
    internal: {
      pageSize: { width: 210, height: 297 }, // A4
      scaleFactor: 1.33,
    },

    // Helper methods for testing
    _getTextCalls: () => mockPDF.text.mock.calls,
    _getImageCalls: () => mockPDF.addImage.mock.calls,
    _getTableCalls: () => mockPDF.autoTable.mock.calls,
  };

  return mockPDF;
};

// Mock Chart.js
export const createMockChart = () => {
  const mockChart = {
    // Chart instance
    data: { datasets: [], labels: [] },
    options: {},

    // Methods
    update: jest.fn((mode = 'default') => Promise.resolve()),
    render: jest.fn(() => Promise.resolve()),
    destroy: jest.fn(),
    clear: jest.fn(),
    stop: jest.fn(),
    resize: jest.fn((width, height) => mockChart),
    reset: jest.fn(),

    // Data manipulation
    getDatasetMeta: jest.fn(index => ({
      data: [],
      dataset: {},
      controller: {},
    })),

    isDatasetVisible: jest.fn(datasetIndex => true),
    setDatasetVisibility: jest.fn((datasetIndex, visible) => {}),

    // Events
    getElementsAtEventForMode: jest.fn((event, mode, options, useFinalPosition) => []),

    // Canvas
    canvas: {
      getContext: jest.fn(() => ({
        canvas: { width: 400, height: 300 },
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
        createImageData: jest.fn(),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        translate: jest.fn(),
        transform: jest.fn(),
        setLineDash: jest.fn(),
        getLineDash: jest.fn(() => []),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        bezierCurveTo: jest.fn(),
        quadraticCurveTo: jest.fn(),
        arc: jest.fn(),
        arcTo: jest.fn(),
        ellipse: jest.fn(),
        rect: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        clip: jest.fn(),
        isPointInPath: jest.fn(() => false),
        isPointInStroke: jest.fn(() => false),
        measureText: jest.fn(() => ({ width: 100 })),
        fillText: jest.fn(),
        strokeText: jest.fn(),
      })),
      toDataURL: jest.fn(() => 'data:image/png;base64,mock-image-data'),
      toBlob: jest.fn(callback => {
        callback(new Blob(['mock image'], { type: 'image/png' }));
      }),
    },

    // Helper methods for testing
    _simulateClick: (x, y) => {
      const event = { x, y, type: 'click' };
      return mockChart.getElementsAtEventForMode(event, 'nearest', {}, false);
    },

    _updateData: newData => {
      mockChart.data = { ...mockChart.data, ...newData };
      return mockChart.update();
    },
  };

  return mockChart;
};

// Mock Date/Time libraries (date-fns, moment, dayjs)
export const createMockDateLibrary = () => {
  const mockDateLib = {
    // Formatting
    format: jest.fn((date, formatString) => {
      const d = new Date(date);
      const formats = {
        'yyyy-MM-dd': d.toISOString().split('T')[0],
        'dd/MM/yyyy': d.toLocaleDateString('it-IT'),
        'MM/dd/yyyy': d.toLocaleDateString('en-US'),
        'yyyy-MM-dd HH:mm:ss': d.toISOString().replace('T', ' ').slice(0, 19),
      };
      return formats[formatString] || d.toString();
    }),

    // Parsing
    parse: jest.fn((dateString, formatString, referenceDate) => {
      return new Date(dateString);
    }),

    parseISO: jest.fn(dateString => new Date(dateString)),

    // Manipulation
    addDays: jest.fn((date, amount) => {
      const result = new Date(date);
      result.setDate(result.getDate() + amount);
      return result;
    }),

    addMonths: jest.fn((date, amount) => {
      const result = new Date(date);
      result.setMonth(result.getMonth() + amount);
      return result;
    }),

    addYears: jest.fn((date, amount) => {
      const result = new Date(date);
      result.setFullYear(result.getFullYear() + amount);
      return result;
    }),

    subDays: jest.fn((date, amount) => mockDateLib.addDays(date, -amount)),
    subMonths: jest.fn((date, amount) => mockDateLib.addMonths(date, -amount)),
    subYears: jest.fn((date, amount) => mockDateLib.addYears(date, -amount)),

    // Comparison
    isAfter: jest.fn((date, dateToCompare) => new Date(date) > new Date(dateToCompare)),
    isBefore: jest.fn((date, dateToCompare) => new Date(date) < new Date(dateToCompare)),
    isEqual: jest.fn(
      (date, dateToCompare) => new Date(date).getTime() === new Date(dateToCompare).getTime(),
    ),
    isSameDay: jest.fn((date, dateToCompare) => {
      const d1 = new Date(date);
      const d2 = new Date(dateToCompare);
      return d1.toDateString() === d2.toDateString();
    }),

    // Utilities
    startOfDay: jest.fn(date => {
      const result = new Date(date);
      result.setHours(0, 0, 0, 0);
      return result;
    }),

    endOfDay: jest.fn(date => {
      const result = new Date(date);
      result.setHours(23, 59, 59, 999);
      return result;
    }),

    startOfMonth: jest.fn(date => {
      const result = new Date(date);
      result.setDate(1);
      result.setHours(0, 0, 0, 0);
      return result;
    }),

    endOfMonth: jest.fn(date => {
      const result = new Date(date);
      result.setMonth(result.getMonth() + 1, 0);
      result.setHours(23, 59, 59, 999);
      return result;
    }),

    // Difference
    differenceInDays: jest.fn((dateLeft, dateRight) => {
      const diffTime = new Date(dateLeft) - new Date(dateRight);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }),

    differenceInMonths: jest.fn((dateLeft, dateRight) => {
      const d1 = new Date(dateLeft);
      const d2 = new Date(dateRight);
      return (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth());
    }),

    // Validation
    isValid: jest.fn(date => {
      return date instanceof Date && !isNaN(date.getTime());
    }),
  };

  return mockDateLib;
};

// Mock Validation library (Yup, Joi, Zod)
export const createMockValidationLibrary = () => {
  const createMockSchema = type => {
    const schema = {
      // Validation
      validate: jest.fn(value => {
        // Simple validation logic
        if (type === 'string' && typeof value !== 'string') {
          return Promise.reject(new Error('Must be a string'));
        }
        if (type === 'number' && typeof value !== 'number') {
          return Promise.reject(new Error('Must be a number'));
        }
        if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return Promise.reject(new Error('Must be a valid email'));
        }
        return Promise.resolve(value);
      }),

      validateSync: jest.fn(value => {
        // Synchronous validation
        if (type === 'string' && typeof value !== 'string') {
          throw new Error('Must be a string');
        }
        if (type === 'number' && typeof value !== 'number') {
          throw new Error('Must be a number');
        }
        if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Must be a valid email');
        }
        return value;
      }),

      // Modifiers
      required: jest.fn(() => schema),
      optional: jest.fn(() => schema),
      nullable: jest.fn(() => schema),
      default: jest.fn(defaultValue => schema),

      // String specific
      min: jest.fn(min => schema),
      max: jest.fn(max => schema),
      length: jest.fn(length => schema),
      matches: jest.fn(regex => schema),
      email: jest.fn(() => createMockSchema('email')),
      url: jest.fn(() => schema),

      // Number specific
      positive: jest.fn(() => schema),
      negative: jest.fn(() => schema),
      integer: jest.fn(() => schema),

      // Object specific
      shape: jest.fn(shape => schema),

      // Array specific
      of: jest.fn(itemSchema => schema),

      // Testing helpers
      _setValidationResult: result => {
        if (result instanceof Error) {
          schema.validate.mockRejectedValue(result);
          schema.validateSync.mockImplementation(() => {
            throw result;
          });
        } else {
          schema.validate.mockResolvedValue(result);
          schema.validateSync.mockReturnValue(result);
        }
      },
    };

    return schema;
  };

  const mockValidation = {
    string: jest.fn(() => createMockSchema('string')),
    number: jest.fn(() => createMockSchema('number')),
    boolean: jest.fn(() => createMockSchema('boolean')),
    date: jest.fn(() => createMockSchema('date')),
    array: jest.fn(() => createMockSchema('array')),
    object: jest.fn(() => createMockSchema('object')),
    mixed: jest.fn(() => createMockSchema('mixed')),

    // Validation errors
    ValidationError: class ValidationError extends Error {
      constructor(message, value, path) {
        super(message);
        this.name = 'ValidationError';
        this.value = value;
        this.path = path;
        this.errors = [message];
      }
    },
  };

  return mockValidation;
};

// Mock Crypto/Security libraries
export const createMockCryptoLibrary = () => {
  const mockCrypto = {
    // Hashing
    hash: jest.fn((algorithm, data) => {
      const mockHashes = {
        md5: 'mock-md5-hash',
        sha1: 'mock-sha1-hash',
        sha256: 'mock-sha256-hash',
        sha512: 'mock-sha512-hash',
      };
      return mockHashes[algorithm] || 'mock-hash';
    }),

    // Encryption/Decryption
    encrypt: jest.fn((algorithm, data, key) => {
      return `encrypted-${data}-with-${algorithm}`;
    }),

    decrypt: jest.fn((algorithm, encryptedData, key) => {
      return encryptedData.replace(`encrypted-`, '').replace(`-with-${algorithm}`, '');
    }),

    // Random generation
    randomBytes: jest.fn(size => {
      const bytes = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      return bytes;
    }),

    randomUUID: jest.fn(() => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }),

    // Base64
    base64Encode: jest.fn(data => {
      if (typeof btoa !== 'undefined') {
        return btoa(data);
      }
      return Buffer.from(data).toString('base64');
    }),

    base64Decode: jest.fn(encodedData => {
      if (typeof atob !== 'undefined') {
        return atob(encodedData);
      }
      return Buffer.from(encodedData, 'base64').toString();
    }),

    // JWT (simplified)
    createJWT: jest.fn((payload, secret, options = {}) => {
      const header = { alg: 'HS256', typ: 'JWT' };
      const encodedHeader = mockCrypto.base64Encode(JSON.stringify(header));
      const encodedPayload = mockCrypto.base64Encode(JSON.stringify(payload));
      const signature = 'mock-signature';
      return `${encodedHeader}.${encodedPayload}.${signature}`;
    }),

    verifyJWT: jest.fn((token, secret) => {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      try {
        const payload = JSON.parse(mockCrypto.base64Decode(parts[1]));
        return { valid: true, payload };
      } catch (error) {
        return { valid: false, error: error.message };
      }
    }),
  };

  return mockCrypto;
};

// Mock Toast/Notification libraries
export const createMockToastLibrary = () => {
  const toasts = [];

  const mockToast = {
    // Basic notifications
    success: jest.fn((message, options = {}) => {
      const toast = {
        id: Date.now() + Math.random(),
        type: 'success',
        message,
        options,
        timestamp: new Date(),
      };
      toasts.push(toast);
      return toast.id;
    }),

    error: jest.fn((message, options = {}) => {
      const toast = {
        id: Date.now() + Math.random(),
        type: 'error',
        message,
        options,
        timestamp: new Date(),
      };
      toasts.push(toast);
      return toast.id;
    }),

    warning: jest.fn((message, options = {}) => {
      const toast = {
        id: Date.now() + Math.random(),
        type: 'warning',
        message,
        options,
        timestamp: new Date(),
      };
      toasts.push(toast);
      return toast.id;
    }),

    info: jest.fn((message, options = {}) => {
      const toast = {
        id: Date.now() + Math.random(),
        type: 'info',
        message,
        options,
        timestamp: new Date(),
      };
      toasts.push(toast);
      return toast.id;
    }),

    // Management
    dismiss: jest.fn(toastId => {
      const index = toasts.findIndex(toast => toast.id === toastId);
      if (index > -1) {
        toasts.splice(index, 1);
      }
    }),

    dismissAll: jest.fn(() => {
      toasts.length = 0;
    }),

    // Custom
    custom: jest.fn((component, options = {}) => {
      const toast = {
        id: Date.now() + Math.random(),
        type: 'custom',
        component,
        options,
        timestamp: new Date(),
      };
      toasts.push(toast);
      return toast.id;
    }),

    // Promise handling
    promise: jest.fn((promise, messages) => {
      const toastId = mockToast.info(messages.loading || 'Loading...');

      return promise
        .then(result => {
          mockToast.dismiss(toastId);
          mockToast.success(messages.success || 'Success!');
          return result;
        })
        .catch(error => {
          mockToast.dismiss(toastId);
          mockToast.error(messages.error || 'Error occurred');
          throw error;
        });
    }),

    // Testing helpers
    _getToasts: () => [...toasts],
    _getToastsByType: type => toasts.filter(toast => toast.type === type),
    _getLastToast: () => toasts[toasts.length - 1] || null,
    _clear: () => {
      toasts.length = 0;
    },
  };

  return mockToast;
};

// Mock File/Upload libraries
export const createMockFileLibrary = () => {
  const mockFileLib = {
    // File reading
    readAsText: jest.fn(file => {
      return Promise.resolve('mock file content');
    }),

    readAsDataURL: jest.fn(file => {
      return Promise.resolve('data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=');
    }),

    readAsArrayBuffer: jest.fn(file => {
      return Promise.resolve(new ArrayBuffer(8));
    }),

    // File validation
    validateFile: jest.fn((file, options = {}) => {
      const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options;

      if (file.size > maxSize) {
        return { valid: false, error: 'File too large' };
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        return { valid: false, error: 'File type not allowed' };
      }

      return { valid: true };
    }),

    // File upload simulation
    upload: jest.fn((file, options = {}) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            url: `https://mock-storage.com/files/${file.name}`,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
          });
        }, 100);
      });
    }),

    // File download simulation
    download: jest.fn((url, filename) => {
      return Promise.resolve({
        blob: new Blob(['mock downloaded content']),
        filename: filename || 'download.txt',
      });
    }),

    // Image processing
    resizeImage: jest.fn((file, options = {}) => {
      const { width = 800, height = 600, quality = 0.8 } = options;
      return Promise.resolve(new File(['resized image'], file.name, { type: file.type }));
    }),

    // File utilities
    getFileExtension: jest.fn(filename => {
      return filename.split('.').pop()?.toLowerCase() || '';
    }),

    formatFileSize: jest.fn(bytes => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }),
  };

  return mockFileLib;
};

// Export all library mocks
export const externalLibraryMocks = {
  pdf: createMockPDFGenerator(),
  chart: createMockChart(),
  date: createMockDateLibrary(),
  validation: createMockValidationLibrary(),
  crypto: createMockCryptoLibrary(),
  toast: createMockToastLibrary(),
  file: createMockFileLibrary(),
};

// Default export
export default externalLibraryMocks;
