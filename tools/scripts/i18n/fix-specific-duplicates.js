#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SpecificDuplicatesFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalIssues = 0;
    this.backupDir = path.join(__dirname, '../backups/specific-duplicates-fix');
  }

  async fixSpecificDuplicates() {
    console.log('🔧 Starting specific duplicates repair...');
    
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

    console.log('✅ Specific duplicates repair completed!');
    console.log(`📝 Fixed ${this.fixedFiles} files`);
    console.log(`🔧 Resolved ${this.totalIssues} duplicate key issues`);
    console.log('');
    console.log('🎉 All fixes completed!');
  }

  async fixLanguageFiles(localesPath, language) {
    const langDir = path.join(localesPath, language);
    const jsonFiles = fs.readdirSync(langDir).filter(file => file.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = path.join(langDir, file);
      await this.fixFileContent(filePath, language, file);
    }
  }

  async fixFileContent(filePath, language, fileName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Use a text-based approach to find and fix duplicates
      const result = this.fixDuplicatesInText(content);
      
      if (result.fixed) {
        console.log(`  📄 ${fileName}: Found and fixed ${result.count} duplicate keys`);
        
        // Create backup
        const backupPath = path.join(this.backupDir, `${language}_${fileName}.backup`);
        fs.writeFileSync(backupPath, originalContent);
        
        // Validate the fixed JSON
        try {
          JSON.parse(result.content);
          
          // Write fixed content
          fs.writeFileSync(filePath, result.content);
          this.fixedFiles++;
          this.totalIssues += result.count;
          console.log(`  ✅ Fixed ${result.count} duplicate keys in ${fileName}`);
        } catch (parseError) {
          console.log(`  ❌ Fixed content is not valid JSON for ${fileName}: ${parseError.message}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Error processing ${fileName}: ${error.message}`);
    }
  }

  fixDuplicatesInText(content) {
    const lines = content.split('\n');
    const result = [];
    const keyStack = []; // Stack to track nested object contexts
    let duplicateCount = 0;
    let currentIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const indent = line.length - line.trimLeft().length;
      
      // Handle closing braces - pop from stack when indentation decreases
      if (trimmed === '}' || trimmed === '},') {
        while (keyStack.length > 0 && keyStack[keyStack.length - 1].indent >= indent) {
          keyStack.pop();
        }
      }
      
      // Check for key definitions
      const keyMatch = trimmed.match(/^"([^"]+)"\s*:\s*(.*)$/);
      if (keyMatch) {
        const key = keyMatch[1];
        const value = keyMatch[2];
        
        // Find the current context (parent keys)
        const currentContext = keyStack.filter(item => item.indent < indent);
        const contextPath = currentContext.map(item => item.key).join('.');
        const fullKey = contextPath ? `${contextPath}.${key}` : key;
        
        // Check if this key already exists at the same level
        const existingAtSameLevel = keyStack.find(item => 
          item.key === key && item.indent === indent
        );
        
        if (existingAtSameLevel) {
          // This is a duplicate at the same level - skip it
          console.log(`    🔍 Removing duplicate key '${key}' at line ${i + 1}`);
          duplicateCount++;
          continue;
        }
        
        // Add this key to the stack
        keyStack.push({ key, indent, line: i });
        
        // If the value starts with '{', this is an object
        if (value.trim() === '{') {
          // Keep track that this is an object start
        }
      }
      
      result.push(line);
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
  const fixer = new SpecificDuplicatesFixer();
  fixer.fixSpecificDuplicates().catch(console.error);
}

module.exports = SpecificDuplicatesFixer;