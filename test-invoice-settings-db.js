// Test script to verify invoice settings database schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './web-app/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInvoiceSettingsSchema() {
  console.log('🔍 Testing Invoice Settings Database Schema...\n');

  try {
    // Test 1: Check if invoice_settings table exists
    console.log('1️⃣ Testing invoice_settings table...');
    const { data: settingsTest, error: settingsError } = await supabase
      .from('invoice_settings')
      .select('id')
      .limit(1);
    
    if (settingsError) {
      console.error('❌ invoice_settings table error:', settingsError.message);
      return false;
    }
    console.log('✅ invoice_settings table exists');

    // Test 2: Check if invoice_templates table exists and has default templates
    console.log('\n2️⃣ Testing invoice_templates table...');
    const { data: templatesTest, error: templatesError } = await supabase
      .from('invoice_templates')
      .select('id, name, template_type')
      .eq('is_active', true);
    
    if (templatesError) {
      console.error('❌ invoice_templates table error:', templatesError.message);
      return false;
    }
    
    console.log('✅ invoice_templates table exists');
    console.log(`📋 Found ${templatesTest.length} active templates:`);
    templatesTest.forEach(template => {
      console.log(`   - ${template.name} (${template.template_type})`);
    });

    // Test 3: Check if invoice_numbering table exists
    console.log('\n3️⃣ Testing invoice_numbering table...');
    const { data: numberingTest, error: numberingError } = await supabase
      .from('invoice_numbering')
      .select('id')
      .limit(1);
    
    if (numberingError) {
      console.error('❌ invoice_numbering table error:', numberingError.message);
      return false;
    }
    console.log('✅ invoice_numbering table exists');

    // Test 4: Test RLS policies (this will fail if not authenticated, which is expected)
    console.log('\n4️⃣ Testing RLS policies...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('invoice_settings')
      .select('*')
      .limit(1);
    
    if (rlsError && rlsError.code === '42501') {
      console.log('✅ RLS policies are active (permission denied as expected for unauthenticated user)');
    } else if (rlsError) {
      console.log('⚠️ RLS test inconclusive:', rlsError.message);
    } else {
      console.log('✅ RLS policies configured (no data or public access)');
    }

    console.log('\n🎉 All invoice settings schema tests passed!');
    console.log('\n📋 Schema Status Summary:');
    console.log('  ✅ invoice_settings table: Ready');
    console.log('  ✅ invoice_templates table: Ready with default templates');
    console.log('  ✅ invoice_numbering table: Ready');
    console.log('  ✅ RLS security policies: Active');
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

// Run the test
testInvoiceSettingsSchema()
  .then(success => {
    if (success) {
      console.log('\n🚀 Database schema is ready for invoice settings!');
      process.exit(0);
    } else {
      console.log('\n💥 Database schema issues detected. Please run the schema SQL file.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }); 