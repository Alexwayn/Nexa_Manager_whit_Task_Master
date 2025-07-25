#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get migration name from command line arguments
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Please provide a migration name');
  console.log('Usage: npm run db:migrate <migration_name>');
  console.log('Example: npm run db:migrate add_user_preferences');
  process.exit(1);
}

try {
  // Create timestamp
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '');

  // Create migration file
  const migrationFileName = `${timestamp}_${migrationName}.sql`;
  const migrationPath = path.join('supabase', 'migrations', migrationFileName);

  // Create migration template
  const migrationTemplate = `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}

-- Add your SQL here
-- Example:
-- CREATE TABLE example (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Don't forget to add RLS policies if needed:
-- ALTER TABLE example ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can access their own records" ON example
--   FOR ALL USING (auth.uid()::text = user_id);
`;

  // Write migration file
  fs.writeFileSync(migrationPath, migrationTemplate);

  console.log(`✅ Migration created: ${migrationPath}`);
  console.log('\n📝 Next steps:');
  console.log('1. Edit the migration file with your SQL');
  console.log('2. Run "npm run db:reset" to apply the migration');
  console.log('3. Or run "npm run db:push" to push to remote database');

} catch (error) {
  console.error('❌ Failed to create migration:', error.message);
  process.exit(1);
}