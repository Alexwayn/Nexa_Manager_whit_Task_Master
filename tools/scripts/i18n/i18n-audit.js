#!/usr/bin/env node

/**
 * Comprehensive i18n Translation Audit Tool
 * 
 * This tool performs a thorough audit of translation files to ensure:
 * - Translation completeness across all languages
 * - Consistency in formatting and structure
 * - Detection of unused or missing keys
 * - Quality checks for encoding and syntax
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class I18nAuditor {
  constructor(options = {}) {
    this.baseLanguage = options.baseLanguage || 'en';
    this.localesPath = options.localesPath || '../web-app/public/locales';
    this.sourceCodePath = options.sourceCodePath || '../web-app/src';
    this.outputPath = options.outputPath || '../reports/i18n-audit-report.json';
    this.supportedFormats = ['.json', '.yaml', '.yml'];
    
    this.report = {
      summary: {
        auditDate: new Date().toISOString(),
        baseLanguage: this.baseLanguage,
        totalLanguages: 0,
        totalFiles: 0,
        completionPercentages: {},
        overallHealth: 'unknown'
      },
      errors: [],
      warnings: [],
      recommendations: [],
      details: {
        missingTranslations: {},
        emptyValues: {},
        unusedKeys: [],
        duplicateKeys: {},
        encodingIssues: [],
        syntaxErrors: []
      }
    };
  }

  /**
   * Main audit function
   */
  async audit() {
    console.log('🔍 Starting i18n Translation Audit...');
    
    try {
      // Step 1: Discover and validate translation files
      const languages = await this.discoverLanguages();
      console.log(`📁 Found ${languages.length} languages: ${languages.join(', ')}`);
      
      // Step 2: Load and parse all translation files
      const translationData = await this.loadTranslationFiles(languages);
      
      // Step 3: Analyze translation completeness
      await this.analyzeCompleteness(translationData);
      
      // Step 4: Check for quality issues
      await this.performQualityChecks(translationData);
      
      // Step 5: Analyze usage in source code
      await this.analyzeUsage(translationData);
      
      // Step 6: Generate recommendations
      this.generateRecommendations();
      
      // Step 7: Calculate overall health score
      this.calculateHealthScore();
      
      // Step 8: Save report
      await this.saveReport();
      
      console.log('✅ Audit completed successfully!');
      console.log(`📊 Report saved to: ${this.outputPath}`);
      
      return this.report;
    } catch (error) {
      console.error('❌ Audit failed:', error.message);
      throw error;
    }
  }

  /**
   * Discover available languages in the locales directory
   */
  async discoverLanguages() {
    const localesDir = path.resolve(this.localesPath);
    
    if (!fs.existsSync(localesDir)) {
      throw new Error(`Locales directory not found: ${localesDir}`);
    }

    const items = fs.readdirSync(localesDir, { withFileTypes: true });
    const languages = items
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .sort();

    if (languages.length === 0) {
      throw new Error('No language directories found in locales folder');
    }

    if (!languages.includes(this.baseLanguage)) {
      this.report.errors.push({
        type: 'missing_base_language',
        message: `Base language '${this.baseLanguage}' not found`,
        severity: 'critical'
      });
    }

    this.report.summary.totalLanguages = languages.length;
    return languages;
  }

  /**
   * Load and parse all translation files for all languages
   */
  async loadTranslationFiles(languages) {
    const translationData = {};
    let totalFiles = 0;

    for (const language of languages) {
      const languageDir = path.join(this.localesPath, language);
      const files = await this.getTranslationFiles(languageDir);
      
      translationData[language] = {};
      
      for (const filePath of files) {
        const relativePath = path.relative(languageDir, filePath);
        const fileKey = relativePath.replace(/\.[^.]+$/, ''); // Remove extension
        
        try {
          const content = await this.parseTranslationFile(filePath);
          translationData[language][fileKey] = {
            path: filePath,
            content: content,
            keys: this.flattenKeys(content)
          };
          totalFiles++;
        } catch (error) {
          this.report.errors.push({
            type: 'syntax_error',
            language: language,
            file: relativePath,
            message: `Failed to parse file: ${error.message}`,
            severity: 'high'
          });
        }
      }
    }

    this.report.summary.totalFiles = totalFiles;
    return translationData;
  }

  /**
   * Get all translation files in a directory
   */
  async getTranslationFiles(dir) {
    const files = [];
    
    const scanDirectory = (currentDir) => {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item.name);
        
        if (item.isDirectory()) {
          scanDirectory(fullPath);
        } else if (this.supportedFormats.includes(path.extname(item.name))) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(dir);
    return files;
  }

  /**
   * Parse a translation file based on its format
   */
  async parseTranslationFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();

    // Check for encoding issues
    if (content.includes('�')) {
      this.report.details.encodingIssues.push({
        file: filePath,
        issue: 'Invalid character encoding detected'
      });
    }

    switch (ext) {
      case '.json':
        return JSON.parse(content);
      case '.yaml':
      case '.yml':
        const yaml = require('yaml');
        return yaml.parse(content);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Flatten nested translation keys into dot notation
   */
  flattenKeys(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenKeys(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  }

  /**
   * Analyze translation completeness across languages
   */
  async analyzeCompleteness(translationData) {
    const baseData = translationData[this.baseLanguage];
    
    if (!baseData) {
      this.report.errors.push({
        type: 'missing_base_language',
        message: `Base language '${this.baseLanguage}' data not found`,
        severity: 'critical'
      });
      return;
    }

    // Get all base language keys
    const baseKeys = new Set();
    for (const fileData of Object.values(baseData)) {
      Object.keys(fileData.keys).forEach(key => baseKeys.add(key));
    }

    // Check each target language
    for (const [language, languageData] of Object.entries(translationData)) {
      if (language === this.baseLanguage) continue;

      const targetKeys = new Set();
      const missingKeys = [];
      const emptyValues = [];

      // Collect all keys from target language
      for (const [fileName, fileData] of Object.entries(languageData)) {
        Object.entries(fileData.keys).forEach(([key, value]) => {
          targetKeys.add(key);
          
          // Check for empty values
          if (value === '' || value === null || value === undefined) {
            emptyValues.push({ file: fileName, key: key });
          }
        });
      }

      // Find missing keys
      for (const baseKey of baseKeys) {
        if (!targetKeys.has(baseKey)) {
          missingKeys.push(baseKey);
        }
      }

      // Calculate completion percentage
      const completionPercentage = Math.round(
        ((baseKeys.size - missingKeys.length) / baseKeys.size) * 100
      );
      
      this.report.summary.completionPercentages[language] = completionPercentage;
      
      // Store missing translations
      if (missingKeys.length > 0) {
        this.report.details.missingTranslations[language] = missingKeys;
        
        this.report.warnings.push({
          type: 'missing_translations',
          language: language,
          count: missingKeys.length,
          message: `${missingKeys.length} missing translations (${100 - completionPercentage}% incomplete)`,
          severity: completionPercentage < 80 ? 'high' : 'medium'
        });
      }

      // Store empty values
      if (emptyValues.length > 0) {
        this.report.details.emptyValues[language] = emptyValues;
        
        this.report.warnings.push({
          type: 'empty_values',
          language: language,
          count: emptyValues.length,
          message: `${emptyValues.length} empty translation values found`,
          severity: 'medium'
        });
      }
    }
  }

  /**
   * Perform quality checks on translation content
   */
  async performQualityChecks(translationData) {
    for (const [language, languageData] of Object.entries(translationData)) {
      for (const [fileName, fileData] of Object.entries(languageData)) {
        this.checkForDuplicateKeys(language, fileName, fileData.content);
        this.checkFormattingConsistency(language, fileName, fileData.keys);
      }
    }
  }

  /**
   * Check for duplicate keys in translation files
   */
  checkForDuplicateKeys(language, fileName, content) {
    const contentStr = JSON.stringify(content);
    const keys = contentStr.match(/"([^"]+)":/g);
    
    if (keys) {
      const keyCount = {};
      keys.forEach(key => {
        const cleanKey = key.slice(1, -2); // Remove quotes and colon
        keyCount[cleanKey] = (keyCount[cleanKey] || 0) + 1;
      });

      const duplicates = Object.entries(keyCount)
        .filter(([key, count]) => count > 1)
        .map(([key]) => key);

      if (duplicates.length > 0) {
        this.report.details.duplicateKeys[`${language}/${fileName}`] = duplicates;
        
        this.report.errors.push({
          type: 'duplicate_keys',
          language: language,
          file: fileName,
          keys: duplicates,
          message: `Duplicate keys found: ${duplicates.join(', ')}`,
          severity: 'high'
        });
      }
    }
  }

  /**
   * Check formatting consistency across translations
   */
  checkFormattingConsistency(language, fileName, keys) {
    const patterns = {
      placeholders: /\{\{[^}]+\}\}/g,
      htmlTags: /<[^>]+>/g,
      variables: /\$\{[^}]+\}/g
    };

    for (const [key, value] of Object.entries(keys)) {
      if (typeof value !== 'string') continue;

      // Check for mixed placeholder patterns
      const hasDoubleBrace = patterns.placeholders.test(value);
      const hasVariable = patterns.variables.test(value);
      
      if (hasDoubleBrace && hasVariable) {
        this.report.warnings.push({
          type: 'mixed_placeholder_patterns',
          language: language,
          file: fileName,
          key: key,
          message: 'Mixed placeholder patterns detected ({{}} and ${})',
          severity: 'low'
        });
      }

      // Check for unescaped HTML
      if (patterns.htmlTags.test(value)) {
        this.report.warnings.push({
          type: 'html_content',
          language: language,
          file: fileName,
          key: key,
          message: 'HTML content detected - ensure proper escaping',
          severity: 'medium'
        });
      }
    }
  }

  /**
   * Analyze translation key usage in source code
   */
  async analyzeUsage(translationData) {
    console.log('🔍 Analyzing translation key usage in source code...');
    
    try {
      const sourceFiles = glob.sync('**/*.{js,jsx,ts,tsx,vue}', {
        cwd: this.sourceCodePath,
        absolute: true
      });

      const usedKeys = new Set();
      const translationCallPatterns = [
        /t\(['"`]([^'"`)]+)['"`]/g,
        /\$t\(['"`]([^'"`)]+)['"`]/g,
        /i18n\.[^(]+\(['"`]([^'"`)]+)['"`]/g,
        /translate\(['"`]([^'"`)]+)['"`]/g
      ];

      for (const filePath of sourceFiles) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          for (const pattern of translationCallPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
              usedKeys.add(match[1]);
            }
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }

      // Find unused keys
      const baseData = translationData[this.baseLanguage];
      if (baseData) {
        const allKeys = new Set();
        for (const fileData of Object.values(baseData)) {
          Object.keys(fileData.keys).forEach(key => allKeys.add(key));
        }

        const unusedKeys = Array.from(allKeys).filter(key => !usedKeys.has(key));
        
        if (unusedKeys.length > 0) {
          this.report.details.unusedKeys = unusedKeys;
          
          this.report.warnings.push({
            type: 'unused_keys',
            count: unusedKeys.length,
            message: `${unusedKeys.length} potentially unused translation keys found`,
            severity: 'low'
          });
        }
      }

      console.log(`📊 Found ${usedKeys.size} used translation keys`);
    } catch (error) {
      console.warn('⚠️  Could not analyze source code usage:', error.message);
    }
  }

  /**
   * Generate recommendations based on audit findings
   */
  generateRecommendations() {
    const recommendations = [];

    // Completion recommendations
    const lowCompletionLanguages = Object.entries(this.report.summary.completionPercentages)
      .filter(([lang, percentage]) => percentage < 90)
      .map(([lang]) => lang);

    if (lowCompletionLanguages.length > 0) {
      recommendations.push({
        type: 'completion',
        priority: 'high',
        message: `Prioritize completing translations for: ${lowCompletionLanguages.join(', ')}`,
        affectedLanguages: lowCompletionLanguages
      });
    }

    // Standardization recommendations
    if (this.report.warnings.some(w => w.type === 'mixed_placeholder_patterns')) {
      recommendations.push({
        type: 'standardization',
        priority: 'medium',
        message: 'Standardize placeholder patterns across all translation files',
        suggestion: 'Choose either {{variable}} or ${variable} format consistently'
      });
    }

    // Cleanup recommendations
    if (this.report.details.unusedKeys.length > 0) {
      recommendations.push({
        type: 'cleanup',
        priority: 'low',
        message: 'Consider removing unused translation keys to reduce bundle size',
        affectedKeys: this.report.details.unusedKeys.slice(0, 10) // Show first 10
      });
    }

    // Quality recommendations
    if (this.report.details.encodingIssues.length > 0) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        message: 'Fix encoding issues in translation files',
        affectedFiles: this.report.details.encodingIssues.map(issue => issue.file)
      });
    }

    this.report.recommendations = recommendations;
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore() {
    let score = 100;
    let issues = 0;

    // Deduct points for errors
    this.report.errors.forEach(error => {
      switch (error.severity) {
        case 'critical': score -= 20; issues++; break;
        case 'high': score -= 10; issues++; break;
        case 'medium': score -= 5; issues++; break;
      }
    });

    // Deduct points for warnings
    this.report.warnings.forEach(warning => {
      switch (warning.severity) {
        case 'high': score -= 5; issues++; break;
        case 'medium': score -= 3; issues++; break;
        case 'low': score -= 1; issues++; break;
      }
    });

    // Deduct points for low completion
    const avgCompletion = Object.values(this.report.summary.completionPercentages)
      .reduce((sum, pct) => sum + pct, 0) / this.report.summary.totalLanguages;
    
    if (avgCompletion < 90) score -= (90 - avgCompletion) / 2;

    score = Math.max(0, Math.round(score));

    this.report.summary.overallHealth = score >= 90 ? 'excellent' : 
                                       score >= 75 ? 'good' : 
                                       score >= 50 ? 'fair' : 'poor';
    this.report.summary.healthScore = score;
    this.report.summary.totalIssues = issues;
  }

  /**
   * Save the audit report to file
   */
  async saveReport() {
    const reportDir = path.dirname(this.outputPath);
    
    // Ensure report directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Save detailed JSON report
    fs.writeFileSync(this.outputPath, JSON.stringify(this.report, null, 2));

    // Generate human-readable summary
    const summaryPath = this.outputPath.replace('.json', '-summary.txt');
    const summary = this.generateSummaryReport();
    fs.writeFileSync(summaryPath, summary);

    console.log(`📄 Summary report saved to: ${summaryPath}`);
  }

  /**
   * Generate human-readable summary report
   */
  generateSummaryReport() {
    const { summary, errors, warnings, recommendations } = this.report;
    
    return `
# i18n Translation Audit Summary

Generated: ${summary.auditDate}
Base Language: ${summary.baseLanguage}
Total Languages: ${summary.totalLanguages}
Total Files: ${summary.totalFiles}

## Overall Health: ${summary.overallHealth.toUpperCase()} (${summary.healthScore}/100)

## Completion Status
${Object.entries(summary.completionPercentages)
  .map(([lang, pct]) => `- ${lang}: ${pct}%`)
  .join('\n')}

## Issues Summary
- Errors: ${errors.length}
- Warnings: ${warnings.length}
- Total Issues: ${summary.totalIssues}

## Critical Issues
${errors.filter(e => e.severity === 'critical')
  .map(e => `❌ ${e.message}`)
  .join('\n') || 'None'}

## High Priority Recommendations
${recommendations.filter(r => r.priority === 'high')
  .map(r => `🔥 ${r.message}`)
  .join('\n') || 'None'}

## Next Steps
${recommendations.slice(0, 3)
  .map((r, i) => `${i + 1}. ${r.message}`)
  .join('\n')}

For detailed analysis, see the full JSON report.
`;
  }
}

// CLI interface
if (require.main === module) {
  const auditor = new I18nAuditor({
    baseLanguage: process.argv[2] || 'en',
    localesPath: process.argv[3] || '../web-app/public/locales',
    outputPath: process.argv[4] || '../reports/i18n-audit-report.json'
  });

  auditor.audit()
    .then(() => {
      console.log('\n🎉 Audit completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Audit failed:', error.message);
      process.exit(1);
    });
}

module.exports = I18nAuditor;