# Development Scripts

This directory contains utility scripts for development, maintenance, and automation tasks.

## Structure

- **i18n/** - Internationalization and translation scripts
- **database/** - Database management and migration scripts
- **maintenance/** - Code maintenance and cleanup scripts
- **setup/** - Environment and service setup scripts

## Scripts Overview

### Internationalization
- `i18n-audit.js` - Audit translation files for missing keys and duplicates
- `fix-translation-issues.js` - Automated fixes for translation problems
- `analyze-duplicates.js` - Analyze duplicate translation keys
- `fix-duplicate-keys.js` - Fix duplicate translation keys
- `fix-remaining-duplicates.js` - Handle remaining duplicate issues
- `fix-specific-duplicates.js` - Fix specific duplicate patterns
- `fix-audit-false-positives.js` - Handle false positives in audits

### Database
- `create-migration.js` - Create new database migrations
- `apply-migrations-remote.js` - Apply migrations to remote database
- `setup-supabase.js` - Setup Supabase configuration

## Usage

Run scripts from the project root:
```bash
node tools/scripts/script-name.js
```

## Dependencies

Scripts have their own package.json for isolated dependencies.