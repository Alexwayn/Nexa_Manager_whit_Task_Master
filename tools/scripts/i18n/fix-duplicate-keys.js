#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class DuplicateKeysFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalIssues = 0;
    this.backupDir = path.join(__dirname, '../backups/duplicate-keys-fix');
  }

  async fixDuplicateKeys() {
    console.log('🔧 Starting enhanced duplicate keys repair...');
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const localesPath = path.join(__dirname, '../web-app/public/locales');
    const languages = fs.readdirSync(localesPath).filter(item => 
      fs.statSync(path.join(localesPath, item)).isDirectory()
    );

    console.log(`📁 Found languages: ${languages.join(', ')}`);
    console.log('');

    for (const lang of languages) {
      console.log(`🔧 Fixing ${lang} files...`);
      await this.fixLanguageFiles(localesPath, lang);
      console.log('');
    }

    console.log('✅ Enhanced duplicate keys repair completed!');
    console.log(`📝 Fixed ${this.fixedFiles} files`);
    console.log(`🔧 Resolved ${this.totalIssues} duplicate key issues`);
    console.log('');
    console.log('🎉 All fixes completed!');
  }

  async fixLanguageFiles(localesPath, language) {
    const langDir = path.join(localesPath, language);
    const jsonFiles = glob.sync('**/*.json', { cwd: langDir });

    for (const file of jsonFiles) {
      const filePath = path.join(langDir, file);
      await this.fixFileContent(filePath, language, file);
    }
  }

  async fixFileContent(filePath, language, fileName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Try to parse as JSON first to check if it's valid
      let jsonData;
      try {
        jsonData = JSON.parse(content);
      } catch (parseError) {
        console.log(`  ❌ ${fileName}: Invalid JSON, skipping`);
        return;
      }

      // Check for duplicate keys using a more robust method
      const duplicates = this.findDuplicateKeysInObject(jsonData, '');
      
      if (duplicates.length > 0) {
        console.log(`  📄 ${fileName}: Found ${duplicates.length} duplicate key paths`);
        
        // Create backup
        const backupPath = path.join(this.backupDir, `${language}_${fileName.replace(/\//g, '_')}.backup`);
        fs.writeFileSync(backupPath, content);
        
        // Fix duplicates by reconstructing the object
        const fixedData = this.removeDuplicateKeysFromObject(jsonData);
        const fixedContent = JSON.stringify(fixedData, null, 2);
        
        fs.writeFileSync(filePath, fixedContent);
        this.fixedFiles++;
        this.totalIssues += duplicates.length;
        console.log(`  ✅ Fixed ${duplicates.length} duplicate key paths in ${fileName}`);
      }
    } catch (error) {
      console.log(`  ❌ Error processing ${fileName}: ${error.message}`);
    }
  }

  findDuplicateKeysInObject(obj, path = '') {
    const duplicates = [];
    
    if (typeof obj !== 'object' || obj === null) {
      return duplicates;
    }

    const keys = Object.keys(obj);
    const keyCount = {};
    
    // Count occurrences of each key
    keys.forEach(key => {
      keyCount[key] = (keyCount[key] || 0) + 1;
    });

    // Find duplicates
    Object.entries(keyCount).forEach(([key, count]) => {
      if (count > 1) {
        const fullPath = path ? `${path}.${key}` : key;
        duplicates.push({
          path: fullPath,
          key: key,
          count: count
        });
      }
    });

    // Recursively check nested objects
    keys.forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const nestedPath = path ? `${path}.${key}` : key;
        const nestedDuplicates = this.findDuplicateKeysInObject(obj[key], nestedPath);
        duplicates.push(...nestedDuplicates);
      }
    });

    return duplicates;
  }

  removeDuplicateKeysFromObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeDuplicateKeysFromObject(item));
    }

    const result = {};
    const processedKeys = new Set();

    // Process each key only once (keeping the last occurrence)
    Object.keys(obj).forEach(key => {
      if (!processedKeys.has(key)) {
        processedKeys.add(key);
        const value = obj[key];
        result[key] = this.removeDuplicateKeysFromObject(value);
      }
    });

    return result;
  }

  // Alternative method using string parsing for edge cases
  findDuplicateKeysInString(content) {
    const duplicates = [];
    const lines = content.split('\n');
    const keyPattern = /^\s*"([^"]+)"\s*:/;
    const seenKeys = new Map();

    lines.forEach((line, lineNumber) => {
      const match = line.match(keyPattern);
      if (match) {
        const key = match[1];
        if (seenKeys.has(key)) {
          duplicates.push({
            key,
            line: lineNumber + 1,
            firstOccurrence: seenKeys.get(key)
          });
        } else {
          seenKeys.set(key, lineNumber + 1);
        }
      }
    });

    return duplicates;
  }
}

// Main execution
if (require.main === module) {
  const fixer = new DuplicateKeysFixer();
  fixer.fixDuplicateKeys().catch(console.error);
}

module.exports = DuplicateKeysFixer;