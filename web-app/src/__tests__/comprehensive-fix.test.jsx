import React from 'react';
import { render, screen, fireEvent, waitFor, userEvent, act, cleanup } from '@testing-library/react';

// Test component to verify all functionality
const TestComponent = ({ title = "Test Component", disabled = false }) => {
  const [count, setCount] = React.useState(0);
  const [text, setText] = React.useState('');

  return (
    <div data-testid="test-component">
      <h1>{title}</h1>
      <button 
        data-testid="increment-button"
        onClick={() => setCount(count + 1)}
        disabled={disabled}
        aria-label="Increment counter"
      >
        Count: {count}
      </button>
      <input
        data-testid="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text"
        aria-label="Text input field"
      />
      <div data-testid="text-display">{text}</div>
    </div>
  );
};

describe('Comprehensive @testing-library/react Fix Test', () => {
  afterEach(() => {
    cleanup();
  });

  it('should resolve the TypeError: (0 , _dom.configure) is not a function', () => {
    // This is the main issue we were solving
    expect(() => {
      render(<TestComponent />);
    }).not.toThrow();
    
    console.log('✓ No TypeError when importing and using @testing-library/react');
  });

  it('should render React components correctly', () => {
    render(<TestComponent title="Custom Title" />);
    
    const component = screen.getByTestId('test-component');
    expect(component).toBeTruthy();
    
    const title = screen.getByText('Custom Title');
    expect(title).toBeTruthy();
    
    console.log('✓ React components render correctly');
  });

  it('should support all screen query methods', () => {
    render(<TestComponent />);
    
    // getBy methods
    expect(screen.getByTestId('test-component')).toBeTruthy();
    expect(screen.getByText('Test Component')).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
    expect(screen.getByLabelText('Increment counter')).toBeTruthy();
    
    // queryBy methods (should not throw)
    expect(screen.queryByTestId('test-component')).toBeTruthy();
    expect(screen.queryByTestId('non-existent')).toBeNull();
    
    console.log('✓ All screen query methods work correctly');
  });

  it('should support fireEvent interactions', () => {
    render(<TestComponent />);
    
    const button = screen.getByTestId('increment-button');
    const input = screen.getByTestId('text-input');
    
    // Test click event
    expect(button.textContent).toBe('Count: 0');
    fireEvent.click(button);
    expect(button.textContent).toBe('Count: 1');
    
    // Test change event
    fireEvent.change(input, { target: { value: 'Hello World' } });
    expect(input.value).toBe('Hello World');
    
    const textDisplay = screen.getByTestId('text-display');
    expect(textDisplay.textContent).toBe('Hello World');
    
    console.log('✓ fireEvent interactions work correctly');
  });

  it('should support userEvent interactions', async () => {
    render(<TestComponent />);
    
    const button = screen.getByTestId('increment-button');
    const input = screen.getByTestId('text-input');
    
    // Test userEvent click
    await userEvent.click(button);
    expect(button.textContent).toBe('Count: 1');
    
    // Test userEvent type
    await userEvent.type(input, 'Typed text');
    expect(input.value).toBe('Typed text');
    
    // Test userEvent clear
    await userEvent.clear(input);
    expect(input.value).toBe('');
    
    console.log('✓ userEvent interactions work correctly');
  });

  it('should support waitFor async testing', async () => {
    render(<TestComponent />);
    
    const button = screen.getByTestId('increment-button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(button.textContent).toBe('Count: 1');
    });
    
    console.log('✓ waitFor async testing works correctly');
  });

  it('should support act for React updates', async () => {
    let component;
    
    await act(async () => {
      component = render(<TestComponent />);
    });
    
    expect(component.container).toBeTruthy();
    
    const button = screen.getByTestId('increment-button');
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    expect(button.textContent).toBe('Count: 1');
    
    console.log('✓ act wrapper works correctly');
  });

  it('should support component rerendering', () => {
    const { rerender } = render(<TestComponent title="Original" />);
    
    expect(screen.getByText('Original')).toBeTruthy();
    
    rerender(<TestComponent title="Updated" />);
    
    expect(screen.getByText('Updated')).toBeTruthy();
    expect(screen.queryByText('Original')).toBeNull();
    
    console.log('✓ Component rerendering works correctly');
  });

  it('should support component unmounting', () => {
    const { unmount } = render(<TestComponent />);
    
    expect(screen.getByTestId('test-component')).toBeTruthy();
    
    unmount();
    
    // After unmount, the component should not be found
    expect(() => screen.getByTestId('test-component')).toThrow();
    expect(screen.queryByTestId('test-component')).toBeNull();
    
    console.log('✓ Component unmounting works correctly');
  });

  it('should handle component props correctly', () => {
    render(<TestComponent disabled={true} />);
    
    const button = screen.getByTestId('increment-button');
    expect(button.disabled).toBe(true);
    
    console.log('✓ Component props are handled correctly');
  });
});