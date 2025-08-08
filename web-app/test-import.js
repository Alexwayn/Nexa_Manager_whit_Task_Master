// Test import resolution
try {
  const scannerTypes = require('./src/types/scanner.ts');
  console.log('Direct require:', scannerTypes);
  console.log('DocumentStatus:', scannerTypes.DocumentStatus);
} catch (error) {
  console.error('Direct require error:', error.message);
}

// Test with TypeScript compilation
try {
  const ts = require('typescript');
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(__dirname, 'src/types/scanner.ts');
  const sourceCode = fs.readFileSync(filePath, 'utf8');
  
  const result = ts.transpile(sourceCode, {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  });
  
  console.log('Transpiled code preview:', result.substring(0, 500));
} catch (error) {
  console.error('TypeScript transpile error:', error.message);
}