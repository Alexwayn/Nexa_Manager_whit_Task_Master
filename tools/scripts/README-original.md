# i18n Translation Audit Tool

A comprehensive tool for auditing internationalization (i18n) translation files in the Nexa Manager project.

## Features

- **Translation Completeness Analysis**: Compare all languages against the base language to identify missing translations
- **Quality Checks**: Detect empty values, duplicate keys, encoding issues, and syntax errors
- **Usage Analysis**: Scan source code to identify unused translation keys
- **Formatting Consistency**: Check for consistent placeholder patterns and formatting
- **Detailed Reporting**: Generate structured JSON reports with errors, warnings, and recommendations
- **Health Scoring**: Calculate an overall health score for your translation files

## Installation

1. Navigate to the scripts directory:
```bash
cd scripts
```

2. Install dependencies:
```bash
npm install
```

Or install manually:
```bash
npm install glob yaml
```

## Usage

### Basic Usage

Run the audit with default settings (English as base language):
```bash
node i18n-audit.js
```

### Custom Base Language

Specify a different base language:
```bash
node i18n-audit.js it
```

### Custom Paths

Specify custom paths for locales and output:
```bash
node i18n-audit.js en ../web-app/public/locales ../reports/custom-audit.json
```

### Using npm Scripts

```bash
# Default audit
npm run audit

# Audit with English as base
npm run audit:en

# Custom audit with specified paths
npm run audit:custom
```

## Output

The tool generates two files:

1. **Detailed JSON Report** (`i18n-audit-report.json`): Complete audit data with all findings
2. **Human-Readable Summary** (`i18n-audit-report-summary.txt`): Quick overview of issues and recommendations

### Report Structure

```json
{
  "summary": {
    "auditDate": "2024-01-15T10:30:00.000Z",
    "baseLanguage": "en",
    "totalLanguages": 2,
    "totalFiles": 24,
    "completionPercentages": {
      "it": 85
    },
    "overallHealth": "good",
    "healthScore": 78,
    "totalIssues": 5
  },
  "errors": [
    {
      "type": "syntax_error",
      "language": "it",
      "file": "common.json",
      "message": "Failed to parse file: Unexpected token",
      "severity": "high"
    }
  ],
  "warnings": [
    {
      "type": "missing_translations",
      "language": "it",
      "count": 12,
      "message": "12 missing translations (15% incomplete)",
      "severity": "medium"
    }
  ],
  "recommendations": [
    {
      "type": "completion",
      "priority": "high",
      "message": "Prioritize completing translations for: it",
      "affectedLanguages": ["it"]
    }
  ],
  "details": {
    "missingTranslations": {
      "it": ["auth.login.title", "auth.register.subtitle"]
    },
    "emptyValues": {
      "it": [
        {"file": "auth", "key": "login.placeholder"}
      ]
    },
    "unusedKeys": ["old.deprecated.key"],
    "duplicateKeys": {},
    "encodingIssues": [],
    "syntaxErrors": []
  }
}
```

## Issue Types

### Errors (Critical Issues)
- **syntax_error**: JSON/YAML parsing failures
- **duplicate_keys**: Duplicate translation keys in the same file
- **missing_base_language**: Base language directory not found

### Warnings (Quality Issues)
- **missing_translations**: Keys present in base language but missing in target language
- **empty_values**: Translation keys with empty or null values
- **unused_keys**: Translation keys not found in source code
- **mixed_placeholder_patterns**: Inconsistent placeholder formats ({{}} vs ${})
- **html_content**: HTML tags detected in translation values

### Recommendations
- **completion**: Suggestions for improving translation completeness
- **standardization**: Recommendations for consistent formatting
- **cleanup**: Suggestions for removing unused keys
- **quality**: Recommendations for fixing encoding or syntax issues

## Health Scoring

The tool calculates an overall health score (0-100) based on:
- Number and severity of errors and warnings
- Average completion percentage across all languages
- Code quality indicators

Health levels:
- **Excellent** (90-100): Minimal issues, high completion
- **Good** (75-89): Some minor issues, good completion
- **Fair** (50-74): Several issues requiring attention
- **Poor** (0-49): Many critical issues, low completion

## Supported File Formats

- JSON (`.json`)
- YAML (`.yaml`, `.yml`)

## Translation Key Detection Patterns

The tool scans source code for these translation function patterns:
- `t('key')` or `t("key")` or `t(`key`)`
- `$t('key')` or `$t("key")` or `$t(`key`)`
- `i18n.method('key')` patterns
- `translate('key')` patterns

## Configuration

You can customize the audit by modifying the `I18nAuditor` constructor options in the script:

```javascript
const auditor = new I18nAuditor({
  baseLanguage: 'en',                              // Base language for comparison
  localesPath: './web-app/public/locales',         // Path to translation files
  sourceCodePath: './web-app/src',                 // Path to source code for usage analysis
  outputPath: './reports/i18n-audit-report.json'  // Output file path
});
```

## Integration with CI/CD

You can integrate this tool into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run i18n Audit
  run: |
    cd scripts
    npm install
    node i18n-audit.js
    
- name: Check Health Score
  run: |
    HEALTH_SCORE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('./reports/i18n-audit-report.json')).summary.healthScore)")
    if [ $HEALTH_SCORE -lt 75 ]; then
      echo "Translation health score too low: $HEALTH_SCORE"
      exit 1
    fi
```

## Troubleshooting

### Common Issues

1. **"Locales directory not found"**
   - Ensure the locales path is correct
   - Check that the directory exists and contains language subdirectories

2. **"No language directories found"**
   - Verify that language directories (e.g., `en`, `it`) exist in the locales folder
   - Ensure directories contain translation files

3. **"Failed to parse file"**
   - Check JSON/YAML syntax in the problematic file
   - Ensure proper encoding (UTF-8)

4. **High number of "unused keys"**
   - Review the translation key detection patterns
   - Consider if keys are used in templates or dynamic contexts
   - Some false positives are normal for dynamically generated keys

### Performance Considerations

- Large codebases may take longer to scan for usage analysis
- Consider excluding build directories and node_modules from source code scanning
- The tool processes files synchronously for accuracy but may be slower on large projects

## Contributing

To extend the tool:

1. Add new check methods to the `I18nAuditor` class
2. Update the `performQualityChecks` method to include new checks
3. Add corresponding error/warning types to the report structure
4. Update this documentation

## License

MIT License - see the project's main LICENSE file for details.