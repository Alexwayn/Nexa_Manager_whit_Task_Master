#!/usr/bin/env node

/**
 * Translation Issues Fixer
 * 
 * This script helps fix common issues found in translation files:
 * - JSON syntax errors
 * - Duplicate keys
 * - Formatting issues
 */

const fs = require('fs');
const path = require('path');

class TranslationFixer {
  constructor(localesPath = '../web-app/public/locales') {
    this.localesPath = localesPath;
    this.fixedFiles = [];
    this.errors = [];
  }

  async fixAllIssues() {
    console.log('🔧 Starting translation files repair...');
    
    const languages = this.getLanguages();
    console.log(`📁 Found languages: ${languages.join(', ')}`);
    
    for (const language of languages) {
      await this.fixLanguageFiles(language);
    }
    
    console.log(`\n✅ Repair completed!`);
    console.log(`📝 Fixed ${this.fixedFiles.length} files`);
    
    if (this.errors.length > 0) {
      console.log(`❌ ${this.errors.length} files had unfixable errors:`);
      this.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    return {
      fixedFiles: this.fixedFiles,
      errors: this.errors
    };
  }

  getLanguages() {
    const localesDir = path.resolve(this.localesPath);
    const items = fs.readdirSync(localesDir, { withFileTypes: true });
    return items
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .sort();
  }

  async fixLanguageFiles(language) {
    const languageDir = path.join(this.localesPath, language);
    const files = this.getJsonFiles(languageDir);
    
    console.log(`\n🔧 Fixing ${language} files...`);
    
    for (const filePath of files) {
      try {
        const fixed = await this.fixJsonFile(filePath);
        if (fixed) {
          const relativePath = path.relative(this.localesPath, filePath);
          this.fixedFiles.push(relativePath);
          console.log(`   ✅ Fixed: ${relativePath}`);
        }
      } catch (error) {
        const relativePath = path.relative(this.localesPath, filePath);
        this.errors.push(`${relativePath}: ${error.message}`);
        console.log(`   ❌ Error: ${relativePath} - ${error.message}`);
      }
    }
  }

  getJsonFiles(dir) {
    const files = [];
    
    const scanDirectory = (currentDir) => {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item.name);
        
        if (item.isDirectory()) {
          scanDirectory(fullPath);
        } else if (path.extname(item.name) === '.json') {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(dir);
    return files;
  }

  async fixJsonFile(filePath) {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let fixed = false;
    
    try {
      // Try to parse the original content
      const parsed = JSON.parse(originalContent);
      
      // Check for and remove duplicate keys
      const cleaned = this.removeDuplicateKeys(parsed);
      
      // Format the JSON properly
      const formatted = JSON.stringify(cleaned, null, 2);
      
      // Only write if content changed
      if (formatted !== originalContent) {
        // Create backup
        const backupPath = filePath + '.backup';
        if (!fs.existsSync(backupPath)) {
          fs.writeFileSync(backupPath, originalContent);
        }
        
        // Write fixed content
        fs.writeFileSync(filePath, formatted);
        fixed = true;
      }
      
    } catch (parseError) {
      // Try to fix common JSON syntax errors
      const fixedContent = this.fixJsonSyntax(originalContent);
      
      if (fixedContent !== originalContent) {
        try {
          // Validate the fixed content
          JSON.parse(fixedContent);
          
          // Create backup
          const backupPath = filePath + '.backup';
          if (!fs.existsSync(backupPath)) {
            fs.writeFileSync(backupPath, originalContent);
          }
          
          // Write fixed content
          fs.writeFileSync(filePath, fixedContent);
          fixed = true;
          
        } catch (stillError) {
          throw new Error(`Could not fix JSON syntax: ${stillError.message}`);
        }
      } else {
        throw parseError;
      }
    }
    
    return fixed;
  }

  removeDuplicateKeys(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return obj;
    }
    
    const cleaned = {};
    const seenKeys = new Set();
    
    for (const [key, value] of Object.entries(obj)) {
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        cleaned[key] = this.removeDuplicateKeys(value);
      }
    }
    
    return cleaned;
  }

  fixJsonSyntax(content) {
    let fixed = content;
    
    // Fix common JSON syntax issues
    
    // Remove trailing commas before closing braces/brackets
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    
    // Fix missing commas between properties
    fixed = fixed.replace(/"\s*\n\s*"/g, '",\n  "');
    
    // Fix unescaped quotes in strings
    fixed = fixed.replace(/"([^"]*[^\\])"([^":,}\]\s])/g, '"$1\\"$2');
    
    // Remove comments (not valid in JSON)
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
    fixed = fixed.replace(/\/\/.*$/gm, '');
    
    // Fix single quotes to double quotes
    fixed = fixed.replace(/'([^']*)'/g, '"$1"');
    
    // Fix missing quotes around property names
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
    
    return fixed;
  }

  async validateAllFiles() {
    console.log('🔍 Validating all translation files...');
    
    const languages = this.getLanguages();
    const results = {
      valid: [],
      invalid: []
    };
    
    for (const language of languages) {
      const languageDir = path.join(this.localesPath, language);
      const files = this.getJsonFiles(languageDir);
      
      for (const filePath of files) {
        const relativePath = path.relative(this.localesPath, filePath);
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content);
          results.valid.push(relativePath);
        } catch (error) {
          results.invalid.push({
            file: relativePath,
            error: error.message
          });
        }
      }
    }
    
    console.log(`✅ Valid files: ${results.valid.length}`);
    console.log(`❌ Invalid files: ${results.invalid.length}`);
    
    if (results.invalid.length > 0) {
      console.log('\nInvalid files:');
      results.invalid.forEach(item => {
        console.log(`   - ${item.file}: ${item.error}`);
      });
    }
    
    return results;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'fix';
  const localesPath = process.argv[3] || '../web-app/public/locales';
  
  const fixer = new TranslationFixer(localesPath);
  
  if (command === 'validate') {
    fixer.validateAllFiles()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
      });
  } else if (command === 'fix') {
    fixer.fixAllIssues()
      .then(() => {
        console.log('\n🎉 All fixes completed!');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Fix failed:', error.message);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  node fix-translation-issues.js fix [locales-path]');
    console.log('  node fix-translation-issues.js validate [locales-path]');
    process.exit(1);
  }
}

module.exports = TranslationFixer;