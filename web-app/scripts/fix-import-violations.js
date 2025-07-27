#!/usr/bin/env node

/**
 * Import Violations Fix Script
 * 
 * This script systematically fixes deep import violations identified
 * by the architecture monitor to use proper public APIs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webAppRoot = path.resolve(__dirname, '..');
const srcPath = path.join(webAppRoot, 'src');

class ImportViolationFixer {
    constructor() {
        this.fixes = [];
        this.errors = [];
    }

    log(message) {
        console.log(`🔧 ${message}`);
    }

    error(message) {
        console.error(`❌ ${message}`);
        this.errors.push(message);
    }

    success(message) {
        console.log(`✅ ${message}`);
    }

    async scanAndFixFiles() {
        this.log('Scanning for import violations...');

        const patterns = [
            'src/**/*.{js,jsx,ts,tsx}',
            '!src/**/__tests__/**',
            '!src/**/*.test.*',
            '!src/**/*.spec.*'
        ];

        const files = await glob(patterns, { cwd: webAppRoot });
        
        for (const file of files) {
            const filePath = path.join(webAppRoot, file);
            await this.fixFileImports(filePath);
        }

        return this.fixes;
    }

    async fixFileImports(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            let modified = false;
            const newLines = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const fixedLine = this.fixImportLine(line, filePath, i + 1);
                
                if (fixedLine !== line) {
                    modified = true;
                    this.fixes.push({
                        file: path.relative(webAppRoot, filePath),
                        line: i + 1,
                        original: line.trim(),
                        fixed: fixedLine.trim()
                    });
                }
                
                newLines.push(fixedLine);
            }

            if (modified) {
                fs.writeFileSync(filePath, newLines.join('\n'));
                this.success(`Fixed imports in ${path.relative(webAppRoot, filePath)}`);
            }

        } catch (error) {
            this.error(`Could not fix imports in ${filePath}: ${error.message}`);
        }
    }

    fixImportLine(line, filePath, lineNumber) {
        if (!line.trim().startsWith('import') || !line.includes('from')) {
            return line;
        }

        // Extract import path
        const match = line.match(/from\s+['"]([^'"]+)['"]/);
        if (!match) return line;

        const importPath = match[1];
        const fixedPath = this.getFixedImportPath(importPath, filePath);

        if (fixedPath && fixedPath !== importPath) {
            return line.replace(importPath, fixedPath);
        }

        return line;
    }

    getFixedImportPath(importPath, filePath) {
        // Fix deep imports into shared modules
        if (importPath.includes('@shared/') && this.isDeepImport(importPath, '@shared/')) {
            return this.fixSharedImport(importPath);
        }

        // Fix deep imports into features
        if (importPath.includes('@features/') && this.isDeepImport(importPath, '@features/')) {
            return this.fixFeatureImport(importPath);
        }

        // Fix relative imports that should use aliases
        if (importPath.startsWith('../') && this.shouldUseAlias(importPath, filePath)) {
            return this.convertToAlias(importPath, filePath);
        }

        return null;
    }

    isDeepImport(importPath, prefix) {
        const parts = importPath.replace(prefix, '').split('/');
        // Deep import if more than 2 levels (module/submodule/file)
        return parts.length > 2 && !parts[parts.length - 1].includes('index');
    }

    fixSharedImport(importPath) {
        // Convert @shared/components/ui/Button to @shared/components
        // Convert @shared/utils/formatters/dateUtils to @shared/utils
        const parts = importPath.split('/');
        
        if (parts.length > 3) {
            // Keep only @shared/module
            return `${parts[0]}/${parts[1]}`;
        }
        
        return importPath;
    }

    fixFeatureImport(importPath) {
        // Convert @features/auth/components/LoginForm to @features/auth
        // Convert @features/clients/services/clientService to @features/clients
        const parts = importPath.split('/');
        
        if (parts.length > 2) {
            // Keep only @features/featureName
            return `${parts[0]}/${parts[1]}`;
        }
        
        return importPath;
    }

    shouldUseAlias(importPath, filePath) {
        // Check if relative import goes up more than 2 levels
        const depth = (importPath.match(/\.\.\//g) || []).length;
        return depth > 2;
    }

    convertToAlias(importPath, filePath) {
        // Convert relative paths to aliases
        const currentDir = path.dirname(filePath);
        const targetPath = path.resolve(currentDir, importPath);
        const relativePath = path.relative(srcPath, targetPath);
        
        // Convert to appropriate alias
        if (relativePath.startsWith('features/')) {
            const parts = relativePath.split('/');
            return `@features/${parts[1]}`;
        }
        
        if (relativePath.startsWith('shared/')) {
            const parts = relativePath.split('/');
            return `@shared/${parts[1]}`;
        }
        
        if (relativePath.startsWith('lib/')) {
            return '@lib';
        }
        
        if (relativePath.startsWith('utils/')) {
            return '@utils';
        }
        
        return `@/${relativePath}`;
    }

    async fixSpecificViolations() {
        this.log('Fixing specific high-priority violations...');

        // Fix App.jsx deep import
        await this.fixAppJsxImports();
        
        // Fix router deep imports
        await this.fixRouterImports();
        
        // Fix page component imports
        await this.fixPageImports();
        
        // Fix feature service imports
        await this.fixFeatureServiceImports();
    }

    async fixAppJsxImports() {
        const appPath = path.join(srcPath, 'App.jsx');
        if (!fs.existsSync(appPath)) return;

        const content = fs.readFileSync(appPath, 'utf8');
        let newContent = content;

        // Fix specific deep imports found in App.jsx
        newContent = newContent.replace(
            /from ['"]@shared\/components\/ui\/([^'"]+)['"]/g,
            'from \'@shared/components\''
        );

        if (newContent !== content) {
            fs.writeFileSync(appPath, newContent);
            this.success('Fixed App.jsx imports');
        }
    }

    async fixRouterImports() {
        const routerFiles = [
            'src/router/protectedRoutes.tsx',
            'src/router/AppRouter.jsx'
        ];

        for (const file of routerFiles) {
            const filePath = path.join(webAppRoot, file);
            if (!fs.existsSync(filePath)) continue;

            const content = fs.readFileSync(filePath, 'utf8');
            let newContent = content;

            // Fix feature deep imports
            newContent = newContent.replace(
                /from ['"]@features\/([^\/]+)\/[^'"]+['"]/g,
                'from \'@features/$1\''
            );

            // Fix shared deep imports
            newContent = newContent.replace(
                /from ['"]@shared\/([^\/]+)\/[^'"]+['"]/g,
                'from \'@shared/$1\''
            );

            if (newContent !== content) {
                fs.writeFileSync(filePath, newContent);
                this.success(`Fixed ${file} imports`);
            }
        }
    }

    async fixPageImports() {
        const pagesPath = path.join(srcPath, 'pages');
        if (!fs.existsSync(pagesPath)) return;

        const pageFiles = await glob('*.{js,jsx}', { cwd: pagesPath });
        
        for (const file of pageFiles) {
            const filePath = path.join(pagesPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            let newContent = content;

            // Fix deep relative imports
            newContent = newContent.replace(
                /from ['"]\.\.\/\.\.\/\.\.\/([^'"]+)['"]/g,
                (match, path) => {
                    if (path.startsWith('shared/')) {
                        const parts = path.split('/');
                        return `from '@shared/${parts[1]}'`;
                    }
                    if (path.startsWith('features/')) {
                        const parts = path.split('/');
                        return `from '@features/${parts[1]}'`;
                    }
                    return `from '@/${path}'`;
                }
            );

            // Fix shared deep imports
            newContent = newContent.replace(
                /from ['"]@shared\/([^\/]+)\/[^'"]+['"]/g,
                'from \'@shared/$1\''
            );

            // Fix feature deep imports
            newContent = newContent.replace(
                /from ['"]@features\/([^\/]+)\/[^'"]+['"]/g,
                'from \'@features/$1\''
            );

            if (newContent !== content) {
                fs.writeFileSync(filePath, newContent);
                this.success(`Fixed ${file} imports`);
            }
        }
    }

    async fixFeatureServiceImports() {
        const featuresPath = path.join(srcPath, 'features');
        if (!fs.existsSync(featuresPath)) return;

        const serviceFiles = await glob('*/services/*.{js,ts}', { cwd: featuresPath });
        
        for (const file of serviceFiles) {
            const filePath = path.join(featuresPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            let newContent = content;

            // Fix cross-feature imports
            newContent = newContent.replace(
                /from ['"]@features\/([^\/]+)\/[^'"]+['"]/g,
                'from \'@features/$1\''
            );

            // Fix shared deep imports
            newContent = newContent.replace(
                /from ['"]@shared\/([^\/]+)\/[^'"]+['"]/g,
                'from \'@shared/$1\''
            );

            if (newContent !== content) {
                fs.writeFileSync(filePath, newContent);
                this.success(`Fixed ${file} imports`);
            }
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('🔧 IMPORT VIOLATION FIX SUMMARY');
        console.log('='.repeat(60));

        console.log(`✅ Total fixes applied: ${this.fixes.length}`);
        console.log(`❌ Errors encountered: ${this.errors.length}`);

        if (this.fixes.length > 0) {
            console.log('\n📝 SAMPLE FIXES:');
            this.fixes.slice(0, 10).forEach((fix, index) => {
                console.log(`  ${index + 1}. ${fix.file}:${fix.line}`);
                console.log(`     - ${fix.original}`);
                console.log(`     + ${fix.fixed}`);
            });

            if (this.fixes.length > 10) {
                console.log(`     ... and ${this.fixes.length - 10} more fixes`);
            }
        }

        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }

        console.log('\n💡 NEXT STEPS:');
        console.log('  1. Run architecture monitor to verify fixes');
        console.log('  2. Update feature index files to export required components');
        console.log('  3. Test that imports resolve correctly');
        console.log('  4. Run build to ensure no breaking changes');

        console.log('\n' + '='.repeat(60));
    }

    async run() {
        console.log('🔧 Starting Import Violation Fix...\n');

        try {
            // Fix specific high-priority violations first
            await this.fixSpecificViolations();
            
            // Then scan and fix all files systematically
            await this.scanAndFixFiles();

            this.printSummary();

            if (this.errors.length > 0) {
                console.log('\n⚠️  Some errors occurred during fixing');
                process.exit(1);
            } else {
                console.log('\n✅ Import violation fix completed successfully');
                process.exit(0);
            }

        } catch (error) {
            console.error('❌ Import violation fix crashed:', error);
            process.exit(1);
        }
    }
}

// Run the fixer
const fixer = new ImportViolationFixer();
fixer.run();