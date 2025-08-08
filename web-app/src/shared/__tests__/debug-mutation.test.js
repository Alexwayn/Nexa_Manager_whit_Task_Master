import { renderHook, act, waitFor } from '@testing-library/react';
import { useScheduledReports } from '../../hooks/useReports';

// Mock the reporting service
jest.mock('../../services/reportingService', () => ({
  getScheduledReports: jest.fn(),
  createSchedule: jest.fn(),
  updateSchedule: jest.fn(),
  deleteSchedule: jest.fn(),
}));

describe('Debug Mutation State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mutation state
    const { resetMutationState, setRerenderCallback } = require('./mocks/tanstack-react-query.cjs');
    resetMutationState();
    setRerenderCallback(null); // Clear any existing callback
  });

  it('should track isPending state correctly', async () => {
    const { createSchedule } = require('../../services/reportingService');
    
    // Mock createSchedule to resolve after a delay
    createSchedule.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 100))
    );

    const { result } = renderHook(() => useScheduledReports());

    console.log('Initial state:', {
      isCreating: result.current.isCreating,
      isLoading: result.current.isLoading,
      createSchedule: typeof result.current.createSchedule
    });

    // Start the mutation
    const mutationPromise = act(() => {
      return result.current.createSchedule({
        name: 'Test Schedule',
        frequency: 'daily'
      });
    });

    console.log('After calling createSchedule:', {
      isCreating: result.current.isCreating,
      isLoading: result.current.isLoading
    });

    // Check immediately after the call
    console.log('Immediate check:', {
      isCreating: result.current.isCreating,
      isLoading: result.current.isLoading
    });

    // Wait for isCreating to become true
    await waitFor(() => {
      console.log('Waiting for isCreating to be true:', {
        isCreating: result.current.isCreating,
        isLoading: result.current.isLoading
      });
      expect(result.current.isCreating).toBe(true);
    });

    // Wait for mutation to complete
    await waitFor(() => {
      console.log('Waiting for completion:', {
        isCreating: result.current.isCreating,
        isLoading: result.current.isLoading
      });
      expect(result.current.isCreating).toBe(false);
    });

    // Wait for the actual promise to resolve
    await mutationPromise;

    console.log('Final state:', {
      isCreating: result.current.isCreating,
      isLoading: result.current.isLoading
    });
  });
});
