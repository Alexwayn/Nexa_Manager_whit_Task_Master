// Debug script to check what's being imported
const path = require('path');

console.log('Current working directory:', process.cwd());
console.log('Checking import path...');

// Try to resolve the path like the test does
const testPath = path.resolve(__dirname, 'src/lib/__tests__/emailStorageService.test.js');
console.log('Test file path:', testPath);

const servicePath = path.resolve(__dirname, 'src/features/email/services/emailStorageService.js');
console.log('Service file path:', servicePath);

// Check if files exist
const fs = require('fs');
console.log('Test file exists:', fs.existsSync(testPath));
console.log('Service file exists:', fs.existsSync(servicePath));

// Try to read the import statement from the test
if (fs.existsSync(testPath)) {
  const testContent = fs.readFileSync(testPath, 'utf8');
  const importMatch = testContent.match(/import.*emailStorageService.*from.*['"](.+)['"];?/);
  if (importMatch) {
    console.log('Import statement found:', importMatch[0]);
    console.log('Import path:', importMatch[1]);
    
    // Resolve the import path relative to the test file
    const resolvedImportPath = path.resolve(path.dirname(testPath), importMatch[1]);
    console.log('Resolved import path:', resolvedImportPath);
    console.log('Resolved file exists:', fs.existsSync(resolvedImportPath));
    
    // Check if it's a .js file
    const jsPath = resolvedImportPath + '.js';
    console.log('JS file path:', jsPath);
    console.log('JS file exists:', fs.existsSync(jsPath));
  }
}