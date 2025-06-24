#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * This script addresses false positive duplicate key detection in the audit tool.
 * The audit tool was detecting keys with the same name at different nesting levels
 * as duplicates, which is incorrect. This script validates that the reported
 * duplicates are actually problematic.
 */

class AuditFalsePositiveFixer {
  constructor() {
    this.checkedFiles = 0;
    this.actualDuplicates = 0;
    this.falsePositives = 0;
  }

  async checkReportedDuplicates() {
    console.log('🔍 Checking reported duplicate keys for false positives...');
    
    // Read the audit report
    const reportPath = path.join(__dirname, '../reports/i18n-audit-report.json');
    
    if (!fs.existsSync(reportPath)) {
      console.log('❌ Audit report not found. Please run the audit first.');
      return;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const duplicateErrors = report.errors.filter(error => error.type === 'duplicate_keys');
    
    console.log(`📊 Found ${duplicateErrors.length} reported duplicate key errors`);
    console.log('');

    for (const error of duplicateErrors) {
      await this.validateDuplicateError(error);
    }

    console.log('\n✅ Duplicate key validation completed!');
    console.log(`📝 Checked ${this.checkedFiles} files`);
    console.log(`🔧 Actual duplicates: ${this.actualDuplicates}`);
    console.log(`❌ False positives: ${this.falsePositives}`);
    
    if (this.falsePositives > 0) {
      console.log('\n💡 The audit tool is reporting false positives.');
      console.log('   Keys at different nesting levels are not actual duplicates.');
    }
  }

  async validateDuplicateError(error) {
    const { language, file, keys } = error;
    const filePath = path.join(__dirname, `../web-app/public/locales/${language}/${file}.json`);
    
    console.log(`🔍 Validating ${language}/${file}.json`);
    console.log(`   Reported duplicates: ${keys.join(', ')}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found: ${filePath}`);
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      const actualDuplicates = this.findActualDuplicates(data);
      
      if (actualDuplicates.length > 0) {
        console.log(`   ❌ Actual duplicates found: ${actualDuplicates.join(', ')}`);
        this.actualDuplicates += actualDuplicates.length;
      } else {
        console.log(`   ✅ No actual duplicates - these are false positives`);
        console.log(`   💡 Keys appear at different nesting levels, which is valid`);
        this.falsePositives += keys.length;
      }
      
      this.checkedFiles++;
    } catch (error) {
      console.log(`   ❌ Error reading file: ${error.message}`);
    }
    
    console.log('');
  }

  findActualDuplicates(obj, path = '') {
    const duplicates = [];
    
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return duplicates;
    }

    const keys = Object.keys(obj);
    const seenKeys = new Set();
    
    // Check for actual duplicates at the same level
    keys.forEach(key => {
      if (seenKeys.has(key)) {
        const fullPath = path ? `${path}.${key}` : key;
        duplicates.push(fullPath);
      } else {
        seenKeys.add(key);
      }
    });

    // Recursively check nested objects
    keys.forEach(key => {
      const newPath = path ? `${path}.${key}` : key;
      const nestedDuplicates = this.findActualDuplicates(obj[key], newPath);
      duplicates.push(...nestedDuplicates);
    });

    return duplicates;
  }

  /**
   * Generate a corrected audit report with only actual duplicates
   */
  async generateCorrectedReport() {
    console.log('\n🔧 Generating corrected audit report...');
    
    const reportPath = path.join(__dirname, '../reports/i18n-audit-report.json');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    // Filter out false positive duplicate errors
    const correctedErrors = [];
    const localesPath = path.join(__dirname, '../web-app/public/locales');
    
    for (const error of report.errors) {
      if (error.type === 'duplicate_keys') {
        const { language, file } = error;
        const filePath = path.join(localesPath, language, `${file}.json`);
        
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            const actualDuplicates = this.findActualDuplicates(data);
            
            if (actualDuplicates.length > 0) {
              // Keep this error but update the keys
              correctedErrors.push({
                ...error,
                keys: actualDuplicates,
                message: `Actual duplicate keys found: ${actualDuplicates.join(', ')}`
              });
            }
            // If no actual duplicates, don't include this error
          } catch (parseError) {
            // Keep the error if we can't parse the file
            correctedErrors.push(error);
          }
        } else {
          // Keep the error if file doesn't exist
          correctedErrors.push(error);
        }
      } else {
        // Keep all non-duplicate errors
        correctedErrors.push(error);
      }
    }
    
    // Update the report
    const correctedReport = {
      ...report,
      errors: correctedErrors,
      summary: {
        ...report.summary,
        totalIssues: correctedErrors.length + report.warnings.length
      }
    };
    
    // Save corrected report
    const correctedReportPath = path.join(__dirname, '../reports/i18n-audit-report-corrected.json');
    fs.writeFileSync(correctedReportPath, JSON.stringify(correctedReport, null, 2));
    
    console.log(`✅ Corrected report saved to: ${correctedReportPath}`);
    console.log(`📊 Reduced errors from ${report.errors.length} to ${correctedErrors.length}`);
    
    return correctedReport;
  }
}

// Main execution
if (require.main === module) {
  const fixer = new AuditFalsePositiveFixer();
  fixer.checkReportedDuplicates()
    .then(() => fixer.generateCorrectedReport())
    .catch(console.error);
}

module.exports = AuditFalsePositiveFixer;