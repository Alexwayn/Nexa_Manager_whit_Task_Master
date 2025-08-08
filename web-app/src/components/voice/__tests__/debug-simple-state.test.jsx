import React, { useState } from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import fs from 'fs';

// Simple test component to verify state updates work
const TestComponent = () => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('initial');

  return (
    <div>
      <button onClick={() => setCount(count + 1)} data-testid="count-button">
        Count: {count}
      </button>
      <button onClick={() => setText('clicked')} data-testid="text-button">
        Text: {text}
      </button>
    </div>
  );
};

describe('Simple State Test', () => {
  test('should update state when buttons are clicked', () => {
    const { container } = render(<TestComponent />);

    let debugOutput = [];
    
    // Debug: log the entire container HTML
    debugOutput.push('Container HTML: ' + container.innerHTML);

    // Initial state
    const countButton = screen.getByTestId('count-button');
    const textButton = screen.getByTestId('text-button');

    debugOutput.push('Count button HTML: ' + countButton.outerHTML);
    debugOutput.push('Text button HTML: ' + textButton.outerHTML);
    debugOutput.push('Count button textContent: ' + JSON.stringify(countButton.textContent));
    debugOutput.push('Text button textContent: ' + JSON.stringify(textButton.textContent));

    // Write debug output to file
    fs.writeFileSync('debug-simple-state-output.txt', debugOutput.join('\n'));

    expect(countButton.textContent).toBe('Count: 0');
    expect(textButton.textContent).toBe('Text: initial');

    // Click count button
    fireEvent.click(countButton);
    expect(countButton.textContent).toBe('Count: 1');

    // Click text button
    fireEvent.click(textButton);
    expect(textButton.textContent).toBe('Text: clicked');

    // Click count button again
    fireEvent.click(countButton);
    expect(countButton.textContent).toBe('Count: 2');
  });
});