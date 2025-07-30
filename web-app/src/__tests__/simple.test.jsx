import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Simple Test', () => {
  test('renders a simple component', () => {
    const SimpleComponent = () => <div>Hello World</div>;
    render(<SimpleComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});