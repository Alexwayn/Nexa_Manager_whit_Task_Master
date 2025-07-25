#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class RemainingDuplicatesFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalIssues = 0;
    this.backupDir = path.join(__dirname, '../backups/remaining-duplicates-fix');
  }

  async fixRemainingDuplicates() {
    console.log('🔧 Starting remaining duplicates repair...');
    
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

    console.log('✅ Remaining duplicates repair completed!');
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
      
      // Parse and reconstruct to find structural duplicates
      const duplicates = this.findAndFixDuplicates(content);
      
      if (duplicates.fixed) {
        console.log(`  📄 ${fileName}: Found and fixed ${duplicates.count} duplicate keys`);
        
        // Create backup
        const backupPath = path.join(this.backupDir, `${language}_${fileName.replace(/\//g, '_')}.backup`);
        fs.writeFileSync(backupPath, content);
        
        // Write fixed content
        fs.writeFileSync(filePath, duplicates.content);
        this.fixedFiles++;
        this.totalIssues += duplicates.count;
        console.log(`  ✅ Fixed ${duplicates.count} duplicate keys in ${fileName}`);
      }
    } catch (error) {
      console.log(`  ❌ Error processing ${fileName}: ${error.message}`);
    }
  }

  findAndFixDuplicates(content) {
    try {
      // First try to parse as JSON and fix structurally
      const jsonData = JSON.parse(content);
      const result = this.removeObjectDuplicates(jsonData);
      
      if (result.count > 0) {
        return {
          fixed: true,
          count: result.count,
          content: JSON.stringify(result.data, null, 2)
        };
      }
      
      return { fixed: false, count: 0 };
    } catch (error) {
      // If JSON parsing fails, try line-by-line approach
      return this.fixDuplicatesLineByLine(content);
    }
  }

  removeObjectDuplicates(obj, path = '') {
    let duplicateCount = 0;
    
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const result = this.removeObjectDuplicates(item, `${path}[${index}]`);
          duplicateCount += result.count;
        });
      }
      return { data: obj, count: duplicateCount };
    }

    // Convert object to array of entries to detect duplicates
    const entries = Object.entries(obj);
    const seenKeys = new Set();
    const uniqueEntries = [];
    
    // Keep only the last occurrence of each key
    for (let i = entries.length - 1; i >= 0; i--) {
      const [key, value] = entries[i];
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueEntries.unshift([key, value]);
      } else {
        duplicateCount++;
      }
    }

    // Recursively process nested objects
    const processedEntries = uniqueEntries.map(([key, value]) => {
      const result = this.removeObjectDuplicates(value, path ? `${path}.${key}` : key);
      duplicateCount += result.count;
      return [key, result.data];
    });

    return {
      data: Object.fromEntries(processedEntries),
      count: duplicateCount
    };
  }

  fixDuplicatesLineByLine(content) {
    const lines = content.split('\n');
    const result = [];
    const keyTracker = new Map();
    let duplicateCount = 0;
    let braceLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Track brace levels
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      
      if (closeBraces > 0) {
        // Clear keys when closing braces
        for (let j = 0; j < closeBraces; j++) {
          braceLevel--;
          keyTracker.delete(braceLevel);
        }
      }
      
      // Check for key definitions
      const keyMatch = trimmed.match(/^"([^"]+)"\s*:/);
      if (keyMatch) {
        const key = keyMatch[1];
        const levelKey = `${braceLevel}:${key}`;
        
        if (keyTracker.has(levelKey)) {
          // Skip this duplicate line
          duplicateCount++;
          continue;
        } else {
          keyTracker.set(levelKey, i);
        }
      }
      
      result.push(line);
      
      if (openBraces > 0) {
        braceLevel += openBraces;
      }
    }

    if (duplicateCount > 0) {
      return {
        fixed: true,
        count: duplicateCount,
        content: result.join('\n')
      };
    }

    return { fixed: false, count: 0 };
  }
}

// Main execution
if (require.main === module) {
  const fixer = new RemainingDuplicatesFixer();
  fixer.fixRemainingDuplicates().catch(console.error);
}

module.exports = RemainingDuplicatesFixer;