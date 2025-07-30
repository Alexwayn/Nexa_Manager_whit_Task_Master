// Mock for react-quill
import React from 'react';

const ReactQuill = React.forwardRef(({ value, onChange, placeholder, modules, formats, ...props }, ref) => {
  return (
    <div data-testid="react-quill-mock" ref={ref}>
      <textarea
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
});

ReactQuill.displayName = 'ReactQuill';

export default ReactQuill;