#!/usr/bin/env node

/**
 * Fix remaining Clerk bypass references
 */

const fs = require('fs');
const path = require('path');

// Files that still need to be updated
const FILES_TO_UPDATE = [
  'src/pages/OrganizationManagement.jsx',
  'src/components/settings/BusinessProfileSettings.jsx',
  'src/components/settings/IntegrationsSettings.jsx',
  'src/components/settings/SecuritySettings.jsx',
  'src/components/settings/UserRoleManagement.jsx',
  'src/components/settings/TaxSettings.jsx',
  'src/components/settings/UserRoleManager.jsx',
  'src/components/settings/ProfileSettings.jsx',
  'src/components/settings/NotificationSettings.jsx',
  'src/components/settings/EmailSettings.jsx',
  'src/components/settings/DataExportSettings.jsx',
  'src/components/settings/CompanySettings.jsx',
  'src/components/settings/BillingSettings.jsx',
  'src/components/settings/BackupSettings.jsx',
  'src/components/financial/QuoteApprovalActions.jsx',
  'src/components/financial/QuoteForm.jsx',
  'src/components/financial/InvoiceFormNew.jsx',
  'src/components/financial/DigitalSignature.jsx',
  'src/components/analytics/ClientAnalyticsWidgets.jsx',
  'src/components/documents/ReceiptUpload.jsx',
  'src/components/demo/SafeTestingWrapper.jsx',
  'src/components/dashboard/EnhancedDashboard.jsx',
  'src/components/dashboard/ClassicViewEnhanced.jsx',
  'src/components/auth/ProtectedRoute.tsx',
  'src/components/financial/QuoteDetailModal.jsx',
  'src/components/financial/QuoteStatusHistory.jsx'
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
  },
  {
    from: "} from '@hooks/useClerkBypass';",
    to: "} from '@clerk/clerk-react';"
  }
];

// Hook usage replacements
const HOOK_REPLACEMENTS = [
  { from: "useAuthBypass()", to: "useAuth()" },
  { from: "useUserBypass()", to: "useUser()" },
  { from: "useClerkBypass()", to: "useClerk()" },
  { from: "useOrganizationBypass()", to: "useOrganization()" },
  { from: "useOrganizationListBypass()", to: "useOrganizationList()" }
];

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Failed to read ${filePath}:`, error.message);
    return null;
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Failed to write ${filePath}:`, error.message);
    return false;
  }
}

function updateFile(relativePath) {
  const fullPath = path.join('./web-app', relativePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    return false;
  }
  
  console.log(`🔧 Updating ${relativePath}...`);
  
  let content = readFile(fullPath);
  if (!content) return false;
  
  const originalContent = content;
  
  // Replace imports
  IMPORT_REPLACEMENTS.forEach(replacement => {
    if (content.includes(replacement.from)) {
      content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
      console.log(`  ✓ Replaced import: ${replacement.from.substring(0, 50)}...`);
    }
  });
  
  // Replace hook usage
  HOOK_REPLACEMENTS.forEach(replacement => {
    if (content.includes(replacement.from)) {
      content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
      console.log(`  ✓ Replaced hook usage: ${replacement.from}`);
    }
  });
  
  if (content !== originalContent) {
    return writeFile(fullPath, content);
  } else {
    console.log(`  ℹ️  No changes needed for ${relativePath}`);
    return true;
  }
}

function main() {
  console.log('🚀 Fixing remaining Clerk bypass references...\n');
  
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
  
  console.log('\n🎉 Remaining bypass fixes complete!');
}

if (require.main === module) {
  main();
}