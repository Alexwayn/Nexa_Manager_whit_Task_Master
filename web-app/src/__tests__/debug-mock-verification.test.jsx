import { render, screen } from '@testing-library/react';

describe('Mock Verification Test', () => {
  it('should verify that our mock is being used', () => {
    console.error('=== MOCK VERIFICATION TEST ===');
    console.error('render function:', typeof render);
    console.error('screen object:', typeof screen);
    console.error('screen.getByLabelText:', typeof screen.getByLabelText);
    
    // Check if our mock properties exist
    console.error('render.isMocked:', render.isMocked);
    console.error('screen.isMocked:', screen.isMocked);
    
    // Also test the expectations
    expect(render.isMocked).toBe(true);
    expect(screen.isMocked).toBe(true);
    expect(render).toBeDefined();
    expect(screen).toBeDefined();
    expect(screen.getByLabelText).toBeDefined();
  });
});