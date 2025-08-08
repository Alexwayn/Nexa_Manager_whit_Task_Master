import {
  notify,
  loadingManager,
  errorHandler,
  validation,
  formatters,
  uiState,
  debounce,
  throttle,
} from '@/lib/uiUtils';
import toast from 'react-hot-toast';
import Logger from '@/utils/Logger';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  promise: jest.fn(),
  custom: jest.fn(),
  dismiss: jest.fn(),
}));

// Mock Logger
jest.mock('../../utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

// Mock console.error
global.console.error = jest.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock window methods
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true,
});

Object.defineProperty(window, 'open', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  writable: true,
});

describe('uiUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notify', () => {
    describe('success', () => {
      it('should call toast.success with default options', () => {
        const mockToastId = 'toast-1';
        (toast.success as jest.Mock).mockReturnValue(mockToastId);

        const result = notify.success('Success message');

        expect(toast.success).toHaveBeenCalledWith(
          'Success message',
          expect.objectContaining({
            duration: 3000,
            style: expect.objectContaining({
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            }),
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          }),
        );
        expect(result).toBe(mockToastId);
      });

      it('should call toast.success with custom options', () => {
        const customOptions = { duration: 5000 };
        notify.success('Success message', customOptions);

        expect(toast.success).toHaveBeenCalledWith(
          'Success message',
          expect.objectContaining({
            duration: 5000,
          }),
        );
      });
    });

    describe('error', () => {
      it('should call toast.error with default options', () => {
        const mockToastId = 'toast-error-1';
        (toast.error as jest.Mock).mockReturnValue(mockToastId);

        const result = notify.error('Error message');

        expect(toast.error).toHaveBeenCalledWith(
          'Error message',
          expect.objectContaining({
            duration: 5000,
            style: expect.objectContaining({
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            }),
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          }),
        );
        expect(result).toBe(mockToastId);
      });
    });

    describe('loading', () => {
      it('should call toast.loading with default style', () => {
        const mockToastId = 'toast-loading-1';
        (toast.loading as jest.Mock).mockReturnValue(mockToastId);

        const result = notify.loading('Loading message');

        expect(toast.loading).toHaveBeenCalledWith(
          'Loading message',
          expect.objectContaining({
            style: expect.objectContaining({
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            }),
          }),
        );
        expect(result).toBe(mockToastId);
      });
    });

    describe('promise', () => {
      it('should call toast.promise with default messages', async () => {
        const mockPromise = Promise.resolve('Success');
        const mockToastPromise = Promise.resolve('Success');
        (toast.promise as jest.Mock).mockReturnValue(mockToastPromise);

        const result = notify.promise(mockPromise, {
          loading: 'Loading...',
          success: 'Success!',
          error: 'Error!',
        });

        expect(toast.promise).toHaveBeenCalledWith(
          mockPromise,
          expect.objectContaining({
            loading: 'Loading...',
            success: 'Success!',
            error: expect.any(Function),
          }),
          expect.objectContaining({
            style: expect.objectContaining({
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            }),
            success: { duration: 3000 },
            error: { duration: 5000 },
          }),
        );
        expect(result).toBe(mockToastPromise);
      });
    });

    describe('dismiss', () => {
      it('should call toast.dismiss with specific toastId', () => {
        notify.dismiss('toast-1');
        expect(toast.dismiss).toHaveBeenCalledWith('toast-1');
      });

      it('should call toast.dismiss without arguments', () => {
        notify.dismiss();
        expect(toast.dismiss).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('loadingManager', () => {
    it('should show loading toast', () => {
      const mockToastId = 'loading-toast-1';
      (toast.loading as jest.Mock).mockReturnValue(mockToastId);

      const result = loadingManager.show('Custom loading...');

      expect(toast.loading).toHaveBeenCalledWith('Custom loading...', expect.any(Object));
      expect(result).toBe(mockToastId);
    });

    it('should hide specific toast', () => {
      loadingManager.hide('toast-1');
      expect(toast.dismiss).toHaveBeenCalledWith('toast-1');
    });

    it('should update toast to success', () => {
      const mockSuccessId = 'success-toast';
      (toast.success as jest.Mock).mockReturnValue(mockSuccessId);

      const result = loadingManager.update('toast-1', 'Success!', 'success');

      expect(toast.dismiss).toHaveBeenCalledWith('toast-1');
      expect(toast.success).toHaveBeenCalledWith('Success!', expect.any(Object));
      expect(result).toBe(mockSuccessId);
    });

    it('should update toast to error', () => {
      const mockErrorId = 'error-toast';
      (toast.error as jest.Mock).mockReturnValue(mockErrorId);

      const result = loadingManager.update('toast-1', 'Error!', 'error');

      expect(toast.dismiss).toHaveBeenCalledWith('toast-1');
      expect(toast.error).toHaveBeenCalledWith('Error!', expect.any(Object));
      expect(result).toBe(mockErrorId);
    });
  });

  describe('errorHandler', () => {
    it('should handle generic error', () => {
      const error = new Error('Test error');

      errorHandler.handle(error, 'test context');

      expect(console.error).toHaveBeenCalledWith('Error in test context:', error);
      expect(toast.error).toHaveBeenCalledWith('Test error', expect.any(Object));
    });

    it('should handle string error', () => {
      const error = 'String error message';

      errorHandler.handle(error, 'test context');

      expect(console.error).toHaveBeenCalledWith('Error in test context:', error);
      expect(toast.error).toHaveBeenCalledWith('String error message', expect.any(Object));
    });

    it('should handle API error with response data', () => {
      const apiError = {
        response: {
          data: {
            message: 'API error message',
          },
        },
      };

      const result = errorHandler.handleApiError(apiError);

      expect(console.error).toHaveBeenCalledWith('API Error:', apiError);
      expect(toast.error).toHaveBeenCalledWith('API error message', expect.any(Object));
      expect(result).toEqual({ error: 'API error message', details: apiError });
    });

    it('should handle Supabase error', () => {
      const supabaseError = {
        message: 'duplicate key value violates unique constraint',
      };

      const result = errorHandler.handleSupabaseError(supabaseError, 'test context');

      expect(console.error).toHaveBeenCalledWith('Supabase Error in test context:', supabaseError);
      expect(toast.error).toHaveBeenCalledWith('duplicate key value violates unique constraint', expect.any(Object));
      expect(result).toEqual({ error: 'duplicate key value violates unique constraint', details: supabaseError });
    });
  });

  describe('validation', () => {
    it('should validate required fields', () => {
      expect(validation.required('test', 'Test Field')).toBeNull();
      expect(validation.required('', 'Test Field')).toBe('Test Field is required');
      expect(validation.required(null, 'Test Field')).toBe('Test Field is required');
      expect(validation.required(undefined, 'Test Field')).toBe('Test Field is required');
    });

    it('should validate email', () => {
      expect(validation.email('test@example.com')).toBe(true);
      expect(validation.email('invalid-email')).toBe('Invalid email');
      expect(validation.email('')).toBe('Invalid email'); // Empty email is invalid
    });

    it('should validate minimum length', () => {
      expect(validation.minLength('test', 3, 'Test Field')).toBeNull();
      expect(validation.minLength('te', 3, 'Test Field')).toBe(
        'Test Field must be at least 3 characters long',
      );
    });

    it('should validate maximum length', () => {
      expect(validation.maxLength('test', 5, 'Test Field')).toBeNull();
      expect(validation.maxLength('toolong', 5, 'Test Field')).toBe(
        'Test Field must be at most 5 characters long',
      );
    });

    it('should validate numeric values', () => {
      expect(validation.numeric('123', 'Test Field')).toBeNull();
      expect(validation.numeric('abc', 'Test Field')).toBe('Test Field must be a number');
    });

    it('should validate positive values', () => {
      expect(validation.positive('5', 'Test Field')).toBeNull();
      expect(validation.positive('-1', 'Test Field')).toBe('Test Field must be positive');
      expect(validation.positive('0', 'Test Field')).toBe('Test Field must be positive');
    });

    it('should validate form with multiple rules', () => {
      const formData = {
        email: 'test@example.com',
        password: 'password123',
        age: '25',
      };

      const rules = {
        email: [validation.required, (value: unknown) => validation.email(value as string)],
        password: [(value: unknown) => validation.minLength(value as string, 8, 'Password')],
        age: [validation.required, validation.numeric, validation.positive],
      };

      const result = validation.validateForm(formData, rules);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return errors for invalid form data', () => {
      const formData = {
        email: 'invalid-email',
        password: 'short',
        age: '',
      };

      const rules = {
        email: [validation.required, (value: unknown) => validation.email(value as string)],
        password: [(value: unknown) => validation.minLength(value as string, 8, 'Password')],
        age: [validation.required],
      };

      const result = validation.validateForm(formData, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Invalid email');
      expect(result.errors.password).toBe('Password must be at least 8 characters long');
      expect(result.errors.age).toBe('This field is required');
    });
  });

  describe('formatters', () => {
    it('should format currency', () => {
      const result = formatters.currency(1234.56);
      expect(result).toBe('$1,234.56'); // US format
    });

    it('should format numbers', () => {
      const result = formatters.number(1234.567, 2);
      expect(result).toBe('1,234.57'); // US format with 2 decimals
    });

    it('should format percentage', () => {
      const result = formatters.percentage(25, 1);
      expect(result).toBe('25.0%'); // US format
    });

    it('should format file size', () => {
      expect(formatters.fileSize(0)).toBe('0 B');
      expect(formatters.fileSize(1024)).toBe('1.0 KB');
      expect(formatters.fileSize(1048576)).toBe('1.0 MB');
    });

    it('should truncate text', () => {
      expect(formatters.truncate('Short text', 20)).toBe('Short text');
      expect(formatters.truncate('This is a very long text that should be truncated', 20)).toBe(
        'This is a very lo...',
      );
    });

    it('should format time ago', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      expect(formatters.timeAgo(now)).toBe('Now');
      expect(formatters.timeAgo(oneMinuteAgo)).toBe('1 min ago');
      expect(formatters.timeAgo(oneHourAgo)).toBe('1 hours ago');
    });
  });

  describe('uiState', () => {
    it('should scroll to top', () => {
      uiState.scrollToTop();
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('should scroll to top without smooth behavior', () => {
      uiState.scrollToTop(false);
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    });

    it('should copy to clipboard successfully', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);

      const result = await uiState.copyToClipboard('test text');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard', expect.any(Object));
      expect(result).toBe(true);
    });

    it('should handle clipboard copy failure', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Copy failed'));

      const result = await uiState.copyToClipboard('test text');

      expect(toast.error).toHaveBeenCalledWith('Cannot copy to clipboard', expect.any(Object));
      expect(result).toBe(false);
    });

    it('should open URL in new tab', () => {
      uiState.openInNewTab('https://example.com');
      expect(window.open).toHaveBeenCalledWith(
        'https://example.com',
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('should detect small screen', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
      expect(uiState.isSmallScreen()).toBe(true);

      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      expect(uiState.isSmallScreen()).toBe(false);
    });

    it('should detect mobile device', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
      });
      expect(uiState.isMobile()).toBe(true);

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });
      expect(uiState.isMobile()).toBe(false);
    });
  });

  describe('debounce', () => {
    let originalSetTimeout: typeof setTimeout;
    let originalClearTimeout: typeof clearTimeout;
    let timeoutId = 0;
    let timeouts: Map<number, { callback: () => void; delay: number }>;

    beforeEach(() => {
      originalSetTimeout = global.setTimeout;
      originalClearTimeout = global.clearTimeout;
      timeouts = new Map();
      timeoutId = 0;

      global.setTimeout = jest.fn((callback: () => void, delay: number) => {
        const id = ++timeoutId;
        timeouts.set(id, { callback, delay });
        return id as any;
      });

      global.clearTimeout = jest.fn((id: number) => {
        timeouts.delete(id);
      });
    });

    afterEach(() => {
      global.setTimeout = originalSetTimeout;
      global.clearTimeout = originalClearTimeout;
    });

    const runTimers = (time: number) => {
      timeouts.forEach((timeout, id) => {
        if (timeout.delay <= time) {
          timeout.callback();
          timeouts.delete(id);
        }
      });
    };

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      runTimers(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should reset debounce timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      // Simulate partial time passage
      debouncedFn('arg2');

      expect(mockFn).not.toHaveBeenCalled();

      runTimers(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });
  });

  describe('throttle', () => {
    let originalSetTimeout: typeof setTimeout;
    let timeoutId = 0;
    let timeouts: Map<number, { callback: () => void; delay: number }>;

    beforeEach(() => {
      originalSetTimeout = global.setTimeout;
      timeouts = new Map();
      timeoutId = 0;

      global.setTimeout = jest.fn((callback: () => void, delay: number) => {
        const id = ++timeoutId;
        timeouts.set(id, { callback, delay });
        return id as any;
      });
    });

    afterEach(() => {
      global.setTimeout = originalSetTimeout;
    });

    const runTimers = () => {
      timeouts.forEach((timeout, id) => {
        timeout.callback();
        timeouts.delete(id);
      });
    };

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('arg1');
      throttledFn('arg2');
      throttledFn('arg3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      // Run the timeout to reset the throttle
      runTimers();

      throttledFn('arg4');

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('arg4');
    });

    it('should not call function during throttle period', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('arg1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      throttledFn('arg2');
      throttledFn('arg3');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Run the timeout to reset the throttle
      runTimers();

      throttledFn('arg5');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('arg5');
    });
  });
});
