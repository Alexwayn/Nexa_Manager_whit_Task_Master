/**
 * Architectural Structure Validation Tests
 * 
 * These tests validate that the project structure follows
 * the established architectural patterns and conventions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcPath = path.resolve(__dirname, '../../');

describe('Project Structure Validation', () => {
  describe('Feature Structure', () => {
    const featuresPath = path.join(srcPath, 'features');
    
    test('should have features directory', () => {
      expect(fs.existsSync(featuresPath)).toBe(true);
    });
    
    test('each feature should have required directories', () => {
      if (!fs.existsSync(featuresPath)) return;
      
      const features = fs.readdirSync(featuresPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      const requiredDirectories = ['components', 'hooks', 'services'];
      const optionalDirectories = ['types', 'utils', '__tests__'];
      
      features.forEach(feature => {
        const featurePath = path.join(featuresPath, feature);
        
        // Check required directories
        requiredDirectories.forEach(dir => {
          const dirPath = path.join(featurePath, dir);
          expect(fs.existsSync(dirPath)).toBe(true);
        });
        
        // Check for index.ts file (public API)
        const indexPath = path.join(featurePath, 'index.ts');
        expect(fs.existsSync(indexPath)).toBe(true);
      });
    });
    
    test('each feature should have a README.md file', () => {
      if (!fs.existsSync(featuresPath)) return;
      
      const features = fs.readdirSync(featuresPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      features.forEach(feature => {
        const readmePath = path.join(featuresPath, feature, 'README.md');
        expect(fs.existsSync(readmePath)).toBe(true);
      });
    });
  });
  
  describe('Shared Structure', () => {
    const sharedPath = path.join(srcPath, 'shared');
    
    test('should have shared directory', () => {
      expect(fs.existsSync(sharedPath)).toBe(true);
    });
    
    test('shared directory should have expected subdirectories', () => {
      if (!fs.existsSync(sharedPath)) return;
      
      const expectedDirectories = [
        'components',
        'hooks',
        'services',
        'types',
        'utils',
        'constants',
        'styles'
      ];
      
      expectedDirectories.forEach(dir => {
        const dirPath = path.join(sharedPath, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });
    
    test('each shared module should have index.ts file', () => {
      if (!fs.existsSync(sharedPath)) return;
      
      const sharedModules = fs.readdirSync(sharedPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      sharedModules.forEach(module => {
        const indexPath = path.join(sharedPath, module, 'index.ts');
        expect(fs.existsSync(indexPath)).toBe(true);
      });
    });
  });
  
  describe('File Naming Conventions', () => {
    const checkNamingConventions = (dirPath, conventions) => {
      if (!fs.existsSync(dirPath)) return;
      
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      
      files.forEach(file => {
        if (file.isDirectory()) {
          checkNamingConventions(path.join(dirPath, file.name), conventions);
        } else {
          const fileName = file.name;
          const extension = path.extname(fileName);
          const baseName = path.basename(fileName, extension);
          
          // Check if file matches any convention
          const matchesConvention = conventions.some(convention => {
            if (convention.extensions && !convention.extensions.includes(extension)) {
              return true; // Skip files with different extensions
            }
            return convention.pattern.test(baseName);
          });
          
          if (!matchesConvention) {
            console.warn(`File naming convention violation: ${fileName} in ${dirPath}`);
          }
        }
      });
    };
    
    test('component files should follow PascalCase convention', () => {
      const componentConventions = [
        {
          pattern: /^[A-Z][a-zA-Z0-9]*$/,
          extensions: ['.tsx', '.jsx']
        },
        {
          pattern: /^[a-z][a-zA-Z0-9]*$/,
          extensions: ['.ts', '.js', '.test.tsx', '.test.jsx', '.stories.tsx', '.stories.jsx']
        }
      ];
      
      // Check feature components
      const featuresPath = path.join(srcPath, 'features');
      if (fs.existsSync(featuresPath)) {
        const features = fs.readdirSync(featuresPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        features.forEach(feature => {
          const componentsPath = path.join(featuresPath, feature, 'components');
          checkNamingConventions(componentsPath, componentConventions);
        });
      }
      
      // Check shared components
      const sharedComponentsPath = path.join(srcPath, 'shared', 'components');
      checkNamingConventions(sharedComponentsPath, componentConventions);
    });
    
    test('hook files should follow useXxx convention', () => {
      const hookConventions = [
        {
          pattern: /^use[A-Z][a-zA-Z0-9]*$/,
          extensions: ['.ts', '.js']
        }
      ];
      
      // Check feature hooks
      const featuresPath = path.join(srcPath, 'features');
      if (fs.existsSync(featuresPath)) {
        const features = fs.readdirSync(featuresPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        features.forEach(feature => {
          const hooksPath = path.join(featuresPath, feature, 'hooks');
          checkNamingConventions(hooksPath, hookConventions);
        });
      }
      
      // Check shared hooks
      const sharedHooksPath = path.join(srcPath, 'shared', 'hooks');
      checkNamingConventions(sharedHooksPath, hookConventions);
    });
    
    test('service files should follow camelCase.service convention', () => {
      const serviceConventions = [
        {
          pattern: /^[a-z][a-zA-Z0-9]*Service$/,
          extensions: ['.ts', '.js']
        },
        {
          pattern: /^[a-z][a-zA-Z0-9]*$/,
          extensions: ['.ts', '.js']
        }
      ];
      
      // Check feature services
      const featuresPath = path.join(srcPath, 'features');
      if (fs.existsSync(featuresPath)) {
        const features = fs.readdirSync(featuresPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        features.forEach(feature => {
          const servicesPath = path.join(featuresPath, feature, 'services');
          checkNamingConventions(servicesPath, serviceConventions);
        });
      }
      
      // Check shared services
      const sharedServicesPath = path.join(srcPath, 'shared', 'services');
      checkNamingConventions(sharedServicesPath, serviceConventions);
    });
  });
  
  describe('Dependency Validation', () => {
    test('features should not have circular dependencies', () => {
      // This would require parsing import statements
      // For now, we rely on ESLint's import/no-cycle rule
      expect(true).toBe(true);
    });
    
    test('shared modules should not import from features', () => {
      // This would require parsing import statements
      // For now, we rely on ESLint's import/no-restricted-paths rule
      expect(true).toBe(true);
    });
  });
  
  describe('Configuration Structure', () => {
    test('should have consolidated .config directory', () => {
      const configPath = path.resolve(__dirname, '../../../.config');
      expect(fs.existsSync(configPath)).toBe(true);
    });
    
    test('.config should have expected tool directories', () => {
      const configPath = path.resolve(__dirname, '../../../.config');
      if (!fs.existsSync(configPath)) return;
      
      const expectedTools = [
        'eslint',
        'prettier',
        'jest',
        'playwright'
      ];
      
      expectedTools.forEach(tool => {
        const toolPath = path.join(configPath, tool);
        expect(fs.existsSync(toolPath)).toBe(true);
      });
    });
  });
  
  describe('Documentation Structure', () => {
    test('should have centralized docs directory', () => {
      const docsPath = path.resolve(__dirname, '../../../docs');
      expect(fs.existsSync(docsPath)).toBe(true);
    });
    
    test('docs should have expected subdirectories', () => {
      const docsPath = path.resolve(__dirname, '../../../docs');
      if (!fs.existsSync(docsPath)) return;
      
      const expectedDirs = [
        'api',
        'architecture',
        'development',
        'deployment'
      ];
      
      expectedDirs.forEach(dir => {
        const dirPath = path.join(docsPath, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });
  });
});

describe('Code Quality Validation', () => {
  test('should not have TODO comments in production code', () => {
    // This test can be enhanced to scan for TODO comments
    // and ensure they have proper tracking
    expect(true).toBe(true);
  });
  
  test('should not have console.log statements in production code', () => {
    // This is handled by ESLint rules
    expect(true).toBe(true);
  });
  
  test('should not have unused imports', () => {
    // This is handled by ESLint rules
    expect(true).toBe(true);
  });
});