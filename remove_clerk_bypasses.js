#!/usr/bin/env node

/**
 * CLERK BYPASS REMOVAL SCRIPT
 * 
 * This script removes all Clerk authentication bypasses from the codebase
 * and replaces them with proper Clerk authentication hooks.
 * 
 * Usage: node remove_clerk_bypasses.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const WEB_APP_DIR = './web-app';
const BACKUP_DIR = './backup-before-clerk-fix';

// Files that need to be updated
const FILES_TO_UPDATE = [
  // Pages
  'src/pages/Analytics.jsx',
  'src/pages/Calendar.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Invoices.jsx',
  'src/pages/Login.jsx',
  'src/pages/Onboarding.jsx',
  'src/pages/ProfileForm.jsx',
  'src/pages/Quotes.jsx',
  'src/pages/Register.jsx',
  'src/pages/ReportsRefactored.jsx',
  'src/pages/ResetPassword.jsx',
  'src/pages/RLSSecurityTest.jsx',
  'src/pages/Settings.jsx',
  'src/pages/TestDebug.jsx',
  'src/pages/Transactions.jsx',
  
  // Hooks
  'src/hooks/useAuthGuard.ts',
  'src/hooks/useClerkAuth.js',
  'src/hooks/useClients.js',
  'src/hooks/useFileUpload.js',
  'src/hooks/useNotifications.js',
  'src/hooks/useProfile.js',
  'src/hooks/useRealtimeDashboard.js',
  'src/hooks/useReports.js',
  'src/hooks/useUserSessions.js',
  
  // Services
  'src/lib/clerkSupabaseIntegration.js',
  'src/lib/supabaseClerkClient.js'
];

// Import replacements
const IMPORT_REPLACEMENTS = [
  {
    from: "import { useAuthBypass as useAuth } from '@hooks/useClerkBypass';",
    to: "import { useAuth } from '@clerk/clerk-react';"
  },
  {
    from: "import { useUserBypass as useUser } from '@hooks/useClerkBypass';",
    to: "import { useUser } from '@clerk/clerk-react';"
  },
  {
    from: "import { useClerkBypass as useClerk } from '@hooks/useClerkBypass';",
    to: "import { useClerk } from '@clerk/clerk-react';"
  },
  {
    from: "import { useOrganizationBypass as useOrganization } from '@hooks/useClerkBypass';",
    to: "import { useOrganization } from '@clerk/clerk-react';"
  },
  {
    from: "import { useOrganizationListBypass as useOrganizationList } from '@hooks/useClerkBypass';",
    to: "import { useOrganizationList } from '@clerk/clerk-react';"
  },
  {
    from: "import { useAuthBypass as useAuth, useUserBypass as useUser } from '@hooks/useClerkBypass';",
    to: "import { useAuth, useUser } from '@clerk/clerk-react';"
  },
  {
    from: "import { useClerkBypass as useClerk, useAuthBypass as useAuth } from '@hooks/useClerkBypass';",
    to: "import { useClerk, useAuth } from '@clerk/clerk-react';"
  }
];

// App.jsx specific changes
const APP_JSX_CHANGES = {
  // Remove bypass logic
  removeLines: [
    'const shouldBypassClerk = isDevelopment && isLocalhost;',
    'console.log(\'🚧 shouldBypassClerk:\', shouldBypassClerk);',
    '// Development mode no longer shows the bypass banner'
  ],
  
  // Remove bypass conditional
  removeBlocks: [
    {
      start: 'if (shouldBypassClerk) {',
      end: '  }'
    }
  ]
};

/**
 * Create backup of current codebase
 */
function createBackup() {
  console.log('📦 Creating backup of current codebase...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  try {
    // Create backup directory structure
    if (!fs.existsSync(`${BACKUP_DIR}\\web-app`)) {
      fs.mkdirSync(`${BACKUP_DIR}\\web-app`, { recursive: true });
    }
    
    // Copy only source files, excluding node_modules and large directories
    execSync(`xcopy "${WEB_APP_DIR}\\src" "${BACKUP_DIR}\\web-app\\src\\" /E /I /H /Y`, { stdio: 'inherit' });
    execSync(`xcopy "${WEB_APP_DIR}\\*.json" "${BACKUP_DIR}\\web-app\\" /Y`, { stdio: 'inherit' });
    execSync(`xcopy "${WEB_APP_DIR}\\*.js" "${BACKUP_DIR}\\web-app\\" /Y`, { stdio: 'inherit' });
    execSync(`xcopy "${WEB_APP_DIR}\\*.ts" "${BACKUP_DIR}\\web-app\\" /Y`, { stdio: 'inherit' });
    console.log('✅ Backup created successfully (source files only)');
  } catch (error) {
    console.error('❌ Failed to create backup:', error.message);
    console.log('⚠️  Continuing without backup...');
  }
}

/**
 * Read file content
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Failed to read ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Write file content
 */
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Failed to write ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Replace imports in a file
 */
function replaceImports(content) {
  let updatedContent = content;
  
  IMPORT_REPLACEMENTS.forEach(replacement => {
    if (updatedContent.includes(replacement.from)) {
      updatedContent = updatedContent.replace(replacement.from, replacement.to);
      console.log(`  ✓ Replaced: ${replacement.from.substring(0, 50)}...`);
    }
  });
  
  return updatedContent;
}

/**
 * Update App.jsx to remove bypass logic
 */
function updateAppJsx() {
  console.log('🔧 Updating App.jsx to remove bypass logic...');
  
  const appJsxPath = path.join(WEB_APP_DIR, 'src/App.jsx');
  let content = readFile(appJsxPath);
  
  if (!content) return false;
  
  // Remove bypass logic lines
  APP_JSX_CHANGES.removeLines.forEach(line => {
    if (content.includes(line)) {
      content = content.replace(line, '');
      console.log(`  ✓ Removed line: ${line}`);
    }
  });
  
  // Remove bypass conditional block
  const bypassStart = content.indexOf('if (shouldBypassClerk) {');
  if (bypassStart !== -1) {
    // Find the matching closing brace
    let braceCount = 0;
    let i = bypassStart;
    let blockStart = -1;
    let blockEnd = -1;
    
    while (i < content.length) {
      if (content[i] === '{') {
        if (blockStart === -1) blockStart = i;
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          blockEnd = i + 1;
          break;
        }
      }
      i++;
    }
    
    if (blockStart !== -1 && blockEnd !== -1) {
      // Find the start of the if statement
      let ifStart = content.lastIndexOf('if (shouldBypassClerk)', blockStart);
      content = content.substring(0, ifStart) + content.substring(blockEnd);
      console.log('  ✓ Removed bypass conditional block');
    }
  }
  
  // Clean up any remaining bypass references
  content = content.replace(/\/\/ For development\/localhost, we can bypass Clerk completely\s*\n/g, '');
  content = content.replace(/const shouldBypassClerk = isDevelopment && isLocalhost;\s*\n/g, '');
  
  return writeFile(appJsxPath, content);
}

/**
 * Update a single file
 */
function updateFile(relativePath) {
  const fullPath = path.join(WEB_APP_DIR, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    return false;
  }
  
  console.log(`🔧 Updating ${relativePath}...`);
  
  let content = readFile(fullPath);
  if (!content) return false;
  
  const originalContent = content;
  content = replaceImports(content);
  
  if (content !== originalContent) {
    return writeFile(fullPath, content);
  } else {
    console.log(`  ℹ️  No changes needed for ${relativePath}`);
    return true;
  }
}

/**
 * Remove or rename the bypass hooks file
 */
function handleBypassHooksFile() {
  console.log('🗑️  Handling useClerkBypass.ts file...');
  
  const bypassHooksPath = path.join(WEB_APP_DIR, 'src/hooks/useClerkBypass.ts');
  
  if (fs.existsSync(bypassHooksPath)) {
    // Rename to .backup instead of deleting
    const backupPath = bypassHooksPath + '.backup';
    try {
      fs.renameSync(bypassHooksPath, backupPath);
      console.log('  ✓ Renamed useClerkBypass.ts to useClerkBypass.ts.backup');
    } catch (error) {
      console.error('  ❌ Failed to rename bypass hooks file:', error.message);
      return false;
    }
  }
  
  return true;
}

/**
 * Verify Clerk is properly configured
 */
function verifyClerkConfiguration() {
  console.log('🔍 Verifying Clerk configuration...');
  
  // Check if Clerk publishable key is set
  const envPath = path.join(WEB_APP_DIR, '.env');
  const envExamplePath = path.join(WEB_APP_DIR, '.env.example');
  
  let hasClerkKey = false;
  
  if (fs.existsSync(envPath)) {
    const envContent = readFile(envPath);
    if (envContent && envContent.includes('VITE_CLERK_PUBLISHABLE_KEY')) {
      hasClerkKey = true;
      console.log('  ✓ Clerk publishable key found in .env');
    }
  }
  
  if (!hasClerkKey) {
    console.log('  ⚠️  Clerk publishable key not found in .env');
    console.log('  📝 Make sure to set VITE_CLERK_PUBLISHABLE_KEY in your .env file');
  }
  
  // Check package.json for Clerk dependency
  const packageJsonPath = path.join(WEB_APP_DIR, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFile(packageJsonPath));
    if (packageJson.dependencies && packageJson.dependencies['@clerk/clerk-react']) {
      console.log('  ✓ @clerk/clerk-react dependency found');
    } else {
      console.log('  ⚠️  @clerk/clerk-react dependency not found');
      console.log('  📝 Run: npm install @clerk/clerk-react');
    }
  }
}

/**
 * Run TypeScript check
 */
function runTypeScriptCheck() {
  console.log('🔍 Running TypeScript check...');
  
  try {
    execSync('npm run type-check', { 
      cwd: WEB_APP_DIR, 
      stdio: 'inherit' 
    });
    console.log('✅ TypeScript check passed');
    return true;
  } catch (error) {
    console.log('❌ TypeScript check failed');
    console.log('  📝 Please fix TypeScript errors before proceeding');
    return false;
  }
}

/**
 * Main execution function
 */
function main() {
  console.log('🚀 Starting Clerk Bypass Removal Process...\n');
  
  // Step 1: Create backup
  createBackup();
  
  // Step 2: Update App.jsx
  if (!updateAppJsx()) {
    console.error('❌ Failed to update App.jsx');
    process.exit(1);
  }
  
  // Step 3: Update all files with bypass imports
  console.log('\n📝 Updating files with bypass imports...');
  let successCount = 0;
  let failCount = 0;
  
  FILES_TO_UPDATE.forEach(file => {
    if (updateFile(file)) {
      successCount++;
    } else {
      failCount++;
    }
  });
  
  console.log(`\n📊 Update Summary:`);
  console.log(`  ✅ Successfully updated: ${successCount} files`);
  console.log(`  ❌ Failed to update: ${failCount} files`);
  
  // Step 4: Handle bypass hooks file
  if (!handleBypassHooksFile()) {
    console.error('❌ Failed to handle bypass hooks file');
    process.exit(1);
  }
  
  // Step 5: Verify Clerk configuration
  verifyClerkConfiguration();
  
  // Step 6: Run TypeScript check
  const typeCheckPassed = runTypeScriptCheck();
  
  console.log('\n🎉 Clerk Bypass Removal Process Complete!');
  console.log('\n📋 Next Steps:');
  console.log('  1. Set VITE_CLERK_PUBLISHABLE_KEY in your .env file');
  console.log('  2. Ensure @clerk/clerk-react is installed');
  console.log('  3. Test authentication flow');
  console.log('  4. Run the RLS remediation script');
  
  if (!typeCheckPassed) {
    console.log('  5. Fix TypeScript errors');
    process.exit(1);
  }
  
  console.log('\n✅ Ready to proceed with RLS remediation!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  updateFile,
  replaceImports,
  createBackup
};