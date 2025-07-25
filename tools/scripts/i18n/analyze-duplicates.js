#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findDuplicateKeys(obj, currentPath = '', allKeys = new Map()) {
  const duplicates = [];
  
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return duplicates;
  }

  const keys = Object.keys(obj);
  const localKeys = new Set();
  
  // Check for duplicates at the current level
  keys.forEach(key => {
    if (localKeys.has(key)) {
      duplicates.push({
        key: key,
        path: currentPath,
        fullPath: currentPath ? `${currentPath}.${key}` : key
      });
    } else {
      localKeys.add(key);
    }
  });

  // Recursively check nested objects
  keys.forEach(key => {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    const nestedDuplicates = findDuplicateKeys(obj[key], newPath, allKeys);
    duplicates.push(...nestedDuplicates);
  });

  return duplicates;
}

function analyzeFile(filePath) {
  try {
    console.log(`\n🔍 Analyzing: ${path.basename(filePath)}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    const duplicates = findDuplicateKeys(data);
    
    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicate keys:`);
      duplicates.forEach(dup => {
        console.log(`   - "${dup.key}" at path: ${dup.path || 'root'}`);
      });
    } else {
      console.log('✅ No duplicate keys found');
    }
    
    return duplicates;
  } catch (error) {
    console.log(`❌ Error analyzing ${filePath}: ${error.message}`);
    return [];
  }
}

// Analyze specific problematic files
const localesPath = path.join(__dirname, '../web-app/public/locales/en');
const problematicFiles = [
  'apiReference.json',
  'common.json', 
  'compliance.json',
  'helpCenter.json',
  'inventory.json',
  'legalNotice.json',
  'login.json',
  'quotes.json'
];

console.log('🔍 Analyzing problematic files for duplicate keys...');

let totalDuplicates = 0;
problematicFiles.forEach(fileName => {
  const filePath = path.join(localesPath, fileName);
  if (fs.existsSync(filePath)) {
    const duplicates = analyzeFile(filePath);
    totalDuplicates += duplicates.length;
  } else {
    console.log(`⚠️  File not found: ${fileName}`);
  }
});

console.log(`\n📊 Total duplicate keys found: ${totalDuplicates}`);