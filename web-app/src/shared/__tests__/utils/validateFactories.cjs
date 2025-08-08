/**
 * Basic Factory Validation Script
 * This script validates that the test data factories are properly structured
 * without requiring complex test runners or module imports
 */

// Simple validation functions
function validateFactory() {
  console.log('🔍 Validating Test Data Factories...\n');
  
  // Check if faker is available
  try {
    const { faker } = require('@faker-js/faker');
    console.log('✅ @faker-js/faker is installed and accessible');
  } catch (error) {
    console.log('❌ @faker-js/faker is not available:', error.message);
    return false;
  }
  
  // Check factory file structure
  try {
    const fs = require('fs');
    const path = require('path');
    
    const factoryPath = path.join(__dirname, 'testDataFactories.js');
    const factoryContent = fs.readFileSync(factoryPath, 'utf8');
    
    // Check for essential exports
    const requiredExports = [
      'createMockUser',
      'createMockClient', 
      'createMockInvoice',
      'createMockEmail',
      'createMockApiResponse',
      'resetTestDataSeed'
    ];
    
    let missingExports = [];
    
    requiredExports.forEach(exportName => {
      if (!factoryContent.includes(`export const ${exportName}`)) {
        missingExports.push(exportName);
      }
    });
    
    if (missingExports.length > 0) {
      console.log('❌ Missing exports:', missingExports.join(', '));
      return false;
    }
    
    console.log('✅ All required factory functions are exported');
    
    // Check for faker usage
    if (!factoryContent.includes('faker.')) {
      console.log('❌ Faker is not being used in factories');
      return false;
    }
    
    console.log('✅ Faker is properly used in factories');
    
    // Check for proper structure
    const structureChecks = [
      { pattern: /createFactory\s*=/, name: 'createFactory helper function' },
      { pattern: /generateTestId\s*=/, name: 'generateTestId function' },
      { pattern: /generateTimestamp\s*=/, name: 'generateTimestamp function' },
      { pattern: /faker\.seed\(/, name: 'faker seed functionality' }
    ];
    
    structureChecks.forEach(check => {
      if (check.pattern.test(factoryContent)) {
        console.log(`✅ ${check.name} is present`);
      } else {
        console.log(`⚠️  ${check.name} might be missing`);
      }
    });
    
    console.log('\n📊 Factory Structure Validation Complete');
    return true;
    
  } catch (error) {
    console.log('❌ Error reading factory file:', error.message);
    return false;
  }
}

// Validate factory data types
function validateFactoryTypes() {
  console.log('\n🔍 Validating Factory Data Types...\n');
  
  try {
    // Basic type validation without actually running the factories
    const fs = require('fs');
    const path = require('path');
    
    const factoryPath = path.join(__dirname, 'testDataFactories.js');
    const factoryContent = fs.readFileSync(factoryPath, 'utf8');
    
    // Check for proper TypeScript-like structure
    const typeChecks = [
      { pattern: /email.*faker\.internet\.email/, name: 'Email generation' },
      { pattern: /first_name.*faker\.person\.firstName/, name: 'First name generation' },
      { pattern: /amount.*faker\.number\.float/, name: 'Amount generation' },
      { pattern: /created_at.*generateTimestamp/, name: 'Timestamp generation' },
      { pattern: /id.*generateTestId/, name: 'ID generation' }
    ];
    
    typeChecks.forEach(check => {
      if (check.pattern.test(factoryContent)) {
        console.log(`✅ ${check.name} is properly implemented`);
      } else {
        console.log(`⚠️  ${check.name} might need attention`);
      }
    });
    
    return true;
    
  } catch (error) {
    console.log('❌ Error validating factory types:', error.message);
    return false;
  }
}

// Check documentation
function validateDocumentation() {
  console.log('\n🔍 Validating Documentation...\n');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const readmePath = path.join(__dirname, 'README_TestDataFactories.md');
    
    if (fs.existsSync(readmePath)) {
      console.log('✅ Documentation file exists');
      
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      if (readmeContent.includes('# Test Data Factories')) {
        console.log('✅ Documentation has proper title');
      }
      
      if (readmeContent.includes('## Basic Usage')) {
        console.log('✅ Documentation includes usage examples');
      }
      
      if (readmeContent.includes('createMockUser')) {
        console.log('✅ Documentation covers main factory functions');
      }
      
    } else {
      console.log('⚠️  Documentation file not found');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Error validating documentation:', error.message);
    return false;
  }
}

// Main validation function
function runValidation() {
  console.log('🧪 Test Data Factories Validation\n');
  console.log('='.repeat(50));
  
  const results = [
    validateFactory(),
    validateFactoryTypes(),
    validateDocumentation()
  ];
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Validation Results: ${passed}/${total} checks passed`);
  
  if (passed === total) {
    console.log('🎉 All validations passed! Test data factories are properly set up.');
    console.log('\n📝 Next steps:');
    console.log('   1. Import factories in your test files');
    console.log('   2. Use createMockUser(), createMockClient(), etc.');
    console.log('   3. Check README_TestDataFactories.md for usage examples');
  } else {
    console.log('⚠️  Some validations failed. Please review the issues above.');
  }
  
  return passed === total;
}

// Export for use in other scripts
module.exports = {
  runValidation,
  validateFactory,
  validateFactoryTypes,
  validateDocumentation
};

// Run validation if this script is executed directly
if (require.main === module) {
  runValidation();
}