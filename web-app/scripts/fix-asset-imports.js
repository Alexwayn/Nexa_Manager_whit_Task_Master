#!/usr/bin/env node

/**
 * Asset Import Fix Script
 * 
 * This script fixes all asset imports to use the correct @assets alias
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webAppRoot = path.resolve(__dirname, '..');

class AssetImportFixer {
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
        this.log('Scanning for asset import issues...');

        const patterns = [
            'src/**/*.{js,jsx,ts,tsx}',
            '!src/**/__tests__/**',
            '!src/**/*.test.*',
            '!src/**/*.spec.*'
        ];

        const files = await glob(patterns, { cwd: webAppRoot });
        
        for (const file of files) {
            const filePath = path.join(webAppRoot, file);
            await this.fixFileAssetImports(filePath);
        }

        return this.fixes;
    }

    async fixFileAssetImports(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            let modified = false;
            const newLines = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const fixedLine = this.fixAssetImportLine(line, filePath, i + 1);
                
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
                this.success(`Fixed asset imports in ${path.relative(webAppRoot, filePath)}`);
            }

        } catch (error) {
            this.error(`Could not fix asset imports in ${filePath}: ${error.message}`);
        }
    }

    fixAssetImportLine(line, filePath, lineNumber) {
        if (!line.trim().startsWith('import') || !line.includes('from')) {
            return line;
        }

        // Fix @/assets imports to @assets
        if (line.includes('@/assets')) {
            return line.replace('@/assets', '@assets');
        }

        // Fix relative asset imports
        if (line.includes('from \'../') && (line.includes('assets') || line.includes('logo') || line.includes('.png') || line.includes('.jpg') || line.includes('.svg'))) {
            const match = line.match(/from\s+['"]([^'"]+)['"]/);
            if (match) {
                const importPath = match[1];
                const fixedPath = this.convertAssetPathToAlias(importPath, filePath);
                if (fixedPath && fixedPath !== importPath) {
                    return line.replace(importPath, fixedPath);
                }
            }
        }

        return line;
    }

    convertAssetPathToAlias(importPath, filePath) {
        // Convert relative paths to assets to @assets alias
        if (importPath.includes('../') && (importPath.includes('assets') || importPath.includes('logo'))) {
            // Extract the asset path part
            const assetMatch = importPath.match(/.*\/(assets\/.+)/);
            if (assetMatch) {
                return `@${assetMatch[1]}`;
            }
        }

        return null;
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('🔧 ASSET IMPORT FIX SUMMARY');
        console.log('='.repeat(60));

        console.log(`✅ Total fixes applied: ${this.fixes.length}`);
        console.log(`❌ Errors encountered: ${this.errors.length}`);

        if (this.fixes.length > 0) {
            console.log('\n📝 FIXES APPLIED:');
            this.fixes.forEach((fix, index) => {
                console.log(`  ${index + 1}. ${fix.file}:${fix.line}`);
                console.log(`     - ${fix.original}`);
                console.log(`     + ${fix.fixed}`);
            });
        }

        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }

        console.log('\n💡 NEXT STEPS:');
        console.log('  1. Run build to verify fixes');
        console.log('  2. Test that assets load correctly');

        console.log('\n' + '='.repeat(60));
    }

    async run() {
        console.log('🔧 Starting Asset Import Fix...\n');

        try {
            await this.scanAndFixFiles();
            this.printSummary();

            if (this.errors.length > 0) {
                console.log('\n⚠️  Some errors occurred during fixing');
                process.exit(1);
            } else {
                console.log('\n✅ Asset import fix completed successfully');
                process.exit(0);
            }

        } catch (error) {
            console.error('❌ Asset import fix crashed:', error);
            process.exit(1);
        }
    }
}

// Run the fixer
const fixer = new AssetImportFixer();
fixer.run();