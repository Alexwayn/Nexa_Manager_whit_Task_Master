#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase for Nexa Manager...\n');

// Check if Supabase CLI is installed
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI is installed');
    return true;
  } catch (error) {
    console.log('❌ Supabase CLI is not installed');
    console.log('📦 Please install it first:');
    console.log('   npm install -g supabase');
    console.log('   or');
    console.log('   brew install supabase/tap/supabase');
    return false;
  }
}

// Check if Docker is running
function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    execSync('docker info', { stdio: 'pipe' });
    console.log('✅ Docker is running');
    return true;
  } catch (error) {
    console.log('❌ Docker is not running or not installed');
    console.log('🐳 Please install and start Docker Desktop:');
    console.log('   Windows: https://docs.docker.com/desktop/install/windows-install/');
    console.log('   macOS: https://docs.docker.com/desktop/install/mac-install/');
    console.log('   Linux: https://docs.docker.com/desktop/install/linux-install/');
    console.log('\n💡 After installation, make sure Docker Desktop is running before continuing.');
    return false;
  }
}

// Initialize Supabase project
function initializeSupabase() {
  try {
    console.log('🔧 Initializing Supabase project...');
    
    // Check if already initialized
    if (fs.existsSync('supabase/config.toml')) {
      console.log('✅ Supabase project already initialized');
      return true;
    }

    // Initialize
    execSync('supabase init', { stdio: 'inherit' });
    console.log('✅ Supabase project initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase project:', error.message);
    return false;
  }
}

// Start local Supabase
function startSupabase() {
  try {
    console.log('🚀 Starting local Supabase...');
    execSync('supabase start', { stdio: 'inherit' });
    console.log('✅ Supabase started successfully');
    
    // Show connection info
    console.log('\n📋 Connection Information:');
    execSync('supabase status', { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to start Supabase:', error.message);
    return false;
  }
}

// Apply migrations
function applyMigrations() {
  try {
    console.log('📊 Applying database migrations...');
    execSync('supabase db reset', { stdio: 'inherit' });
    console.log('✅ Migrations applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to apply migrations:', error.message);
    return false;
  }
}

// Main setup function
async function setup() {
  console.log('Setting up Supabase for document scanner feature...\n');

  // Step 1: Check CLI
  if (!checkSupabaseCLI()) {
    process.exit(1);
  }

  // Step 2: Check Docker
  if (!checkDocker()) {
    process.exit(1);
  }

  // Step 3: Initialize project
  if (!initializeSupabase()) {
    process.exit(1);
  }

  // Step 4: Start Supabase
  if (!startSupabase()) {
    process.exit(1);
  }

  // Step 5: Apply migrations
  if (!applyMigrations()) {
    process.exit(1);
  }

  console.log('\n🎉 Supabase setup completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Copy .env.local.example to .env.local and fill in your values');
  console.log('2. Run "npm run dev" to start the development server');
  console.log('3. Your local Supabase is running at http://localhost:54323');
  console.log('\n💡 Useful commands:');
  console.log('- npm run db:status    - Check Supabase status');
  console.log('- npm run db:reset     - Reset database with migrations');
  console.log('- npm run db:stop      - Stop local Supabase');
  console.log('- npm run db:migrate   - Create new migration');
}

// Run setup
setup().catch(console.error);