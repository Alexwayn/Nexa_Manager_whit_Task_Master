import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

describe('Testing Library import test', () => {
  it('should work with testing library imports', () => {
    expect(render).toBeDefined();
    expect(screen).toBeDefined();
    expect(fireEvent).toBeDefined();
    expect(waitFor).toBeDefined();
  });
});