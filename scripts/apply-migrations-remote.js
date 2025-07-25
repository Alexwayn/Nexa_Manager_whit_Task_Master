#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📊 Remote Database Migration Script');
console.log('=====================================\n');

// Read all migration files
const migrationsDir = path.join('supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

if (migrationFiles.length === 0) {
  console.log('❌ No migration files found in supabase/migrations/');
  process.exit(1);
}

console.log('📋 Found the following migrations:');
migrationFiles.forEach((file, index) => {
  console.log(`   ${index + 1}. ${file}`);
});

console.log('\n🔧 To apply these migrations to your remote Supabase database:');
console.log('\n1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to SQL Editor');
console.log('4. Copy and paste each migration file in order:\n');

migrationFiles.forEach((file, index) => {
  const filePath = path.join(migrationsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`MIGRATION ${index + 1}: ${file}`);
  console.log(`${'='.repeat(60)}`);
  console.log(content);
});

console.log('\n✅ After running all migrations, your database will be ready!');
console.log('\n💡 Alternative: If you have Supabase CLI linked to your project:');
console.log('   npm run db:link    # Link to your project (one-time)');
console.log('   npm run db:deploy  # Deploy all migrations');