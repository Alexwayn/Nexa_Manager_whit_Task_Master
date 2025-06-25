import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInvoiceSettingsSchema() {
  console.log('🔍 Testing Invoice Settings Database Schema...\n')

  try {
    // Test 1: Check if invoice_templates table exists and has data
    console.log('1. Testing invoice_templates table...')
    const { data: templates, error: templatesError } = await supabase
      .from('invoice_templates')
      .select('*')
      .limit(5)

    if (templatesError) {
      console.error('❌ Error accessing invoice_templates:', templatesError.message)
      return false
    }

    console.log(`✅ Found ${templates.length} invoice templates`)
    if (templates.length > 0) {
      console.log('   Sample template:', templates[0].name)
    }

    // Test 2: Check if invoice_settings table exists
    console.log('\n2. Testing invoice_settings table...')
    const { data: settings, error: settingsError } = await supabase
      .from('invoice_settings')
      .select('*')
      .limit(1)

    if (settingsError) {
      console.error('❌ Error accessing invoice_settings:', settingsError.message)
      return false
    }

    console.log('✅ invoice_settings table accessible')

    // Test 3: Check if invoice_numbering table exists
    console.log('\n3. Testing invoice_numbering table...')
    const { data: numbering, error: numberingError } = await supabase
      .from('invoice_numbering')
      .select('*')
      .limit(1)

    if (numberingError) {
      console.error('❌ Error accessing invoice_numbering:', numberingError.message)
      return false
    }

    console.log('✅ invoice_numbering table accessible')

    console.log('\n🎉 All invoice settings tables are properly deployed!')
    return true

  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    return false
  }
}

async function testInvoiceSettingsService() {
  console.log('\n🔧 Testing InvoiceSettingsService integration...\n')

  try {
    // Import the service
    const { InvoiceSettingsService } = await import('./src/lib/invoiceSettingsService.js')

    // Test 1: Get default settings
    console.log('1. Testing getDefaultSettings...')
    const defaultSettings = InvoiceSettingsService.getDefaultSettings()
    console.log('✅ Default settings loaded:', Object.keys(defaultSettings).length, 'properties')

    // Test 2: Get available templates
    console.log('\n2. Testing getAvailableTemplates...')
    const templates = await InvoiceSettingsService.getAvailableTemplates()
    console.log('✅ Templates loaded:', templates.length, 'templates available')

    // Test 3: Test numbering generation
    console.log('\n3. Testing numbering generation...')
    const testNumber = await InvoiceSettingsService.generateInvoiceNumber('test-user', 'sequential')
    console.log('✅ Generated test number:', testNumber)

    console.log('\n🎉 InvoiceSettingsService is working correctly!')
    return true

  } catch (error) {
    console.error('❌ Service test error:', error.message)
    return false
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Invoice Settings Integration Tests\n')
  console.log('=' .repeat(50))

  const schemaTest = await testInvoiceSettingsSchema()
  
  if (schemaTest) {
    await testInvoiceSettingsService()
  } else {
    console.log('\n⚠️ Skipping service tests due to schema issues')
  }

  console.log('\n' + '='.repeat(50))
  console.log('🏁 Tests completed')
}

runTests().catch(console.error) 